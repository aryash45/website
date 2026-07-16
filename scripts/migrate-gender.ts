// Migration: Add gender column to products and set values based on product name
import pg from "pg";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const { Client } = pg;

// Simple heuristic: assign gender by scanning product name keywords
function inferGender(name: string): string {
  const lower = name.toLowerCase();
  const girlKeywords = ["girl", "dress", "skirt", "frock", "blossom", "rainbow", "floral", "mint", "corset", "pleated", "co-ord"];
  const boyKeywords = ["boy", "shirt", "nicker", "vltn", "real madrid", "nike", "racing"];
  const isGirl = girlKeywords.some((k) => lower.includes(k));
  const isBoy = boyKeywords.some((k) => lower.includes(k));
  if (isGirl && !isBoy) return "Girls";
  if (isBoy && !isGirl) return "Boys";
  return "Unisex";
}

async function main() {
  let url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  if (url.includes("pooler.supabase.com:5432")) url = url.replace(":5432", ":6543");

  const client = new Client({ connectionString: url });
  await client.connect();
  process.stdout.write("Connected to database\n");

  // Add gender column if not exists
  await client.query(`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS gender text NOT NULL DEFAULT 'Unisex'
  `);
  process.stdout.write("Added gender column (or already existed)\n");

  // Fetch all products and assign gender
  const { rows } = await client.query("SELECT id, name FROM products");
  process.stdout.write(`Found ${rows.length} products\n`);

  for (const p of rows) {
    const gender = inferGender(p.name as string);
    await client.query("UPDATE products SET gender = $1 WHERE id = $2", [gender, p.id]);
    process.stdout.write(`SET "${p.name}" => ${gender}\n`);
  }

  await client.end();
  process.stdout.write("\nDone!\n");
}

main().catch((e) => {
  process.stderr.write(`ERROR: ${e}\n`);
  process.exit(1);
});
