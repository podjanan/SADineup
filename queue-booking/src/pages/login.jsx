// src/pages/Login.jsx
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api"; // axios instance
import LoginScreen from "../components/LoginScreen";

export default function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = async ({ login, password }) => {
    const { data } = await api.post('/api/auth/login', { identifier: login, password });
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token', data.token); // <-- เก็บ token
    navigate('/dashboard');
  };

  return <LoginScreen onSubmit={handleLogin} />;
}
