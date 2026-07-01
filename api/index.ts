import "dotenv/config";
import express from "express";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { registerRoutes } from "../server/routes.js";
import { pool } from "../server/db.js";

const app = express();

// Trust Vercel's edge proxy so req.secure and req.ip are correct.
// Without this, Express sees all requests as HTTP (Vercel terminates TLS at the edge)
// and cookie.secure:true silently drops the Set-Cookie header.
app.set('trust proxy', 1);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Session configuration — share the single pool instance with the session store
// so connect-pg-simple doesn't open its own separate connections.
const PgSession = pgSession(session);
const usePgStore = Boolean(process.env.DATABASE_URL);

const sessionSecret = process.env.SESSION_SECRET || "change-me-in-prod";

const store = usePgStore ? new PgSession({
  pool: pool,
  createTableIfMissing: true,
}) : undefined;

if (store) {
  store.on('error', (err) => {
    console.error('[session store error]', err);
  });
}

app.use(session({
  store,
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    // With trust proxy set above, req.secure is true on Vercel (HTTPS).
    // secure:true means the browser only sends the cookie over HTTPS — correct for production.
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

// Register routes eagerly at module load time.
// Using a top-level promise ensures routes are attached before any request is handled.
// In a serverless environment each cold start is a new module load, so this
// effectively runs once per instance — which is the correct behaviour.
const ready = registerRoutes(app);

// Block every incoming request until route registration completes.
// This avoids the race where the first request arrives before registerRoutes resolves.
app.use(async (_req, _res, next) => {
  await ready;
  next();
});

// Custom error handling middleware to capture and log errors
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Production Server Error]:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ 
    error: err.message || "Internal Server Error",
    details: err.code || undefined
  });
});

export default app;

