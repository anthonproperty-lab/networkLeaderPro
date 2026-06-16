import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { InboxOutlined } from '@mui/icons-material';

interface EmptyStateProps {
  judul: string;
  deskripsi: string;
  tombolTeks?: string;
  onAksi?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ judul, deskripsi, tombolTeks, onAksi }) => (
  <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="40vh" p={4} textAlign="center">
    <InboxOutlined sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>{judul}</Typography>
    <Typography variant="body2" color="textSecondary" sx={{ maxW: 400, mb: 3 }}>{deskripsi}</Typography>
    {tombolTeks && onAksi && (
      <Button variant="contained" color="primary" onClick={onAksi}>{tombolTeks}</Button>
    )}
  </Box>
);
