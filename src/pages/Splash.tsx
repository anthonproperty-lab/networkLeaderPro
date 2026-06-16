import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

export const Splash: React.FC = () => (
  <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#101318" color="#fff">
    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2, letterSpacing: 1, color: '#0984e3' }}>NETWORK LEAD PRO</Typography>
    <CircularProgress size={30} sx={{ color: '#00b894', mb: 2 }} />
    <Typography variant="caption" color="textSecondary" sx={{ color: '#7f8c8d' }}>SaaS CRM Multi-Tenant v1.0.0</Typography>
  </Box>
);
export default Splash;
