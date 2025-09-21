// backend/admin.branches.routes.js
import { Router } from "express";
import pool from "./db.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const router = Router();

/* ================================
 * CONFIG: Upload Directory (branches)
 * ================================ */
// อ่านจาก .env: UPLOAD_DIR = .../uploads (ห้ามลงท้าย /brands หรือ /branches)
const rawUploadEnv = (process.env.UPLOAD_DIR || path.join(process.cwd(), "backend", "uploads")).trim();

// ถ้าเผลอชี้ไป .../uploads/branches ให้ถอยกลับมาเป็น .../uploads
let UPLOAD_ROOT = rawUploadEnv;
if (/[/\\]uploads[/\\](brands|branches)[/\\]?$/i.test(UPLOAD_ROOT.replace(/\\/g, "/"))) {
  UPLOAD_ROOT = path.dirname(UPLOAD_ROOT);
}

const branchesDir = path.join(UPLOAD_ROOT, "branches");
fs.mkdirSync(branchesDir, { recursive: true });
console.log("[BRANCHES] Upload dir =", branchesDir);

/* ================================
 * MULTER: Storage
 * ================================ */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, branchesDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

// รองรับได้ทั้ง field name: image / logo (อย่างใดอย่างหนึ่ง)
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    const ok = ["image/png", "image/jpeg", "image/webp"];
    if (!ok.includes(file.mimetype)) return cb(new Error("ไฟล์รูปไม่ถูกต้อง (PNG/JPG/WEBP)"));
    cb(null, true);
  },
});
// ใช้ fields เพื่อให้แน่ใจว่ารองรับได้ทั้ง "image" และ "logo"
const uploadFields = upload.fields([{ name: "image", maxCount: 1 }, { name: "logo", maxCount: 1 }]);

/* ================================
 * GET /api/admin/branches
 *   - รองรับ ?brand_id=
 *   - ส่ง image_url ออกไปด้วย
 * ================================ */
router.get("/", async (req, res) => {
  try {
    const { brand_id } = req.query;

    if (brand_id) {
      const [rows] = await pool.query(
        `
        SELECT b.branch_id, b.name, b.address, b.phone, b.image_url, b.created_at, b.brand_id,
               br.name AS brand_name
        FROM branches b
        LEFT JOIN brands br ON b.brand_id = br.brand_id
        WHERE b.brand_id = ?
        ORDER BY b.name ASC
        `,
        [brand_id]
      );
      return res.json({ branches: rows });
    }

    const [rows] = await pool.query(`
      SELECT b.branch_id, b.name, b.address, b.phone, b.image_url, b.created_at, b.brand_id,
             br.name AS brand_name
      FROM branches b
      LEFT JOIN brands br ON b.brand_id = br.brand_id
      ORDER BY b.name ASC
    `);
    res.json({ branches: rows });
  } catch (err) {
    console.error("GET /api/admin/branches error:", err);
    res.status(500).json({ message: "ไม่สามารถดึงข้อมูลสาขาได้" });
  }
});

/* ================================
 * POST /api/admin/branches
 *   body: name, address, phone?, brand_id?
 *   file: image|logo (1 ไฟล์)
 * ================================ */
router.post("/", uploadFields, async (req, res) => {
  try {
    const { name, address, phone, brand_id } = req.body || {};
    if (!name?.trim() || !address?.trim()) {
      // ลบไฟล์ถ้าอัปโหลดมาแล้ว
      const file = (req.files?.image?.[0] || req.files?.logo?.[0]);
      if (file) fs.unlink(path.join(branchesDir, file.filename), () => {});
      return res.status(400).json({ message: "กรุณาระบุชื่อสาขาและที่อยู่" });
    }

    // validate brand_id (nullable)
    let brandIdValue = null;
    if (brand_id !== undefined && brand_id !== null && String(brand_id).trim() !== "") {
      const idNum = Number(brand_id);
      if (Number.isNaN(idNum)) {
        const file = (req.files?.image?.[0] || req.files?.logo?.[0]);
        if (file) fs.unlink(path.join(branchesDir, file.filename), () => {});
        return res.status(400).json({ message: "brand_id ไม่ถูกต้อง" });
      }
      const [[exists]] = await pool.query(`SELECT COUNT(*) AS cnt FROM brands WHERE brand_id=?`, [idNum]);
      if (!exists.cnt) {
        const file = (req.files?.image?.[0] || req.files?.logo?.[0]);
        if (file) fs.unlink(path.join(branchesDir, file.filename), () => {});
        return res.status(400).json({ message: "ไม่พบแบรนด์ที่เลือก" });
      }
      brandIdValue = idNum;
    }

    const file = (req.files?.image?.[0] || req.files?.logo?.[0]) || null;
    const imageUrl = file ? `/uploads/branches/${file.filename}` : null;

    const [result] = await pool.query(
      `INSERT INTO branches (name, address, phone, brand_id, image_url) VALUES (?, ?, ?, ?, ?)`,
      [name.trim(), address.trim(), phone ?? null, brandIdValue, imageUrl]
    );

    res.status(201).json({ message: "สร้างสาขาสำเร็จ", branch_id: result.insertId, image_url: imageUrl });
  } catch (err) {
    console.error("POST /api/admin/branches error:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้างสาขา" });
  }
});

/* ================================
 * PATCH /api/admin/branches/:id
 *   body: name?, address?, phone?, brand_id?
 *   file: image|logo (1 ไฟล์)
 * ================================ */
router.patch("/:id", uploadFields, async (req, res) => {
  try {
    const { id } = req.params;

    const [curRows] = await pool.query(`SELECT * FROM branches WHERE branch_id=?`, [id]);
    if (!curRows.length) {
      const file = (req.files?.image?.[0] || req.files?.logo?.[0]);
      if (file) fs.unlink(path.join(branchesDir, file.filename), () => {});
      return res.status(404).json({ message: "ไม่พบสาขา" });
    }

    const cur = curRows[0];
    let { name, address, phone, brand_id } = req.body || {};
    name = (name ?? cur.name)?.trim();
    address = (address ?? cur.address)?.trim();
    phone = phone ?? cur.phone;

    if (!name || !address) {
      const file = (req.files?.image?.[0] || req.files?.logo?.[0]);
      if (file) fs.unlink(path.join(branchesDir, file.filename), () => {});
      return res.status(400).json({ message: "ชื่อสาขา/ที่อยู่ห้ามว่าง" });
    }

    // validate brand_id (nullable)
    let brandIdValue = cur.brand_id;
    if (brand_id !== undefined) {
      if (brand_id === null || String(brand_id).trim() === "") {
        brandIdValue = null;
      } else {
        const idNum = Number(brand_id);
        if (Number.isNaN(idNum)) {
          const file = (req.files?.image?.[0] || req.files?.logo?.[0]);
          if (file) fs.unlink(path.join(branchesDir, file.filename), () => {});
          return res.status(400).json({ message: "brand_id ไม่ถูกต้อง" });
        }
        const [[exists]] = await pool.query(`SELECT COUNT(*) AS cnt FROM brands WHERE brand_id=?`, [idNum]);
        if (!exists.cnt) {
          const file = (req.files?.image?.[0] || req.files?.logo?.[0]);
          if (file) fs.unlink(path.join(branchesDir, file.filename), () => {});
          return res.status(400).json({ message: "ไม่พบแบรนด์ที่เลือก" });
        }
        brandIdValue = idNum;
      }
    }

    // ถ้ามีรูปใหม่ แนบมา
    let nextImageUrl = cur.image_url || null;
    let oldFileToRemove = null;
    const file = (req.files?.image?.[0] || req.files?.logo?.[0]) || null;

    if (file) {
      nextImageUrl = `/uploads/branches/${file.filename}`;
      if (cur.image_url && cur.image_url.startsWith("/uploads/branches/")) {
        const oldFilePath = path.join(UPLOAD_ROOT, cur.image_url.replace("/uploads/", ""));
        oldFileToRemove = oldFilePath;
      }
    }

    const [rs] = await pool.query(
      `UPDATE branches SET name=?, address=?, phone=?, brand_id=?, image_url=? WHERE branch_id=?`,
      [name, address, phone, brandIdValue, nextImageUrl, id]
    );

    if (!rs.affectedRows) {
      if (file) fs.unlink(path.join(branchesDir, file.filename), () => {});
      return res.status(404).json({ message: "ไม่พบสาขา" });
    }

    if (oldFileToRemove) fs.unlink(oldFileToRemove, () => {});

    res.json({ message: "แก้ไขสาขาสำเร็จ", image_url: nextImageUrl });
  } catch (err) {
    console.error("PATCH /api/admin/branches/:id error:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการแก้ไขสาขา" });
  }
});

/* ================================
 * DELETE /api/admin/branches/:id
 *   - บล็อกหรือจัดการ refs ตาม logic เดิม
 *   - ลบรูปประกอบถ้าเป็นของเรา
 * ================================ */
router.delete("/:id", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const force = String(req.query.force || "").toLowerCase() === "true";

    await conn.beginTransaction();

    // lock row
    const [[branch]] = await conn.query(
      "SELECT branch_id, image_url FROM branches WHERE branch_id = ? FOR UPDATE",
      [id]
    );
    if (!branch) {
      await conn.rollback();
      return res.status(404).json({ message: "ไม่พบสาขานี้" });
    }

    // นับการอ้างอิง
    const [[bttCnt]] = await conn.query(
      "SELECT COUNT(*) AS cnt FROM branch_table_types WHERE branch_id = ?",
      [id]
    );
    const [[empCnt]] = await conn.query(
      "SELECT COUNT(*) AS cnt FROM employee_branches WHERE branch_id = ?",
      [id]
    );
    const [[apptCnt]] = await conn.query(
      "SELECT COUNT(*) AS cnt FROM appointments WHERE branch_id = ?",
      [id]
    );

    if (!force) {
      if (bttCnt.cnt || empCnt.cnt || apptCnt.cnt) {
        await conn.rollback();
        return res.status(409).json({
          message: "ลบไม่ได้: มีข้อมูลอ้างอิงอยู่",
          refs: {
            branch_table_types: bttCnt.cnt,
            employee_branches: empCnt.cnt,
            appointments: apptCnt.cnt,
          },
          hint: "ถ้าต้องการลบจริงให้เรียกด้วย ?force=true (แต่อาจต้องตัดสินใจเรื่อง appointments ว่าจะจัดการยังไง)"
        });
      }
    } else {
      if (apptCnt.cnt) {
        await conn.rollback();
        return res.status(409).json({
          message: "ยังมีใบนัดของสาขานี้อยู่ กรุณาเคลียร์/ยกเลิกก่อน",
          appointments: apptCnt.cnt,
        });
      }
      if (bttCnt.cnt) {
        await conn.query("DELETE FROM branch_table_types WHERE branch_id = ?", [id]);
      }
      if (empCnt.cnt) {
        await conn.query("DELETE FROM employee_branches WHERE branch_id = ?", [id]);
      }
    }

    // ลบสาขา
    await conn.query("DELETE FROM branches WHERE branch_id = ?", [id]);

    await conn.commit();

    // ลบไฟล์รูปถ้าเป็นไฟล์ที่เราเก็บไว้
    if (branch.image_url && branch.image_url.startsWith("/uploads/branches/")) {
      const filePath = path.join(UPLOAD_ROOT, branch.image_url.replace("/uploads/", ""));
      fs.unlink(filePath, () => {});
    }

    res.json({ message: "ลบสาขาสำเร็จ" });
  } catch (err) {
    await conn.rollback();
    console.error("DELETE /api/admin/branches/:id error:", err);
    res.status(500).json({ message: "ลบสาขาไม่สำเร็จ" });
  } finally {
    conn.release();
  }
});

export default router;
