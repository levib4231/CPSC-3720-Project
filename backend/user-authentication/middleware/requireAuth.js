import { verifyToken } from '../utils/jwt.js';

export default function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : null;
  const token = req.cookies?.token || bearer;
  if (!token) return _res.status(401).json({ message: 'Unauthorized' });

  try {
    req.user = verifyToken(token); // { sub, email, iat, exp }
    return next();
  } catch {
    return _res.status(401).json({ message: 'Token expired or invalid' });
  }
}