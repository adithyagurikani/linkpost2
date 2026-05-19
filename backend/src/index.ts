import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { requestLogger } from "./middleware/request-logger";
import { errorHandler } from "./middleware/error-handler";
import routes from "./routes";
import { startCronJobs } from "./jobs/cron-scheduler";

const app = express();

// ─── Security ───
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
const allowedOrigins = [
  env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.trim().toLowerCase();
      const isAllowed = allowedOrigins.some((allowed) => {
        const normalizedAllowed = allowed.trim().toLowerCase();
        return normalizedAllowed === "*" || normalizedAllowed === normalizedOrigin;
      });

      if (isAllowed) {
        return callback(null, true);
      }

      // Dynamically allow localhost, Vercel previews, and Render domains
      if (
        normalizedOrigin.startsWith("http://localhost:") ||
        normalizedOrigin.startsWith("http://127.0.0.1:") ||
        normalizedOrigin.endsWith(".vercel.app") ||
        normalizedOrigin.endsWith(".onrender.com")
      ) {
        return callback(null, true);
      }

      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// ─── Body parsing ───
app.use(express.json({ limit: "5mb" }));

// ─── Logging ───
app.use(requestLogger);

// ─── Routes ───
app.use("/api/v1", routes);

// ─── Error handler (must be last) ───
app.use(errorHandler);

// ─── Start ───
app.listen(env.PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   InkPost API v1.0.0                ║
  ║   Port: ${env.PORT}                         ║
  ║   Env:  ${env.NODE_ENV.padEnd(26)}║
  ║   CORS: ${env.FRONTEND_URL.slice(0, 25).padEnd(26)}║
  ╚══════════════════════════════════════╝
  `);
  startCronJobs();
});

export default app;
