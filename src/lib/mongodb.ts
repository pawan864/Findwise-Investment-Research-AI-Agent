import mongoose from "mongoose";
import dns from "dns";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // ignore
}

const DEFAULT_URI = "mongodb://127.0.0.1:27017/findwise";
let MONGODB_URI = process.env.MONGODB_URI || DEFAULT_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose | null> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose | null> {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
    };

    // If SRV string for this cluster is provided, also construct fallback direct string
    const fallbackDirect = MONGODB_URI.includes("findwise.lksj7bi.mongodb.net") && MONGODB_URI.startsWith("mongodb+srv://")
      ? MONGODB_URI.replace(
          "mongodb+srv://",
          "mongodb://"
        ).replace(
          "findwise.lksj7bi.mongodb.net",
          "ac-sxwunjo-shard-00-00.lksj7bi.mongodb.net:27017,ac-sxwunjo-shard-00-01.lksj7bi.mongodb.net:27017,ac-sxwunjo-shard-00-02.lksj7bi.mongodb.net:27017"
        ) + (MONGODB_URI.includes("?") ? "&ssl=true&replicaSet=atlas-88l5ra-shard-0&authSource=admin" : "?ssl=true&replicaSet=atlas-88l5ra-shard-0&authSource=admin")
      : null;

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((m) => {
        console.log("Connected to MongoDB Atlas successfully.");
        return m;
      })
      .catch(async (err) => {
        if (fallbackDirect) {
          console.warn("Retrying with direct replica set hosts...");
          try {
            const m = await mongoose.connect(fallbackDirect, opts);
            console.log("Connected to MongoDB Atlas via direct hosts successfully.");
            return m;
          } catch (e) {
            console.warn("Fallback direct connection also failed:", (e as Error).message);
          }
        }
        cached.promise = null;
        console.warn("MongoDB connection warning:", err.message);
        return null;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch {
    cached.conn = null;
  }

  return cached.conn;
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
