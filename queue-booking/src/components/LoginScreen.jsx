import React, { useState } from "react";
import { Eye, EyeOff, ArrowRight } from "lucide-react";

/**
 * LoginScreen – เหมือนภาพตัวอย่าง
 * props:
 *  - onSubmit?: ({ login, password }) => Promise<void> | void
 *  - forgotHref?: string
 *  - createHref?: string
 *  - title?: string
 */
export default function LoginScreen({
  onSubmit,
  forgotHref = "#",
  createHref = "/Register",
  title = "Login",
}) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!login || !password) {
      setError("Please enter your login and password.");
      return;
    }
    try {
      setLoading(true);
      await onSubmit?.({ login, password });
    } catch (err) {
      setError(err?.message || "Unable to login. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto w-full max-w-5xl px-5 pt-4">
        {/* Title (ซ้ายบน) */}
        <h1 className="text-3xl font-extrabold text-[#13274A]">Login</h1>

        <form onSubmit={handleSubmit} className="mt-4 max-w-4xl">
          {/* Login */}
          <label htmlFor="login" className="sr-only">Login</label>
          <input
            id="login"
            type="text"
            placeholder="Login"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0F1F44]/80"
          />

          {/* Password + eye */}
          <div className="relative mt-3">
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              type={showPwd ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 pr-12 text-sm placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0F1F44]/80"
            />
            <button
              type="button"
              aria-label={showPwd ? "Hide password" : "Show password"}
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0F1F44]/60"
            >
              {showPwd ? (
                <EyeOff className="h-4 w-4 text-slate-600" />
              ) : (
                <Eye className="h-4 w-4 text-slate-600" />
              )}
            </button>
          </div>

          {/* Submit (แถบสีน้ำเงินเต็มความกว้าง) */}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-[#0F1F44] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d1a39] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Processing..." : "Login"}
            <ArrowRight className="h-4 w-4" />
          </button>

          {/* Error */}
          {error && (
            <p className="mt-3 text-sm text-rose-600" role="alert">
              {error}
            </p>
          )}

          {/* Links (ตัวเล็ก กลางหน้า) */}
          <div className="mt-4 text-center text-xs text-slate-500">
            <p>
              Forgot password{" "}
              <a href={forgotHref} className="font-semibold text-slate-900 hover:underline">
                Get new
              </a>
            </p>
            <p className="mt-1">
              Do you have an account?{" "}
              <a href={createHref} className="font-semibold text-slate-900 hover:underline">
                Create new
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
