import { hash } from "bcryptjs";
import { ObjectId } from "mongodb";
import { getDb } from "../config/db";
import { writeAuditLog } from "./audit.service";
import { UserDoc } from "../types";

export async function listUsers(): Promise<Pick<UserDoc, "_id" | "username" | "role" | "createdAt">[]> {
  const db = await getDb();
  return db
    .collection<UserDoc>("users")
    .find({}, { projection: { passwordHash: 0 } })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function createUser(username: string, password: string, role: "admin" | "user" = "user") {
  const db = await getDb();
  const trimmedUser = username.trim().toLowerCase();

  const existing = await db.collection("users").findOne({ username: trimmedUser });
  if (existing) {
    throw Object.assign(new Error("Username already taken"), { statusCode: 409 });
  }

  const passwordHash = await hash(password, 12);
  const result = await db.collection("users").insertOne({
    username: trimmedUser,
    passwordHash,
    role,
    createdAt: new Date(),
  });

  return { id: result.insertedId.toString(), username: trimmedUser, role };
}

export async function deleteUser(id: string) {
  const db = await getDb();
  const result = await db.collection("users").deleteOne({ _id: new ObjectId(id) });
  if (result.deletedCount === 0) {
    throw Object.assign(new Error("User not found"), { statusCode: 404 });
  }
}

export async function resetPassword(id: string, newPassword: string) {
  const db = await getDb();
  const passwordHash = await hash(newPassword, 12);
  const result = await db.collection("users").updateOne(
    { _id: new ObjectId(id) },
    { $set: { passwordHash } }
  );
  if (result.matchedCount === 0) {
    throw Object.assign(new Error("User not found"), { statusCode: 404 });
  }
}
