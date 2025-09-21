// backend/employee.appointments.routes.js
import { Router } from "express";
import pool from "./db.js";
import { authRequired } from "./auth.middleware.js";

const router = Router();

// helper: ให้เฉพาะ employee เท่านั้น
function employeeOnly(req, res, next) {
  if (!req.user || req.user.role !== "employee") {
    return res.status(403).json({ message: "Forbidden: employee only" });
  }
  next();
}

/**
 * GET /api/employee/appointments
 * พารามิเตอร์เลือกได้: date (YYYY-MM-DD), status (comma), q (ค้นหาชื่อ/เบอร์)
 * คืนเฉพาะคิวของสาขาที่พนักงานสังกัด
 */
// backend/employee.appointments.routes.js  (เฉพาะ GET /)
router.get("/", authRequired, employeeOnly, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const date = req.query.date || null;
    const rawStatuses = (req.query.status || "").toString();
    const q = (req.query.q || "").toString().trim();
    const brandId = req.query.brand_id ? Number(req.query.brand_id) : null; // ⬅️ ใหม่

    // ดึงสาขาที่พนักงานสังกัด (+ กรองตาม brand ถ้าถูกส่งมา)
    let sql = `
      SELECT eb.branch_id
      FROM employee_branches eb
      JOIN branches b ON b.branch_id = eb.branch_id
    `;
    const p = [];
    const where = ["eb.user_id = ?"];
    p.push(userId);
    if (brandId) { where.push("b.brand_id = ?"); p.push(brandId); }
    sql += ` WHERE ${where.join(" AND ")}`;

    const [myBranches] = await pool.query(sql, p);
    if (!myBranches.length) return res.json({ appointments: [] });

    const branchIds = myBranches.map(x => x.branch_id);

    // เงื่อนไขหลัก
    const cond = [`a.branch_id IN (${branchIds.map(()=>"?").join(",")})`];
    const params = [...branchIds];

    if (date) { cond.push("a.date = ?"); params.push(date); }

    if (rawStatuses) {
      const allowed = new Set(["pending","confirmed","completed","canceled"]);
      const list = rawStatuses.split(",").map(s=>s.trim().toLowerCase()).filter(s=>allowed.has(s));
      if (list.length) {
        cond.push(`a.status IN (${list.map(()=>"?").join(",")})`);
        params.push(...list);
      }
    }

    if (q) {
      cond.push("(u.username LIKE ? OR u.phone LIKE ? OR u.email LIKE ?)");
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    const [rows] = await pool.query(
      `
      SELECT a.*,
             b.name AS branch_name,
             br.name AS brand_name,
             tt.name AS type_name,
             u.username,
             CONCAT(COALESCE(u.first_name,''),' ',COALESCE(u.last_name,'')) AS customer_name,
             u.phone, u.email
      FROM appointments a
      JOIN branches b ON b.branch_id = a.branch_id
      JOIN brands   br ON br.brand_id = b.brand_id
      JOIN table_types tt ON tt.type_id = a.type_id
      JOIN users u ON u.user_id = a.user_id
      WHERE ${cond.join(" AND ")}
      ORDER BY a.date DESC, a.time DESC
      `,
      params
    );

    res.json({ appointments: rows });
  } catch (err) {
    console.error("GET /api/employee/appointments error:", err);
    res.status(500).json({ message: "ไม่สามารถโหลดคิวได้" });
  }
});


/**
 * PATCH /api/employee/appointments/:id/status
 * body: { status: 'pending'|'confirmed'|'completed'|'canceled' }
 * อนุญาตให้เปลี่ยนได้เฉพาะคิวในสาขาที่พนักงานสังกัด
 */
router.patch("/:id/status", authRequired, employeeOnly, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const id = Number(req.params.id);
    const status = (req.body?.status || "").toString().toLowerCase();

    const allowed = new Set(["pending","confirmed","completed","canceled"]);
    if (!allowed.has(status)) {
      return res.status(400).json({ message: "สถานะไม่ถูกต้อง" });
    }

    // สาขาที่พนักงานสังกัด
    const [myBranches] = await pool.query(
      "SELECT branch_id FROM employee_branches WHERE user_id=?",
      [userId]
    );
    if (!myBranches.length) return res.status(403).json({ message: "ไม่มีสิทธิ์ในสาขาใด" });
    const branchIds = myBranches.map(x=>x.branch_id);

    // ตรวจว่าคิวนี้อยู่ในสาขาที่เราดูแล
    const [[row]] = await pool.query(
      `SELECT appointment_id, branch_id, status 
       FROM appointments WHERE appointment_id=?`,
      [id]
    );
    if (!row) return res.status(404).json({ message: "ไม่พบคิว" });
    if (!branchIds.includes(row.branch_id)) {
      return res.status(403).json({ message: "ไม่มีสิทธิ์เปลี่ยนสถานะคิวนี้" });
    }

    // อัปเดตสถานะ
    const [upd] = await pool.query(
      "UPDATE appointments SET status=? WHERE appointment_id=?",
      [status, id]
    );
    if (!upd.affectedRows) return res.status(409).json({ message: "อัปเดตไม่สำเร็จ" });

    res.json({ message: `อัปเดตสถานะเป็น ${status} แล้ว` });
  } catch (err) {
    console.error("PATCH /api/employee/appointments/:id/status error:", err);
    res.status(500).json({ message: "เปลี่ยนสถานะไม่สำเร็จ" });
  }
});

export default router;
