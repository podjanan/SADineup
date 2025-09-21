import { Navigate, useLocation } from "react-router-dom";

export default function EmployeeRoute({ children }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const location = useLocation();

  if (!token) return <Navigate to="/login" replace state={{ from: location }} />;
  if (user?.role !== "employee") return <Navigate to="/dashboard" replace />;
  return children;
}
