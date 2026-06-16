import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { TagsManagement } from './pages/TagsManagement';

// State Store & Route Guard
import { useAuthStore } from './stores/authStore';
import { GuardedRoute } from './components/GuardedRoute';

// Layouts
import { DashboardLayout } from './layouts/DashboardLayout';

// Pages
import Splash from './pages/Splash';
import Login from './pages/Login';
import Register from './pages/Register';
import LupaPassword from './pages/LupaPassword';
import Dashboard from './pages/Dashboard';
import KontakDirektori from './pages/KontakDirektori';
import KontakForm from './pages/KontakForm';
import FollowUp from './pages/FollowUp';
import TemplatePesan from './pages/TemplatePesan';
import KampanyeBroadcast from './pages/KampanyeBroadcast';
import Profil from './pages/Profil';

export default function App() {
  const { checkUser, initialized } = useAuthStore();
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Sinkronisasi status autentikasi pengguna saat aplikasi pertama kali dimuat
  useEffect(() => {
    checkUser();
  }, [checkUser]);

  // Konfigurasi Kustom Tema Material Design 3 (SaaS Elegan)
  const theme = useMemo(() => 
    createTheme({
      palette: {
        mode: darkMode ? 'dark' : 'light',
        primary: {
          main: '#0984e3', // Biru SaaS Profesional
        },
        secondary: {
          main: '#00b894', // Hijau Aksen/Tag
        },
        background: {
          default: darkMode ? '#101318' : '#f5f6fa',
          paper: darkMode ? '#181c23' : '#ffffff',
        },
        text: {
          primary: darkMode ? '#ecf0f1' : '#2d3436',
          secondary: darkMode ? '#7f8c8d' : '#636e72',
        },
      },
      shape: {
        borderRadius: 10,
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              fontWeight: 600,
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              border: darkMode ? '1px solid #1f252f' : '1px solid #e2e8f0',
            },
          },
        },
      },
    }), 
    [darkMode]
  );

  // Tampilkan layar Splash screen interaktif jika status auth sedang dimuat
  if (!initialized) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Splash />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastContainer theme={darkMode ? 'dark' : 'light'} position="top-right" autoClose={4000} />
      
      <BrowserRouter>
        <Routes>
          {/* ================= PUBLIC ROUTES ================= */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/lupa-password" element={<LupaPassword />} />

          {/* ================= PROTECTED MULTI-TENANT ROUTES ================= */}
          <Route element={<GuardedRoute />}>
            <Route element={<DashboardLayout toggleTheme={() => setDarkMode(!darkMode)} darkMode={darkMode} />}>
              {/* Dasbor Ringkasan */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/label" element={<TagsManagement />} />
              {/* Manajemen Kontak (CRUD) */}
              <Route path="/kontak" element={<KontakDirektori />} />
              <Route path="/kontak/tambah" element={<KontakForm mode="create" />} />
              <Route path="/kontak/edit/:id" element={<KontakForm mode="edit" />} />
              
              {/* Aktivitas CRM */}
              <Route path="/follow-up" element={<FollowUp />} />
              <Route path="/template-pesan" element={<TemplatePesan />} />
              <Route path="/kampanye-broadcast" element={<KampanyeBroadcast />} />
              
              {/* Pengaturan Akun & Profil Tenant */}
              <Route path="/profil" element={<Profil />} />
            </Route>
          </Route>

          {/* Fallback Navigasi Otomatis */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
