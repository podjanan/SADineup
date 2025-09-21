// src/pages/AdminBrands.jsx
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import AdminHeader from "../components/AdminHeader";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, ""); // ตัด '/' ท้าย

const toLogoSrc = (u) => {
  if (!u) return "";
  // ถ้า backend คืนเป็น URL เต็มอยู่แล้ว
  if (/^https?:\/\//i.test(u)) return u;

  // ถ้า backend คืนแบบขึ้นต้นด้วย '/' เช่น "/uploads/brands/..."
  if (u.startsWith("/")) return `${API}${u}`;

  // ถ้า backend คืนแบบไม่มี '/', เช่น "uploads/brands/..."
  return `${API}/${u}`;
};


export default function AdminBrands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [newBrand, setNewBrand] = useState("");
  const [logoFile, setLogoFile] = useState(null);     // ← เพิ่ม
  const [logoPreview, setLogoPreview] = useState(""); // ← เพิ่ม
  const [error, setError] = useState("");



  const fetchBrands = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/admin/brands");
      setBrands(data.brands || []);
    } catch (e) {
      setError(e.response?.data?.message || "โหลดข้อมูลแบรนด์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBrands(); }, []);

  const resetModal = () => {
    setNewBrand("");
    setLogoFile(null);
    setLogoPreview("");
    setOpenAdd(false);
  };

  const handleSelectLogo = (file) => {
    if (!file) { setLogoFile(null); setLogoPreview(""); return; }
    // validate type/size
    const okTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!okTypes.includes(file.type)) {
      setError("รองรับเฉพาะ PNG, JPG, WEBP");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("ไฟล์ควรมีขนาดไม่เกิน 2MB");
      return;
    }
    setError("");
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const handleAddBrand = async (e) => {
    e.preventDefault();
    setError("");
    if (!newBrand.trim()) return setError("กรุณากรอกชื่อแบรนด์");

    try {
      const form = new FormData();
      form.append("name", newBrand.trim());
      if (logoFile) form.append("logo", logoFile); // ← แนบไฟล์

      await api.post("/api/admin/brands", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      resetModal();
      fetchBrands();
    } catch (e) {
      setError(e.response?.data?.message || "เพิ่มแบรนด์ไม่สำเร็จ");
    }
  };

  const handleDelete = async (brand) => {
    const ok = confirm(`ต้องการลบแบรนด์ “${brand.name}” ใช่ไหม?`);
    if (!ok) return;
    try {
      await api.delete(`/api/admin/brands/${brand.brand_id}`);
      fetchBrands();
    } catch (e) {
      alert(e.response?.data?.message || "ลบแบรนด์ไม่สำเร็จ");
    }
  };

  const rightSlot = (
    <button
      onClick={() => setOpenAdd(true)}
      className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
    >
      เพิ่มแบรนด์
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <AdminHeader title="จัดการแบรนด์" showBack rightSlot={rightSlot} />

      {error && (
        <div className="mb-4 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        {loading ? (
          <p className="text-gray-500">กำลังโหลด...</p>
        ) : brands.length === 0 ? (
          <p className="text-gray-500">ยังไม่มีแบรนด์</p>
        ) : (
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="border p-2 text-left">ID</th>
                <th className="border p-2 text-left">โลโก้</th>
                <th className="border p-2 text-left">ชื่อแบรนด์</th>
                <th className="border p-2 text-left">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((b) => (
                <tr key={b.brand_id} className="hover:bg-gray-50">
                  <td className="border p-2">{b.brand_id}</td>
                  <td className="border p-2">
                    {b.logo_url ? (
                      <img
                        src={toLogoSrc(b.logo_url)}
                        alt={b.name}
                        className="h-10 w-10 rounded object-cover ring-1 ring-gray-200"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 text-xs text-gray-400 ring-1 ring-gray-200">
                        N/A
                      </div>
                    )}
                  </td>
                  <td className="border p-2">{b.name}</td>
                  <td className="border p-2">
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
        )}
      </div>

      {/* โมดอลเพิ่มแบรนด์ */}
      {openAdd && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">เพิ่มแบรนด์</h3>
              <button onClick={resetModal} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={handleAddBrand} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-gray-700">ชื่อแบรนด์ *</label>
                <input
                  type="text"
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="เช่น MK Restaurants"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-700">โลโก้ (PNG/JPG/WEBP ≤ 2MB)</label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center rounded-md border bg-white px-3 py-2 text-sm hover:bg-gray-50">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e)=>handleSelectLogo(e.target.files?.[0])}
                    />
                    เลือกไฟล์
                  </label>
                  {logoPreview ? (
                    <img src={logoPreview} alt="preview" className="h-10 w-10 rounded object-cover ring-1 ring-gray-200" />
                  ) : (
                    <span className="text-xs text-gray-500">ยังไม่ได้เลือกไฟล์</span>
                  )}
                  {logoPreview && (
                    <button
                      type="button"
                      onClick={() => { setLogoFile(null); setLogoPreview(""); }}
                      className="text-xs text-gray-600 hover:text-gray-800"
                    >
                      ลบรูป
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={resetModal} className="rounded-md border px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  ยกเลิก
                </button>
                <button type="submit" className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
