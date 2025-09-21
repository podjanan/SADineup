import { Router } from "express";
import pool from "./db.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const router = Router();

/* ================================
 * CONFIG: Upload Directory
 * ================================ */
const rootUploadDir = (process.env.UPLOAD_DIR || path.join(process.cwd(), "backend", "uploads")).trim();

// ถ้าผู้ใช้ใส่ path ปลายทางเป็น .../uploads/brands ให้ถอยกลับมาเป็น .../uploads
let UPLOAD_ROOT = rootUploadDir;
if (/[/\\]uploads[/\\]brands[/\\]?$/i.test(UPLOAD_ROOT.replace(/\\/g, "/"))) {
  UPLOAD_ROOT = path.dirname(UPLOAD_ROOT);
}

// Subfolder สำหรับแบรนด์
const brandsDir = path.join(UPLOAD_ROOT, "brands");
fs.mkdirSync(brandsDir, { recursive: true });

console.log("[BRANDS] Upload dir =", brandsDir);

/* ================================
 * MULTER: Storage
 * ================================ */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, brandsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    const ok = ["image/png", "image/jpeg", "image/webp"];
    if (!ok.includes(file.mimetype)) return cb(new Error("ไฟล์รูปไม่ถูกต้อง (PNG/JPG/WEBP)"));
    cb(null, true);
  },
});

/* ================================
 * GET: List all brands
 * ================================ */
router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT brand_id, name, logo_url
       FROM brands
       ORDER BY name ASC`
    );
    res.json({ brands: rows });
  } catch (err) {
    console.error("GET /api/admin/brands error:", err);
    res.status(500).json({ message: "ไม่สามารถดึงข้อมูลแบรนด์ได้" });
  }
});

/* ================================
 * POST: Create new brand
 * ================================ */
router.post("/", upload.single("logo"), async (req, res) => {
  try {
    const { name } = req.body || {};
    if (!name?.trim()) {
      if (req.file) fs.unlink(path.join(brandsDir, req.file.filename), () => {});
      return res.status(400).json({ message: "กรุณาระบุชื่อแบรนด์" });
    }

    // ตรวจชื่อซ้ำ
    const [[dup]] = await pool.query(
      "SELECT COUNT(*) AS cnt FROM brands WHERE name = ?",
      [name.trim()]
    );
    if (dup.cnt > 0) {
      if (req.file) fs.unlink(path.join(brandsDir, req.file.filename), () => {});
      return res.status(400).json({ message: "ชื่อแบรนด์นี้มีอยู่แล้ว" });
    }

    const logoUrl = req.file ? `/uploads/brands/${req.file.filename}` : null;

    const [rs] = await pool.query(
      `INSERT INTO brands (name, logo_url) VALUES (?, ?)`,
      [name.trim(), logoUrl]
    );

    res.status(201).json({
      message: "สร้างแบรนด์สำเร็จ",
      brand_id: rs.insertId,
      logo_url: logoUrl,
    });
  } catch (err) {
    console.error("POST /api/admin/brands error:", err);
    res.status(500).json({ message: "สร้างแบรนด์ไม่สำเร็จ" });
  }
});

/* ================================
 * PATCH: Update brand
 * ================================ */
router.patch("/:id", upload.single("logo"), async (req, res) => {
  try {
    const { id } = req.params;

    const [curRows] = await pool.query(
      `SELECT brand_id, name, logo_url FROM brands WHERE brand_id = ?`,
      [id]
    );
    if (!curRows.length) {
      if (req.file) fs.unlink(path.join(brandsDir, req.file.filename), () => {});
      return res.status(404).json({ message: "ไม่พบแบรนด์" });
    }
    const cur = curRows[0];

    const nextName = (req.body?.name ?? cur.name)?.trim();
    if (!nextName) {
      if (req.file) fs.unlink(path.join(brandsDir, req.file.filename), () => {});
      return res.status(400).json({ message: "ชื่อแบรนด์ห้ามว่าง" });
    }

    // ตรวจชื่อซ้ำ
    const [[dup]] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM brands WHERE name = ? AND brand_id <> ?`,
      [nextName, id]
    );
    if (dup.cnt > 0) {
      if (req.file) fs.unlink(path.join(brandsDir, req.file.filename), () => {});
      return res.status(400).json({ message: "ชื่อแบรนด์นี้ถูกใช้แล้ว" });
    }

    // อัปเดตโลโก้ใหม่
    let nextLogoUrl = cur.logo_url;
    let oldFileToRemove = null;

    if (req.file) {
      nextLogoUrl = `/uploads/brands/${req.file.filename}`;

      // ถ้ามีไฟล์เก่าและเป็นไฟล์ที่เราเก็บไว้ → จดไว้เพื่อลบหลังจากอัปเดตสำเร็จ
      if (cur.logo_url && cur.logo_url.startsWith("/uploads/brands/")) {
        const oldFilePath = path.join(UPLOAD_ROOT, cur.logo_url.replace("/uploads/", ""));
        oldFileToRemove = oldFilePath;
      }
    }

    const [rs] = await pool.query(
      `UPDATE brands SET name = ?, logo_url = ? WHERE brand_id = ?`,
      [nextName, nextLogoUrl, id]
    );

    if (!rs.affectedRows) {
      if (req.file) fs.unlink(path.join(brandsDir, req.file.filename), () => {});
      return res.status(404).json({ message: "ไม่พบแบรนด์" });
    }

    if (oldFileToRemove) fs.unlink(oldFileToRemove, () => {});

    res.json({ message: "อัปเดตแบรนด์สำเร็จ", logo_url: nextLogoUrl });
  } catch (err) {
    console.error("PATCH /api/admin/brands/:id error:", err);
    res.status(500).json({ message: "แก้ไขแบรนด์ไม่สำเร็จ" });
  }
});

/* ================================
 * DELETE: Delete brand + logo
 * ================================ */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // ตรวจว่ายังมี branch อ้างถึงอยู่หรือไม่
    const [[{ cnt }]] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM branches WHERE brand_id = ?`,
      [id]
    );
    if (cnt > 0) {
      return res.status(400).json({ message: "มีสาขาที่อ้างถึงแบรนด์นี้อยู่ ไม่สามารถลบได้" });
    }

    const [[row]] = await pool.query(
      `SELECT logo_url FROM brands WHERE brand_id = ?`,
      [id]
    );
    if (!row) return res.status(404).json({ message: "ไม่พบบรนด์" });

    const [rs] = await pool.query(`DELETE FROM brands WHERE brand_id = ?`, [id]);
    if (!rs.affectedRows) return res.status(404).json({ message: "ไม่พบบรนด์" });

    // ลบไฟล์โลโก้ถ้าเป็นไฟล์ที่เราเก็บ
    if (row.logo_url && row.logo_url.startsWith("/uploads/brands/")) {
      const filePath = path.join(UPLOAD_ROOT, row.logo_url.replace("/uploads/", ""));
      fs.unlink(filePath, () => {});
    }

    res.json({ message: "ลบแบรนด์สำเร็จ" });
  } catch (err) {
    console.error("DELETE /api/admin/brands/:id error:", err);
    res.status(500).json({ message: "ลบแบรนด์ไม่สำเร็จ" });
  }
});

export default router;
