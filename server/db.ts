import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema";

if (!process.env.DATABASE_URL) {
  console.warn("[startup] DATABASE_URL not set. API endpoints that access the database will fail until it's configured.");
}

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
pool.on('error', (err) => {
  console.error('[postgres pool error]', err);
});
export const db = drizzle(pool, { schema });