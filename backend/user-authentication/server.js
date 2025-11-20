import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load shared secrets (e.g., JWT_SECRET) from project root .env
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });
// Then load service-specific overrides from this folder's .env (MONGO_URI, PORT, etc.)
dotenv.config();

// Fallback defaults mirroring .env.example for local dev
if (!process.env.MONGO_URI) {
  process.env.MONGO_URI = "mongodb://127.0.0.1:27017/user_auth_demo";
}
process.env.PORT = "6003";

if (!process.env.CLIENT_ORIGIN) {
  process.env.CLIENT_ORIGIN = "http://localhost:3000";
}

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import './db.js';
import authRoutes from './routes/authRoutes.js';
import protectedRoutes from './routes/protectedRoutes.js';

const app = express();

app.use(cors({
  origin: process.env.CLIENT_ORIGIN,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// routes
app.use('/api/auth', authRoutes);
app.use('/api/protected', protectedRoutes);

const port = process.env.PORT || 6003;
app.listen(port, () => console.log(`user-authentication on http://localhost:${port}`));

export default app; // for tests