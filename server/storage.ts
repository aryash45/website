import { 
  users, products, carts, cartItems, orders, orderItems, siteSettings, contentBlocks, reviews,
  type User, type InsertUser, type Product, type InsertProduct,
  type Cart, type InsertCart, type CartItem, type InsertCartItem,
  type Order, type InsertOrder, type OrderItem, type InsertOrderItem,
  type SiteSetting, type InsertSiteSetting, type ContentBlock, type InsertContentBlock,
  type Review, type InsertReview
} from "../shared/schema.js";
import { db } from "./db.js";
import { eq, desc, and, sql } from "drizzle-orm";

// Storage interface with all CRUD methods needed for e-commerce
export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Products
  getAllProducts(includeDrafts?: boolean): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductByInstagramId(instagramPostId: string): Promise<Product | undefined>;
  getProductsByCategory(category: string, includeDrafts?: boolean): Promise<Product[]>;
  getProductsByAgeGroup(ageGroup: string, includeDrafts?: boolean): Promise<Product[]>;
  createProduct(product: InsertProduct & { instagramPostId?: string | null; status?: string }): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct & { status?: string }>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;

  // Shopping Cart
  getCart(sessionId: string): Promise<(Cart & { items: (CartItem & { product: Product })[] }) | undefined>;
  createCart(cart: InsertCart): Promise<Cart>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: string, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: string): Promise<boolean>;
  clearCart(cartId: string): Promise<boolean>;

  // Orders
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  getOrder(id: string): Promise<(Order & { items: OrderItem[] }) | undefined>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  getOrdersByEmail(email: string): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  
  // Site Settings
  getSiteSettings(): Promise<SiteSetting[]>;
  getSiteSetting(key: string): Promise<SiteSetting | undefined>;
  updateSiteSetting(key: string, value: any): Promise<SiteSetting | undefined>;
  
  // Content Blocks
  getAllContentBlocks(): Promise<ContentBlock[]>;
  getContentBlocksByLocation(location: string): Promise<ContentBlock[]>;
  getContentBlock(id: string): Promise<ContentBlock | undefined>;
  createContentBlock(block: InsertContentBlock): Promise<ContentBlock>;
  updateContentBlock(id: string, block: Partial<InsertContentBlock>): Promise<ContentBlock | undefined>;
  deleteContentBlock(id: string): Promise<boolean>;

  // Reviews
  getReviews(productId: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;

  // User Profile
  updateUserProfile(id: string, email: string | null, phone: string | null, addresses: any[]): Promise<User | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserProfile(id: string, email: string | null, phone: string | null, addresses: any[]): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ email, phone, addresses })
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  // Products
  async getAllProducts(includeDrafts = false): Promise<Product[]> {
    if (includeDrafts) {
      return await db.select().from(products).orderBy(desc(products.createdAt));
    }
    return await db.select().from(products).where(eq(products.status, "published")).orderBy(desc(products.createdAt));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProductByInstagramId(instagramPostId: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.instagramPostId, instagramPostId));
    return product || undefined;
  }

  async getProductsByCategory(category: string, includeDrafts = false): Promise<Product[]> {
    if (includeDrafts) {
      return await db.select().from(products).where(eq(products.category, category));
    }
    return await db.select().from(products).where(and(eq(products.category, category), eq(products.status, "published")));
  }

  async getProductsByAgeGroup(ageGroup: string, includeDrafts = false): Promise<Product[]> {
    if (includeDrafts) {
      return await db.select().from(products).where(eq(products.ageGroup, ageGroup));
    }
    return await db.select().from(products).where(and(eq(products.ageGroup, ageGroup), eq(products.status, "published")));
  }

  async createProduct(product: InsertProduct & { instagramPostId?: string | null; status?: string }): Promise<Product> {
    const [newProduct] = await db
      .insert(products)
      .values({
        ...product,
        updatedAt: new Date()
      })
      .returning();
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct & { status?: string }>): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set({
        ...product,
        updatedAt: new Date()
      })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct || undefined;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Shopping Cart
  async getCart(sessionId: string): Promise<(Cart & { items: (CartItem & { product: Product })[] }) | undefined> {
    const cart = await db.query.carts.findFirst({
      where: eq(carts.sessionId, sessionId),
      with: {
        items: {
          with: {
            product: true
          }
        }
      }
    });
    return cart || undefined;
  }

  async createCart(cart: InsertCart): Promise<Cart> {
    const [newCart] = await db
      .insert(carts)
      .values(cart)
      .returning();
    return newCart;
  }

  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const existingItem = await db.select().from(cartItems)
      .where(and(
        eq(cartItems.cartId, cartItem.cartId),
        eq(cartItems.productId, cartItem.productId),
        eq(cartItems.size, cartItem.size)
      ));

    if (existingItem.length > 0) {
      // Update quantity
      const [updatedItem] = await db
        .update(cartItems)
        .set({ quantity: sql`${cartItems.quantity} + ${cartItem.quantity}` })
        .where(eq(cartItems.id, existingItem[0].id))
        .returning();
      return updatedItem;
    } else {
      // Insert new item
      const [newItem] = await db
        .insert(cartItems)
        .values(cartItem)
        .returning();
      return newItem;
    }
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem | undefined> {
    const [updatedItem] = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    return updatedItem || undefined;
  }

  async removeFromCart(id: string): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async clearCart(cartId: string): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
    return (result.rowCount ?? 0) >= 0; // Returns true even if no items to delete
  }

  // Orders
  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    return await db.transaction(async (tx) => {
      const [newOrder] = await tx
        .insert(orders)
        .values(order)
        .returning();

      if (items.length > 0) {
        await tx
          .insert(orderItems)
          .values(items.map(item => ({ ...item, orderId: newOrder.id })));
      }

      return newOrder;
    });
  }

  async getOrder(id: string): Promise<(Order & { items: OrderItem[] }) | undefined> {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        items: true
      }
    });
    return order || undefined;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder || undefined;
  }

  async getOrdersByEmail(email: string): Promise<Order[]> {
    return await db.select().from(orders)
      .where(eq(orders.customerEmail, email))
      .orderBy(desc(orders.createdAt));
  }

  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getReviews(productId: string): Promise<Review[]> {
    return await db.select().from(reviews)
      .where(eq(reviews.productId, productId))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const [newReview] = await db
      .insert(reviews)
      .values(insertReview)
      .returning();
    return newReview;
  }

  // Site Settings Implementation
  async getSiteSettings(): Promise<SiteSetting[]> {
    return await db.select().from(siteSettings);
  }

  async getSiteSetting(key: string): Promise<SiteSetting | undefined> {
    const [setting] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
    return setting || undefined;
  }

  async updateSiteSetting(key: string, value: any): Promise<SiteSetting | undefined> {
    const [existing] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
    
    if (existing) {
      const [updated] = await db
        .update(siteSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(siteSettings.key, key))
        .returning();
      return updated;
    } else {
      const [newSetting] = await db
        .insert(siteSettings)
        .values({ key, value })
        .returning();
      return newSetting;
    }
  }

  // Content Blocks Implementation
  async getAllContentBlocks(): Promise<ContentBlock[]> {
    return await db.select().from(contentBlocks);
  }

  async getContentBlocksByLocation(location: string): Promise<ContentBlock[]> {
    return await db.select().from(contentBlocks).where(eq(contentBlocks.location, location));
  }

  async getContentBlock(id: string): Promise<ContentBlock | undefined> {
    const [block] = await db.select().from(contentBlocks).where(eq(contentBlocks.id, id));
    return block || undefined;
  }

  async createContentBlock(block: InsertContentBlock): Promise<ContentBlock> {
    const [newBlock] = await db.insert(contentBlocks).values(block).returning();
    return newBlock;
  }

  async updateContentBlock(id: string, block: Partial<InsertContentBlock>): Promise<ContentBlock | undefined> {
    const [updated] = await db
      .update(contentBlocks)
      .set({ ...block, updatedAt: new Date() })
      .where(eq(contentBlocks.id, id))
      .returning();
    return updated;
  }

  async deleteContentBlock(id: string): Promise<boolean> {
    const result = await db.delete(contentBlocks).where(eq(contentBlocks.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export class MemStorage implements IStorage {
  private users = new Map<string, User>();
  private products = new Map<string, Product>();
  private carts = new Map<string, Cart>();
  private cartItems = new Map<string, CartItem>();
  private orders = new Map<string, Order>();
  private orderItems = new Map<string, OrderItem>();
  private siteSettings = new Map<string, SiteSetting>();
  private contentBlocks = new Map<string, ContentBlock>();
  private reviews = new Map<string, Review>();

  constructor() {
    this.seed();
  }

  private seed() {
    const adminId = "admin-user-id";
    this.users.set(adminId, {
      id: adminId,
      username: "admin",
      password: "password123",
      role: "admin",
      email: "admin@rajourikids.com",
      phone: null,
      addresses: [],
      createdAt: new Date()
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = Math.random().toString(36).substring(2, 9);
    const user: User = {
      id,
      username: insertUser.username,
      password: insertUser.password,
      role: "user",
      email: insertUser.email ?? null,
      phone: insertUser.phone ?? null,
      addresses: [],
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserProfile(id: string, email: string | null, phone: string | null, addresses: any[]): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated: User = {
      ...user,
      email,
      phone,
      addresses
    };
    this.users.set(id, updated);
    return updated;
  }

  // Products
  async getAllProducts(includeDrafts = false): Promise<Product[]> {
    const list = Array.from(this.products.values());
    const filtered = includeDrafts ? list : list.filter(p => p.status === "published");
    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductByInstagramId(instagramPostId: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(p => p.instagramPostId === instagramPostId);
  }

  async getProductsByCategory(category: string, includeDrafts = false): Promise<Product[]> {
    const list = Array.from(this.products.values()).filter(p => p.category === category);
    return includeDrafts ? list : list.filter(p => p.status === "published");
  }

  async getProductsByAgeGroup(ageGroup: string, includeDrafts = false): Promise<Product[]> {
    const list = Array.from(this.products.values()).filter(p => p.ageGroup === ageGroup);
    return includeDrafts ? list : list.filter(p => p.status === "published");
  }

  async createProduct(product: InsertProduct & { instagramPostId?: string | null; status?: string }): Promise<Product> {
    const id = Math.random().toString(36).substring(2, 9);
    const newProduct: Product = {
      id,
      name: product.name,
      description: product.description ?? null,
      price: product.price,
      originalPrice: product.originalPrice ?? null,
      category: product.category,
      ageGroup: product.ageGroup,
      sizes: product.sizes,
      images: product.images,
      inStock: product.inStock ?? true,
      isNew: product.isNew ?? false,
      discount: product.discount ?? null,
      instagramPostId: product.instagramPostId ?? null,
      status: product.status ?? "published",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.products.set(id, newProduct);
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct & { status?: string }>): Promise<Product | undefined> {
    const existing = this.products.get(id);
    if (!existing) return undefined;
    const updated: Product = {
      ...existing,
      ...product,
      updatedAt: new Date()
    };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.products.delete(id);
  }

  // Shopping Cart
  async getCart(sessionId: string): Promise<(Cart & { items: (CartItem & { product: Product })[] }) | undefined> {
    const cart = Array.from(this.carts.values()).find(c => c.sessionId === sessionId);
    if (!cart) return undefined;
    const items = Array.from(this.cartItems.values())
      .filter(item => item.cartId === cart.id)
      .map(item => {
        const product = this.products.get(item.productId)!;
        return { ...item, product };
      });
    return { ...cart, items };
  }

  async createCart(cart: InsertCart): Promise<Cart> {
    const id = Math.random().toString(36).substring(2, 9);
    const newCart: Cart = {
      id,
      sessionId: cart.sessionId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.carts.set(id, newCart);
    return newCart;
  }

  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    const existing = Array.from(this.cartItems.values()).find(
      item => item.cartId === cartItem.cartId && 
              item.productId === cartItem.productId && 
              item.size === cartItem.size
    );

    if (existing) {
      existing.quantity += cartItem.quantity ?? 1;
      return existing;
    } else {
      const id = Math.random().toString(36).substring(2, 9);
      const newItem: CartItem = {
        id,
        cartId: cartItem.cartId,
        productId: cartItem.productId,
        size: cartItem.size,
        quantity: cartItem.quantity ?? 1,
        createdAt: new Date()
      };
      this.cartItems.set(id, newItem);
      return newItem;
    }
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem | undefined> {
    const item = this.cartItems.get(id);
    if (!item) return undefined;
    item.quantity = quantity;
    return item;
  }

  async removeFromCart(id: string): Promise<boolean> {
    return this.cartItems.delete(id);
  }

  async clearCart(cartId: string): Promise<boolean> {
    Array.from(this.cartItems.entries()).forEach(([id, item]) => {
      if (item.cartId === cartId) {
        this.cartItems.delete(id);
      }
    });
    return true;
  }

  // Orders
  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const orderId = Math.random().toString(36).substring(2, 9);
    const newOrder: Order = {
      id: orderId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone ?? null,
      shippingAddress: order.shippingAddress,
      subtotal: order.subtotal,
      shipping: order.shipping,
      total: order.total,
      status: "pending",
      paymentIntentId: order.paymentIntentId ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.orders.set(orderId, newOrder);

    items.forEach(item => {
      const itemId = Math.random().toString(36).substring(2, 9);
      this.orderItems.set(itemId, {
        id: itemId,
        orderId,
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        size: item.size,
        quantity: item.quantity,
        price: item.price
      });
    });

    return newOrder;
  }

  async getOrder(id: string): Promise<(Order & { items: OrderItem[] }) | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    const items = Array.from(this.orderItems.values()).filter(item => item.orderId === order.id);
    return { ...order, items };
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    order.status = status;
    order.updatedAt = new Date();
    return order;
  }

  async getOrdersByEmail(email: string): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(o => o.customerEmail === email)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getReviews(productId: string): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(r => r.productId === productId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = Math.random().toString(36).substring(2, 9);
    const newReview: Review = {
      id,
      productId: insertReview.productId,
      name: insertReview.name,
      rating: insertReview.rating,
      content: insertReview.content,
      isVerified: insertReview.isVerified ?? false,
      createdAt: new Date()
    };
    this.reviews.set(id, newReview);
    return newReview;
  }

  // Site Settings
  async getSiteSettings(): Promise<SiteSetting[]> {
    return Array.from(this.siteSettings.values());
  }

  async getSiteSetting(key: string): Promise<SiteSetting | undefined> {
    return Array.from(this.siteSettings.values()).find(s => s.key === key);
  }

  async updateSiteSetting(key: string, value: any): Promise<SiteSetting | undefined> {
    const existing = Array.from(this.siteSettings.values()).find(s => s.key === key);
    if (existing) {
      existing.value = value;
      existing.updatedAt = new Date();
      return existing;
    } else {
      const id = Math.random().toString(36).substring(2, 9);
      const newSetting: SiteSetting = {
        id,
        key,
        value,
        updatedAt: new Date()
      };
      this.siteSettings.set(id, newSetting);
      return newSetting;
    }
  }

  // Content Blocks
  async getAllContentBlocks(): Promise<ContentBlock[]> {
    return Array.from(this.contentBlocks.values());
  }

  async getContentBlocksByLocation(location: string): Promise<ContentBlock[]> {
    return Array.from(this.contentBlocks.values()).filter(b => b.location === location);
  }

  async getContentBlock(id: string): Promise<ContentBlock | undefined> {
    return this.contentBlocks.get(id);
  }

  async createContentBlock(block: InsertContentBlock): Promise<ContentBlock> {
    const id = Math.random().toString(36).substring(2, 9);
    const newBlock: ContentBlock = {
      id,
      name: block.name,
      location: block.location,
      content: block.content,
      active: block.active ?? true,
      updatedAt: new Date()
    };
    this.contentBlocks.set(id, newBlock);
    return newBlock;
  }

  async updateContentBlock(id: string, block: Partial<InsertContentBlock>): Promise<ContentBlock | undefined> {
    const existing = this.contentBlocks.get(id);
    if (!existing) return undefined;
    const updated: ContentBlock = {
      ...existing,
      ...block,
      updatedAt: new Date()
    };
    this.contentBlocks.set(id, updated);
    return updated;
  }

  async deleteContentBlock(id: string): Promise<boolean> {
    return this.contentBlocks.delete(id);
  }
}

export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();

