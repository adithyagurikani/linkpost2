import { Request, Response } from "express";
import { validate, LoginSchema, RegisterSchema } from "../lib/validation";
import * as authService from "../services/auth.service";

export async function login(req: Request, res: Response) {
  const { data, error } = validate(LoginSchema, req.body);
  if (error) return res.status(error.status).json({ error: error.message });

  try {
    const result = await authService.login(data.username, data.password);
    res.json(result);
  } catch (err: any) {
    res
      .status(err.statusCode || 500)
      .json({ error: err.message || "Login failed" });
  }
}

export async function register(req: Request, res: Response) {
  const { data, error } = validate(RegisterSchema, req.body);
  if (error) return res.status(error.status).json({ error: error.message });

  try {
    const result = await authService.register(data.username, data.password);
    res.status(201).json(result);
  } catch (err: any) {
    res
      .status(err.statusCode || 500)
      .json({ error: err.message || "Registration failed" });
  }
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token is required" });
  }

  try {
    const tokens = await authService.refreshTokens(refreshToken);
    res.json(tokens);
  } catch {
    res.status(401).json({ error: "Invalid or expired refresh token" });
  }
}
