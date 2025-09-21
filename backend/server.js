// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import { authRequired, requireRole } from "./auth.middleware.js";

// Routes
import authRoutes from "./auth.routes.js";
import adminRoutes from "./admin.routes.js";
import adminBranchRoutes from "./admin.branches.routes.js";
import adminBrandRoutes from "./admin.brands.routes.js";
import tableTypeRoutes from "./admin.tabletypes.routes.js";
import branchTableTypesRoutes from "./admin.branchTableTypes.routes.js";
import adminEmployeesRoutes from "./admin.employees.routes.js";
import appointmentsRoutes from "./appointments.routes.js";
import availabilityRouter from "./availability.routes.js";
import catalogRouter from "./catalog.routes.js";
import adminAppointmentsRouter, { purgeOldDay } from "./admin.appointments.routes.js";
import employeeAppointmentsRouter from "./employee.appointments.routes.js";
import usersMeRoutes from "./users.me.routes.js";

dotenv.config();

// __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* =======================
 * Static: /uploads
 * ======================= */
// Read base uploads dir from .env (should point to .../uploads, NOT .../uploads/brands)
const rawUploadEnv = (process.env.UPLOAD_DIR || "").trim();

// Default to <project>/backend/uploads if UPLOAD_DIR not provided
let UPLOAD_ROOT = rawUploadEnv
  ? path.resolve(rawUploadEnv)
  : path.join(__dirname, "uploads");

// If someone set UPLOAD_DIR ending with /uploads/brands, normalize back to /uploads
const norm = UPLOAD_ROOT.replace(/\\/g, "/");
if (/\/uploads\/brands\/?$/i.test(norm)) {
  UPLOAD_ROOT = path.dirname(UPLOAD_ROOT);
}

// Ensure folder exists
fs.mkdirSync(UPLOAD_ROOT, { recursive: true });

// Debug log where we actually serve from
console.log(
  "[STATIC] /uploads =>",
  UPLOAD_ROOT,
  fs.existsSync(UPLOAD_ROOT) ? "(exists)" : "(NOT EXISTS)"
);

// Serve static files
app.use("/uploads", express.static(UPLOAD_ROOT));

/* =======================
 * Middlewares
 * ======================= */
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

/* =======================
 * Health
 * ======================= */
app.get("/healthz", (_req, res) => res.json({ ok: true }));

/* =======================
 * Routes
 * ======================= */
app.use("/api/auth", authRoutes);

// Admin (role required)
app.use("/api/admin", authRequired, requireRole("admin"), adminRoutes);
app.use("/api/admin/branches", authRequired, requireRole("admin"), adminBranchRoutes);
app.use("/api/admin/brands", authRequired, requireRole("admin"), adminBrandRoutes);
app.use("/api/admin/table-types", authRequired, requireRole("admin"), tableTypeRoutes);
app.use("/api/admin/branch-table-types", authRequired, requireRole("admin"), branchTableTypesRoutes);
app.use("/api/admin/appointments", authRequired, requireRole("admin"), adminAppointmentsRouter);
app.use("/api/admin/employees", authRequired, requireRole("admin"), adminEmployeesRoutes);

// Customer / Public-ish
app.use("/api/appointments", appointmentsRoutes); // internal auth inside file if needed
app.use("/api/availability", availabilityRouter);
app.use("/api/catalog", catalogRouter);
app.use("/api/employee/appointments", authRequired, employeeAppointmentsRouter);
app.use("/api/users", usersMeRoutes);

/* =======================
 * 404 fallback
 * ======================= */
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

/* =======================
 * Start server
 * ======================= */
const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  scheduleDailyPurge();
});

/* =======================
 * Daily purge scheduler
 * ======================= */
function msUntilNext(hour = 0, minute = 5, tz = "Asia/Bangkok") {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(fmt.formatToParts(now).map(p => [p.type, p.value]));
  const y = Number(parts.year), m = Number(parts.month), d = Number(parts.day);

  // Build target in that timezone, then approximate to local wall time
  const targetLocal = new Date(Date.UTC(y, m - 1, d, hour, minute, 0));
  const nowUTC = new Date();
  const tzOffsetMs = now.getTime() - nowUTC.getTime();
  let target = new Date(targetLocal.getTime() - tzOffsetMs);
  if (target <= now) target = new Date(target.getTime() + 24 * 60 * 60 * 1000);
  return target.getTime() - now.getTime();
}

function scheduleDailyPurge() {
  const delay = msUntilNext(0, 5, "Asia/Bangkok");
  setTimeout(async function run() {
    try {
      const removed = await purgeOldDay();
      console.log(`[DAILY PURGE] removed rows = ${removed}`);
    } catch (e) {
      console.error("[DAILY PURGE] error:", e);
    } finally {
      setTimeout(run, 24 * 60 * 60 * 1000); // every 24h
    }
  }, delay);
}
