import React from 'react';
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Box } from '@mui/material';
import { Dashboard, People, Schedule, Message, Campaign, AccountCircle } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

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
    { text: 'Jadwal Follow Up', icon: <Schedule />, path: '/follow-up' },
    { text: 'Template Pesan', icon: <Message />, path: '/template-pesan' },
    { text: 'Kampanye Broadcast', icon: <Campaign />, path: '/kampanye-broadcast' },
    { text: 'Profil Akun', icon: <AccountCircle />, path: '/profil' },
  ];

  const drawerContent = (
    <Box sx={{ overflow: 'auto', mt: 2 }}>
      <List>
        {menuItems.map((item) => {
          const active = location.pathname.startsWith(item.path);
          return (
            <ListItemButton key={item.text} onClick={() => { navigate(item.path); onClose(); }} sx={{ mx: 1.5, my: 0.5, borderRadius: 2, bgcolor: active ? 'rgba(9, 132, 227, 0.15)' : 'transparent', color: active ? '#0984e3' : 'inherit', '&:hover': { bgcolor: 'rgba(9, 132, 227, 0.08)' } }}>
              <ListItemIcon sx={{ color: active ? '#0984e3' : 'inherit', minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: active ? 600 : 500 }} />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
      {/* Drawer untuk Tampilan Mobile */}
      <Drawer variant="temporary" open={mobileOpen} onClose={onClose} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, backgroundImage: 'none' } }}>
        <Toolbar />
        {drawerContent}
      </Drawer>
      {/* Drawer untuk Tampilan Desktop */}
      <Drawer variant="permanent" sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid', borderColor: 'divider', backgroundImage: 'none' } }} open>
        <Toolbar />
        {drawerContent}
      </Drawer>
    </Box>
  );
};
