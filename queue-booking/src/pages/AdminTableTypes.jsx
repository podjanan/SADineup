import { useEffect, useState } from "react";
import { api } from "../lib/api";
import AdminHeader from "../components/AdminHeader";

export default function AdminTableTypes() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create"); // "create" | "edit"
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    min_capacity: "",
    max_capacity: "",
    min_spend: "",
  });
  const [error, setError] = useState("");

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/admin/table-types");
      setItems(data.table_types || []);
    } catch (e) {
      setError(e.response?.data?.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => {
    setMode("create");
    setEditing(null);
    setForm({ name: "", description: "", min_capacity: "", max_capacity: "", min_spend: "" });
    setError("");
    setOpen(true);
  };

  const openEdit = (row) => {
    setMode("edit");
    setEditing(row);
    setForm({
      name: row.name ?? "",
      description: row.description ?? "",
      min_capacity: row.min_capacity ?? "",
      max_capacity: row.max_capacity ?? "",
      min_spend: row.min_spend ?? "",
    });
    setError("");
    setOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        name: form.name,
        description: form.description,
        min_capacity: Number(form.min_capacity),
        max_capacity: Number(form.max_capacity),
        min_spend: form.min_spend === "" ? 0 : Number(form.min_spend),
      };
      if (mode === "create") {
        await api.post("/api/admin/table-types", payload);
      } else {
        await api.patch(`/api/admin/table-types/${editing.type_id}`, payload);
      }
      setOpen(false);
      await fetchAll();
    } catch (e) {
      setError(e.response?.data?.message || "บันทึกไม่สำเร็จ");
    }
  };

  const handleDelete = async (row) => {
    const ok = confirm(`ต้องการลบประเภทโต๊ะ “${row.name}” ใช่ไหม?`);
    if (!ok) return;
    try {
      await api.delete(`/api/admin/table-types/${row.type_id}`);
      setItems((prev) => prev.filter((x) => x.type_id !== row.type_id));
    } catch (e) {
      alert(e.response?.data?.message || "ลบไม่สำเร็จ");
    }
  };

  const rightSlot = (
    <button
      onClick={openCreate}
      className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
    >
      เพิ่มประเภทโต๊ะ
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <AdminHeader title="จัดการประเภทโต๊ะ" showBack rightSlot={rightSlot} />

      {error && (
        <div className="mb-4 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        {loading ? (
          <p className="text-gray-500">กำลังโหลด...</p>
        ) : items.length === 0 ? (
          <p className="text-gray-500">ยังไม่มีประเภทโต๊ะ</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="border p-2 text-left">ID</th>
                  <th className="border p-2 text-left">ชื่อ</th>
                  <th className="border p-2 text-left">min - max</th>
                  <th className="border p-2 text-left">ขั้นต่ำ (บาท)</th>
                  <th className="border p-2 text-left">รายละเอียด</th>
                  <th className="border p-2 text-left">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.type_id} className="hover:bg-gray-50">
                    <td className="border p-2">{r.type_id}</td>
                    <td className="border p-2">{r.name}</td>
                    <td className="border p-2">
                      {r.min_capacity} - {r.max_capacity} คน
                    </td>
                    <td className="border p-2">{Number(r.min_spend).toLocaleString("th-TH")}</td>
                    <td className="border p-2">{r.description || "-"}</td>
                    <td className="border p-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(r)}
                          className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(r)}
                          className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700"
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                {mode === "create" ? "เพิ่มประเภทโต๊ะ" : "แก้ไขประเภทโต๊ะ"}
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mb-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-gray-700">ชื่อ *</label>
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  maxLength={50}
                  placeholder='เช่น "4-6 ที่นั่ง"'
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-700">Min capacity *</label>
                <input
                  type="number"
                  min={1}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={form.min_capacity}
                  onChange={(e) => setForm({ ...form, min_capacity: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-700">Max capacity *</label>
                <input
                  type="number"
                  min={1}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={form.max_capacity}
                  onChange={(e) => setForm({ ...form, max_capacity: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-700">ขั้นต่ำต่อโต๊ะ (บาท)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={form.min_spend}
                  onChange={(e) => setForm({ ...form, min_spend: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-gray-700">รายละเอียด</label>
                <textarea
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  maxLength={255}
                  placeholder="เช่น โซนใกล้เวที มีปลั๊กไฟ ฯลฯ"
                />
              </div>

              <div className="sm:col-span-2 mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  {mode === "create" ? "บันทึก" : "อัปเดต"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
