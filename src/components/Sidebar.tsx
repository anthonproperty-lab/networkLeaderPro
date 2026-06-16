import React from 'react';
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Box, Typography } from '@mui/material';
import { Dashboard, People, Label, Schedule, Message, Campaign, AccountCircle } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

// 1. IMPORT LOGO ANDA DI SINI
import LogoApp from 'src/assets/logo.png'; 

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
  drawerWidth: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onClose, drawerWidth }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { text: 'Dasbor Analitik', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Direktori Kontak', icon: <People />, path: '/kontak' },
    { text: 'Kelola Label / Tag', icon: <Label />, path: '/label' },
    { text: 'Jadwal Follow Up', icon: <Schedule />, path: '/follow-up' },
    { text: 'Template Pesan', icon: <Message />, path: '/template-pesan' },
    { text: 'Kampanye Broadcast', icon: <Campaign />, path: '/kampanye-broadcast' },
    { text: 'Profil Akun', icon: <AccountCircle />, path: '/profil' },
  ];

  const drawerContent = (
    <Box sx={{ overflow: 'auto' }}>
      {/* 2. TEMPATKAN LOGO DI SINI (DI ATAS LIST MENU) */}
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
        {/* Komponen Gambar Logo */}
        <Box 
          component="img" 
          src={LogoApp} 
          alt="Logo Aplikasi" 
          sx={{ height: 40, width: 'auto', objectFit: 'contain' }} 
        />
        {/* Nama Aplikasi di Samping Logo */}
        <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#0984e3' }}>
          SaaS Keren
        </Typography>
      </Box>

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
      {/* Drawer Mobile */}
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
        {/* Pada mobile, kita sembunyikan Toolbar kosongnya agar logo mepet ke atas */}
        {drawerContent}
      </Drawer>
      
      {/* Drawer Desktop */}
      <Drawer 
        variant="permanent" 
        sx={{ 
          display: { xs: 'none', md: 'block' }, 
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid', borderColor: 'divider', backgroundImage: 'none' } 
        }} 
        open
      >
        {/* Di desktop, Toolbar dikosongkan/dihapus agar logo menggantikan area putih di paling atas */}
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
