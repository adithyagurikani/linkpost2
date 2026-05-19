import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(`[Error] ${err.message}`, err.stack);

  if (err instanceof ZodError) {
    const first = err.errors[0];
    res.status(400).json({ error: first.message });
    return;
  }

  if (err.name === "MongoServerError") {
    res.status(500).json({ error: "Database operation failed" });
    return;
  }

  const status = (err as any).statusCode || 500;
  res.status(status).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
}
