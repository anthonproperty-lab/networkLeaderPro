import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Table, TableHead, TableRow, TableCell, TableBody, Chip } from '@mui/material';
import { supabase } from '../services/supabaseClient';

export const KampanyeBroadcast: React.FC = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    const fetchCampaigns = async () => {
      const { data } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false });
      if (data) setCampaigns(data);
    };
    fetchCampaigns();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Selesai': return 'success';
      case 'Berjalan': return 'info';
      case 'Draft': return 'default';
      default: return 'error';
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>Riwayat Kampanye Broadcast Massal</Typography>
      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Nama Kampanye</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold', align: 'center' }}>Target</TableCell>
              <TableCell sx={{ fontWeight: 'bold', align: 'center' }}>Sukses</TableCell>
              <TableCell sx={{ fontWeight: 'bold', align: 'center' }}>Gagal</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {campaigns.map((cp) => (
              <TableRow key={cp.id}>
                <TableCell sx={{ fontWeight: 500 }}>{cp.judul}</TableCell>
                <TableCell><Chip label={cp.status} size="small" color={getStatusColor(cp.status)} /></TableCell>
                <TableCell>{cp.jumlah_target}</TableCell>
                <TableCell sx={{ color: 'success.main' }}>{cp.jumlah_berhasil}</TableCell>
                <TableCell sx={{ color: 'error.main' }}>{cp.jumlah_gagal}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </Box>
  );
};
export default KampanyeBroadcast;
