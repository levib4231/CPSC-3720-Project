import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load shared secrets (e.g., JWT_SECRET) from project root .env
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });
// Then load service-specific overrides from this folder's .env (MONGO_URI, PORT, etc.)
dotenv.config();

// Fallback default mirroring .env.example for local dev
if (!process.env.MONGO_URI) {
  process.env.MONGO_URI = "mongodb://127.0.0.1:27017/user_auth_demo";
}

mongoose.set("strictQuery", true);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Mongo connected (user-authentication)"))
  .catch((err) => console.error("Mongo connection error", err));