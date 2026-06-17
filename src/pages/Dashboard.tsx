import React, { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import { People, NotificationImportant, Campaign, Schedule } from '@mui/icons-material';
import { supabase } from '../services/supabaseClient';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({ kontak: 0, followup: 0, kampanye: 0, notif: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const [kontakCount, followupCount, kampanyeCount, notifCount] = await Promise.all([
        supabase.from('contacts').select('*', { count: 'exact', head: true }),
        supabase.from('followups').select('*', { count: 'exact', head: true }).eq('status', 'Belum Selesai'),
        supabase.from('campaigns').select('*', { count: 'exact', head: true }),
        supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('is_read', false)
      ]);

      setStats({
        kontak: kontakCount.count || 0,
        followup: followupCount.count || 0,
        kampanye: kampanyeCount.count || 0,
        notif: notifCount.count || 0,
      });
      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  const cards = [
    { title: 'Total Kontak', val: stats.kontak, icon: <People fontSize="large" color="primary" /> },
    { title: 'Follow Up Hari Ini', val: stats.followup, icon: <Schedule fontSize="large" color="warning" /> },
    { title: 'Total Kampanye', val: stats.kampanye, icon: <Campaign fontSize="large" color="success" /> },
    { title: 'Notifikasi Baru', val: stats.notif, icon: <NotificationImportant fontSize="large" color="error" /> },
  ];

  return (
    <Box p={3}>
      {/* ✅ PERBAIKAN 1: Menggunakan 'text.primary' agar otomatis hitam di mode terang, putih di mode gelap */}
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
        Dasbor Ringkasan Analitik
      </Typography>
      
      <Grid container spacing={3} mt={1}>
        {cards.map((card, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            {/* ✅ PERBAIKAN 2: Menggunakan background 'background.paper' agar warna box ikut berubah sesuai tema */}
            <Card sx={{ 
              backgroundColor: 'background.paper', 
              backgroundImage: 'none', // Menghilangkan overlay default MUI pada dark mode
              border: '1px solid',
              borderColor: 'divider', // Border adaptif mengikuti tema
              borderRadius: '12px' 
            }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    {/* ✅ PERBAIKAN 3: Menggunakan 'text.secondary' agar warna label lebih soft secara dinamis */}
                    <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {card.title}
                    </Typography>
                    {/* ✅ PERBAIKAN 4: Mengubah warna angka menjadi 'text.primary' (bukan #fff statis) */}
                    <Typography variant="h3" sx={{ fontWeight: 'bold', mt: 1, color: 'text.primary' }}>
                      {card.val}
                    </Typography>
                  </Box>
                  {card.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard;
