import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';
import { Topbar } from '../components/Topbar';
import { Sidebar } from '../components/Sidebar';

const DRAWER_WIDTH = 260;

export const DashboardLayout: React.FC<{ toggleTheme: () => void; darkMode: boolean }> = ({ toggleTheme, darkMode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box display="flex" minHeight="100vh">
      <Topbar onSidebarToggle={() => setMobileOpen(!mobileOpen)} toggleTheme={toggleTheme} darkMode={darkMode} />
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} drawerWidth={DRAWER_WIDTH} />
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, minHeight: '100vh', bgcolor: 'background.default' }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};
