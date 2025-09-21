import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, role }) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');

  if (!user || !token) return <Navigate to="/login" replace />;

  if (role && user.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}