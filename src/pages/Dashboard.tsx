import React, { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography, Box, CircularProgress, LinearProgress, Chip } from '@mui/material'; // 💡 TAMBAHAN: Import LinearProgress & Chip di sini
import { People, NotificationImportant, Campaign, Schedule } from '@mui/icons-material';
import { supabase } from '../services/supabaseClient';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const [stats, setStats] = useState({ kontak: 0, followup: 0, kampanye: 0, notif: 0 });
  const [loading, setLoading] = useState(true);

  // 💡 PERBAIKAN 1: Buat State baru agar data profil & paket bisa dibaca oleh UI JSX di bawah
  const [quotaData, setQuotaData] = useState({
    memberLevel: 'FREE',
    tokenUsed: 0,
    maxToken: 100,
    isBlocked: false
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // 💡 PERBAIKAN 2: Gunakan Promise.all untuk mengambil data profil, paket, dan statistik secara paralel (Lebih Cepat!)
        const [profilRes, statsRes] = await Promise.all([
          supabase.from('profiles').select('member_level, token_used, is_blocked').eq('id', user.id).single(),
          Promise.all([
            supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
            supabase.from('followups').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'Belum Selesai'),
            supabase.from('broadcasts').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
            supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false)
          ])
        ]);

        // Ambil data limit paket berdasarkan level member yang didapat
        let maxTokenValue = 100;
        if (profilRes.data) {
          const { data: paketRes } = await supabase
            .from('subscription_packages')
            .select('max_token')
            .eq('level', profilRes.data.member_level)
            .single();
          
          if (paketRes) maxTokenValue = paketRes.max_token;
        }

        // Simpan data kuota ke state
        if (profilRes.data) {
          setQuotaData({
            memberLevel: profilRes.data.member_level || 'FREE',
            tokenUsed: profilRes.data.token_used || 0,
            maxToken: maxTokenValue,
            isBlocked: profilRes.data.is_blocked || false
          });
        }

        // Simpan data statistik ke state
        const [kontakCount, followupCount, kampanyeCount, notifCount] = statsRes;
        setStats({
          kontak: kontakCount.count || 0,
          followup: followupCount.count || 0,
          kampanye: kampanyeCount.count || 0,
          notif: notifCount.count || 0,
        });

      } catch (error: any) {
        console.error('Gagal mengambil data dashboard:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  const cards = [
    { title: 'Total Kontak', val: stats.kontak, icon: <People fontSize="large" color="primary" />, link: null },
    { title: 'Follow Up Hari Ini', val: stats.followup, icon: <Schedule fontSize="large" color="warning" />, link: null },
    { title: 'Total Kampanye', val: stats.kampanye, icon: <Campaign fontSize="large" color="success" />, link: '/kampanye-broadcast' },
    { title: 'Notifikasi Baru', val: stats.notif, icon: <NotificationImportant fontSize="large" color="error" />, link: '/notifications' },
  ];

  // Hitung persentase pemakaian token untuk LinearProgress
  const nilaiProgress = quotaData.maxToken > 0 ? (quotaData.tokenUsed / quotaData.maxToken) * 100 : 0;
  
  return (
    <Box p={3}>
      {/* ⚠️ BANNER PEMBERITAHUAN JIKA USER DI-BLOCK */}
     {quotaData.isBlocked && (
  <Box 
    mb={3} 
    p={2} 
    bgcolor="#ff7675" 
    borderRadius="8px" 
    color="#fff" 
    display="flex" 
    justifyContent="space-between" 
    alignItems="center"
    flexWrap="wrap"
    gap={2}
  >
    <Typography sx={{ fontWeight: 'bold' }}>
      ⚠️ Akun Anda Ditangguhkan! Kuota token pengiriman pesan telah habis. Silakan hubungi admin untuk melakukan perpanjangan paket.
    </Typography>
    <Button 
      variant="contained" 
      color="success"
      size="small"
      onClick={() => {
        const nomorAdmin = "628xxxxxxxxxx"; // 📞 Ganti dengan nomor WhatsApp Anda (awali dengan 62)
        const pesan = encodeURIComponent(`Halo Admin, akun saya ditangguhkan karena kuota token habis. Saya ingin konfirmasi untuk upgrade/isi ulang paket.\n\nEmail Akun: ${user?.email}`);
        window.open(`https://wa.me/${nomorAdmin}?text=${pesan}`, '_blank');
      }}
      sx={{ bgcolor: '#2ecc71', '&:hover': { bgcolor: '#27ae60' }, fontWeight: 'bold' }}
    >
      Hubungi Admin via WA
    </Button>
  </Box>
)}

      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
        Dasbor Ringkasan Analitik
      </Typography>

      {/* 💡 PERBAIKAN 3: Memasukkan Widget Kuota ke dalam wadah return utama, tepat di atas Grid Cards */}
      <Card sx={{ mb: 4, p: 3, borderRadius: '12px', backgroundColor: 'background.paper', backgroundImage: 'none' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
              Status Paket:
            </Typography>
            <Chip 
              label={quotaData.memberLevel.toUpperCase()} 
              color={quotaData.memberLevel === 'vip' ? 'secondary' : 'primary'} 
              size="small" 
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            {quotaData.tokenUsed} / {quotaData.maxToken} Token Digunakan
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={nilaiProgress > 100 ? 100 : nilaiProgress} // Menjaga agar bar tidak overflow jika data melebihi limit
          color={quotaData.tokenUsed >= quotaData.maxToken * 0.9 ? "error" : "primary"}
          sx={{ height: 10, borderRadius: 5, bgcolor: 'action.hover' }}
        />
      </Card>
      
      <Grid container spacing={3}>
        {cards.map((card, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card 
              onClick={() => card.link && navigate(card.link)}
              sx={{ 
                backgroundColor: 'background.paper', 
                backgroundImage: 'none', 
                border: '1px solid',
                borderColor: 'divider', 
                borderRadius: '12px',
                cursor: card.link ? 'pointer' : 'default',
                '&:hover': card.link ? { boxShadow: 3, borderColor: 'primary.main' } : {},
                transition: 'all 0.2s ease-in-out'
              }}
            >
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
