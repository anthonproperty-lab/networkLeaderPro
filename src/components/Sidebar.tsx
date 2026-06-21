import React from 'react';
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Box, Typography } from '@mui/material';
import { 
  Dashboard, People, Label, Schedule, Message, 
  Campaign, AccountCircle, Notifications, HelpCenter, SupervisorAccount
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
  drawerWidth: number;
}

// 🔐 SINKRONISASI ARRAY EMAIL ADMIN (Sama persis dengan yang ada di AdminDashboard.tsx)
const ADMIN_LIST = [
  "anthonproperty@gmail.com",    // Owner Utama (Super Admin)
  "afisq5@gmail.com",  // Staf Admin 1
];

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onClose, drawerWidth }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // 📋 Menu utama untuk seluruh tenant
  const menuItems = [
    { text: 'Dasbor Analitik', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Direktori Kontak', icon: <People />, path: '/kontak' },
    { text: 'Kelola Label / Tag', icon: <Label />, path: '/label' },
    { text: 'Jadwal Follow Up', icon: <Schedule />, path: '/follow-up' },
    { text: 'Template Pesan', icon: <Message />, path: '/template-pesan' },
    { text: 'Kampanye Broadcast', icon: <Campaign />, path: '/kampanye-broadcast' },
    { text: 'Notifikasi', icon: <Notifications />, path: '/notifications' },
    { text: 'Pusat Bantuan (FAQ)', icon: <HelpCenter />, path: '/bantuan' },
    { text: 'Profil Akun', icon: <AccountCircle />, path: '/profil' },
  ];

  // 🔑 SUNTIKAN BERBASIS ARRAY EMAIL: Validasi admin
  const userEmail = user?.email?.toLowerCase() || '';
  if (userEmail && ADMIN_LIST.includes(userEmail)) {
    menuItems.push({
      text: 'Admin Panel Control',
      icon: <SupervisorAccount sx={{ color: '#e74c3c' }} />,
      path: '/admin-panel',
    });
  }

  // 🛠️ PERBAIKAN TOTAL: Pastikan Logo & Judul berada di ATAS List Menu, bukan di luarnya.
  const drawerContent = (
    <Box>
      {/* 1. Bagian Logo & Judul (Sekarang tampil di HP & Desktop) */}
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5, 
          px: 3, 
          py: 2.5, 
          cursor: 'pointer',
          borderBottom: '1px solid', // Beri garis pembatas agar rapi
          borderColor: 'divider',
          mb: 1
        }} 
        onClick={() => {
          navigate('/dashboard');
          onClose(); // Tutup sidebar setelah diklik di HP
        }} 
      >
        <Box 
          component="img" 
          src="/logo.png" 
          alt="Logo Aplikasi" 
          sx={{ height: 35, width: 'auto', objectFit: 'contain' }} 
          onError={() => { console.error('Logo gagal dimuat!'); }} 
        />
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0984e3', fontSize: '1.1rem' }}>
          Forward CRM
        </Typography>
      </Box>

      {/* 2. Daftar Menu */}
      <List sx={{ px: 1 }}>
        {menuItems.map((item) => {
          const active = location.pathname.startsWith(item.path);
          return (
            <ListItemButton
              key={item.text}
              onClick={() => {
                navigate(item.path);
                onClose(); // Tutup sidebar setelah menu diklik di HP
              }}
              sx={{
                my: 0.5,
                borderRadius: 2,
                bgcolor: active ? 'rgba(9, 132, 227, 0.15)' : 'transparent',
                color: active ? '#0984e3' : 'inherit',
                '&:hover': { bgcolor: 'rgba(9, 132, 227, 0.08)' },
              }}
            >
              <ListItemIcon sx={{ color: active ? '#0984e3' : 'inherit', minWidth: 35 }}>
                {React.cloneElement(item.icon, { fontSize: 'small' })}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: active ? 600 : 500 }} 
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
      {/* Drawer untuk HP (Temporary) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }} // Bagus untuk performa mobile
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth, 
            backgroundImage: 'none' 
          },
        }}
      >
        {drawerContent} {/* 🛠️ Logo & Judul kini ikut dipanggil di sini */}
      </Drawer>

      {/* Drawer untuk Desktop (Permanent) */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth, 
            borderRight: '1px solid', 
            borderColor: 'divider', 
            backgroundImage: 'none' 
          },
        }}
        open
      >
        {drawerContent} {/* 🛠️ Logo & Judul ikut dipanggil di sini */}
      </Drawer>
    </Box>
  );
};

export default Sidebar;


