import { useNavigate, useLocation } from "react-router-dom";
import { Home, CalendarDays, User2, LogOut } from "lucide-react";
import logo from "../assets/logo.png";

export default function TopNavbar({ title, active }) {
  const navigate = useNavigate();
  const location = useLocation();

  // ดึง path ให้ถูกทั้ง BrowserRouter และ HashRouter
  const path = (() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const raw = hash?.startsWith("#/") ? hash.slice(1) : location.pathname;
    const clean = raw.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
    return clean;
  })();

  // map path -> active tab
  const autoActive =
    path.startsWith("/my-bookings") ? "bookings" :
    path.startsWith("/profile")     ? "me" :
    /* default */                     "home";

  // map path -> title
  const autoTitle =
    path.startsWith("/my-bookings") ? "MY BOOKINGS" :
    path.startsWith("/profile")     ? "MY PROFILE"  :
    path.startsWith("/book")        ? "BOOK A TABLE":
                                      "DINE UP";

  const currentActive = active ?? autoActive;
  const currentTitle  = title  ?? autoTitle;

  // ฟังก์ชัน Logout
  const handleLogout = () => {
    // ลบข้อมูล token/user ใน localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Redirect ไปหน้า login
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0F2544] text-white shadow">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-4 sm:px-6">
        {/* Left: Logo */}
        <div className="flex min-w-0 items-center gap-3">
          <img src={logo} alt="Logo" className="h-8 w-auto" />
        </div>

        {/* Center: Title */}
        <div className="mx-auto hidden min-w-0 flex-1 items-center justify-center sm:flex">
          <h1 className="truncate text-[15px] font-extrabold tracking-wide text-[#F2D39B]">
            {currentTitle}
          </h1>
        </div>

        {/* Right: Actions */}
        <nav className="ml-auto flex items-center gap-4 sm:gap-6">
          <NavBtn
            label="Home"
            icon={<Home size={20} />}
            active={currentActive === "home"}
            onClick={() => navigate("/book")}
          />
          <NavBtn
            label="Book"
            icon={<CalendarDays size={20} />}
            active={currentActive === "bookings"}
            onClick={() => navigate("/my-bookings")}
          />
          <NavBtn
            label="Me"
            icon={<User2 size={20} />}
            active={currentActive === "me"}
            onClick={() => navigate("/profile")}
          />

          {/* Logout ปุ่ม */}
          <NavBtn
            label="Logout"
            icon={<LogOut size={20} />}
            onClick={handleLogout}
            className="hover:bg-rose-600/90 hover:text-white"
          />
        </nav>
      </div>

      {/* mobile title row */}
      <div className="flex items-center justify-center bg-[#0F2544] py-2 sm:hidden">
        <span className="truncate px-3 text-[13px] font-bold tracking-wide text-[#F2D39B]">
          {currentTitle}
        </span>
      </div>
    </header>
  );
}

function NavBtn({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "group grid place-items-center rounded-md px-3 py-2 transition-all",
        active ? "bg-[#F2D39B]/90 text-[#0F2544]" : "text-white/90 hover:bg-white/10",
      ].join(" ")}
    >
      <div className="grid place-items-center">
        {icon}
        <span
          className={[
            "mt-1 text-[11px] leading-none font-medium",
            active ? "text-[#0F2544]" : "text-white/70 group-hover:text-white",
          ].join(" ")}
        >
          {label}
        </span>
      </div>
    </button>
  );
}
