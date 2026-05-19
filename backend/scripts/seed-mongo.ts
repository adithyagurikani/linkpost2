import { MongoClient } from "mongodb";
import { hash } from "bcryptjs";
import { config } from "dotenv";
import dns from "dns/promises";

config();

if (process.env.NODE_ENV === "development" || !process.env.NODE_ENV) {
  try {
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
  } catch (err) {
    console.warn("Failed to set custom DNS servers:", err);
  }
}


async function main() {
  const uri = process.env.MONGODB_URI;
  let username = process.env.ADMIN_USERNAME;
  let password = process.env.ADMIN_PASSWORD;

  if (!uri) throw new Error("MONGODB_URI is missing in .env");
  if (!username || !password) {
    throw new Error("ADMIN_USERNAME and ADMIN_PASSWORD must be set in .env for seeding");
  }

  const passwordHash = await hash(password, 12);

  console.log("Connecting to MongoDB Atlas...");
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();

    // Seed users
    const usersCol = db.collection("users");
    await usersCol.createIndex({ username: 1 }, { unique: true });

    const existing = await usersCol.findOne({ username: username.toLowerCase() });
    if (existing) {
      console.log("User exists. Updating hash and role...");
      await usersCol.updateOne({ _id: existing._id }, { $set: { passwordHash, role: "admin" } });
    } else {
      console.log("Creating admin user...");
      await usersCol.insertOne({
        username: username.toLowerCase(),
        passwordHash,
        role: "admin",
        createdAt: new Date(),
      });
    }

    // Create indexes
    await db.collection("posts").createIndex({ status: 1, scheduledAt: 1 });
    await db.collection("posts").createIndex({ userId: 1 });
    console.log("Created indexes on posts");

    console.log("Seeding complete!");
  } catch (err) {
    console.error("Error seeding:", err);
  } finally {
    await client.close();
  }
}

main();
