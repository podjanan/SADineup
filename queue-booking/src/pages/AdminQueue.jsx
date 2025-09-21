// src/pages/AdminQueue.jsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import AdminHeader from "../components/AdminHeader";

const BADGES = {
  pending:   "bg-amber-50 text-amber-700",
  confirmed: "bg-emerald-50 text-emerald-700",
  completed: "bg-slate-100 text-slate-700",
  canceled:  "bg-rose-50 text-rose-700",
};

function StatusBadge({ status }) {
  const label = { pending: "รอยืนยัน", confirmed: "ยืนยันแล้ว", completed: "เสร็จสิ้น", canceled: "ยกเลิก" }[status] || status;
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${BADGES[status] || "bg-gray-100 text-gray-600"}`}>{label}</span>;
}

export default function AdminQueue() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  async function load() {
    setErr(""); setOk(""); setLoading(true);
    try {
      // แนะนำให้มีเอ็นพอยต์นี้ในฝั่งแบ็กเอนด์: GET /api/admin/appointments
      // ควรคืนรายการทั้งหมดของระบบ (join สาขา/ประเภท/ผู้ใช้)
      const { data } = await api.get("/api/admin/appointments");
      setItems(data.appointments || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "โหลดคิวไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const visible = useMemo(() => {
    // เรียงตามวันที่เวลาล่าสุดก่อน
    return [...items].sort((a, b) => {
      const kA = `${a.date} ${a.time}`;
      const kB = `${b.date} ${b.time}`;
      return kA < kB ? 1 : -1;
    });
  }, [items]);

  async function purgeOnServer() {
    // พยายามล้างที่ฝั่งแบ็กเอนด์ก่อน (ถ้ามี)
    try {
      const { data } = await api.delete("/api/admin/appointments/purge", {
        params: { statuses: "canceled,completed" },
      });
      setOk(data?.message || "ล้างคิว (ยกเลิก/เสร็จสิ้น) เรียบร้อย");
      await load();
      return true;
    } catch (e) {
      // ถ้า 404/405 แปลว่าไม่มีเอ็นพอยต์ ให้ fallback frontend
      if ([404, 405].includes(e?.response?.status)) return false;
      setErr(e?.response?.data?.message || "ล้างคิวไม่สำเร็จ");
      return true; // มี error อื่น ไม่ต้อง fallback
    }
  }

  async function handleClearQueue() {
    setErr(""); setOk("");
    const doneOnServer = await purgeOnServer();
    if (doneOnServer) return;

    // Fallback: ล้างในตารางฝั่ง FE (filter ออกเฉย ๆ)
    setItems((prev) => prev.filter((x) => !["canceled", "completed"].includes(x.status)));
    setOk("ล้างคิว (ยกเลิก/เสร็จสิ้น) ออกจากตารางแล้ว (เฉพาะฝั่งหน้าเว็บ)");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-4">
        <AdminHeader title="จัดการคิว" showBack />

        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-gray-600">รวม {items.length} รายการ</p>
          <div className="flex gap-2">
            <button
              onClick={load}
              className="rounded-md border px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              รีเฟรช
            </button>
            <button
              onClick={handleClearQueue}
              className="rounded-md bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"
              title="เอารายการที่ยกเลิกและเสร็จสิ้นออกจากตาราง (และพยายามลบจริงในฐานข้อมูลถ้ามีเอ็นพอยต์)"
            >
              ล้างคิว (ยกเลิก/เสร็จสิ้น)
            </button>
          </div>
        </div>

        {err && <div className="mt-3 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">{err}</div>}
        {ok &&  <div className="mt-3 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{ok}</div>}

        {loading ? (
          <div className="mt-4 grid gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-white shadow-sm ring-1 ring-gray-100" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-gray-500">
            ไม่มีคิว
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
            <table className="w-full min-w-[880px] border-collapse">
              <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                <tr>
                  <th className="p-3 text-left">ID</th>
                  <th className="p-3 text-left">ลูกค้า</th>
                  <th className="p-3 text-left">สาขา</th>
                  <th className="p-3 text-left">ประเภทโต๊ะ</th>
                  <th className="p-3 text-left">วัน-เวลา</th>
                  <th className="p-3 text-left">นาที</th>
                  <th className="p-3 text-left">คน</th>
                  <th className="p-3 text-left">สถานะ</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {visible.map((it) => (
                  <tr key={it.appointment_id} className="border-t">
                    <td className="p-3">{it.appointment_id}</td>
                    <td className="p-3">
                      {it.customer_name || it.username || `#${it.user_id}`}
                    </td>
                    <td className="p-3">{it.branch_name || `#${it.branch_id}`}</td>
                    <td className="p-3">{it.type_name || `#${it.type_id}`}</td>
                    <td className="p-3">
                      {it.date} {it.time?.slice(0,5)}
                    </td>
                    <td className="p-3">{it.duration ?? 90}</td>
                    <td className="p-3">{it.guest_count}</td>
                    <td className="p-3"><StatusBadge status={it.status} /></td>
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
