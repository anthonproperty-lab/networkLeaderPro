import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Box, Menu, MenuItem, Avatar } from '@mui/material';
import { Menu as MenuIcon, LightMode, DarkMode, AccountCircle, ExitToApp } from '@mui/icons-material';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';

interface TopbarProps {
  onSidebarToggle: () => void;
  toggleTheme: () => void;
  darkMode: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({ onSidebarToggle, toggleTheme, darkMode }) => {
  const signOut = useAuthStore((state) => state.signOut);
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, background: darkMode ? '#181c23' : '#fff', color: darkMode ? '#fff' : '#000', boxShadow: 'none', borderBottom: darkMode ? '1px solid #1f252f' : '1px solid #e2e8f0' }}>
      <Toolbar>
        <IconButton edge="start" color="inherit" onClick={onSidebarToggle} sx={{ mr: 2, display: { md: 'none' } }}><MenuIcon /></IconButton>
        <Typography variant="h6" noWrap sx={{ fontWeight: 'bold', letterSpacing: 0.5, color: '#0984e3' }}>NETWORK LEADER PRO</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton color="inherit" onClick={toggleTheme} sx={{ mr: 1 }}>{darkMode ? <LightMode /> : <DarkMode />}</IconButton>
        <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}><Avatar sx={{ width: 32, height: 32, bgcolor: '#0984e3' }} /></IconButton>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} keepMounted>
          <MenuItem onClick={() => { setAnchorEl(null); navigate('/profil'); }}><AccountCircle sx={{ mr: 1 }} /> Profil Saya</MenuItem>
          <MenuItem onClick={() => { setAnchorEl(null); signOut(); }} sx={{ color: 'error.main' }}><ExitToApp sx={{ mr: 1 }} /> Keluar Keluar</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};
