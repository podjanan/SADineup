// backend/auth.routes.js
import { Router } from "express";
import pool from "./db.js";
import jwt from "jsonwebtoken";
// (ถ้าจะใช้ bcrypt ค่อยเพิ่มภายหลัง)
import { authRequired } from "./auth.middleware.js";


const router = Router();

/**
 * POST /api/auth/register
 * body: { name, username, email, password, confirmPassword, phone }
 */
router.post("/register", async (req, res) => {
  try {
    const { name, username, email, password, confirmPassword, phone } = req.body || {};

    if (!name || !username || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน" });
    }

    const trimmed = name.trim().replace(/\s+/g, " ");
    const spaceIdx = trimmed.lastIndexOf(" ");
    const first_name = spaceIdx > 0 ? trimmed.slice(0, spaceIdx) : trimmed;
    const last_name = spaceIdx > 0 ? trimmed.slice(spaceIdx + 1) : "";

    // ตรวจ Username/Email ซ้ำ
    const [dupRows] = await pool.query(
      "SELECT user_id FROM users WHERE username = ? OR email = ? LIMIT 1",
      [username, email]
    );
    if (dupRows.length) {
      return res.status(409).json({ message: "Username หรือ Email ถูกใช้แล้ว" });
    }

    // NOTE: ยังไม่แฮชรหัสผ่าน (เพื่อให้ตรงกับโค้ดเดิมของคุณ)
    const [result] = await pool.query(
      "INSERT INTO users (username, password, first_name, last_name, email, phone, role) VALUES (?, ?, ?, ?, ?, ?, 'customer')",
      [username, password, first_name, last_name, email, phone || null]
    );

    return res.status(201).json({
      message: "สมัครสมาชิกสำเร็จ",
      user: {
        user_id: result.insertId,
        username,
        first_name,
        last_name,
        email,
        phone: phone || null,
        role: "customer",
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  }
});

/**
 * POST /api/auth/login
 * body: { identifier, password }  // identifier = username หรือ email
 * คืน { token, user }
 */
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body || {};
    if (!identifier?.trim() || !password?.trim()) {
      return res.status(400).json({ message: "กรุณากรอก identifier และ password" });
    }

    const [rows] = await pool.query(
      `SELECT user_id, username, password, first_name, last_name, email, phone, role
       FROM users
       WHERE username = ? OR email = ?
       LIMIT 1`,
      [identifier, identifier]
    );
    if (!rows.length) return res.status(404).json({ message: "ไม่พบบัญชีผู้ใช้" });

    const user = rows[0];

    // เทียบรหัสผ่านตรง ๆ (ยังไม่ใช้ bcrypt)
    if (user.password !== password) {
      return res.status(401).json({ message: "รหัสผ่านไม่ถูกต้อง" });
    }

    // ไม่ส่ง password กลับ
    delete user.password;

    const secret = process.env.JWT_SECRET || "dev_fallback_secret_change_me";
    const expires = process.env.JWT_EXPIRES || "7d";

    // ✅ สำคัญ: ใส่ user_id ใน payload ให้ตรงกับ middleware
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, username: user.username, role: user.role },
      secret,
      { expiresIn: expires }
    );

    return res.json({ message: "เข้าสู่ระบบสำเร็จ", user, token });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  }
});

/**
 * (ออปชัน) GET /api/auth/whoami  – ไว้เทสว่า token ใช้งานได้จริง
 */
router.get("/whoami", async (req, res) => {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return res.json({ user: null });
  try {
    const payload = jwt.verify(h.slice(7), process.env.JWT_SECRET || "dev_fallback_secret_change_me");
    res.json({ user: { user_id: payload.user_id, email: payload.email, username: payload.username, role: payload.role } });
  } catch {
    res.json({ user: null });
  }
});

/**
 * (ออปชัน/แอดมิน) GET /api/auth/users
 */
router.get("/users", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT user_id, username, CONCAT(first_name, ' ', last_name) AS name, role
       FROM users
       ORDER BY user_id ASC`
    );
    res.json({ users: rows });
  } catch (err) {
    console.error("GET /auth/users error:", err);
    res.status(500).json({ message: "ไม่สามารถดึงข้อมูลผู้ใช้ได้" });
  }
});

/**
 * (ออปชัน/แอดมิน) PATCH /api/auth/users/:id/role
 * body: { role: 'admin' | 'employee' | 'customer' }
 */
router.patch("/users/:id/role", async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const ALLOWED = ["customer", "admin", "employee"];
    if (!ALLOWED.includes(role)) {
      return res.status(400).json({ message: "ค่า role ไม่ถูกต้อง" });
    }
    const [result] = await pool.query("UPDATE users SET role = ? WHERE user_id = ?", [role, id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    res.json({ message: "อัปเดต role สำเร็จ" });
  } catch (err) {
    console.error("PATCH /auth/users/:id/role error:", err);
    res.status(500).json({ message: "อัปเดต role ไม่สำเร็จ" });
  }
});


router.get("/me", authRequired, async (req, res) => {
  try {
    const uid = req.user.user_id;

    const [[u]] = await pool.query(
      `SELECT user_id, username, first_name, last_name, email, phone, role, created_at
       FROM users WHERE user_id=?`,
      [uid]
    );

    if (!u) return res.status(404).json({ message: "ไม่พบผู้ใช้" });

    // ดึงสังกัด (ถ้าเป็นพนักงาน)
    const [rows] = await pool.query(
      `SELECT eb.branch_id, b.name AS branch_name, br.brand_id, br.name AS brand_name
       FROM employee_branches eb
       JOIN branches b ON eb.branch_id=b.branch_id
       JOIN brands br ON b.brand_id=br.brand_id
       WHERE eb.user_id=?`,
      [uid]
    );

    res.json({ user: { ...u, employee_branches: rows } });
  } catch (e) {
    console.error("GET /api/auth/me error:", e);
    res.status(500).json({ message: "ไม่สามารถโหลดข้อมูลผู้ใช้ได้" });
  }
});


export default router;
