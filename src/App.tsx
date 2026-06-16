import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { Register } from './pages/Register';
import { KontakForm } from './pages/KontakForm';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function App() {
  const { checkUser, loading } = useAuthStore();

  useEffect(() => {
    checkUser();
  }, []);

  if (loading) return <div style={{ color: '#fff', background: '#101318', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Memuat Aplikasi...</div>;

  return (
    <BrowserRouter>
      <ToastContainer theme="dark" />
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/kontak/tambah" element={<KontakForm />} />
        <Route path="*" element={<Navigate to="/register" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
