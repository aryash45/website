import "dotenv/config";
import express from "express";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { registerRoutes } from "../server/routes.js";
import { pool } from "../server/db.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
    secure: true, // Vercel serves via HTTPS
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

export default app;
