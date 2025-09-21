import { useEffect, useState } from "react";
import { api } from "../lib/api";
import BranchFormModal from "../components/BranchFormModal";
import AdminHeader from "../components/AdminHeader";

// ช่วยต่อ URL ให้ถูกเสมอ
const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
function toSrc(u) {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  return u.startsWith("/") ? `${API}${u}` : `${API}/${u}`;
}

export default function AdminBranches() {
  const [branches, setBranches] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [error, setError] = useState("");

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/admin/branches");
      setBranches(data.branches || []);
    } catch (e) {
      setError(e.response?.data?.message || "โหลดสาขาไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const { data } = await api.get("/api/admin/brands");
      setBrands(data.brands || []);
    } catch (e) {
      console.error("โหลด brands ไม่สำเร็จ:", e);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchBrands();
  }, []);

  const handleCreate = async (payload) => {
    setError("");
    try {
      await api.post("/api/admin/branches", payload);
      setOpenAdd(false);
      await fetchBranches();
    } catch (e) {
      setError(e.response?.data?.message || "เพิ่มสาขาไม่สำเร็จ");
    }
  };

  const handleDelete = async (branch) => {
    const ok = confirm(`ต้องการลบสาขา “${branch.name}” ใช่ไหม?`);
    if (!ok) return;
    try {
      await api.delete(`/api/admin/branches/${branch.branch_id}`);
      setBranches((prev) => prev.filter((b) => b.branch_id !== branch.branch_id));
    } catch (e) {
      alert(e.response?.data?.message || "ลบสาขาไม่สำเร็จ");
    }
  };

  const rightSlot = (
    <div className="flex gap-2">
      <button
        onClick={fetchBranches}
        className="rounded-md border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
      >
        รีเฟรช
      </button>
      <button
        onClick={() => setOpenAdd(true)}
        className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
      >
        เพิ่มสาขา
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <AdminHeader title="จัดการสาขา" showBack rightSlot={rightSlot} />

      {error && (
        <div className="mb-4 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        {loading ? (
          <p className="text-gray-500">กำลังโหลด...</p>
        ) : branches.length === 0 ? (
          <div className="flex items-center justify-between">
            <p className="text-gray-500">ยังไม่มีสาขา</p>
            <button
              onClick={() => setOpenAdd(true)}
              className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              เพิ่มสาขาแรก
            </button>
          </div>
        ) : (
          // ตารางพร้อมรูปสาขา
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left text-sm text-gray-700">
                  <th className="px-3 py-2">รูป</th>
                  <th className="px-3 py-2">สาขา</th>
                  <th className="px-3 py-2">แบรนด์</th>
                  <th className="px-3 py-2">ที่อยู่</th>
                  <th className="px-3 py-2">โทร</th>
                  <th className="px-3 py-2">จัดการ</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {branches.map((b) => (
                  <tr key={b.branch_id} className="border-t hover:bg-gray-50/50">
                    <td className="px-3 py-2">
                      {b.image_url ? (
                        <img
                          src={toSrc(b.image_url)}
                          alt={b.name}
                          className="h-12 w-12 rounded object-cover ring-1 ring-gray-200"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-100 text-xs text-gray-400 ring-1 ring-gray-200">
                          N/A
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-900">{b.name}</td>
                    <td className="px-3 py-2">{b.brand_name || "-"}</td>
                    <td className="px-3 py-2 text-gray-600">{b.address}</td>
                    <td className="px-3 py-2">{b.phone || "-"}</td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => handleDelete(b)}
                        className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700"
                      >
                        ลบ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {openAdd && (
        <BranchFormModal
          title="เพิ่มสาขา"
          brands={brands}
          onClose={() => setOpenAdd(false)}
          onSubmit={async (payload) => {
            // ⚙️ รองรับทั้ง payload ปกติ และ payload ที่มี image (File) -> multipart
            try {
              const file = payload?.image || payload?.logo || payload?.file || null;
              if (file) {
                const fd = new FormData();
                if (payload.name != null) fd.append("name", payload.name);
                if (payload.address != null) fd.append("address", payload.address);
                if (payload.phone != null) fd.append("phone", payload.phone);
                if (payload.brand_id != null) fd.append("brand_id", payload.brand_id);
                fd.append("image", file);
                await api.post("/api/admin/branches", fd, {
                  headers: { "Content-Type": "multipart/form-data" },
                });
              } else {
                await api.post("/api/admin/branches", payload);
              }
              setOpenAdd(false);
              await fetchBranches();
            } catch (e) {
              setError(e.response?.data?.message || "เพิ่มสาขาไม่สำเร็จ");
            }
          }}
        />
      )}
    </div>
  );
}
