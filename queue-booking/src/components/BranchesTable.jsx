// src/components/BranchesTable.jsx
export default function BranchesTable({ branches, onDelete, canManage = true }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100 text-gray-700">
            <th className="border p-2 text-left">ID</th>
            <th className="border p-2 text-left">ชื่อสาขา</th>
            <th className="border p-2 text-left">แบรนด์</th>
            <th className="border p-2 text-left">ที่อยู่</th>
            <th className="border p-2 text-left">เบอร์โทร</th>
            <th className="border p-2 text-left">วันที่สร้าง</th>
            {canManage && <th className="border p-2 text-left">จัดการ</th>}
          </tr>
        </thead>
        <tbody>
          {branches.map((b) => (
            <tr key={b.branch_id} className="hover:bg-gray-50">
              <td className="border p-2">{b.branch_id}</td>
              <td className="border p-2">{b.name}</td>
              <td className="border p-2">{b.brand_name || "-"}</td>
              <td className="border p-2">{b.address || "-"}</td>
              <td className="border p-2">{b.phone || "-"}</td>
              <td className="border p-2">
                {b.created_at ? new Date(b.created_at).toLocaleString("th-TH") : "-"}
              </td>
              {canManage && (
                <td className="border p-2">
                  <button
                    onClick={() => onDelete?.(b)}
                    className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700"
                  >
                    ลบ
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
