// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/login.jsx";
import RegisterPage from "./pages/Register.jsx";
import ProtectedRoute from "./components/ProtectedRoute";
import EmployeeRoute from "./components/EmployeeRoute";

import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminBranches from "./pages/AdminBranches";
import AdminBrands from "./pages/AdminBrands";
import AdminTableTypes from "./pages/AdminTableTypes";
import AdminBranchTableTypes from "./pages/AdminBranchTableTypes";
import BookTable from "./pages/BookTable";
import MyBookings from "./pages/MyBookings";
import AdminQueue from "./pages/AdminQueue";
import AdminEmployees from "./pages/AdminEmployees";
import Profile from "./pages/Profile";
import EmployeeQueue from "./pages/EmployeeQueue";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* หน้า Login & Register */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* หน้าโปรไฟล์ */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Employee Queue */}
        <Route
          path="/employee/queue"
          element={
            <EmployeeRoute>
              <EmployeeQueue />
            </EmployeeRoute>
          }
        />

        {/* My Bookings */}
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          }
        />

        {/* Book Table (หน้าแรกหลัง login) */}
        <Route
          path="/book"
          element={
            <ProtectedRoute>
              <BookTable />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin/employees"
          element={
            <ProtectedRoute role="admin">
              <AdminEmployees />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/queue"
          element={
            <ProtectedRoute role="admin">
              <AdminQueue />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/branch-table-types"
          element={
            <ProtectedRoute role="admin">
              <AdminBranchTableTypes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/table-types"
          element={
            <ProtectedRoute role="admin">
              <AdminTableTypes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/brands"
          element={
            <ProtectedRoute role="admin">
              <AdminBrands />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/branches"
          element={
            <ProtectedRoute role="admin">
              <AdminBranches />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute role="admin">
              <AdminUsers />
            </ProtectedRoute>
          }
        />

        {/* Default: ถ้าพิมพ์ path อื่น ให้เด้งไป /book */}
        <Route path="*" element={<Navigate to="/book" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
