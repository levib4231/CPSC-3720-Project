import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';

const cookieCfg = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.COOKIE_SECURE === 'true',
  maxAge: 30 * 60 * 1000 // 30 minutes
};

export async function register(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: 'Email already in use' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, passwordHash });
  return res.status(201).json({ id: user._id, email: user.email });
}

// controllers/authController.js (login)
export async function login(req, res) {
  const { email, password, delivery = "cookie" } = req.body || {};
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = signToken({ sub: String(user._id), email: user.email });

  if (delivery === "memory") {
    // return token so the frontend can call other services on different ports
    return res.json({ token, email: user.email, expiresIn: 30 * 60 });
  }

  // cookie mode (existing behavior)
  res.set("Cache-Control", "no-store");
  res.cookie("token", token, {
    httpOnly: true, sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    maxAge: 30 * 60 * 1000
  });
  return res.json({ email: user.email });
}
export function me(req, res) {
  // quick presence check; rely on protected endpoints for full verify
  return res.json({ authenticated: Boolean(req.cookies?.token) });
}

export function logout(_req, res) {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: process.env.COOKIE_SECURE === 'true' });
  return res.json({ message: 'Logged out' });
}