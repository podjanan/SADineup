import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import AdminHeader from "../components/AdminHeader";

export default function AdminEmployees() {
  // master data
  const [brands, setBrands] = useState([]);
  const [branches, setBranches] = useState([]);
  const [rows, setRows] = useState([]); // mapping ที่ backend ส่ง (user + branch/brand)

  // selects
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedUser, setSelectedUser] = useState("");

  // list พนักงาน (distinct)
  const [employees, setEmployees] = useState([]);

  // ui
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  // โหลดแบรนด์ + mapping + พนักงาน
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(""); setOk("");
      try {
        const [brandRes, empMapRes] = await Promise.all([
          api.get("/api/admin/brands"),
          api.get("/api/admin/employees"),
        ]);

        setBrands(brandRes.data.brands || []);
        const mapRows = empMapRes.data.employees || [];
        setRows(mapRows);

        // ทำ distinct รายชื่อพนักงานจาก mapping
        const byUserId = new Map();
        for (const r of mapRows) {
          if (!byUserId.has(r.user_id)) byUserId.set(r.user_id, {
            user_id: r.user_id,
            username: r.username,
            full_name: r.full_name,
            email: r.email,
            phone: r.phone,
            role: r.role,
          });
        }
        let uniqueFromMap = Array.from(byUserId.values());

        // fallback: ถ้าไม่มีใน mapping เลย ให้ลองดึงจาก /api/admin/users?role=employee
        if (uniqueFromMap.length === 0) {
          try {
            const { data } = await api.get("/api/admin/users", { params: { role: "employee" } });
            uniqueFromMap = (data.users || []).map(u => ({
              user_id: u.user_id,
              username: u.username,
              full_name: u.name || `${u.first_name || ""} ${u.last_name || ""}`.trim(),
              email: u.email,
              phone: u.phone,
              role: "employee",
            }));
          } catch {
            // เงียบไว้ ถ้า endpoint นี้ไม่มี
          }
        }

        setEmployees(uniqueFromMap);
      } catch (e) {
        setErr(e?.response?.data?.message || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // เมื่อเลือกแบรนด์ → โหลดสาขาของแบรนด์นั้น
  useEffect(() => {
    if (!selectedBrand) {
      setBranches([]);
      setSelectedBranch("");
      return;
    }
    (async () => {
      try {
        const { data } = await api.get("/api/admin/branches", {
          params: { brand_id: selectedBrand },
        });
        setBranches(data.branches || []);
        setSelectedBranch("");
      } catch (e) {
        setBranches([]);
      }
    })();
  }, [selectedBrand]);

  const filteredRows = useMemo(() => {
    if (!q) return rows;
    const k = q.toLowerCase();
    return rows.filter(r =>
      [r.full_name, r.username, r.email, r.phone, r.brand_name, r.branch_name]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(k))
    );
  }, [rows, q]);

  async function handleAssign() {
    setErr(""); setOk("");
    if (!selectedUser || !selectedBrand || !selectedBranch) {
      setErr("กรุณาเลือกพนักงาน, แบรนด์ และสาขาให้ครบ");
      return;
    }
    try {
      await api.post("/api/admin/employees", {
        user_id: Number(selectedUser),
        branch_id: Number(selectedBranch),
      });
      setOk("กำหนดพนักงานเข้าในสาขาสำเร็จ");
      setSelectedBranch("");
      // reload mapping
      const { data } = await api.get("/api/admin/employees");
      setRows(data.employees || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "ไม่สามารถกำหนดพนักงานได้");
    }
  }

  async function handleRemove(user_id, branch_id) {
    if (!window.confirm("ต้องการลบพนักงานออกจากสาขานี้หรือไม่?")) return;
    setErr(""); setOk("");
    try {
      await api.delete(`/api/admin/employees/${user_id}/${branch_id}`);
      setOk("ลบพนักงานออกจากสาขาสำเร็จ");
      // reload mapping
      const { data } = await api.get("/api/admin/employees");
      setRows(data.employees || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "ไม่สามารถลบพนักงานออกได้");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <AdminHeader title="จัดการพนักงาน" showBack />

      {err && <div className="mb-3 rounded bg-rose-50 p-3 text-rose-700">{err}</div>}
      {ok &&  <div className="mb-3 rounded bg-emerald-50 p-3 text-emerald-700">{ok}</div>}

      {/* Assign section */}
      <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <h2 className="mb-4 text-base font-semibold text-gray-900">เพิ่มพนักงานเข้าร้าน/สาขา</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* เลือกพนักงาน */}
          <div>
            <label className="mb-1 block text-xs text-gray-500">พนักงาน</label>
            <select
              className="w-full rounded-md border px-3 py-2"
              value={selectedUser}
              onChange={(e)=>setSelectedUser(e.target.value)}
            >
              <option value="">— เลือกพนักงาน —</option>
              {employees.map(u => (
                <option key={u.user_id} value={u.user_id}>
                  {u.full_name || u.username} ({u.username})
                </option>
              ))}
            </select>
          </div>

          {/* เลือกแบรนด์ */}
          <div>
            <label className="mb-1 block text-xs text-gray-500">แบรนด์</label>
            <select
              className="w-full rounded-md border px-3 py-2"
              value={selectedBrand}
              onChange={(e)=>setSelectedBrand(e.target.value)}
            >
              <option value="">— เลือกแบรนด์ —</option>
              {brands.map(b => (
                <option key={b.brand_id} value={b.brand_id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* เลือกสาขา (ของแบรนด์ที่เลือก) */}
          <div>
            <label className="mb-1 block text-xs text-gray-500">สาขา</label>
            <select
              className="w-full rounded-md border px-3 py-2"
              value={selectedBranch}
              onChange={(e)=>setSelectedBranch(e.target.value)}
              disabled={!selectedBrand}
            >
              <option value="">
                {selectedBrand ? "— เลือกสาขา —" : "เลือกแบรนด์ก่อน"}
              </option>
              {branches.map(br => (
                <option key={br.branch_id} value={br.branch_id}>
                  {br.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              onClick={handleAssign}
              disabled={!selectedUser || !selectedBrand || !selectedBranch}
            >
              เพิ่ม
            </button>
          </div>
        </div>
      </div>

      {/* filter/search */}
      <div className="mb-3 flex items-center gap-2">
        <input
          className="w-80 rounded-md border px-3 py-2 text-sm"
          placeholder="ค้นหา: ชื่อ/ผู้ใช้/อีเมล/แบรนด์/สาขา"
          value={q}
          onChange={(e)=>setQ(e.target.value)}
        />
        <button
          onClick={() => setQ("")}
          className="rounded-md border px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          ล้าง
        </button>
      </div>

      {/* table */}
      {loading ? (
        <div className="grid gap-3">
          {Array.from({length:6}).map((_,i)=>(
            <div key={i} className="h-20 animate-pulse rounded-xl bg-white shadow-sm ring-1 ring-gray-100" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left">พนักงาน</th>
                <th className="px-3 py-2 text-left">Username</th>
                <th className="px-3 py-2 text-left">ติดต่อ</th>
                <th className="px-3 py-2 text-left">แบรนด์</th>
                <th className="px-3 py-2 text-left">สาขา</th>
                <th className="px-3 py-2 text-left">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length ? filteredRows.map((r) => (
                <tr key={`${r.user_id}-${r.branch_id || "none"}-${r.brand_name || "none"}`} className="border-t">
                  <td className="px-3 py-2">{r.full_name || "-"}</td>
                  <td className="px-3 py-2">{r.username}</td>
                  <td className="px-3 py-2">
                    <div>{r.email || "-"}</div>
                    <div className="text-xs text-gray-500">{r.phone || "-"}</div>
                  </td>
                  <td className="px-3 py-2">{r.brand_name || "-"}</td>
                  <td className="px-3 py-2">{r.branch_name || "-"}</td>
                  <td className="px-3 py-2">
                    {r.branch_id ? (
                      <button
                        className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                        onClick={()=>handleRemove(r.user_id, r.branch_id)}
                      >
                        ลบออกจากสาขานี้
                      </button>
                    ) : (
                      <span className="text-xs text-gray-500">ยังไม่สังกัด</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-gray-500">
                    ไม่พบข้อมูล
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
