const { MongoClient } = require('mongodb');
require('dotenv').config();
const dns = require('dns/promises');

async function run() {
  try {
    await dns.setServers(['8.8.8.8', '8.8.4.4']);
  } catch (e) {}

  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('test');
    
    const adithyaUser = await db.collection('users').findOne({ username: 'adithya' });
    if (!adithyaUser) {
      console.log('Adithya user not found');
      return;
    }
    
    const newUserId = adithyaUser._id.toString();
    const result = await db.collection('posts').updateMany({}, { $set: { userId: newUserId } });
    
    console.log('Updated', result.modifiedCount, 'posts to belong to user:', newUserId);
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

run();
