import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { users, insertProductSchema, insertCartItemSchema, insertOrderSchema, insertSiteSettingsSchema, insertContentBlockSchema, insertReviewSchema } from "@shared/schema";
import { ZodError } from "zod";
import { randomUUID } from "crypto";
import "./types"; // Import session types
import { downloadImage } from "./services/download";
import { classifyGarment } from "./services/gemini";
import { hashPassword, comparePasswords } from "./auth";
import { db } from "./db";
import { eq } from "drizzle-orm";

// ---------- Simple in-memory rate limiter for login endpoint ----------
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 5; // max attempts per window per IP

function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (record.count >= RATE_LIMIT_MAX) return false;
  record.count++;
  return true;
}
// ---------------------------------------------------------------------

// Helper functions for Instagram carousel image parsing and ranking
function extractInstagramImageUrls(html: string): string[] {
  const urls: string[] = [];
  let match;

  // 1. Try to look for "display_url" fields in JSON/script blocks.
  // Example: "display_url":"https:\/\/scontent.cdninstagram.com\/..."
  const jsonUrlsRegex = /"display_url"\s*:\s*"([^"]+)"/g;
  while ((match = jsonUrlsRegex.exec(html)) !== null) {
    const rawUrl = match[1];
    const unescapedUrl = rawUrl.replace(/\\/g, '');
    if (unescapedUrl.includes('cdninstagram.com') || unescapedUrl.includes('fbcdn.net')) {
      if (!urls.includes(unescapedUrl)) {
        urls.push(unescapedUrl);
      }
    }
  }

  // 2. Try to look for "src" inside "display_resources"
  // Example: "src":"https:\/\/scontent.cdninstagram.com\/..."
  const srcRegex = /"src"\s*:\s*"([^"]+)"/g;
  while ((match = srcRegex.exec(html)) !== null) {
    const rawUrl = match[1];
    const unescapedUrl = rawUrl.replace(/\\/g, '');
    if (unescapedUrl.includes('cdninstagram.com') || unescapedUrl.includes('fbcdn.net')) {
      if (!urls.includes(unescapedUrl)) {
        urls.push(unescapedUrl);
      }
    }
  }

  // 3. Look for og:image tags
  const ogImgRegex = /<meta[^>]*property="og:image"[^>]*content="([^"]+)"/gi;
  while ((match = ogImgRegex.exec(html)) !== null) {
    const unescapedUrl = match[1].replace(/&amp;/g, '&');
    if (!urls.includes(unescapedUrl)) {
      urls.push(unescapedUrl);
    }
  }

  // 4. Look for other meta og:image forms
  const ogImgRegex2 = /<meta[^>]*content="([^"]+)"[^>]*property="og:image"/gi;
  while ((match = ogImgRegex2.exec(html)) !== null) {
    const unescapedUrl = match[1].replace(/&amp;/g, '&');
    if (!urls.includes(unescapedUrl)) {
      urls.push(unescapedUrl);
    }
  }

  // 5. Look for any https links pointing directly to cdninstagram or fbcdn
  const generalCdnRegex = /https?:[\\\/]+[^"'\s()]+(?:cdninstagram\.com|fbcdn\.net)[^"'\s()]+/gi;
  while ((match = generalCdnRegex.exec(html)) !== null) {
    const unescapedUrl = match[0].replace(/\\/g, '').replace(/&amp;/g, '&');
    if (!urls.includes(unescapedUrl)) {
      urls.push(unescapedUrl);
    }
  }

  // Clean URLs - filter out obvious profile images
  const filteredUrls = urls.filter(url => {
    const lower = url.toLowerCase();
    return !lower.includes('profile_pic') && !lower.includes('150x150') && !lower.includes('320x320');
  });

  return filteredUrls.length > 0 ? filteredUrls : urls;
}

function getInstagramFilenameId(urlStr: string): string | null {
  try {
    const url = new URL(urlStr);
    const pathname = url.pathname;
    const parts = pathname.split('/');
    const filename = parts[parts.length - 1];
    
    const match = filename.match(/([a-zA-Z0-9_-]+)_[a-z]\.[a-z0-9]+$/i) || filename.match(/^([a-zA-Z0-9_-]+)\.[a-z0-9]+$/i);
    if (match) {
      return match[1];
    }
    return filename;
  } catch {
    const match = urlStr.match(/\/([^\/?#]+)(?:\?|#|$)/);
    return match ? match[1] : null;
  }
}

function scoreUrl(url: string): number {
  let score = 0;
  const lower = url.toLowerCase();
  
  if (lower.includes('s1080x1080') || lower.includes('1080x1080')) score += 10;
  else if (lower.includes('s750x750') || lower.includes('750x750')) score += 5;
  else if (lower.includes('s640x640') || lower.includes('640x640')) score += 2;
  else if (lower.includes('s480x480') || lower.includes('480x480')) score += 1;
  else if (lower.includes('s320x320') || lower.includes('320x320')) score -= 5;
  else if (lower.includes('s150x150') || lower.includes('150x150')) score -= 10;
  else score += 8; // default original high res

  if (lower.includes('profile_pic')) score -= 20;
  return score;
}

function getUniqueBestImages(urls: string[]): string[] {
  const groups: Record<string, { url: string; score: number }[]> = {};
  
  for (const url of urls) {
    const id = getInstagramFilenameId(url);
    if (!id) continue;
    
    if (!groups[id]) {
      groups[id] = [];
    }
    groups[id].push({ url, score: scoreUrl(url) });
  }
  
  const bestUrls: string[] = [];
  for (const id of Object.keys(groups)) {
    const sorted = groups[id].sort((a, b) => b.score - a.score);
    bestUrls.push(sorted[0].url);
  }
  
  return bestUrls;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auto-migrate plaintext passwords to scrypt hashes
  try {
    const dbUsers = await db.select().from(users);
    for (const u of dbUsers) {
      if (u.password && !u.password.includes(".")) {
        console.log(`[security] Migrating password for user "${u.username}" to secure scrypt hash`);
        const hashed = await hashPassword(u.password);
        await db.update(users).set({ password: hashed }).where(eq(users.id, u.id));
      }
    }
  } catch (err) {
    console.error("[security] Failed to auto-migrate passwords:", err);
  }

  app.get("/api/debug-env", async (req, res) => {
    const dbUrl = process.env.DATABASE_URL;
    res.json({
      databaseUrlSet: !!dbUrl,
      databaseUrlPrefix: dbUrl ? dbUrl.substring(0, 30) + "..." : null,
      storageType: storage.constructor.name,
      nodeEnv: process.env.NODE_ENV
    });
  });

  // Auth API
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, email, phone } = req.body;
      
      if (!username || !password || !email) {
        return res.status(400).json({ error: "Username, email, and password are required" });
      }

      // Input length validation to prevent abuse
      if (username.length > 50) return res.status(400).json({ error: "Username must be 50 characters or fewer" });
      if (password.length < 6)  return res.status(400).json({ error: "Password must be at least 6 characters" });
      if (password.length > 128) return res.status(400).json({ error: "Password is too long" });
      if (email.length > 254) return res.status(400).json({ error: "Email address is too long" });
      if (phone && phone.length > 20) return res.status(400).json({ error: "Phone number is too long" });

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        phone: phone || null,
      });

      req.session.userId = user.id;
      
      // Return user without password
      const { password: _, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      // Rate limiting — protect against brute force
      const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() 
                        || req.socket.remoteAddress 
                        || "unknown";
      if (!checkLoginRateLimit(clientIp)) {
        return res.status(429).json({ error: "Too many login attempts. Please wait a minute and try again." });
      }

      // Single lookup — admin is just a DB user with role='admin'
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return res.status(400).json({ error: "Invalid username or password" });
      }

      req.session.userId = user.id;
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });


  app.post("/api/auth/logout", async (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout session destroy failed:", err);
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: "User session not found" });
      }

      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Auth check me error:", error);
      res.status(500).json({ error: "Failed to get session" });
    }
  });

  // Customer Profile API
  app.put("/api/customer/profile", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { email, phone, addresses } = req.body;
      
      const updatedUser = await storage.updateUserProfile(
        req.session.userId,
        email || null,
        phone || null,
        addresses || []
      );

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password: _, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Customer Orders API
  app.get("/api/customer/orders", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      if (!user.email) {
        return res.json([]);
      }

      const orders = await storage.getOrdersByEmail(user.email);
      
      const detailedOrders = await Promise.all(
        orders.map(async (order) => {
          const detail = await storage.getOrder(order.id);
          return detail || { ...order, items: [] };
        })
      );

      res.json(detailedOrders);
    } catch (error) {
      console.error("Fetch customer orders error:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Products API
  app.get("/api/products", async (req, res) => {
    try {
      const { category, ageGroup } = req.query;
      
      let products;
      if (category) {
        products = await storage.getProductsByCategory(category as string);
      } else if (ageGroup) {
        products = await storage.getProductsByAgeGroup(ageGroup as string);
      } else {
        products = await storage.getAllProducts();
      }
      
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid product data", details: error });
      }
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const validatedData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, validatedData);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid product data", details: error });
      }
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProduct(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Shopping Cart API
  app.get("/api/cart", async (req, res) => {
    try {
      // Get or create session ID
      const sessionId = req.session.cartId ?? (req.session.cartId = randomUUID());
      
      // Get or create cart
      let cart = await storage.getCart(sessionId);
      if (!cart) {
        await storage.createCart({ sessionId });
        // Refetch to include items relation
        cart = await storage.getCart(sessionId);
      }

      res.json(cart ?? { id: "", sessionId, createdAt: new Date(), updatedAt: new Date(), items: [] });
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ error: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart/items", async (req, res) => {
    try {
      // Get or create session ID
      const sessionId = req.session.cartId ?? (req.session.cartId = randomUUID());
      
      // Get or create cart
      let cart = await storage.getCart(sessionId);
      if (!cart) {
        await storage.createCart({ sessionId });
        cart = await storage.getCart(sessionId);
      }

      // Validate cart item data with cartId
      const validatedData = insertCartItemSchema.parse({
        ...req.body,
        cartId: cart!.id
      });
      
      const cartItem = await storage.addToCart(validatedData);
      res.status(201).json(cartItem);
    } catch (error) {
      console.error("Error adding to cart:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid cart item data", details: error });
      }
      res.status(500).json({ error: "Failed to add to cart" });
    }
  });

  app.put("/api/cart/items/:id", async (req, res) => {
    try {
      const { quantity } = req.body;
      if (!quantity || quantity < 1) {
        return res.status(400).json({ error: "Quantity must be at least 1" });
      }
      
      const cartItem = await storage.updateCartItem(req.params.id, quantity);
      if (!cartItem) {
        return res.status(404).json({ error: "Cart item not found" });
      }
      res.json(cartItem);
    } catch (error) {
      console.error("Error updating cart item:", error);
      res.status(500).json({ error: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/items/:id", async (req, res) => {
    try {
      const deleted = await storage.removeFromCart(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Cart item not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ error: "Failed to remove from cart" });
    }
  });

  app.delete("/api/cart", async (req, res) => {
    try {
      const sessionId = req.session.cartId;
      if (!sessionId) {
        return res.status(204).send();
      }
      
      const cart = await storage.getCart(sessionId);
      if (cart) {
        await storage.clearCart(cart.id);
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(500).json({ error: "Failed to clear cart" });
    }
  });

  // Orders API
  app.post("/api/orders", async (req, res) => {
    try {
      // Must be logged in as a customer to place an order
      if (!req.session.userId) {
        return res.status(401).json({ error: "You must be logged in to place an order" });
      }

      // Admin accounts cannot place customer orders
      const sessionUser = await storage.getUser(req.session.userId);
      if (sessionUser?.role === "admin") {
        return res.status(403).json({ error: "Admin accounts cannot place customer orders" });
      }

      const { orderData, items } = req.body;
      const validatedOrder = insertOrderSchema.parse(orderData);
      
      const order = await storage.createOrder(validatedOrder, items);
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid order data", details: error });
      }
      res.status(500).json({ error: "Failed to create order" });
    }
  });


  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  app.put("/api/orders/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const order = await storage.updateOrderStatus(req.params.id, status);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  app.get("/api/orders/track", async (req, res) => {
    try {
      const { email, orderId } = req.query;
      
      if (!email || !orderId) {
        return res.status(400).json({ error: "Email and order ID are required" });
      }
      
      const order = await storage.getOrder(orderId as string);
      
      if (!order || order.customerEmail !== email) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error tracking order:", error);
      res.status(500).json({ error: "Failed to track order" });
    }
  });

  // Admin middleware — uses the session, no Basic Auth tokens needed
  const adminAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized: not logged in" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "Forbidden: admin access required" });
      }

      next();
    } catch (error) {
      console.error("Admin auth error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  };


  // Site Settings API (Admin only)
  app.get("/api/admin/settings", adminAuth, async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.get("/api/admin/settings/:key", adminAuth, async (req, res) => {
    try {
      const setting = await storage.getSiteSetting(req.params.key);
      if (!setting) {
        return res.status(404).json({ error: "Setting not found" });
      }
      res.json(setting);
    } catch (error) {
      console.error("Error fetching setting:", error);
      res.status(500).json({ error: "Failed to fetch setting" });
    }
  });

  app.put("/api/admin/settings/:key", adminAuth, async (req, res) => {
    try {
      const { value } = req.body;
      if (value === undefined) {
        return res.status(400).json({ error: "Value is required" });
      }
      
      const setting = await storage.updateSiteSetting(req.params.key, value);
      res.json(setting);
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({ error: "Failed to update setting" });
    }
  });

  // Content Blocks API (Admin only)
  app.get("/api/admin/content", adminAuth, async (req, res) => {
    try {
      const { location } = req.query;
      
      let blocks;
      if (location) {
        blocks = await storage.getContentBlocksByLocation(location as string);
      } else {
        blocks = await storage.getAllContentBlocks();
      }
      
      res.json(blocks);
    } catch (error) {
      console.error("Error fetching content blocks:", error);
      res.status(500).json({ error: "Failed to fetch content blocks" });
    }
  });

  app.get("/api/admin/content/:id", adminAuth, async (req, res) => {
    try {
      const block = await storage.getContentBlock(req.params.id);
      if (!block) {
        return res.status(404).json({ error: "Content block not found" });
      }
      res.json(block);
    } catch (error) {
      console.error("Error fetching content block:", error);
      res.status(500).json({ error: "Failed to fetch content block" });
    }
  });

  app.post("/api/admin/content", adminAuth, async (req, res) => {
    try {
      const validatedData = insertContentBlockSchema.parse(req.body);
      const block = await storage.createContentBlock(validatedData);
      res.status(201).json(block);
    } catch (error) {
      console.error("Error creating content block:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid content block data", details: error });
      }
      res.status(500).json({ error: "Failed to create content block" });
    }
  });

  app.put("/api/admin/content/:id", adminAuth, async (req, res) => {
    try {
      const validatedData = insertContentBlockSchema.partial().parse(req.body);
      const block = await storage.updateContentBlock(req.params.id, validatedData);
      if (!block) {
        return res.status(404).json({ error: "Content block not found" });
      }
      res.json(block);
    } catch (error) {
      console.error("Error updating content block:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid content block data", details: error });
      }
      res.status(500).json({ error: "Failed to update content block" });
    }
  });

  app.delete("/api/admin/content/:id", adminAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteContentBlock(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Content block not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting content block:", error);
      res.status(500).json({ error: "Failed to delete content block" });
    }
  });

  // Public API for content blocks (no auth required)
  app.get("/api/content", async (req, res) => {
    try {
      const { location } = req.query;
      
      if (!location) {
        return res.status(400).json({ error: "Location parameter is required" });
      }
      
      const blocks = await storage.getContentBlocksByLocation(location as string);
      res.json(blocks);
    } catch (error) {
      console.error("Error fetching content blocks:", error);
      res.status(500).json({ error: "Failed to fetch content blocks" });
    }
  });

  // Reviews API
  app.get("/api/products/:productId/reviews", async (req, res) => {
    try {
      const reviews = await storage.getReviews(req.params.productId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  app.post("/api/products/:productId/reviews", async (req, res) => {
    try {
      const validatedData = insertReviewSchema.parse({
        ...req.body,
        productId: req.params.productId,
      });
      const review = await storage.createReview(validatedData);
      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid review data", details: error });
      }
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  // Admin Orders API (Admin only)
  app.get("/api/admin/orders", adminAuth, async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      
      // For each order, fetch its items relations (needed by frontend)
      const populatedOrders = await Promise.all(
        orders.map(async (order) => {
          const detailedOrder = await storage.getOrder(order.id);
          return detailedOrder || order;
        })
      );
      
      res.json(populatedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.put("/api/admin/orders/:id/status", adminAuth, async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }
      const order = await storage.updateOrderStatus(req.params.id, status);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  // Instagram Sync Endpoints
  app.post("/api/sync/instagram/webhook", async (req, res) => {
    try {
      const { media_url, caption, id } = req.body;
      if (!media_url && !req.body.media_urls && !id) {
        return res.status(400).json({ error: "media_url/media_urls and id are required" });
      }

      const existing = await storage.getProductByInstagramId(id);
      if (existing) {
        return res.status(400).json({ error: "Post already imported" });
      }

      // Gather all media urls (webhook supports array/comma-separated strings or carousel_media list)
      let urls: string[] = [];
      if (req.body.media_urls) {
        if (Array.isArray(req.body.media_urls)) {
          urls = req.body.media_urls;
        } else if (typeof req.body.media_urls === 'string') {
          urls = req.body.media_urls.split(',').map((u: any) => u.trim());
        }
      }
      if (urls.length === 0 && req.body.media_url) {
        if (Array.isArray(req.body.media_url)) {
          urls = req.body.media_url;
        } else if (typeof req.body.media_url === 'string') {
          urls = req.body.media_url.split(',').map((u: any) => u.trim());
        }
      }
      if (urls.length === 0 && Array.isArray(req.body.carousel_media)) {
        urls = req.body.carousel_media.map((item: any) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object' && item.media_url) return item.media_url;
          return null;
        }).filter(Boolean) as string[];
      }
      if (urls.length === 0 && media_url) {
        urls = [media_url];
      }

      // Deduplicate webhook URLs
      const uniqueUrls = urls.filter((val, index, self) => self.indexOf(val) === index);
      const limitedUrls = uniqueUrls.slice(0, 10);

      console.log(`[sync] Webhook importing post ID ${id} with ${limitedUrls.length} media URLs`);

      const localImagePaths: string[] = [];
      for (const imgUrl of limitedUrls) {
        const localPath = await downloadImage(imgUrl);
        localImagePaths.push(localPath);
      }

      const mainLocalPath = localImagePaths.length > 0 ? localImagePaths[0] : (media_url ? await downloadImage(media_url) : "");
      if (!mainLocalPath) {
        return res.status(400).json({ error: "No media could be downloaded" });
      }

      const classification = await classifyGarment(mainLocalPath, caption || "");

      const product = await storage.createProduct({
        ...classification,
        images: localImagePaths.length > 0 ? localImagePaths : [mainLocalPath],
        instagramPostId: id,
        status: "draft"
      });

      res.status(201).json(product);
    } catch (error: any) {
      console.error("[sync] Webhook error:", error);
      res.status(500).json({ error: "Webhook import failed", details: error.message });
    }
  });

  app.post("/api/sync/instagram/import-url", async (req, res) => {
    try {
      // extra_image_urls: comma/newline-separated extra image URLs (for carousel slides)
      const { url, extra_image_urls } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      // Extract post ID
      const idMatch = url.match(/(?:\/p\/|\/reel\/|\/tv\/)([A-Za-z0-9_-]+)/);
      const postRawId = idMatch ? idMatch[1] : null;
      if (!postRawId) {
        return res.status(400).json({ error: "Could not parse Instagram Post ID from URL" });
      }

      // If post already exists as a DRAFT → delete and re-import fresh.
      // If it's already PUBLISHED → block (would create a duplicate product).
      const existing = await storage.getProductByInstagramId(postRawId);
      if (existing) {
        if (existing.status === "published") {
          return res.status(400).json({
            error: "This post is already published as a product. Delete the product first if you want to re-import."
          });
        }
        // Delete the old draft so we can start clean
        await storage.deleteProduct(existing.id);
        console.log(`[sync] Deleted old draft (id=${existing.id}) for post ${postRawId} — re-importing fresh`);
      }

      console.log(`[sync] Scraping Instagram URL: ${url}`);
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch Instagram page: ${response.statusText}`);
      }

      const html = await response.text();

      // Extract description / caption
      const descMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i) ||
                        html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:description"/i);
      let rawDescription = descMatch ? descMatch[1].replace(/&amp;/g, '&') : "";
      let caption = rawDescription;
      const captionMatch = rawDescription.match(/on Instagram:\s*"([\s\S]*)"/i) ||
                            rawDescription.match(/on Instagram:\s*['""]([\s\S]*?)['""].+/i) ||
                            rawDescription.match(/:\s*"([\s\S]*)"/i);
      if (captionMatch) caption = captionMatch[1];

      // --- Gather image URLs ---
      // 1. Scrape from HTML (usually just the og:image for single posts)
      const foundImageUrls = extractInstagramImageUrls(html);
      const bestImageUrls = getUniqueBestImages(foundImageUrls);

      // 2. Merge with manually pasted extra_image_urls (the reliable way to get carousel slides)
      let extraUrls: string[] = [];
      if (extra_image_urls) {
        const raw = typeof extra_image_urls === "string" ? extra_image_urls : String(extra_image_urls);
        extraUrls = raw
          .split(/[,\n]+/)
          .map((u: string) => u.trim())
          .filter((u: string) => u.startsWith("http"));
      }

      // Combine scraped + extra (dedup, scraped first so main image stays first)
      const allUrls = [...bestImageUrls];
      for (const eu of extraUrls) {
        if (!allUrls.includes(eu)) allUrls.push(eu);
      }

      const limitedUrls = allUrls.slice(0, 10);
      console.log(`[sync] Downloading ${limitedUrls.length} image(s) for post ${postRawId}:`, limitedUrls);

      const localImagePaths: string[] = [];
      for (const imgUrl of limitedUrls) {
        try {
          const localPath = await downloadImage(imgUrl);
          localImagePaths.push(localPath);
        } catch (dlErr: any) {
          console.warn(`[sync] Failed to download image ${imgUrl}:`, dlErr.message);
        }
      }

      // Fallback if nothing was downloaded
      let mainLocalPath = localImagePaths[0] ?? null;
      if (!mainLocalPath) {
        console.warn("[sync] No images downloaded — using placeholder");
        const fallbackUrl = "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=600";
        mainLocalPath = await downloadImage(fallbackUrl);
        localImagePaths.push(mainLocalPath);
      }

      // Classify garment using Gemini
      const classification = await classifyGarment(mainLocalPath, caption);

      // Create draft product
      const draftProduct = await storage.createProduct({
        ...classification,
        images: localImagePaths,
        instagramPostId: postRawId,
        status: "draft"
      });

      res.status(201).json(draftProduct);
    } catch (error: any) {
      console.error("[sync] Error importing Instagram URL:", error);
      res.status(500).json({ error: "Failed to import Instagram post", details: error.message });
    }
  });

  app.get("/api/admin/products/drafts", adminAuth, async (req, res) => {
    try {
      const allProducts = await storage.getAllProducts(true);
      const drafts = allProducts.filter(p => p.status === "draft");
      res.json(drafts);
    } catch (error) {
      console.error("Error fetching drafts:", error);
      res.status(500).json({ error: "Failed to fetch drafts" });
    }
  });

  app.put("/api/admin/products/:id/publish", adminAuth, async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      const updated = await storage.updateProduct(req.params.id, { status: "published" });
      res.json(updated);
    } catch (error) {
      console.error("Error publishing product:", error);
      res.status(500).json({ error: "Failed to publish product" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
