import { useNavigate } from "react-router-dom";
import AdminHeader from "../components/AdminHeader";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const Card = ({ title, desc, actionLabel, onClick, color = "bg-slate-900 hover:bg-slate-800" }) => (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      <p className="mt-2 text-sm text-gray-500">{desc}</p>
      <button
        className={`mt-3 rounded-md ${color} px-4 py-2 text-sm font-medium text-white`}
        onClick={onClick}
      >
        {actionLabel}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <AdminHeader title="Admin Dashboard" showBack={false} />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          title="จัดการผู้ใช้"
          desc="แก้ไขสิทธิ์การเข้าถึงของผู้ใช้"
          actionLabel="View Users"
          onClick={() => navigate("/admin/users")}
          color="bg-blue-600 hover:bg-blue-700"
        />
        <Card
          title="จัดการสาขา"
          desc="เพิ่ม ลบ หรือแก้ไขข้อมูลสาขา"
          actionLabel="Manage Branches"
          onClick={() => navigate("/admin/branches")}
          color="bg-green-600 hover:bg-green-700"
        />
        <Card
          title="จัดการแบรนด์"
          desc="เพิ่ม ลบ หรือแก้ไขแบรนด์ร้านอาหาร"
          actionLabel="Manage Brands"
          onClick={() => navigate("/admin/brands")}
          color="bg-orange-600 hover:bg-orange-700"
        />
        <Card
          title="ประเภทโต๊ะ"
          desc="กำหนดความจุขั้นต่ำ/สูงสุด และขั้นต่ำต่อโต๊ะ"
          actionLabel="Manage Table Types"
          onClick={() => navigate("/admin/table-types")}
          color="bg-indigo-600 hover:bg-indigo-700"
        />
        <Card
          title="จัดการจำนวนโต๊ะในสาขา"
          desc="กำหนดจำนวนโต๊ะของแต่ละประเภทในแต่ละสาขา"
          actionLabel="Manage Branch Table Types"
          onClick={() => navigate("/admin/branch-table-types")}
          color="bg-teal-600 hover:bg-teal-700"
        />

        {/* เพิ่มการ์ดจัดการคิว */}
        <Card
          title="จัดการคิว"
          desc="ดูคิวทั้งหมด และล้างคิวที่ยกเลิก/เสร็จสิ้นออกจากตาราง"
          actionLabel="Manage Queue"
          onClick={() => navigate("/admin/queue")}
          color="bg-rose-600 hover:bg-rose-700"
        />
        <Card
          title="จัดการพนักงาน"
          desc="กำหนดพนักงานประจำร้านและสาขา"
          actionLabel="Manage Employees"
          onClick={() => navigate("/admin/employees")}
          color="bg-yellow-600 hover:bg-yellow-700"
        />
      </div>
    </div>
  );
}
