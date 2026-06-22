import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema.js";

if (!process.env.DATABASE_URL) {
  console.warn("[startup] DATABASE_URL not set. API endpoints that access the database will fail until it's configured.");
}

// Automatically route to Supabase transaction pooler (port 6543) instead of session pooler (port 5432)
// to prevent EMAXCONNSESSION issues under concurrent serverless function executions.
let databaseUrl = process.env.DATABASE_URL;
if (databaseUrl && databaseUrl.includes('pooler.supabase.com:5432')) {
  databaseUrl = databaseUrl.replace('pooler.supabase.com:5432', 'pooler.supabase.com:6543');
}

export const pool = new pg.Pool({ 
  connectionString: databaseUrl,
  max: 1,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000
});
pool.on('error', (err) => {
  console.error('[postgres pool error]', err);
});
export const db = drizzle(pool, { schema });