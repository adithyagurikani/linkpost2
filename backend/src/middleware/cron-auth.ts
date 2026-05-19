import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

export function cronAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const cronSecret = env.CRON_SECRET;

  if (!cronSecret) {
    res.status(500).json({ error: "Cron authentication not configured" });
    return;
  }

  // Vercel cron header
  if (req.headers["x-vercel-cron"] === "1") {
    next();
    return;
  }

  // Bearer token
  const authHeader = req.headers.authorization;
  if (authHeader === `Bearer ${cronSecret}`) {
    next();
    return;
  }

  // Query param auth (for external cron tools)
  const queryKey =
    (req.query.key as string) || (req.query.token as string);
  if (queryKey === cronSecret) {
    next();
    return;
  }

  res.status(401).json({ error: "Unauthorized" });
}
