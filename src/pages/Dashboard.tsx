import React, { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import { People, NotificationImportant, Campaign, Schedule } from '@mui/icons-material';
import { supabase } from '../services/supabaseClient';
import { useAuthStore } from '../stores/authStore'; // 💡 TAMBAHAN: Import auth store

export const Dashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user); // 💡 TAMBAHAN: Ambil data user yang sedang login
  const [stats, setStats] = useState({ kontak: 0, followup: 0, kampanye: 0, notif: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // 🔒 PENAHAN: Jika session auth user belum siap/load, tunggu dulu dan jangan jalankan query
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // 💡 PERBAIKAN UTAMA: Arahkan nama tabel ke 'broadcasts' dan saring semuanya menggunakan .eq('user_id', user.id)
        const [kontakCount, followupCount, kampanyeCount, notifCount] = await Promise.all([
          supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('followups').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'Belum Selesai'),
          supabase.from('broadcasts').select('*', { count: 'exact', head: true }).eq('user_id', user.id), // 🔥 DIUBAH ke 'broadcasts' & disaring user_id
          supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false)
        ]);

        setStats({
          kontak: kontakCount.count || 0,
          followup: followupCount.count || 0,
          kampanye: kampanyeCount.count || 0, // Nilai ini sekarang otomatis sinkron dengan riwayat broadcast
          notif: notifCount.count || 0,
        });
      } catch (error: any) {
        console.error('Gagal mengambil data dashboard:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]); // 🔄 Pemicu: Jalankan ulang fungsi jika state user berhasil dimuat dari local storage

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
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
        Dasbor Ringkasan Analitik
      </Typography>
      
      <Grid container spacing={3} mt={1}>
        {cards.map((card, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card sx={{ 
              backgroundColor: 'background.paper', 
              backgroundImage: 'none', 
              border: '1px solid',
              borderColor: 'divider', 
              borderRadius: '12px' 
            }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {card.title}
                    </Typography>
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
