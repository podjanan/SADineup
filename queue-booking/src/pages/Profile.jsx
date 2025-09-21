// src/pages/Profile.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import TopNavbar from "../components/TopNavbar";

function Row({ label, children }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
      <div className="w-36 shrink-0 text-sm text-gray-500">{label}</div>
      <div className="text-sm text-gray-900">{children || "-"}</div>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  // local form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [phone, setPhone]         = useState("");

  async function load() {
    setErr(""); setOk(""); setLoading(true);
    try {
      const [{ data: meRes }, { data: apptRes }] = await Promise.all([
        api.get("/api/auth/me"),
        api.get("/api/appointments/my"),
      ]);
      setMe(meRes.user || null);
      setAppointments(apptRes.appointments || []);
      setFirstName(meRes.user?.first_name || "");
      setLastName(meRes.user?.last_name || "");
      setPhone(meRes.user?.phone || "");
    } catch (e) {
      setErr(e?.response?.data?.message || "โหลดข้อมูลโปรไฟล์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    setErr(""); setOk("");
    try {
      await api.patch("/api/users/me", {
        first_name: firstName,
        last_name: lastName,
        phone,
      });
      setOk("บันทึกโปรไฟล์สำเร็จ");
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (user) {
        const updated = { ...user, first_name: firstName, last_name: lastName, phone };
        localStorage.setItem("user", JSON.stringify(updated));
      }
      load();
    } catch (e) {
      setErr(e?.response?.data?.message || "บันทึกไม่สำเร็จ");
    }
  }

  const avatarText = (me?.first_name || me?.username || "?").slice(0,1).toUpperCase();
  const isEmployee = me?.role === "employee"; // เงื่อนไขแสดงปุ่มคิวพนักงาน

  return (
    <>
      <TopNavbar title="MY PROFILE" />

      <div className="min-h-screen bg-gray-50 pt-14">
        <div className="mx-auto w-full max-w-5xl px-4 py-4">
          {err && <div className="mt-3 rounded-md bg-rose-50 px-4 py-2 text-rose-700">{err}</div>}
          {ok  && <div className="mt-3 rounded-md bg-emerald-50 px-4 py-2 text-emerald-700">{ok}</div>}

          {loading ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {Array.from({length:3}).map((_,i)=>(
                <div key={i} className="h-40 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-gray-100" />
              ))}
            </div>
          ) : me ? (
            <>
              {/* Header card */}
              <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-xl font-semibold text-white">
                    {avatarText}
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <div className="text-lg font-semibold text-gray-900">
                      {me.first_name || me.last_name ? `${me.first_name || ""} ${me.last_name || ""}`.trim() : me.username}
                    </div>
                    <div className="text-sm text-gray-500">{me.email}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-700">
                      {me.role}
                    </span>

                    {/* ปุ่มไปหน้า /employee/queue เฉพาะ employee */}
                    {isEmployee && (
                      <button
                        onClick={() => navigate("/employee/queue")}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                      >
                        เมนูพนักงาน
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Basic info + Edit */}
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 lg:col-span-2">
                  <h3 className="mb-4 text-base font-semibold text-gray-900">ข้อมูลพื้นฐาน</h3>
                  <div className="grid gap-4">
                    <Row label="ชื่อจริง">
                      <input className="w-full max-w-sm rounded-md border px-3 py-2" value={firstName} onChange={(e)=>setFirstName(e.target.value)} />
                    </Row>
                    <Row label="นามสกุล">
                      <input className="w-full max-w-sm rounded-md border px-3 py-2" value={lastName} onChange={(e)=>setLastName(e.target.value)} />
                    </Row>
                    <Row label="อีเมล">{me.email}</Row>
                    <Row label="เบอร์โทร">
                      <input className="w-full max-w-sm rounded-md border px-3 py-2" value={phone} onChange={(e)=>setPhone(e.target.value)} />
                    </Row>
                    <Row label="ชื่อผู้ใช้">{me.username}</Row>
                    <Row label="สมัครเมื่อ">
                      {me.created_at ? new Date(me.created_at).toLocaleString("th-TH") : "-"}
                    </Row>
                  </div>

                  <div className="mt-5 flex gap-2">
                    <button
                      className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                      onClick={handleSave}
                    >
                      บันทึก
                    </button>
                  </div>
                </div>

                {/* Employee branches */}
                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                  <h3 className="mb-3 text-base font-semibold text-gray-900">สังกัด</h3>
                  {me.employee_branches?.length ? (
                    <ul className="space-y-2">
                      {me.employee_branches.map((x) => (
                        <li key={`${x.branch_id}`} className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
                          <div className="font-medium">{x.brand_name}</div>
                          <div className="text-gray-600">{x.branch_name}</div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-sm text-gray-500">
                      ไม่ได้สังกัดสาขาใด
                    </div>
                  )}
                </div>
              </div>

              {/* Appointments */}
              <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900">การจองล่าสุดของฉัน</h3>
                </div>

                {appointments.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-sm">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="px-3 py-2 text-left">หมายเลข</th>
                          <th className="px-3 py-2 text-left">สาขา</th>
                          <th className="px-3 py-2 text-left">ประเภทโต๊ะ</th>
                          <th className="px-3 py-2 text-left">วัน-เวลา</th>
                          <th className="px-3 py-2 text-left">คน</th>
                          <th className="px-3 py-2 text-left">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointments.map((a) => (
                          <tr key={a.appointment_id} className="border-t">
                            <td className="px-3 py-2">#{a.appointment_id}</td>
                            <td className="px-3 py-2">{a.branch_name}</td>
                            <td className="px-3 py-2">{a.type_name}</td>
                            <td className="px-3 py-2">
                              {a.date} {a.time?.slice(0,5)}
                            </td>
                            <td className="px-3 py-2">{a.guest_count}</td>
                            <td className="px-3 py-2 capitalize">{a.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-gray-500">
                    ยังไม่มีการจอง
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="mt-6 rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm ring-1 ring-gray-100">
              ไม่พบข้อมูลผู้ใช้
            </div>
          )}
        </div>
      </div>
    </>
  );
}
