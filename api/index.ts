import "dotenv/config";
import express from "express";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { registerRoutes } from "../server/routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration with Postgres store
const PgSession = pgSession(session);
const usePgStore = Boolean(process.env.DATABASE_URL);

const sessionSecret = process.env.SESSION_SECRET || "change-me-in-prod";

// Create session store with error handler
const store = usePgStore ? new PgSession({
  conString: process.env.DATABASE_URL,
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

// Route registration wrapper to handle async setup
let routesRegistered = false;
let routesPromise: Promise<any> | null = null;

app.use(async (req, res, next) => {
  if (!routesRegistered) {
    if (!routesPromise) {
      routesPromise = registerRoutes(app);
    }
    await routesPromise;
    routesRegistered = true;
  }
  next();
});

export default app;
