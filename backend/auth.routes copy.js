// auth.routes.js
import { Router } from 'express';
import pool from './db.js';
import jwt from 'jsonwebtoken';


const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { name, username, email, password, confirmPassword, phone } = req.body;

    if (!name || !username || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน' });
    }

    const trimmed = name.trim().replace(/\s+/g, ' ');
    const spaceIdx = trimmed.lastIndexOf(' ');
    const first_name = spaceIdx > 0 ? trimmed.slice(0, spaceIdx) : trimmed;
    const last_name  = spaceIdx > 0 ? trimmed.slice(spaceIdx + 1) : '';

    // เช็คซ้ำ
    const [dupRows] = await pool.query(
      'SELECT user_id FROM users WHERE username = ? OR email = ? LIMIT 1',
      [username, email]
    );
    if (dupRows.length) {
      return res.status(409).json({ message: 'Username หรือ Email ถูกใช้แล้ว' });
    }

    // บันทึก
    const [result] = await pool.query(
      'INSERT INTO users (username, password, first_name, last_name, email, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [username, password, first_name, last_name, email, phone || null]
    );

    return res.status(201).json({
      message: 'สมัครสมาชิกสำเร็จ',
      user: {
        user_id: result.insertId,
        username,
        first_name,
        last_name,
        email,
        phone: phone || null,
        role: 'customer',
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body || {};
    if (!identifier?.trim() || !password?.trim()) {
      return res.status(400).json({ message: 'กรุณากรอก identifier และ password' });
    }

    // ดึงผู้ใช้จาก DB
    const [rows] = await pool.query(
      `SELECT user_id, username, password, first_name, last_name, email, phone, role
       FROM users
       WHERE username = ? OR email = ?
       LIMIT 1`,
      [identifier, identifier]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'ไม่พบบัญชีผู้ใช้' });
    }

    const user = rows[0];

    // ไม่ใช้ bcrypt ตามที่คุณแจ้ง → เทียบตรง ๆ
    if (user.password !== password) {
      return res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });
    }

    // ไม่ส่ง password กลับไป
    delete user.password;

    // ป้องกัน env หาย
    const secret = process.env.JWT_SECRET || 'dev_fallback_secret_change_me';
    const expires = process.env.JWT_EXPIRES || '30m';

    const token = jwt.sign(
      { sub: user.user_id, username: user.username, role: user.role },
      secret,
      { expiresIn: expires }
    );

    return res.json({
      message: 'เข้าสู่ระบบสำเร็จ',
      user,
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
});

/**
 * GET /api/admin/users
 * ดึงรายการผู้ใช้ทั้งหมด
 */
router.get("/users", async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT user_id, username, CONCAT(first_name, ' ', last_name) AS name, role
       FROM users
       ORDER BY user_id ASC`
    );
    res.json({ users: rows });
  } catch (err) {
    console.error("GET /admin/users error:", err);
    res.status(500).json({ message: "ไม่สามารถดึงข้อมูลผู้ใช้ได้" });
  }
});

/**
 * PATCH /api/admin/users/:id/role
 * body: { role: 'admin' | 'employee' | 'customer' }
 */
router.patch("/users/:id/role", async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // ตรวจสอบค่า role ให้ตรงกับ enum ใน DB
    const ALLOWED = ["customer", "admin", "employee"];
    if (!ALLOWED.includes(role)) {
      return res.status(400).json({ message: "ค่า role ไม่ถูกต้อง" });
    }

    const [result] = await db.promise().query(
      "UPDATE users SET role = ? WHERE user_id = ?",
      [role, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    }

    res.json({ message: "อัปเดต role สำเร็จ" });
  } catch (err) {
    console.error("PATCH /admin/users/:id/role error:", err);
    res.status(500).json({ message: "อัปเดต role ไม่สำเร็จ" });
  }
});




export default router;
