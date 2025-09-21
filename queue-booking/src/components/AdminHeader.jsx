// src/components/AdminHeader.jsx
import { useNavigate } from "react-router-dom";

export default function AdminHeader({
  title,
  showBack = false,          // true = แสดงปุ่มกลับ /admin
  rightSlot = null,          // ปุ่มพิเศษด้านขวา (เช่น เพิ่ม, รีเฟรช)
  showLogout = true,         // แสดงปุ่ม logout มุมขวา
}) {
  const navigate = useNavigate();
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => navigate("/admin")}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            ← กลับไปหน้าแอดมิน
          </button>
        )}
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {rightSlot}
        {showLogout && (
          <button
            onClick={() => {
              localStorage.removeItem("user");
              localStorage.removeItem("token");
              navigate("/login");
            }}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Logout
          </button>
        )}
      </div>
    </header>
  );
}
