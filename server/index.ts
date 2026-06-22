import "dotenv/config";
import path from "path";
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploaded images statically
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

// Session configuration with Postgres store
const PgSession = pgSession(session);
const usePgStore = Boolean(process.env.DATABASE_URL);

const sessionSecret = process.env.SESSION_SECRET || "change-me-in-prod";
if (sessionSecret === "change-me-in-prod") {
  console.warn("[SECURITY WARNING] SESSION_SECRET is using the default insecure value. Set a strong secret in your .env file!");
}

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
    secure: app.get("env") === "production",
    httpOnly: true,    // Prevents client-side JS from reading the session cookie (XSS protection)
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Send error response without rethrowing to avoid crashing the process
    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
  });
})();
