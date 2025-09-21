// src/pages/MyBookings.jsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import TopNavbar from "../components/TopNavbar";

/** รวม date (YYYY-MM-DD หรือ ISO) + time (HH:mm[:ss] optional) เป็น Date (โซนเครื่องผู้ใช้) */
function combineLocalDateTime(dateStr, timeStr) {
  if (!dateStr) return null;
  const pureDate = String(dateStr).split("T")[0];
  const [y, m, d] = pureDate.split("-").map((v) => Number(v));
  let hh = 0, mm = 0, ss = 0;
  if (timeStr) {
    const parts = String(timeStr).split(":").map((v) => Number(v));
    hh = parts[0] ?? 0;
    mm = parts[1] ?? 0;
    ss = parts[2] ?? 0;
  }
  const dt = new Date(y || 0, (m || 1) - 1, d || 1, hh, mm, ss);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function StatusBadge({ status }) {
  const map = {
    pending: "bg-amber-50 text-amber-700",
    confirmed: "bg-emerald-50 text-emerald-700",
    completed: "bg-slate-100 text-slate-700",
    canceled: "bg-rose-50 text-rose-700",
  };
  const label =
    {
      pending: "รอยืนยัน",
      confirmed: "ยืนยันแล้ว",
      completed: "เสร็จสิ้น",
      canceled: "ยกเลิกแล้ว",
    }[status] || status;

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${map[status] || "bg-gray-100 text-gray-600"}`}>
      {label}
    </span>
  );
}

function BookingRow({ appt, onCancel, canCancel }) {
  const dateText = useMemo(() => {
    const dt = combineLocalDateTime(appt.date, appt.time);
    if (!dt) return `${appt.date ?? ""} ${appt.time ?? ""}`.trim() || "-";
    return dt.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
  }, [appt.date, appt.time]);

  const isQueued = appt.queue_no !== null && Number(appt.queue_no) > 0;
  const queuesBefore = Number(appt.queues_before || 0);

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-gray-900">
              {appt.branch_name || `สาขา #${appt.branch_id}`}
            </h3>
            <StatusBadge status={appt.status} />
            {isQueued ? (
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                คิวที่ {appt.queue_no}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                ได้ที่นั่งทันที
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-gray-600">
            ประเภทโต๊ะ:{" "}
            <span className="font-medium text-gray-800">
              {appt.type_name || `#${appt.type_id}`}
            </span>
          </p>

          <div className="mt-2 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
            <div>วัน-เวลา: <span className="font-medium text-gray-800">{dateText}</span></div>
            <div>ระยะเวลา: <span className="font-medium text-gray-800">{appt.duration ?? 90} นาที</span></div>
            <div>จำนวนคน: <span className="font-medium text-gray-800">{appt.guest_count}</span></div>
            <div>มัดจำ: <span className="font-medium text-gray-800">
              {Number(appt.deposit_amount || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </span> บาท</div>
            {/* ▶ เพิ่มบรรทัดแสดงหมายเลขคิว */}
            <div className="sm:col-span-2">
              หมายเลขคิว:{" "}
              <span className="font-medium text-gray-800">
                {isQueued ? `#${appt.queue_no}` : "— ได้ที่นั่งทันที —"}
              </span>
              {isQueued && (
                <span className="ml-3 text-indigo-700">
                  (มีคิวก่อนหน้า <b>{queuesBefore}</b> คิว)
                </span>
              )}
            </div>
          </div>

          {appt.note ? (
            <p className="mt-2 text-sm text-gray-500">หมายเหตุ: {appt.note}</p>
          ) : null}

          <p className="mt-2 text-[11px] text-gray-400">หมายเลขการจอง #{appt.appointment_id}</p>
        </div>

        <div className="flex items-center gap-2">
          {canCancel && appt.status !== "canceled" && appt.status !== "completed" ? (
            <button
              onClick={() => onCancel?.(appt)}
              className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"
            >
              ยกเลิกการจอง
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function MyBookings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const load = async () => {
    setErr(""); setOk(""); setLoading(true);
    try {
      const { data } = await api.get("/api/appointments/my"); // ต้องส่ง queue_no และ queues_before มาด้วยจาก backend
      setItems(data.appointments || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "โหลดรายการจองไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const canCancel = (appt) => appt.status === "pending" || appt.status === "confirmed";

  const onCancel = async (appt) => {
    setErr(""); setOk("");
    try {
      await api.patch(`/api/appointments/${appt.appointment_id}/cancel`);
      setOk(`ยกเลิกการจอง #${appt.appointment_id} สำเร็จ`);
      load();
    } catch (e) {
      setErr(e?.response?.data?.message || "ยกเลิกไม่สำเร็จ");
    }
  };

  const grouped = useMemo(() => {
    const order = { pending: 1, confirmed: 2, completed: 3, canceled: 4 };
    return [...items].sort(
      (a, b) =>
        (order[a.status] || 9) - (order[b.status] || 9) ||
        (a.date < b.date ? 1 : -1) ||
        (a.time < b.time ? 1 : -1)
    );
  }, [items]);

  return (
    <>
      <TopNavbar title="MY BOOKINGS" active="bookings" />
      <div className="min-h-screen bg-gray-50 pt-14">
        <div className="mx-auto w-full max-w-5xl px-4 py-4">
          {err && <div className="mt-3 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">{err}</div>}
          {ok &&  <div className="mt-3 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{ok}</div>}

          <div className="mt-4 flex items-center justify-between gap-2">
            <p className="text-sm text-gray-600">รวม {items.length} รายการ</p>
            <button onClick={load} className="rounded-md border px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
              รีเฟรช
            </button>
          </div>

          {loading ? (
            <div className="mt-4 grid gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-gray-100" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-gray-500">
              ยังไม่มีการจอง
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              {grouped.map((appt) => (
                <BookingRow
                  key={appt.appointment_id}
                  appt={appt}
                  canCancel={canCancel(appt)}
                  onCancel={onCancel}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
