// backend/admin.appointments.routes.js
import { Router } from "express";
import pool from "./db.js";
import { authRequired } from "./auth.middleware.js";

const router = Router();

function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: admin only" });
  }
  next();
}

// ดึงคิวทั้งหมด
router.get("/", authRequired, adminOnly, async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.*, u.username, CONCAT(COALESCE(u.first_name,''),' ',COALESCE(u.last_name,'')) AS customer_name,
             b.name AS branch_name, tt.name AS type_name
      FROM appointments a
      JOIN users u ON u.user_id=a.user_id
      JOIN branches b ON b.branch_id=a.branch_id
      JOIN table_types tt ON tt.type_id=a.type_id
      ORDER BY a.date DESC, a.time DESC
    `);
    res.json({ appointments: rows });
  } catch (e) {
    console.error("GET /api/admin/appointments error:", e);
    res.status(500).json({ message: "ไม่สามารถดึงคิวทั้งหมดได้" });
  }
});

// ล้างคิวตามสถานะ (สำหรับปุ่มล้าง)
router.delete("/purge", authRequired, adminOnly, async (req, res) => {
  try {
    const raw = (req.query.statuses || "canceled,completed").toString();
    const statuses = raw.split(",").map(s=>s.trim().toLowerCase()).filter(Boolean);
    const allowed = new Set(["pending","confirmed","completed","canceled"]);
    const list = statuses.filter(s => allowed.has(s));
    if (!list.length) return res.status(400).json({ message: "ระบุสถานะไม่ถูกต้อง" });

    const placeholders = list.map(()=>"?").join(",");
    const [rs] = await pool.query(`DELETE FROM appointments WHERE status IN (${placeholders})`, list);
    res.json({ message: `ล้าง ${list.join(", ")} ${rs.affectedRows} รายการ`, removed: rs.affectedRows });
  } catch (e) {
    console.error("DELETE /api/admin/appointments/purge error:", e);
    res.status(500).json({ message: "ล้างคิวไม่สำเร็จ" });
  }
});

// <<< ออโต้ล้าง: ลบ canceled/completed ของ "วันที่ผ่านมา" ทั้งหมด >>>
export async function purgeOldDay() {
  // ล้างเฉพาะเรคคอร์ดก่อนวันนี้ (และสถานะ canceled/completed)
  const [rs] = await pool.query(
    `DELETE FROM appointments
     WHERE date < CURDATE() AND status IN ('canceled','completed')`
  );
  return rs.affectedRows;
}

// endpoint เผื่อทดสอบรันทันที
router.post("/purge-daily-run", authRequired, adminOnly, async (_req, res) => {
  try {
    const removed = await purgeOldDay();
    res.json({ message: `ล้างคิววันเก่าแล้ว ${removed} รายการ` });
  } catch (e) {
    console.error("POST /api/admin/appointments/purge-daily-run error:", e);
    res.status(500).json({ message: "รันทาสกล้างคิวไม่สำเร็จ" });
  }
});

export default router;
