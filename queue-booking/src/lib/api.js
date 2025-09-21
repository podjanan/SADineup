// src/lib/api.js
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

if (!BASE_URL) {
  // ช่วยบอกชัด ๆ ถ้าไม่ตั้งค่า
  // eslint-disable-next-line no-console
  console.warn("[api] VITE_API_URL is not set. Requests may go to the wrong origin.");
}

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ===== Helpers =====
export function setToken(token) {
  if (token) {
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("token");
  }
}
export function setUser(user) {
  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  } else {
    localStorage.removeItem("user");
  }
}
export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

// ===== Request interceptor: แนบ Bearer =====
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // DEV log: ดูปลายทางและ header ช่วยดีบัก
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log("[api] ->", config.method?.toUpperCase(), config.baseURL + config.url, {
      Authorization: config.headers.Authorization ? "Bearer ..." : "none",
    });
  }
  return config;
});

// ===== Response interceptor: จัดการ 401 อย่างระวัง =====
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const url = err?.config?.url || "";

    // อย่าเด้ง logout เมื่อ 401 มาจาก endpoint auth เอง
    const isAuthEndpoint =
      url.startsWith("/api/auth/login") ||
      url.startsWith("/api/auth/refresh") ||
      url.startsWith("/api/auth/whoami");

    if (status === 401 && !isAuthEndpoint) {
      // ตัวเลือก A: แจ้งเตือนแล้วพาไป login แบบนุ่มนวล
      clearAuth();
      if (location.pathname !== "/login") {
        // eslint-disable-next-line no-alert
        // alert("Session หมดอายุ กรุณาเข้าสู่ระบบใหม่");
        location.href = "/login";
      }
    }

    // DEV log: เห็น error เต็ม ๆ
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn("[api] ERROR", status, url, err?.response?.data || err?.message);
    }

    return Promise.reject(err);
  }
);
