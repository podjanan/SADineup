import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Check, X, Pencil } from "lucide-react";

const ROLES = ["customer", "employee", "admin"];

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [draftRole, setDraftRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const me = useMemo(() => JSON.parse(localStorage.getItem("user") || "null"), []);

  useEffect(() => {
    // กันหน้า: ต้องเป็น admin เท่านั้น
    if (!me) return navigate("/login");
    if (me.role !== "admin") return navigate("/dashboard");

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/api/admin/users");
        setUsers(data.users || []);
      } catch (err) {
        setMsg({ type: "error", text: err?.response?.data?.message || "โหลดรายชื่อผู้ใช้ไม่สำเร็จ" });
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [navigate, me]);

  const startEdit = (u) => {
    setEditingId(u.user_id);
    setDraftRole(u.role);
    setMsg({ type: "", text: "" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftRole("");
  };

  const saveRole = async (u) => {
    if (!draftRole) return;
    try {
      await api.patch(`/api/admin/users/${u.user_id}/role`, { role: draftRole });
      setUsers((arr) =>
        arr.map((it) => (it.user_id === u.user_id ? { ...it, role: draftRole } : it))
      );
      setMsg({ type: "success", text: `อัปเดต role ของ ${u.username} เป็น ${draftRole} แล้ว` });
      cancelEdit();
    } catch (err) {
      setMsg({ type: "error", text: err?.response?.data?.message || "อัปเดต role ไม่สำเร็จ" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg font-medium">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">จัดการผู้ใช้</h1>
        <button
          onClick={() => navigate("/admin")}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          กลับหน้า Admin
        </button>
      </header>

      {msg.text && (
        <div
          className={`mb-4 rounded-md border px-4 py-3 text-sm ${
            msg.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-gray-600">
              <th className="px-4 py-3 font-semibold">#</th>
              <th className="px-4 py-3 font-semibold">Username</th>
              <th className="px-4 py-3 font-semibold">ชื่อ</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u, i) => (
              <tr key={u.user_id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{i + 1}</td>
                <td className="px-4 py-3 font-mono">{u.username}</td>
                <td className="px-4 py-3">{u.name || "-"}</td>
                <td className="px-4 py-3">
                  {editingId === u.user_id ? (
                    <select
                      className="rounded border border-gray-300 px-2 py-1"
                      value={draftRole}
                      onChange={(e) => setDraftRole(e.target.value)}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        u.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : u.role === "employee"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {u.role}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === u.user_id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveRole(u)}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                      >
                        <Check className="h-4 w-4" />
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(u)}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan={5}>
                  ไม่พบผู้ใช้
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
