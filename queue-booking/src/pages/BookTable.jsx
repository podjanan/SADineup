import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import TopNavbar from "../components/TopNavbar";

// helper: YYYY-MM-DD (วันนี้)
function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

// ช่วยต่อ URL รูปให้ถูกเสมอ
const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
function toSrc(u) {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  return u.startsWith("/") ? `${API}${u}` : `${API}/${u}`;
}

const FIXED_DURATION = 120;
const DEFAULT_GUEST = 2;

export default function BookTable() {
  const navigate = useNavigate();

  const [brands, setBrands] = useState([]);
  const [branches, setBranches] = useState([]);
  const [typesByBranch, setTypesByBranch] = useState({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [pick, setPick] = useState(null);
  const [pickTime, setPickTime] = useState("");
  const [booking, setBooking] = useState(false);

  const date = todayStr();

  useEffect(() => {
    (async () => {
      try {
        const [b, br] = await Promise.all([
          api.get("/api/catalog/brands"),
          api.get("/api/catalog/branches"),
        ]);
        setBrands(b.data.brands || []);
        setBranches(br.data.branches || []);
      } catch (e) {
        setErr(e?.response?.data?.message || "โหลดแบรนด์/สาขาไม่สำเร็จ");
      }
    })();
  }, []);

  useEffect(() => {
    if (!branches.length) {
      setTypesByBranch({});
      return;
    }
    const ctrl = new AbortController();
    (async () => {
      try {
        setLoading(true);
        try {
          const { data } = await api.get("/api/catalog/branch-table-types", { signal: ctrl.signal });
          const byBranch = {};
          for (const it of data?.items || []) {
            (byBranch[it.branch_id] ||= []).push({
              type_id: it.type_id,
              name: it.name,
              min_capacity: it.min_capacity,
              max_capacity: it.max_capacity,
              total_slots: it.total_slots ?? null,
            });
          }
          setTypesByBranch(byBranch);
          return;
        } catch {
          const jobs = branches.map((br) =>
            api
              .get("/api/availability/table-types", {
                params: {
                  branch_id: br.branch_id, date, time: "00:00",
                  guest: DEFAULT_GUEST, duration: FIXED_DURATION,
                },
                signal: ctrl.signal,
              })
              .then((res) => [
                br.branch_id,
                (res.data?.items || []).map((x) => ({
                  type_id: x.type_id,
                  name: x.name,
                  min_capacity: x.min_capacity,
                  max_capacity: x.max_capacity,
                  total_slots: x.total_slots ?? null,
                })),
              ])
              .catch(() => [br.branch_id, []])
          );
          const pairs = await Promise.all(jobs);
          setTypesByBranch(Object.fromEntries(pairs));
        }
      } catch (e) {
        if (e.name !== "CanceledError") setErr("โหลดประเภทโต๊ะไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [branches, date]);

  // group branches by brand
  const brandToBranches = useMemo(() => {
    const m = {};
    for (const br of branches) {
      const key = String(br.brand_id ?? "unknown");
      (m[key] ||= []).push(br);
    }
    return m;
  }, [branches]);

  const brandById = (id) => brands.find((b) => b.brand_id === Number(id));
  const brandName  = (id) => brandById(id)?.name || "Brand";
  const brandLogo  = (id) => toSrc(brandById(id)?.logo_url || "");

  function openPick(branch, type) {
    setErr(""); setOk(""); setPick({ branch, type }); setPickTime("");
  }

  async function confirmBook() {
    if (!pick || !pickTime) { setErr("กรุณาเลือกเวลา"); return; }
    setErr(""); setOk(""); setBooking(true);
    try {
      const payload = {
        branch_id: Number(pick.branch.branch_id),
        type_id: Number(pick.type.type_id),
        date, time: pickTime, duration: FIXED_DURATION,
        guest_count: DEFAULT_GUEST, deposit_amount: 0, note: "",
      };
      const rs = await api.post("/api/appointments", payload);
      setOk(`จองสำเร็จ หมายเลขการจอง #${rs.data?.appointment_id}`);
      setPick(null);
    } catch (e) {
      const code = e?.response?.status;
      setErr(code === 401 ? "กรุณาเข้าสู่ระบบก่อนทำการจอง" : (e?.response?.data?.message || "จองไม่สำเร็จ"));
    } finally {
      setBooking(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavbar
        title="BOOK A TABLE"
        active="home"
        onHome={() => navigate("/book")}
        onBookings={() => navigate("/my-bookings")}
        onMe={() => navigate("/profile")}
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-4">
        {err && <div className="mt-3 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">{err}</div>}
        {ok  && <div className="mt-3 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{ok}</div>}

        {loading ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-gray-100" />
            ))}
          </div>
        ) : (
          <>
            {Object.keys(brandToBranches).length ? (
              Object.keys(brandToBranches).map((bid) => {
                const branchesOfBrand = brandToBranches[bid];
                const cover = toSrc(branchesOfBrand?.[0]?.image_url || ""); // ใช้รูปสาขาแรกเป็นปก

                return (
                  <section key={bid} className="mt-8">
                    {/* HERO: ปก = รูปสาขาแรก, ด้านหน้าโชว์โลโก้แบรนด์ */}
                    <div className="relative h-44 w-full overflow-hidden rounded-2xl">
                      {cover ? (
                        <img
                          src={cover}
                          alt="branch cover"
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full bg-slate-200" />
                      )}

                      {/* gradient ด้านล่างให้อ่านตัวหนังสือง่าย */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />

                      {/* โลโก้ + ชื่อแบรนด์ */}
                      <div className="absolute left-4 bottom-4 flex items-center gap-4">
                        <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-2xl bg-white shadow ring-1 ring-black/5">
                          {brandLogo(bid) ? (
                            <img src={brandLogo(bid)} alt={brandName(bid)} className="h-full w-full object-contain p-2" />
                          ) : (
                            <div className="text-xs text-gray-400">No Logo</div>
                          )}
                        </div>
                        <div>
                          <h2 className="text-2xl font-extrabold tracking-wide text-white drop-shadow">
                            {brandName(bid)}
                          </h2>
                          <p className="text-xs text-white/80">สาขา {branchesOfBrand.length} แห่ง</p>
                        </div>
                      </div>
                    </div>

                    {/* รายการสาขา */}
                    <div className="mt-4 space-y-6">
                      {branchesOfBrand.map((br) => {
                        const items = typesByBranch[br.branch_id] || [];
                        const typeCount = items.length;
                        const branchCover = toSrc(br.image_url || "");

                        return (
                          <div
                            key={br.branch_id}
                            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100"
                          >
                            <div className="mb-3 flex items-center justify-between">
                              <div>
                                <div className="text-base font-semibold text-gray-800">{br.name}</div>
                                {br.address ? (
                                  <div className="text-xs text-gray-500">{br.address}</div>
                                ) : null}
                              </div>
                              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                {typeCount} ประเภทโต๊ะ
                              </div>
                            </div>

                            {typeCount ? (
                              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {items.map((it) => (
                                  <div
                                    key={it.type_id}
                                    className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100"
                                  >
                                    {/* รูปหัวการ์ด = รูปสาขา */}
                                    {branchCover ? (
                                      <img
                                        src={branchCover}
                                        alt={br.name}
                                        className="h-28 w-full object-cover"
                                        loading="lazy"
                                      />
                                    ) : (
                                      <div className="h-28 w-full bg-gray-100" />
                                    )}

                                    <div className="p-4">
                                      <div className="flex items-center justify-between">
                                        <div className="text-sm font-semibold text-gray-800">
                                          {it.name}
                                        </div>
                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                          {it.min_capacity}-{it.max_capacity} คน
                                        </span>
                                      </div>
                                      <div className="mt-1 text-xs text-gray-500">
                                        วันที่ {date} • ระยะเวลา {FIXED_DURATION} นาที
                                      </div>

                                      <div className="mt-3 flex justify-end">
                                        <button
                                          onClick={() => openPick(br, it)}
                                          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                                        >
                                          จอง
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-sm text-gray-500">
                                สาขานี้ยังไม่มีการตั้งค่าประเภทโต๊ะ
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })
            ) : (
              <div className="mt-6 rounded-2xl bg-white p-8 text-center text-gray-500 ring-1 ring-gray-100">
                ไม่พบแบรนด์/สาขา
              </div>
            )}
          </>
        )}

        {/* Modal เลือกเวลา */}
        {pick && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
              <div className="mb-3">
                <h3 className="text-base font-semibold text-gray-900">เลือกเวลา</h3>
                <p className="mt-1 text-sm text-gray-600">
                  วันที่: <b>{date}</b> • สาขา: <b>{pick.branch.name}</b> • โต๊ะ: <b>{pick.type.name}</b>
                </p>
              </div>

              <div className="mt-2">
                <label className="mb-1 block text-xs text-gray-500">เวลา (ชั่วโมง:นาที)</label>
                <input
                  type="time"
                  className="w-full rounded-lg border px-3 py-2"
                  value={pickTime}
                  onChange={(e) => setPickTime(e.target.value)}
                />
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setPick(null)}
                  className="rounded-md border px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={confirmBook}
                  disabled={booking || !pickTime}
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {booking ? "กำลังจอง..." : "ยืนยันการจอง"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
