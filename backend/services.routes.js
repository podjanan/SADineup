// backend/services.routes.js
import { Router } from "express";
import pool from "./db.js";

const router = Router();

/**
 * GET /api/services
 * รายการบริการสำหรับผู้ใช้ทั่วไป
 */
router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT service_id, name, duration, price FROM services ORDER BY service_id DESC`
    );
    res.json({ services: rows });
  } catch (err) {
    console.error("GET /services error:", err);
    res.status(500).json({ message: "ดึงรายการบริการไม่สำเร็จ" });
  }
});

export default router;