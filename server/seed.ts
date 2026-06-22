import "dotenv/config";
import { fileURLToPath } from "url";
import { db } from "./db.js";
import { products, users } from "../shared/schema.js";
import { eq } from "drizzle-orm";
import { hashPassword } from "./auth.js";

async function seedDatabase() {
  try {
    console.log("🌱 Seeding database...");
    
    // Check and seed admin user
    const existingAdmin = await db.select().from(users).where(eq(users.id, "admin-user-id"));
    if (existingAdmin.length === 0) {
      console.log("👤 Creating admin user...");
      const hashedPassword = await hashPassword("admin123");
      await db.insert(users).values({
        id: "admin-user-id",
        username: "admin",
        password: hashedPassword,
        role: "admin",
        email: "admin@rajourikids.com"
      });
    }
    
    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
}

export { seedDatabase };

// Run if called directly
const isDirectRun = process.argv[1] && 
  (fileURLToPath(import.meta.url) === process.argv[1] || 
   fileURLToPath(import.meta.url).replace(/\\/g, '/') === process.argv[1].replace(/\\/g, '/'));

if (isDirectRun) {
  seedDatabase().then(() => process.exit(0));
}