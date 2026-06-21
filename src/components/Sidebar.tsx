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

  // 🔑 SUNTIKAN BERBASIS ARRAY EMAIL: Validasi apakah email user terdaftar sebagai admin
  const userEmail = user?.email?.toLowerCase() || '';
  if (userEmail && ADMIN_LIST.includes(userEmail)) {
    menuItems.push({ 
      text: 'Admin Panel Control', 
      icon: <SupervisorAccount sx={{ color: '#e74c3c' }} />, 
      path: '/admin-panel' 
    });
  }

 const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 🛠️ SINKRONISASI DESKTOP: Jarak kosong setinggi Header/Topbar agar logo tidak tertutup di komputer */}
      <Box sx={{ display: { xs: 'none', md: 'block' }, minHeight: 64 }} />

      {/* 1. Bagian Logo & Judul (Aman di HP & Komputer, Tidak Akan Terpotong) */}
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5, 
          px: 3, 
          py: 2, 
          cursor: 'pointer',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }} 
        onClick={() => {
          navigate('/dashboard');
          onClose();
        }} 
      >
        <Box 
          component="img" 
          src="/logo.png" 
          alt="Logo Aplikasi" 
          sx={{ 
            height: 38,             // Tinggi logo yang pas dan proporsional
            width: 'auto', 
            objectFit: 'contain',
            bgcolor: 'white',        
            p: 0.5,                 
            borderRadius: '8px',
            boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' // Memberi sedikit bayangan agar elegan
          }} 
          onError={() => { console.error('Logo gagal dimuat, periksa lokasi file!'); }} 
        />
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0984e3', fontSize: '1.05rem' }}>
          Forward CRM
        </Typography>
      </Box>

      {/* 2. Daftar Menu dengan scroll mandiri jika menu terlalu panjang */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', pt: 1 }}>
        <List>
          {menuItems.map((item) => {
            const active = location.pathname.startsWith(item.path);
            return (
              <ListItemButton
                key={item.text}
                onClick={() => {
                  navigate(item.path);
                  onClose();
                }}
                sx={{
                  mx: 1.5,
                  my: 0.5,
                  borderRadius: 2,
                  bgcolor: active ? 'rgba(9, 132, 227, 0.15)' : 'transparent',
                  color: active ? '#0984e3' : 'inherit',
                  '&:hover': { bgcolor: 'rgba(9, 132, 227, 0.08)' }
                }}
              >
                <ListItemIcon sx={{ color: active ? '#0984e3' : 'inherit', minWidth: 40 }}>
                  {item.icon}
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
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
      <Drawer 
        variant="temporary" 
        open={mobileOpen} 
        onClose={onClose} 
        ModalProps={{ keepMounted: true }} 
        sx={{ 
          display: { xs: 'block', md: 'none' }, 
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, backgroundImage: 'none' } 
        }}
      >
        {drawerContent}
      </Drawer>
      
      <Drawer 
        variant="permanent" 
        sx={{ 
          display: { xs: 'none', md: 'block' }, 
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid', borderColor: 'divider', backgroundImage: 'none' } 
        }} 
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;


