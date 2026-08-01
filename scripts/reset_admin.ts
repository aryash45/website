import "dotenv/config";
import { db } from "../server/db.js";
import { users } from "../shared/schema.js";
import { eq } from "drizzle-orm";
import { hashPassword } from "../server/auth.js";

async function fixAdmin() {
  const hashedPassword = await hashPassword("admin123");
  const existingAdmin = await db.select().from(users).where(eq(users.username, "admin"));
  
  if (existingAdmin.length === 0) {
    console.log("Admin user does not exist. Creating admin user...");
    await db.insert(users).values({
      username: "admin",
      password: hashedPassword,
      role: "admin",
      email: "admin@rajourikids.com"
    });
    console.log("Admin user created successfully with username: admin and password: admin123");
  } else {
    console.log("Admin user exists. Updating password to 'admin123'...");
    await db.update(users)
      .set({ password: hashedPassword, role: "admin" })
      .where(eq(users.username, "admin"));
    console.log("Admin password successfully reset to 'admin123'");
  }
}

fixAdmin().then(() => process.exit(0)).catch((err) => {
  console.error("Error setting admin password:", err);
  process.exit(1);
});
