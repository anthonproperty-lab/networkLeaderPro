import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Card, CardContent, Grid, Chip } from '@mui/material';
import { Schedule, CheckCircleOutline } from '@mui/icons-material';
import { supabase } from '../services/supabaseClient';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { toast } from 'react-toastify';

export const FollowUp: React.FC = () => {
  const [followups, setFollowups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFollowUps = async () => {
    setLoading(true);
    const { data } = await supabase.from('followups').select('*, contacts(nama_lengkap, nomor_whatsapp)').order('tanggal_followup', { ascending: true });
    if (data) setFollowups(data);
    setLoading(false);
  };

  useEffect(() => { fetchFollowUps(); }, []);

  const tandaiSelesai = async (id: string) => {
    const { error } = await supabase.from('followups').update({ status: 'Selesai' }).eq('id', id);
    if (!error) { toast.success('Tugas follow-up diselesaikan!'); fetchFollowUps(); }
  };

  if (loading) return <LoadingState />;

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>Agenda & Pelacakan Follow Up</Typography>
      {followups.length === 0 ? (
        <EmptyState judul="Jadwal Follow Up Kosong" deskripsi="Belum ada agenda follow-up prospek yang direncanakan hari ini." />
      ) : (
        <Grid container spacing={2}>
          {followups.map((item) => (
            <Grid item xs={12} sm={6} key={item.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{item.judul}</Typography>
                    <Chip label={item.status} color={item.status === 'Selesai' ? 'success' : 'warning'} size="small" />
                  </Box>
                  <Typography variant="body2" color="primary" sx={{ mt: 1, fontWeight: 500 }}>Target: {item.contacts?.nama_lengkap}</Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>{item.catatan || 'Tidak ada catatan khusus.'}</Typography>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} pt={2} sx={{ borderTop: '1px solid divider' }}>
                    <Box display="flex" alignItems="center" gap={0.5} color="text.secondary"><Schedule fontSize="small" /> <Typography variant="caption">{new Date(item.tanggal_followup).toLocaleString('id-ID')}</Typography></Box>
                    {item.status === 'Belum Selesai' && (
                      <Button size="small" variant="contained" color="success" startIcon={<CheckCircleOutline />} onClick={() => tandaiSelesai(item.id)}>Selesai</Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};
export default FollowUp;
