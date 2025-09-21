// backend/users.me.routes.js (ไฟล์ใหม่สั้น ๆ)
import { Router } from "express";
import { authRequired } from "./auth.middleware.js";
import pool from "./db.js";

const router = Router();

router.patch("/me", authRequired, async (req, res) => {
  try {
    const uid = req.user.user_id;
    const { first_name = "", last_name = "", phone = "" } = req.body || {};
    await pool.query(
      "UPDATE users SET first_name=?, last_name=?, phone=? WHERE user_id=?",
      [first_name, last_name, phone, uid]
    );
    res.json({ message: "อัปเดตโปรไฟล์สำเร็จ" });
  } catch (e) {
    console.error("PATCH /api/users/me error:", e);
    res.status(500).json({ message: "อัปเดตไม่สำเร็จ" });
  }
});

export default router;
