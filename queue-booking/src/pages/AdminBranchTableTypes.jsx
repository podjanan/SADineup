import { useEffect, useState } from "react";
import { api } from "../lib/api";
import AdminHeader from "../components/AdminHeader";

export default function AdminBranchTableTypes() {
  const [brands, setBrands] = useState([]);
  const [branches, setBranches] = useState([]);
  const [types, setTypes] = useState([]);

  const [brandId, setBrandId] = useState("");
  const [branchId, setBranchId] = useState("");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // โหลดแบรนด์ & table types
  useEffect(() => {
    (async () => {
      try {
        const [bRes, tRes] = await Promise.all([
          api.get("/api/admin/brands"),
          api.get("/api/admin/table-types"),
        ]);
        setBrands(bRes.data.brands || []);
        setTypes(tRes.data.table_types || []);
      } catch {
        setErr("โหลดข้อมูลเริ่มต้นไม่สำเร็จ");
      }
    })();
  }, []);

  // เมื่อเลือก brand → โหลดสาขาของ brand นั้น
  useEffect(() => {
    setBranches([]);
    setBranchId("");
    setRows([]);
    if (!brandId) return;
    (async () => {
      try {
        const { data } = await api.get("/api/admin/branches", { params: { brand_id: brandId } });
        setBranches(data.branches || []);
      } catch {
        setErr("โหลดสาขาไม่สำเร็จ");
      }
    })();
  }, [brandId]);

  // เมื่อเลือก branch → โหลด branch_table_types
  useEffect(() => {
    setRows([]);
    if (!brandId || !branchId) return;
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const fetchRows = async () => {
    setLoading(true);
    setErr("");
    try {
      const { data } = await api.get("/api/admin/branch-table-types", {
        params: { brand_id: brandId, branch_id: branchId },
      });
      setRows(data.data || []);
    } catch {
      setErr("โหลดข้อมูลจำนวนโต๊ะไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const addType = async (type_id) => {
    const val = prompt("กรอกจำนวนโต๊ะ (ตัวเลข ≥ 0):", "0");
    if (val == null) return;
    const n = Number(val);
    if (Number.isNaN(n) || n < 0) return alert("กรุณากรอกตัวเลข ≥ 0");
    try {
      await api.post("/api/admin/branch-table-types", {
        brand_id: Number(brandId),
        branch_id: Number(branchId),
        type_id,
        total_slots: n,
      });
      fetchRows();
    } catch (e) {
      alert(e.response?.data?.message || "เพิ่มไม่สำเร็จ");
    }
  };

  const updateSlots = async (type_id, current) => {
    const val = prompt("จำนวนโต๊ะใหม่:", String(current));
    if (val == null) return;
    const n = Number(val);
    if (Number.isNaN(n) || n < 0) return alert("กรุณากรอกตัวเลข ≥ 0");
    try {
      await api.patch(`/api/admin/branch-table-types/${brandId}/${branchId}/${type_id}`, {
        total_slots: n,
      });
      fetchRows();
    } catch (e) {
      alert(e.response?.data?.message || "อัปเดตไม่สำเร็จ");
    }
  };

  const removeType = async (type_id) => {
    if (!confirm("ลบรายการนี้?")) return;
    try {
      await api.delete(`/api/admin/branch-table-types/${brandId}/${branchId}/${type_id}`);
      fetchRows();
    } catch (e) {
      alert(e.response?.data?.message || "ลบไม่สำเร็จ");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <AdminHeader title="กำหนดจำนวนโต๊ะตามแบรนด์/สาขา" showBack />

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-gray-700">เลือกแบรนด์</label>
          <select
            className="w-full rounded-md border px-3 py-2"
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
          >
            <option value="">— เลือกแบรนด์ —</option>
            {brands.map((b) => (
              <option key={b.brand_id} value={b.brand_id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-700">เลือกสาขา</label>
          <select
            className="w-full rounded-md border px-3 py-2"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            disabled={!brandId}
          >
            <option value="">{brandId ? "— เลือกสาขา —" : "เลือกแบรนด์ก่อน"}</option>
            {branches.map((br) => (
              <option key={br.branch_id} value={br.branch_id}>{br.name}</option>
            ))}
          </select>
        </div>
      </div>

      {err && <div className="mb-3 rounded-md bg-rose-50 px-4 py-2 text-sm text-rose-700">{err}</div>}

      {!brandId || !branchId ? (
        <p className="text-gray-500">กรุณาเลือกแบรนด์และสาขา</p>
      ) : (
        <div className="rounded-lg bg-white p-5 shadow">
          {loading ? (
            <p className="text-gray-500">กำลังโหลด...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">ประเภทโต๊ะ</th>
                    <th className="border p-2 text-left">Min–Max</th>
                    <th className="border p-2 text-left">จำนวนโต๊ะ</th>
                    <th className="border p-2 text-left">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {/* แถวที่มีอยู่แล้ว */}
                  {rows.map((r) => (
                    <tr key={r.type_id} className="hover:bg-gray-50">
                      <td className="border p-2">{r.type_name}</td>
                      <td className="border p-2">{r.min_capacity}-{r.max_capacity} คน</td>
                      <td className="border p-2">{r.total_slots}</td>
                      <td className="border p-2">
                        <button
                          className="mr-2 rounded bg-amber-600 px-3 py-1 text-xs text-white hover:bg-amber-700"
                          onClick={() => updateSlots(r.type_id, r.total_slots)}
                        >
                          แก้ไข
                        </button>
                        <button
                          className="rounded bg-rose-600 px-3 py-1 text-xs text-white hover:bg-rose-700"
                          onClick={() => removeType(r.type_id)}
                        >
                          ลบ
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* ประเภทโต๊ะที่ยังไม่มีในสาขา → ให้ปุ่มเพิ่ม */}
                  {types
                    .filter((t) => !rows.find((x) => x.type_id === t.type_id))
                    .map((t) => (
                      <tr key={t.type_id} className="bg-gray-50/50">
                        <td className="border p-2">{t.name}</td>
                        <td className="border p-2">{t.min_capacity}-{t.max_capacity} คน</td>
                        <td className="border p-2">—</td>
                        <td className="border p-2">
                          <button
                            className="rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700"
                            onClick={() => addType(t.type_id)}
                          >
                            เพิ่ม
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
