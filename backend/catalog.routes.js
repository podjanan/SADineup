// backend/catalog.routes.js
import { Router } from "express";
import pool from "./db.js";

const router = Router();

/**
 * แบรนด์ทั้งหมด (public)
 * - ส่ง logo_url มาด้วย เพื่อใช้โชว์โลโก้
 */
router.get("/brands", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT brand_id, name, logo_url
       FROM brands
       ORDER BY name ASC`
    );
    res.json({ brands: rows });
  } catch (err) {
    console.error("GET /api/catalog/brands error:", err);
    res.status(500).json({ message: "ไม่สามารถดึงข้อมูลแบรนด์ได้" });
  }
});

/**
 * สาขาทั้งหมด (public)
 * - ส่ง image_url มาด้วย เพื่อใช้เป็นรูปปกสาขา
 * - แถม brand_name มาให้ด้วย (สะดวกตอนแสดงผล)
 */
router.get("/branches", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         b.branch_id,
         b.brand_id,
         b.name,
         b.address,
         b.phone,
         b.created_at,
         b.image_url,
         br.name AS brand_name
       FROM branches b
       LEFT JOIN brands br ON br.brand_id = b.brand_id
       ORDER BY b.branch_id ASC`
    );
    res.json({ branches: rows });
  } catch (err) {
    console.error("GET /api/catalog/branches error:", err);
    res.status(500).json({ message: "ไม่สามารถดึงข้อมูลสาขาได้" });
  }
});

/**
 * ทุกประเภทโต๊ะที่ตั้งค่าให้แต่ละสาขา (ไม่กรองตาม guest)
 */
router.get("/branch-table-types", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         btt.branch_id,
         tt.type_id,
         tt.name,
         tt.min_capacity,
         tt.max_capacity,
         btt.total_slots
       FROM branch_table_types btt
       JOIN table_types tt ON tt.type_id = btt.type_id
       ORDER BY btt.branch_id, tt.min_capacity, tt.max_capacity, tt.name`
    );
    res.json({ items: rows });
  } catch (err) {
    console.error("GET /api/catalog/branch-table-types error:", err);
    res.status(500).json({ message: "ไม่สามารถดึงประเภทโต๊ะได้" });
  }
});

export default router;
