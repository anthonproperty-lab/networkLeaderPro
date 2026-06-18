import React from 'react';
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Box, Typography } from '@mui/material';
import { 
  Dashboard, People, Label, Schedule, Message, 
  Campaign, AccountCircle, Notifications, HelpCenter // 💡 TAMBAHAN: Import ikon baru di sini
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore'; // 💡 Pastikan store auth di-import di Sidebar.tsx
import { SupervisorAccount } from '@mui/icons-material'; // Import ikon admin

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
  drawerWidth: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onClose, drawerWidth }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  
  // 📋 Tambahan rute /notifications dan /bantuan ke dalam menuItems
  const menuItems = [
    { text: 'Dasbor Analitik', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Direktori Kontak', icon: <People />, path: '/kontak' },
    { text: 'Kelola Label / Tag', icon: <Label />, path: '/label' },
    { text: 'Jadwal Follow Up', icon: <Schedule />, path: '/follow-up' },
    { text: 'Template Pesan', icon: <Message />, path: '/template-pesan' },
    { text: 'Kampanye Broadcast', icon: <Campaign />, path: '/kampanye-broadcast' },
    { text: 'Notifikasi', icon: <Notifications />, path: '/notifications' }, // 🎯 TAMBAHAN BARU
    { text: 'Pusat Bantuan (FAQ)', icon: <HelpCenter />, path: '/bantuan' }, // 🎯 TAMBAHAN BARU
    { text: 'Profil Akun', icon: <AccountCircle />, path: '/profil' },
  ];
// 🔑 SUNTIKAN KHUSUS ADMIN: Jika email Anda yang login, tambahkan menu Admin Panel ke baris paling bawah
  if (user?.email === "admin_forwardcrm@gmail.com") {
    menuItems.push({ 
      text: 'Admin Panel Control', 
      icon: <SupervisorAccount sx={{ color: '#e74c3c' }} />, 
      path: '/admin-panel' 
    });
  }
  const drawerContent = (
    <Box sx={{ overflow: 'auto' }}>
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5, 
          px: 3, 
          py: 2.5, 
          cursor: 'pointer' 
        }}
        onClick={() => navigate('/dashboard')}
      >
       <Box 
  component="img" 
  src="/logo.png"
  alt="Logo Aplikasi" 
  sx={{ height: 40, width: 'auto', objectFit: 'contain' }} 
  onError={(e) => {
    console.error("Logo gagal dimuat, periksa lokasi file!");
  }}
/>

      <List>
        {menuItems.map((item) => {
          const active = location.pathname.startsWith(item.path);
          return (
            <ListItemButton 
              key={item.text} 
              onClick={() => { navigate(item.path); onClose(); }} 
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
                primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: active ? 600 : 500 }} 
              />
            </ListItemButton>
          );
        })}
      </List>
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
