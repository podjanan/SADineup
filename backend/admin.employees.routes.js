import { Router } from "express";
import pool from "./db.js";

const router = Router();

/**
 * GET /api/admin/employees
 * ดึงรายชื่อพนักงาน + ร้าน/สาขาที่สังกัด
 */
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT 
        u.user_id,
        u.username,
        CONCAT(u.first_name, ' ', u.last_name) AS full_name,
        u.email,
        u.phone,
        u.role,
        b.branch_id,
        b.name AS branch_name,
        br.name AS brand_name
      FROM users u
      LEFT JOIN employee_branches eb ON u.user_id = eb.user_id
      LEFT JOIN branches b ON eb.branch_id = b.branch_id
      LEFT JOIN brands br ON b.brand_id = br.brand_id
      WHERE u.role = 'employee'
      ORDER BY u.user_id ASC, b.branch_id ASC
      `
    );
    res.json({ employees: rows });
  } catch (err) {
    console.error("GET /api/admin/employees error:", err);
    res.status(500).json({ message: "ไม่สามารถโหลดรายชื่อพนักงานได้" });
  }
});

/**
 * POST /api/admin/employees
 * body: { user_id, branch_id }
 * กำหนดพนักงานสังกัดสาขา
 */
router.post("/", async (req, res) => {
  try {
    const { user_id, branch_id } = req.body;
    if (!user_id || !branch_id) {
      return res.status(400).json({ message: "กรุณาระบุ user_id และ branch_id" });
    }

    // ตรวจสอบว่า user เป็นพนักงานจริง
    const [[user]] = await pool.query(
      "SELECT user_id, role FROM users WHERE user_id = ?",
      [user_id]
    );
    if (!user || user.role !== "employee") {
      return res.status(400).json({ message: "User ไม่ใช่พนักงาน" });
    }

    // ตรวจสอบว่ามีสาขานี้จริง
    const [[branch]] = await pool.query(
      "SELECT branch_id FROM branches WHERE branch_id = ?",
      [branch_id]
    );
    if (!branch) {
      return res.status(400).json({ message: "ไม่พบสาขา" });
    }

    // บันทึกความสัมพันธ์
    await pool.query(
      `INSERT IGNORE INTO employee_branches (user_id, branch_id)
       VALUES (?, ?)`,
      [user_id, branch_id]
    );

    res.status(201).json({ message: "เพิ่มพนักงานเข้าในสาขาสำเร็จ" });
  } catch (err) {
    console.error("POST /api/admin/employees error:", err);
    res.status(500).json({ message: "ไม่สามารถเพิ่มพนักงานเข้าในสาขาได้" });
  }
});

/**
 * DELETE /api/admin/employees/:user_id/:branch_id
 * ลบพนักงานออกจากสาขา
 */
router.delete("/:user_id/:branch_id", async (req, res) => {
  try {
    const { user_id, branch_id } = req.params;

    await pool.query(
      "DELETE FROM employee_branches WHERE user_id = ? AND branch_id = ?",
      [user_id, branch_id]
    );

    res.json({ message: "ลบพนักงานออกจากสาขาสำเร็จ" });
  } catch (err) {
    console.error("DELETE /api/admin/employees error:", err);
    res.status(500).json({ message: "ไม่สามารถลบพนักงานออกจากสาขาได้" });
  }
});

export default router;
