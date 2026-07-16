import pg from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const { Client } = pg;

const AGE_GROUP_SIZES: Record<string, string[]> = {
  "0-2 Years":  ["0-6M", "6-12M", "1-2Y"],
  "3-5 Years":  ["2-3Y", "3-4Y", "4-5Y"],
  "6-8 Years":  ["5-6Y", "6-7Y", "7-8Y"],
  "9-12 Years": ["8-9Y", "9-10Y", "10-11Y", "11-12Y"],
};

const ADULT_SIZES = new Set(["XS", "S", "M", "L", "XL", "XXL"]);

async function main() {
  let url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  if (url.includes("pooler.supabase.com:5432")) {
    url = url.replace(":5432", ":6543");
  }

  const client = new Client({ connectionString: url });
  await client.connect();
  process.stdout.write("Connected to database\n");

  const result = await client.query(
    "SELECT id, name, age_group, sizes FROM products ORDER BY created_at"
  );
  const products = result.rows;
  process.stdout.write(`Found ${products.length} products\n`);

  let updated = 0;
  let skipped = 0;

  for (const p of products) {
    const hasAdultSizes = (p.sizes as string[]).some((s) => ADULT_SIZES.has(s));
    if (!hasAdultSizes) {
      process.stdout.write(`SKIP: "${p.name}" => [${(p.sizes as string[]).join(", ")}]\n`);
      skipped++;
      continue;
    }

    const newSizes = AGE_GROUP_SIZES[p.age_group as string] || ["2-3Y", "3-4Y", "4-5Y"];
    await client.query(
      "UPDATE products SET sizes = $1, updated_at = NOW() WHERE id = $2",
      [newSizes, p.id]
    );
    process.stdout.write(`UPDATED: "${p.name}" [${p.age_group}] => [${newSizes.join(", ")}]\n`);
    updated++;
  }

  await client.end();
  process.stdout.write(`\nDone! Updated: ${updated} | Skipped: ${skipped}\n`);
}

main().catch((e) => {
  process.stderr.write(`ERROR: ${e}\n`);
  process.exit(1);
});
