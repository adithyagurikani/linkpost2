import { MongoClient, Db } from "mongodb";
import { env } from "./env";
import dns from "dns/promises";

if (env.NODE_ENV === "development") {
  try {
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
  } catch (err) {
    console.warn("Failed to set custom DNS servers:", err);
  }
}

let clientPromise: Promise<MongoClient> | null = null;
let indexesEnsured = false;

function getClientPromise(): Promise<MongoClient> {
  if (!clientPromise) {
    const client = new MongoClient(env.MONGODB_URI);
    clientPromise = client.connect();
  }
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  const db = client.db();

  if (!indexesEnsured) {
    indexesEnsured = true;
    ensureIndexes(db).catch((err) =>
      console.error("Index creation failed:", err)
    );
  }

  return db;
}

async function ensureIndexes(db: Db): Promise<void> {
    await Promise.all([
    db.collection("posts").createIndexes([
      { key: { userId: 1 } },
      { key: { status: 1, scheduledAt: 1 } },
      { key: { status: 1, postedAt: -1 } },
      { key: { status: 1, createdAt: -1 } },
      { key: { accountId: 1 } },
      { key: { linkedinPostId: 1 }, sparse: true },
      { key: { analyticsLastSync: 1 } },
      { key: { userId: 1, status: 1, postedAt: -1 } },
      { key: { userId: 1, status: 1, source: 1 } },
      { key: { userId: 1, scheduledAt: 1 } },
      { key: { userId: 1, accountId: 1 } },
      { key: { userId: 1, updatedAt: -1 } },
    ]),
    db.collection("accounts").createIndexes([
      { key: { userId: 1 } },
      { key: { linkedinUserId: 1 }, unique: true, sparse: true },
      { key: { createdAt: -1 } },
    ]),
    db.collection("contentSources").createIndexes([
      { key: { userId: 1 } },
      { key: { createdAt: -1 } },
    ]),
    db.collection("schedules").createIndexes([
      { key: { userId: 1 } },
      { key: { isActive: 1, nextRunAt: 1 } },
    ]),
    db.collection("auditLogs").createIndexes([
      { key: { createdAt: -1 } },
      { key: { action: 1 } },
      { key: { entityType: 1 } },
      { key: { userId: 1 } },
      { key: { userId: 1, createdAt: -1 } },
      { key: { userId: 1, action: 1, createdAt: -1 } },
    ]),
    // TTL index for OAuth state documents — auto-delete after 10 minutes
    db.collection("oauthStates").createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 600 }
    ),
  ]);
}
