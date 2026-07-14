import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let mongoServer;

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;

    // Check if the Atlas URI is the default placeholder or missing
    if (!uri || uri.includes('<db_password>')) {
      console.log("⚠️ MongoDB Atlas password placeholder detected or URI missing.");
      console.log("🚀 Starting in-memory MongoDB database sandbox (mongodb-memory-server)...");
      
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
    }

    console.log(`Connecting to MongoDB at: ${uri.replace(/:[^@]+@/, ':****@')}`);
    
    // Set a short timeout for connection attempts to avoid hanging
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000 
    });
    
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.warn("⚠️ MongoDB connection failed. Attempting in-memory DB fallback...", err.message);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      if (!mongoServer) {
        mongoServer = await MongoMemoryServer.create();
      }
      const fallbackUri = mongoServer.getUri();
      console.log(`Connecting to in-memory fallback database at: ${fallbackUri}`);
      await mongoose.connect(fallbackUri);
      console.log("✅ connected to in-memory fallback database");
    } catch (fallbackErr) {
      console.error("❌ Both standard connection and in-memory fallback failed:", fallbackErr.message);
      process.exit(1);
    }
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
    console.log("🔌 MongoDB disconnected");
  } catch (err) {
    console.error("❌ MongoDB disconnect failed:", err.message);
  }
};

export default connectDB;
