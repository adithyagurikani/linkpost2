import { getDb } from "../config/db";
import { AuditEntry } from "../types";

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    const db = await getDb();
    await db.collection("auditLogs").insertOne({
      ...entry,
      createdAt: new Date(),
    });
  } catch {
    // audit should never throw
  }
}
