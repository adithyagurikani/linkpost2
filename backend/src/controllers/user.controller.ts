import { Response } from "express";
import { AuthRequest, paramId } from "../types";
import * as userService from "../services/user.service";
import { writeAuditLog } from "../services/audit.service";

export async function listUsers(req: AuthRequest, res: Response) {
  try {
    const users = await userService.listUsers();
    res.json(users);
  } catch (err) {
    console.error("Failed to list users:", err);
    res.status(500).json({ error: "Failed to list users" });
  }
}

export async function createUser(req: AuthRequest, res: Response) {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    const user = await userService.createUser(username, password, role || "user");
    writeAuditLog({
      action: "user.created",
      entityType: "user",
      entityId: user.id,
      userId: req.user!.id,
      metadata: { username: user.username, createdBy: req.user!.username },
    });
    res.status(201).json(user);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error: err.message || "Failed to create user" });
  }
}

export async function deleteUser(req: AuthRequest, res: Response) {
  try {
    const id = paramId(req);
    if (id === req.user!.id) {
      return res.status(400).json({ error: "Cannot delete yourself" });
    }
    await userService.deleteUser(id);
    writeAuditLog({
      action: "user.deleted",
      entityType: "user",
      entityId: id,
      userId: req.user!.id,
    });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error: err.message || "Failed to delete user" });
  }
}

export async function resetPassword(req: AuthRequest, res: Response) {
  try {
    const id = paramId(req);
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    await userService.resetPassword(id, password);
    writeAuditLog({
      action: "user.password_reset",
      entityType: "user",
      entityId: id,
      userId: req.user!.id,
    });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error: err.message || "Failed to reset password" });
  }
}
