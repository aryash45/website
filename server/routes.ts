import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { users, insertProductSchema, insertCartItemSchema, insertOrderSchema, insertSiteSettingsSchema, insertContentBlockSchema, insertReviewSchema } from "../shared/schema.js";
import { ZodError } from "zod";
import { randomUUID } from "crypto";
import "./types.js"; // Import session types
import { downloadImage } from "./services/download.js";
import { classifyGarment } from "./services/gemini.js";
import { hashPassword, comparePasswords } from "./auth.js";
import { db } from "./db.js";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

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

      // Explicitly save session before responding — critical on serverless where
      // the process may exit before the auto-save hook fires.
      await new Promise<void>((resolve, reject) =>
        req.session.save((err) => (err ? reject(err) : resolve()))
      );

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

      // Explicitly save session before responding — critical on serverless where
      // the process may exit before express-session's auto-save hook fires.
      await new Promise<void>((resolve, reject) =>
        req.session.save((err) => (err ? reject(err) : resolve()))
      );

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

  // Admin Image Upload Endpoint (saves base64 images to local /uploads directory)
  app.post("/api/admin/upload", adminAuth, async (req, res) => {
    try {
      const { filename, data } = req.body;
      if (!filename || !data) {
        return res.status(400).json({ error: "Filename and data are required" });
      }

      // Check if data is a base64 encoded data URI
      const base64Data = data.includes(",") ? data.split(",")[1] : data;
      const buffer = Buffer.from(base64Data, "base64");

      // Ensure uploads directory exists
      const uploadsDir = path.resolve(process.cwd(), "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Determine file extension
      const ext = path.extname(filename) || ".jpg";
      const newFilename = `${randomUUID()}${ext}`;
      const filePath = path.join(uploadsDir, newFilename);

      await fs.promises.writeFile(filePath, buffer);

      console.log(`[upload] File saved: ${filePath}`);
      res.json({ url: `/uploads/${newFilename}` });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
