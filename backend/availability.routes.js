// backend/availability.routes.js
import { Router } from "express";
import pool from "./db.js";

const router = Router();

/**
 * Fallback: รายการประเภทโต๊ะของสาขา (ไม่เช็คเวลาว่างจริง แค่โครงสร้าง/ความจุ)
 * GET /api/availability/table-types?branch_id=..&date=YYYY-MM-DD&time=HH:mm&guest=2&duration=120
 * (หน้า BookTable ใช้เป็น fallback ถ้า /catalog/branch-table-types ใช้ไม่ได้)
 */
router.get("/table-types", async (req, res) => {
  try {
    const { branch_id } = req.query;
    if (!branch_id) return res.status(400).json({ message: "กรุณาระบุ branch_id" });

    const [rows] = await pool.query(
      `
      SELECT tt.type_id, tt.name, tt.min_capacity, tt.max_capacity, btt.total_slots
      FROM branch_table_types btt
      JOIN table_types tt ON tt.type_id = btt.type_id
      WHERE btt.branch_id = ?
      ORDER BY tt.min_capacity, tt.max_capacity, tt.name
      `,
      [branch_id]
    );

    res.json({ items: rows });
  } catch (err) {
    console.error("GET /api/availability/table-types error:", err);
    res.status(500).json({ message: "ดึงชนิดโต๊ะไม่สำเร็จ" });
  }
});

/**
 * เช็คจำนวนคงเหลือในช่วงเวลาหนึ่ง
 * GET /api/availability/remaining?branch_id=..&type_id=..&date=YYYY-MM-DD&time=HH:mm&duration=120
 * คืน { total, booked, remaining }
 */
router.get("/remaining", async (req, res) => {
  try {
    const { branch_id, type_id, date, time, duration } = req.query;
    if (!branch_id || !type_id || !date || !time || !duration) {
      return res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน" });
    }

    const [[slotRow]] = await pool.query(
      `SELECT COALESCE(btt.total_slots, 1) AS total_slots
       FROM branch_table_types btt
       WHERE btt.branch_id = ? AND btt.type_id = ?`,
      [branch_id, type_id]
    );
    const total = slotRow?.total_slots ?? 1;

    const t = (time || "").length === 5 ? `${time}:00` : time;
    const [[{ start_dt }]] = await pool.query(
      `SELECT STR_TO_DATE(CONCAT(?, ' ', ?), '%Y-%m-%d %H:%i:%s') AS start_dt`,
      [date, t]
    );
    const [[{ end_dt }]] = await pool.query(
      `SELECT DATE_ADD(?, INTERVAL ? MINUTE) AS end_dt`,
      [start_dt, Number(duration || 0)]
    );

    const [[{ cnt }]] = await pool.query(
      `
      SELECT COUNT(*) AS cnt
      FROM appointments a
      WHERE a.branch_id = ?
        AND a.type_id   = ?
        AND a.status IN ('pending','confirmed')
        AND STR_TO_DATE(CONCAT(a.date, ' ', a.time), '%Y-%m-%d %H:%i:%s') < ?
        AND DATE_ADD(STR_TO_DATE(CONCAT(a.date, ' ', a.time), '%Y-%m-%d %H:%i:%s'), INTERVAL a.duration MINUTE) > ?
      `,
      [branch_id, type_id, end_dt, start_dt]
    );

    const remaining = Math.max(0, total - cnt);
    res.json({ total, booked: cnt, remaining });
  } catch (err) {
    console.error("GET /api/availability/remaining error:", err);
    res.status(500).json({ message: "ดึงจำนวนคงเหลือไม่สำเร็จ" });
  }
});

export default router;
