import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

export const LoadingState: React.FC<{ pesan?: string }> = ({ pesan = 'Sinkronisasi data sistem...' }) => (
  <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="50vh" gap={2}>
    <CircularProgress color="primary" />
    <Typography variant="body2" color="textSecondary">{pesan}</Typography>
  </Box>
);
