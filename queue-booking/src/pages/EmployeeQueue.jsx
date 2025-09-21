// src/pages/EmployeeQueue.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";      // ⬅️ เพิ่ม
import { api } from "../lib/api";

const STATUS_COLORS = {
  pending:   "bg-amber-50 text-amber-700",
  confirmed: "bg-emerald-50 text-emerald-700",
  completed: "bg-slate-100 text-slate-700",
  canceled:  "bg-rose-50 text-rose-700",
};

const TABS = [
  { key: "",         label: "ทั้งหมด" },
  { key: "pending",  label: "รอยืนยัน" },
  { key: "confirmed",label: "ยืนยันแล้ว" },
  { key: "completed",label: "เสร็จสิ้น" },
  { key: "canceled", label: "ยกเลิก" },
];

export default function EmployeeQueue() {
  const navigate = useNavigate();                     // ⬅️ เพิ่ม

  const today = useMemo(() => new Date().toISOString().slice(0,10), []);
  const [date, setDate] = useState(today);

  const [statusTab, setStatusTab] = useState("");
  const [q, setQ] = useState("");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  async function load() {
    setErr(""); setOk(""); setLoading(true);
    try {
      const params = { date };
      if (statusTab) params.status = statusTab;
      if (q) params.q = q;
      const { data } = await api.get("/api/employee/appointments", { params });
      setItems(data.appointments || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "โหลดคิวไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [date, statusTab]);

  async function updateStatus(id, status) {
    setErr(""); setOk("");
    try {
      await api.patch(`/api/employee/appointments/${id}/status`, { status });
      setOk(`อัปเดตสถานะเป็น ${status} แล้ว`);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "อัปเดตสถานะไม่สำเร็จ");
    }
  }

  const filtered = useMemo(() => {
    if (!q) return items;
    const k = q.toLowerCase();
    return items.filter(x =>
      [x.username, x.customer_name, x.phone, x.email, x.branch_name, x.type_name, x.brand_name]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(k))
    );
  }, [items, q]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-4">

        {/* แถวหัวข้อ + ปุ่มกลับ */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">คิวพนักงาน</h1>
          <button
            onClick={() => navigate("/book")}
            className="rounded-md border px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            ← กลับไปจอง
          </button>
        </div>

        {/* filters */}
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex gap-2">
            <input
              type="date"
              className="rounded-md border px-3 py-2"
              value={date}
              onChange={(e)=>setDate(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              className="w-full rounded-md border px-3 py-2"
              placeholder="ค้นหา (ชื่อ/โทร/อีเมล/สาขา/ประเภท)"
              value={q}
              onChange={(e)=>setQ(e.target.value)}
              onKeyDown={(e)=>{ if (e.key==='Enter') load(); }}
            />
            <button
              onClick={load}
              className="rounded-md border px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              ค้นหา
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto">
            {TABS.map(t => (
              <button
                key={t.key || "all"}
                onClick={()=>setStatusTab(t.key)}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  statusTab===t.key ? "bg-slate-900 text-white" : "bg-white ring-1 ring-gray-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {err && <div className="mt-3 rounded-md bg-rose-50 px-4 py-2 text-rose-700">{err}</div>}
        {ok &&  <div className="mt-3 rounded-md bg-emerald-50 px-4 py-2 text-emerald-700">{ok}</div>}

        {/* table */}
        {loading ? (
          <div className="mt-4 grid gap-3">
            {Array.from({length:6}).map((_,i)=>(
              <div key={i} className="h-20 animate-pulse rounded-xl bg-white shadow-sm ring-1 ring-gray-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-gray-500">
            ไม่มีคิว
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
            <table className="w-full min-w-[960px] border-collapse">
              <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                <tr>
                  <th className="p-3 text-left">ID</th>
                  <th className="p-3 text-left">ลูกค้า</th>
                  <th className="p-3 text-left">แบรนด์/สาขา</th>
                  <th className="p-3 text-left">ประเภทโต๊ะ</th>
                  <th className="p-3 text-left">วัน-เวลา</th>
                  <th className="p-3 text-left">คน</th>
                  <th className="p-3 text-left">สถานะ</th>
                  <th className="p-3 text-left">จัดการ</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filtered.map((it)=>(
                  <tr key={it.appointment_id} className="border-t">
                    <td className="p-3">{it.appointment_id}</td>
                    <td className="p-3">
                      <div className="font-medium">{it.customer_name || it.username}</div>
                      <div className="text-xs text-gray-500">{it.phone || it.email}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{it.brand_name}</div>
                      <div className="text-xs text-gray-600">{it.branch_name}</div>
                    </td>
                    <td className="p-3">{it.type_name}</td>
                    <td className="p-3">{it.date} {it.time?.slice(0,5)}</td>
                    <td className="p-3">{it.guest_count}</td>
                    <td className="p-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[it.status] || "bg-gray-100 text-gray-700"}`}>
                        {it.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        {(it.status === "pending") && (
                          <button
                            onClick={()=>updateStatus(it.appointment_id, "confirmed")}
                            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                          >
                            Confirm
                          </button>
                        )}
                        {(it.status === "confirmed") && (
                          <button
                            onClick={()=>updateStatus(it.appointment_id, "completed")}
                            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                          >
                            Complete
                          </button>
                        )}
                        {["pending","confirmed"].includes(it.status) && (
                          <button
                            onClick={()=>updateStatus(it.appointment_id, "canceled")}
                            className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
