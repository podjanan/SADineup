import { Router } from "express";
import pool from "./db.js";
import { authRequired } from "./auth.middleware.js";

const router = Router();

/**
 * POST /api/appointments
 * body: { branch_id, type_id, date, time, duration, guest_count, deposit_amount?, note? }
 * - ถ้าโต๊ะ “ยังมีที่ว่าง” → queue_no = NULL (หรือ 0) = ได้ที่นั่งทันที
 * - ถ้า “เต็มแล้ว”      → queue_no = (#จองซ้อนทั้งหมด - total_slots + 1)
 */
router.post("/", authRequired, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    if (!req.user?.user_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = req.user.user_id;

    let {
      branch_id, type_id, date, time,
      duration = 120, guest_count = 2,
      deposit_amount = 0, note = ""
    } = req.body || {};

    // validate พื้นฐาน
    if (!branch_id || !type_id || !date || !time || !guest_count) {
      return res.status(400).json({ message: "กรุณาระบุ branch_id, type_id, date, time, guest_count" });
    }
    duration = duration === null ? null : Number(duration);
    guest_count = Number(guest_count);
    deposit_amount = deposit_amount === "" ? 0 : Number(deposit_amount);
    if (!guest_count || guest_count <= 0) return res.status(400).json({ message: "guest_count ไม่ถูกต้อง" });
    if (deposit_amount < 0 || Number.isNaN(deposit_amount)) return res.status(400).json({ message: "deposit_amount ไม่ถูกต้อง" });
    if (duration !== null && (duration <= 0 || Number.isNaN(duration))) return res.status(400).json({ message: "duration ไม่ถูกต้อง" });

    await conn.beginTransaction();

    // verify branch / type + capacity
    const [[branch]] = await conn.query("SELECT branch_id FROM branches WHERE branch_id=?", [branch_id]);
    if (!branch) { await conn.rollback(); return res.status(400).json({ message: "ไม่พบสาขา" }); }

    const [[tt]] = await conn.query(
      "SELECT type_id, min_capacity, max_capacity FROM table_types WHERE type_id=?",
      [type_id]
    );
    if (!tt) { await conn.rollback(); return res.status(400).json({ message: "ไม่พบประเภทโต๊ะ" }); }
    if (guest_count < tt.min_capacity || guest_count > tt.max_capacity) {
      await conn.rollback();
      return res.status(400).json({ message: `จำนวนคนต้องอยู่ระหว่าง ${tt.min_capacity}-${tt.max_capacity}` });
    }

    // จำนวนโต๊ะที่ตั้งไว้ในสาขาสำหรับประเภทนี้
    const [[btt]] = await conn.query(
      "SELECT total_slots FROM branch_table_types WHERE branch_id=? AND type_id=? FOR UPDATE",
      [branch_id, type_id]
    );
    const totalSlots = Number(btt?.total_slots ?? 0); // 0 หรือ NULL = ไม่จำกัด (ไม่ต้องรอคิว)

    // นับ “จำนวนการจองที่ชนช่วงเวลาเดียวกัน” (pending/confirmed เท่านั้น)
    const desiredStart = `${date} ${time}`;
    const [[occRow]] = await conn.query(
      `
      SELECT COUNT(*) AS occ
      FROM appointments a
      WHERE a.branch_id = ?
        AND a.type_id = ?
        AND a.status IN ('pending','confirmed')
        AND CONCAT(a.date,' ',a.time) < DATE_ADD(?, INTERVAL COALESCE(?, 90) MINUTE)
        AND DATE_ADD(CONCAT(a.date,' ',a.time), INTERVAL COALESCE(a.duration, 90) MINUTE) > ?
      FOR UPDATE
      `,
      [branch_id, type_id, desiredStart, duration, desiredStart]
    );
    const occ = Number(occRow?.occ ?? 0);

    let queue_no = null;
    if (totalSlots > 0 && occ >= totalSlots) {
      // เต็มแล้ว → ต้องรอคิว
      queue_no = (occ - totalSlots) + 1; // 1,2,3,...
    } else {
      // ยังมีที่นั่ง → ไม่ต้องรอคิว
      queue_no = null; // หรือ 0 ตามที่ตกลง
    }

    const [rs] = await conn.query(
      `
      INSERT INTO appointments
        (user_id, branch_id, type_id, date, time, duration, guest_count, deposit_amount, note, status, employee_id, queue_no)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, ?)
      `,
      [userId, branch_id, type_id, date, time, duration, guest_count, deposit_amount, note, queue_no]
    );

    await conn.commit();
    res.status(201).json({
      message: "สร้างการจองสำเร็จ",
      appointment_id: rs.insertId,
      queue_no
    });
  } catch (err) {
    await conn.rollback();
    console.error("POST /api/appointments error:", err);
    res.status(500).json({ message: "ไม่สามารถสร้างการจองได้" });
  } finally {
    conn.release();
  }
});

/** รายการของฉัน + จำนวนคิวก่อนหน้าแต่ละรายการ */
router.get("/my", authRequired, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const [rows] = await pool.query(
      `
      SELECT
        a.*,
        b.name  AS branch_name,
        tt.name AS type_name,
        /* จำนวนคิวที่มาก่อนเรา (เฉพาะรอ/ยังไม่นั่ง) */
        CASE
          WHEN a.queue_no IS NULL THEN 0
          ELSE (
            SELECT COUNT(*)
            FROM appointments x
            WHERE x.branch_id = a.branch_id
              AND x.type_id   = a.type_id
              AND x.date      = a.date
              AND x.time      = a.time
              AND x.status IN ('pending','confirmed')
              AND x.created_at < a.created_at
          )
        END AS queues_before
      FROM appointments a
      JOIN branches b   ON a.branch_id = b.branch_id
      JOIN table_types tt ON a.type_id = tt.type_id
      WHERE a.user_id = ?
      ORDER BY a.date DESC, a.time DESC, a.appointment_id DESC
      `,
      [userId]
    );
    res.json({ appointments: rows });
  } catch (err) {
    console.error("GET /api/appointments/my error:", err);
    res.status(500).json({ message: "ไม่สามารถดึงข้อมูลการจองได้" });
  }
});

/* ยกเลิกของตัวเองเหมือนเดิม */
router.patch("/:id/cancel", authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    const [rs] = await pool.query(
      `UPDATE appointments
         SET status='canceled'
       WHERE appointment_id=? AND user_id=? AND status IN ('pending','confirmed')`,
      [id, userId]
    );
    if (!rs.affectedRows) return res.status(404).json({ message: "ไม่พบคิวนี้หรือยกเลิกไม่ได้" });
    res.json({ message: "ยกเลิกคิวสำเร็จ" });
  } catch (err) {
    console.error("PATCH /api/appointments/:id/cancel error:", err);
    res.status(500).json({ message: "ไม่สามารถยกเลิกคิวได้" });
  }
});

router.post("/forgot", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: "กรุณาระบุอีเมล" });

    const [[user]] = await pool.query("SELECT user_id, email, name FROM users WHERE email=?", [email]);
    // เพื่อความปลอดภัย ตอบ success แม้ไม่พบ user (กันไล่เดาอีเมล)
    if (!user) {
      return res.json({ message: "หากอีเมลนี้อยู่ในระบบ เราได้ส่งลิงก์รีเซ็ตให้แล้ว" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 ชั่วโมง

    await pool.query(
      "UPDATE users SET reset_token=?, reset_expires=? WHERE user_id=?",
      [token, expires, user.user_id]
    );

    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset?token=${token}`;

    await transporter.sendMail({
      from: process.env.MAIL_FROM || '"DineUp" <no-reply@dineup.local>',
      to: user.email,
      subject: "รีเซ็ตรหัสผ่าน DineUp",
      html: `
        <p>สวัสดี ${user.name || ""},</p>
        <p>คุณแจ้งลืมรหัสผ่าน โปรดกดลิงก์ด้านล่างเพื่อรีเซ็ตรหัสผ่าน (ภายใน 1 ชั่วโมง)</p>
        <p><a href="${resetUrl}" target="_blank">${resetUrl}</a></p>
        <p>หากไม่ได้ร้องขอ ให้เมินอีเมลนี้</p>
      `,
    });

    return res.json({ message: "ส่งอีเมลรีเซ็ตรหัสผ่านแล้ว" });
  } catch (err) {
    console.error("POST /api/auth/forgot error:", err);
    return res.status(500).json({ message: "ไม่สามารถส่งอีเมลได้" });
  }
});

// POST /api/auth/reset
router.post("/reset", async (req, res) => {
  try {
    const { token, new_password } = req.body || {};
    if (!token || !new_password) {
      return res.status(400).json({ message: "ข้อมูลไม่ครบ" });
    }

    const [[user]] = await pool.query(
      "SELECT user_id, reset_expires FROM users WHERE reset_token=?",
      [token]
    );
    if (!user) return res.status(400).json({ message: "โทเคนไม่ถูกต้อง" });

    if (!user.reset_expires || new Date(user.reset_expires).getTime() < Date.now()) {
      return res.status(400).json({ message: "โทเคนหมดอายุแล้ว" });
    }

    const hash = await bcrypt.hash(new_password, 10);
    await pool.query(
      "UPDATE users SET password=?, reset_token=NULL, reset_expires=NULL WHERE user_id=?",
      [hash, user.user_id]
    );

    return res.json({ message: "ตั้งรหัสผ่านใหม่สำเร็จ" });
  } catch (err) {
    console.error("POST /api/auth/reset error:", err);
    return res.status(500).json({ message: "ไม่สามารถตั้งรหัสผ่านใหม่ได้" });
  }
});


export default router;
