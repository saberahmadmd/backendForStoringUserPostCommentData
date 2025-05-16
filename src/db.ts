import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// Validate and get MONGO_URI
const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
if (!uri) {
  throw new Error("❌ MONGO_URI is not defined in environment variables.");
}

const client = new MongoClient(uri);

export const connectToDb = async () => {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
  }
};

export const getDb = () => client.db('node_assignment');
