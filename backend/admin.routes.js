// backend/admin.routes.js
import { Router } from 'express';
import pool from './db.js'; //

const router = Router();

router.get('/users', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT user_id, username, CONCAT(first_name,' ',last_name) AS name, role
      FROM users
      ORDER BY user_id ASC
    `);
    res.json({ users: rows });
  } catch (err) {
    console.error('GET /admin/users error:', err);
    res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้' });
  }
});

router.patch('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const ALLOWED = ['customer', 'employee', 'admin'];
    if (!ALLOWED.includes(role)) {
      return res.status(400).json({ message: 'ค่า role ไม่ถูกต้อง' });
    }
    const [result] = await pool.query(
      'UPDATE users SET role = ? WHERE user_id = ?',
      [role, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
    }
    res.json({ message: 'อัปเดต role สำเร็จ' });
  } catch (err) {
    console.error('PATCH /admin/users/:id/role error:', err);
    res.status(500).json({ message: 'อัปเดต role ไม่สำเร็จ' });
  }
});

export default router;
