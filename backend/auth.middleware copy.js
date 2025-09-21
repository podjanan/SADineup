// auth.middleware.js
import jwt from 'jsonwebtoken';

export function authRequired(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'ต้องล็อกอินก่อน' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { sub, username, role, iat, exp }
    return next();
  } catch (e) {
    return res.status(401).json({ message: 'Session หมดอายุหรือ token ไม่ถูกต้อง' });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'ต้องล็อกอินก่อน' });
    if (req.user.role !== role) return res.status(403).json({ message: 'สิทธิ์ไม่เพียงพอ' });
    next();
  };
}
