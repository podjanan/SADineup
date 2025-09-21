import { Router } from "express";
import pool from "./db.js";

const router = Router();

/**
 * GET /api/admin/table-types
 * ดึงรายการประเภทโต๊ะทั้งหมด
 */
router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT type_id, name, description, min_capacity, max_capacity, min_spend
       FROM table_types
       ORDER BY type_id DESC`
    );
    res.json({ table_types: rows });
  } catch (err) {
    console.error("GET /api/admin/table-types error:", err);
    res.status(500).json({ message: "โหลดรายการประเภทโต๊ะไม่สำเร็จ" });
  }
});

/**
 * POST /api/admin/table-types
 * body: { name, description?, min_capacity, max_capacity, min_spend? }
 */
router.post("/", async (req, res) => {
  try {
    let { name, description, min_capacity, max_capacity, min_spend } = req.body || {};

    if (!name?.trim()) return res.status(400).json({ message: "กรุณาระบุชื่อประเภทโต๊ะ" });
    if (min_capacity == null || max_capacity == null)
      return res.status(400).json({ message: "กรุณาระบุ min_capacity และ max_capacity" });

    min_capacity = Number(min_capacity);
    max_capacity = Number(max_capacity);
    if (Number.isNaN(min_capacity) || Number.isNaN(max_capacity) || min_capacity <= 0 || max_capacity <= 0)
      return res.status(400).json({ message: "ค่า capacity ต้องเป็นตัวเลขบวก" });
    if (min_capacity > max_capacity)
      return res.status(400).json({ message: "min_capacity ต้อง <= max_capacity" });

    min_spend = (min_spend == null || min_spend === "") ? 0 : Number(min_spend);
    if (Number.isNaN(min_spend) || min_spend < 0)
      return res.status(400).json({ message: "min_spend ต้องเป็นตัวเลข ≥ 0" });

    const [rs] = await pool.query(
      `INSERT INTO table_types (name, description, min_capacity, max_capacity, min_spend)
       VALUES (?, ?, ?, ?, ?)`,
      [name.trim(), description ?? null, min_capacity, max_capacity, min_spend]
    );
    res.status(201).json({ message: "เพิ่มประเภทโต๊ะสำเร็จ", type_id: rs.insertId });
  } catch (err) {
    console.error("POST /api/admin/table-types error:", err);
    res.status(500).json({ message: "เพิ่มประเภทโต๊ะไม่สำเร็จ" });
  }
});

/**
 * PATCH /api/admin/table-types/:id
 * body: { name?, description?, min_capacity?, max_capacity?, min_spend? }
 */
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [cur] = await pool.query(`SELECT * FROM table_types WHERE type_id=?`, [id]);
    if (!cur.length) return res.status(404).json({ message: "ไม่พบประเภทโต๊ะ" });

    let {
      name = cur[0].name,
      description = cur[0].description,
      min_capacity = cur[0].min_capacity,
      max_capacity = cur[0].max_capacity,
      min_spend = cur[0].min_spend,
    } = req.body || {};

    if (!String(name).trim()) return res.status(400).json({ message: "ชื่อห้ามว่าง" });

    min_capacity = Number(min_capacity);
    max_capacity = Number(max_capacity);
    min_spend = Number(min_spend);
    if ([min_capacity, max_capacity, min_spend].some(Number.isNaN))
      return res.status(400).json({ message: "ค่าที่เป็นตัวเลขไม่ถูกต้อง" });
    if (min_capacity <= 0 || max_capacity <= 0)
      return res.status(400).json({ message: "capacity ต้องเป็นค่าบวก" });
    if (min_capacity > max_capacity)
      return res.status(400).json({ message: "min_capacity ต้อง <= max_capacity" });
    if (min_spend < 0)
      return res.status(400).json({ message: "min_spend ต้อง ≥ 0" });

    const [rs] = await pool.query(
      `UPDATE table_types
       SET name=?, description=?, min_capacity=?, max_capacity=?, min_spend=?
       WHERE type_id=?`,
      [String(name).trim(), description ?? null, min_capacity, max_capacity, min_spend, id]
    );
    if (!rs.affectedRows) return res.status(404).json({ message: "ไม่พบประเภทโต๊ะ" });
    res.json({ message: "อัปเดตประเภทโต๊ะสำเร็จ" });
  } catch (err) {
    console.error("PATCH /api/admin/table-types/:id error:", err);
    res.status(500).json({ message: "แก้ไขประเภทโต๊ะไม่สำเร็จ" });
  }
});

/**
 * DELETE /api/admin/table-types/:id
 * ป้องกันลบถ้ามีโต๊ะจริง (tables) อ้างอยู่
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [[{ cnt }]] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM tables WHERE type_id=?`,
      [id]
    );
    if (cnt > 0) {
      return res.status(400).json({ message: "มีโต๊ะจริงที่อ้างถึงประเภทนี้อยู่ ไม่สามารถลบได้" });
    }

    const [rs] = await pool.query(`DELETE FROM table_types WHERE type_id=?`, [id]);
    if (!rs.affectedRows) return res.status(404).json({ message: "ไม่พบประเภทโต๊ะ" });
    res.json({ message: "ลบประเภทโต๊ะสำเร็จ" });
  } catch (err) {
    console.error("DELETE /api/admin/table-types/:id error:", err);
    res.status(500).json({ message: "ลบประเภทโต๊ะไม่สำเร็จ" });
  }
});

export default router;
