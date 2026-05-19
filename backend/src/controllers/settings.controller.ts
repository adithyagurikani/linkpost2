import { Response } from "express";
import { compare, hash } from "bcryptjs";
import { getDb } from "../config/db";
import { validate, PasswordChangeSchema } from "../lib/validation";
import { getPrompts, updatePrompts } from "../services/prompt.service";
import { writeAuditLog } from "../services/audit.service";
import { AuthRequest, paramId } from "../types";
import { ObjectId } from "mongodb";

export async function changePassword(req: AuthRequest, res: Response) {
  const { data, error } = validate(PasswordChangeSchema, req.body);
  if (error) return res.status(error.status).json({ error: error.message });

  const db = await getDb();
  const user = await db
    .collection("users")
    .findOne({ _id: new ObjectId(req.user!.id) });

  if (!user) return res.status(404).json({ error: "User not found" });

  const valid = await compare(data.currentPassword, user.passwordHash);
  if (!valid)
    return res.status(400).json({ error: "Current password is incorrect" });

  const newHash = await hash(data.newPassword, 12);
  await db
    .collection("users")
    .updateOne({ _id: user._id }, { $set: { passwordHash: newHash } });

  writeAuditLog({
    action: "settings.password_changed",
    entityType: "user",
    userId: req.user!.id,
  });

  res.json({ ok: true });
}

export async function getPromptsHandler(req: AuthRequest, res: Response) {
  const prompts = await getPrompts(req.user!.id);
  res.json(prompts);
}

export async function updatePromptsHandler(req: AuthRequest, res: Response) {
  await updatePrompts(req.user!.id, req.body);
  writeAuditLog({
    action: "settings.prompts_updated",
    entityType: "settings",
    userId: req.user!.id,
  });
  res.json({ ok: true });
}
