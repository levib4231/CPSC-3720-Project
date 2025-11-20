// load env for tests (shared root + service-local)
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Shared secrets (JWT_SECRET) from project root .env
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });
// Service-specific values from backend/user-authentication/.env (MONGO_URI, PORT, etc.)
dotenv.config();