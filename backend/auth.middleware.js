// backend/auth.middleware.js
import jwt from "jsonwebtoken";

export const authRequired = (req, res, next) => {
  // DEBUG: ดูว่า header ถูกแนบมาจริงไหม
  console.log("AUTH >>", req.method, req.url, req.headers.authorization || "-");

  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = h.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev_fallback_secret_change_me");
    if (!payload?.user_id) return res.status(401).json({ message: "Invalid token" });

    req.user = {
      user_id: payload.user_id,
      email: payload.email || null,
      username: payload.username || null,
      role: payload.role || "user",
    };
    next();
  } catch (e) {
    console.error("JWT verify error:", e.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// เพิ่ม requireRole เพื่อให้ server.js import ได้
export const requireRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    }
    next();
  };
};
