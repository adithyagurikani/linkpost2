import jwt from "jsonwebtoken";
import { compare, hash } from "bcryptjs";
import { getDb } from "../config/db";
import { env } from "../config/env";
import { writeAuditLog } from "./audit.service";
import { TokenPair, JwtPayload } from "../types";
import { ObjectId } from "mongodb";

export function generateTokens(user: {
  id: string;
  username: string;
  role: "admin" | "user";
}): TokenPair {
  const accessToken = jwt.sign(
    { id: user.id, username: user.username, role: user.role } as JwtPayload,
    env.JWT_SECRET,
    { expiresIn: "15m" }
  );
  const refreshToken = jwt.sign(
    { id: user.id, username: user.username, role: user.role } as JwtPayload,
    env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
  return { accessToken, refreshToken };
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
}

export async function login(
  username: string,
  password: string
): Promise<{
  tokens: TokenPair;
  user: { id: string; username: string; role: "admin" | "user" };
}> {
  const trimmedUser = username.trim().toLowerCase();
  const trimmedPass = password.trim();

  await writeAuditLog({
    action: "login.attempt",
    entityType: "user",
    metadata: { username: trimmedUser },
  });

  const db = await getDb();
  const user = await db
    .collection("users")
    .findOne({ username: trimmedUser });

  if (!user) {
    await writeAuditLog({
      action: "login.failed",
      entityType: "user",
      metadata: { username: trimmedUser, reason: "user_not_found" },
    });
    throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });
  }

  const valid = await compare(trimmedPass, user.passwordHash);
  if (!valid) {
    await writeAuditLog({
      action: "login.failed",
      entityType: "user",
      metadata: { username: trimmedUser, reason: "invalid_credentials" },
    });
    throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });
  }

  const userId = user._id.toString();
  const role = user.role || "user";
  const tokens = generateTokens({ id: userId, username: user.username, role });

  await writeAuditLog({
    action: "login.success",
    entityType: "user",
    entityId: userId,
    metadata: { username: trimmedUser },
  });

  return { tokens, user: { id: userId, username: user.username, role } };
}

export async function register(
  username: string,
  password: string
): Promise<{
  tokens: TokenPair;
  user: { id: string; username: string; role: "admin" | "user" };
}> {
  if (!env.ALLOW_REGISTRATION) {
    throw Object.assign(new Error("Registration is disabled"), {
      statusCode: 403,
    });
  }

  const db = await getDb();
  const trimmedUser = username.trim().toLowerCase();

  const existing = await db
    .collection("users")
    .findOne({ username: trimmedUser });
  if (existing) {
    throw Object.assign(new Error("Username already taken"), {
      statusCode: 409,
    });
  }

  const passwordHash = await hash(password, 12);
  const result = await db.collection("users").insertOne({
    username: trimmedUser,
    passwordHash,
    role: "user",
    createdAt: new Date(),
  });

  const userId = result.insertedId.toString();
  const tokens = generateTokens({ id: userId, username: trimmedUser, role: "user" });

  return { tokens, user: { id: userId, username: trimmedUser, role: "user" } };
}

export async function refreshTokens(refreshToken: string): Promise<TokenPair> {
  const payload = verifyRefreshToken(refreshToken);
  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(payload.id) });
  const role = user?.role || "user";
  return generateTokens({ id: payload.id, username: payload.username, role });
}
