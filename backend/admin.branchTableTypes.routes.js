import { Router } from "express";
import pool from "./db.js";

const router = Router();

// GET /api/admin/branch-table-types?brand_id=&branch_id=
router.get("/", async (req, res) => {
  try {
    const { brand_id, branch_id } = req.query;
    if (!brand_id || !branch_id) {
      return res.status(400).json({ message: "กรุณาระบุ brand_id และ branch_id" });
    }

    const [rows] = await pool.query(
      `SELECT btt.brand_id, btt.branch_id, btt.type_id, btt.total_slots,
              tt.name AS type_name, tt.min_capacity, tt.max_capacity
       FROM branch_table_types btt
       JOIN table_types tt ON tt.type_id = btt.type_id
       WHERE btt.brand_id = ? AND btt.branch_id = ?
       ORDER BY tt.min_capacity, tt.max_capacity, tt.name`,
      [brand_id, branch_id]
    );
    res.json({ data: rows });
  } catch (err) {
    console.error("GET /branch-table-types error:", err);
    res.status(500).json({ message: "ไม่สามารถโหลดข้อมูลได้" });
  }
});

// POST /api/admin/branch-table-types
// body: { brand_id, branch_id, type_id, total_slots }
router.post("/", async (req, res) => {
  try {
    const { brand_id, branch_id, type_id, total_slots } = req.body || {};
    if (!brand_id || !branch_id || !type_id || total_slots == null) {
      return res.status(400).json({ message: "ต้องมี brand_id, branch_id, type_id และ total_slots" });
    }
    if (Number(total_slots) < 0) {
      return res.status(400).json({ message: "total_slots ต้องเป็นเลข ≥ 0" });
    }

    // กันซ้ำ
    const [dup] = await pool.query(
      `SELECT 1 FROM branch_table_types WHERE brand_id=? AND branch_id=? AND type_id=?`,
      [brand_id, branch_id, type_id]
    );
    if (dup.length) return res.status(400).json({ message: "รายการนี้มีอยู่แล้ว" });

    await pool.query(
      `INSERT INTO branch_table_types (brand_id, branch_id, type_id, total_slots)
       VALUES (?, ?, ?, ?)`,
      [brand_id, branch_id, type_id, total_slots]
    );
    res.status(201).json({ message: "เพิ่มสำเร็จ" });
  } catch (err) {
    console.error("POST /branch-table-types error:", err);
    res.status(500).json({ message: "เพิ่มไม่สำเร็จ" });
  }
});

// PATCH /api/admin/branch-table-types/:brand_id/:branch_id/:type_id
// body: { total_slots }
router.patch("/:brand_id/:branch_id/:type_id", async (req, res) => {
  try {
    const { brand_id, branch_id, type_id } = req.params;
    const { total_slots } = req.body || {};
    if (total_slots == null || Number(total_slots) < 0) {
      return res.status(400).json({ message: "total_slots ต้องเป็นเลข ≥ 0" });
    }
    const [rs] = await pool.query(
      `UPDATE branch_table_types
       SET total_slots=?
       WHERE brand_id=? AND branch_id=? AND type_id=?`,
      [total_slots, brand_id, branch_id, type_id]
    );
    if (!rs.affectedRows) return res.status(404).json({ message: "ไม่พบข้อมูล" });
    res.json({ message: "อัปเดตสำเร็จ" });
  } catch (err) {
    console.error("PATCH /branch-table-types error:", err);
    res.status(500).json({ message: "อัปเดตไม่สำเร็จ" });
  }
});

// DELETE /api/admin/branch-table-types/:brand_id/:branch_id/:type_id
router.delete("/:brand_id/:branch_id/:type_id", async (req, res) => {
  try {
    const { brand_id, branch_id, type_id } = req.params;
    const [rs] = await pool.query(
      `DELETE FROM branch_table_types WHERE brand_id=? AND branch_id=? AND type_id=?`,
      [brand_id, branch_id, type_id]
    );
    if (!rs.affectedRows) return res.status(404).json({ message: "ไม่พบข้อมูล" });
    res.json({ message: "ลบสำเร็จ" });
  } catch (err) {
    console.error("DELETE /branch-table-types error:", err);
    res.status(500).json({ message: "ลบไม่สำเร็จ" });
  }
});

export default router;
