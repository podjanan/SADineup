import { useState } from "react";
import { Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import logo from "../assets/logo.png"; // โลโก้

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    // JS Validation
    if (
      !form.name.trim() ||
      !form.username.trim() ||
      !form.email.trim() ||
      !form.password.trim() ||
      !form.confirmPassword.trim() ||
      !form.phone.trim()
    ) {
      return setMsg({ type: "error", text: "กรุณากรอกข้อมูลให้ครบทุกช่อง" });
    }

    if (form.password !== form.confirmPassword) {
      return setMsg({ type: "error", text: "รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน" });
    }

    try {
      setLoading(true);
      await api.post("/api/auth/register", {
        name: form.name,
        username: form.username,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        phone: form.phone,
      });

      setMsg({ type: "success", text: "สมัครสมาชิกสำเร็จ! กำลังพาไปหน้า Login..." });
      setTimeout(() => navigate("/login"), 800);
    } catch (err) {
      const text = err?.response?.data?.message || "สมัครไม่สำเร็จ กรุณาลองใหม่";
      setMsg({ type: "error", text });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto w-full max-w-5xl px-5 pt-4">
        
        {/* Logo + Back Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Logo" className="h-12 w-auto object-contain" />
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-900 focus:outline-none"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        <h1 className="mt-3 text-3xl font-extrabold text-[#13274A]">Register</h1>

        {/* Form */}
        <form onSubmit={onSubmit} className="mt-3 max-w-4xl">
          {/* Name */}
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder="Name"
            required
            className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0F1F44]/80"
          />

          {/* Username */}
          <input
            name="username"
            value={form.username}
            onChange={onChange}
            placeholder="Username"
            required
            className="mt-3 w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0F1F44]/80"
          />

          {/* Email */}
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            placeholder="Email"
            required
            className="mt-3 w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0F1F44]/80"
          />

          {/* Password */}
          <div className="relative mt-3">
            <input
              name="password"
              type={showPwd ? "text" : "password"}
              value={form.password}
              onChange={onChange}
              placeholder="Password"
              required
              className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 pr-12 text-sm placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0F1F44]/80"
            />
            <button
              type="button"
              onClick={() => setShowPwd((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0F1F44]/60"
              aria-label={showPwd ? "Hide password" : "Show password"}
            >
              {showPwd ? <EyeOff className="h-4 w-4 text-slate-600" /> : <Eye className="h-4 w-4 text-slate-600" />}
            </button>
          </div>

          {/* Confirm Password */}
          <input
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={onChange}
            placeholder="Confirm password"
            required
            className="mt-3 w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0F1F44]/80"
          />

          {/* Phone */}
          <input
            name="phone"
            value={form.phone}
            onChange={onChange}
            placeholder="Phone"
            required
            className="mt-3 w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0F1F44]/80"
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="mx-auto mt-8 flex w-72 items-center justify-center gap-2 rounded-md bg-[#0F1F44] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d1a39] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Processing..." : "Confirm"}
            <ArrowRight className="h-4 w-4" />
          </button>

          {/* Error or Success Message */}
          {msg.text && (
            <p
              className={`mt-3 text-sm ${msg.type === "error" ? "text-rose-600" : "text-emerald-600"}`}
              role="alert"
            >
              {msg.text}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
