import React, { useEffect, useState, useCallback, useRef } from 'react'; 
import { Grid, Card, CardContent, Typography, Box, CircularProgress, LinearProgress, Chip, Button } from '@mui/material'; 
import { People, NotificationImportant, Campaign, Schedule, WhatsApp } from '@mui/icons-material'; 
import { supabase } from '../services/supabaseClient';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';


export const Dashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const [stats, setStats] = useState({ kontak: 0, followup: 0, kampanye: 0, notif: 0 });
  const [loading, setLoading] = useState(true);

  const [quotaData, setQuotaData] = useState({
    memberLevel: 'FREE',
    tokenUsed: 0,
    maxToken: 100,
    isBlocked: false
  });

  const [waSession, setWaSession] = useState({
    status: 'DISCONNECTED',
    qrString: ''
  });
  const [triggerLoading, setTriggerLoading] = useState(false);

  const waSessionRef = useRef(waSession);
  useEffect(() => {
    waSessionRef.current = waSession;
  }, [waSession]);

  const fetchDashboardData = useCallback(async (showLoading = true) => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      if (showLoading) setLoading(true);

      const [profilRes, waRes, statsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('member_level, token_used, is_blocked')
          .eq('id', user.id)
          .single(),
        supabase
          .from('whatsapp_sessions')
          .select('status, qr_string')
          .eq('user_id', user.id)
          .maybeSingle(),
        Promise.all([
          supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('followups').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'Belum Selesai'),
          supabase.from('broadcasts').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false)
        ])
      ]);

      if (profilRes.error) throw profilRes.error;

      if (waRes.data) {
        setWaSession({
          status: waRes.data.status || 'DISCONNECTED',
          qrString: waRes.data.qr_string || ''
        });
      }

      let maxTokenValue = 50; 
      const levelAktif = profilRes.data?.member_level?.toLowerCase() || 'free';

      if (profilRes.data) {
        const { data: paketRes, error: paketError } = await supabase
          .from('subscription_packages')
          .select('max_token')
          .eq('level', levelAktif)
          .maybeSingle();

        if (!paketError && paketRes) {
          maxTokenValue = paketRes.max_token;
        } else {
          if (levelAktif === 'standard') maxTokenValue = 2000;
          if (levelAktif === 'vip') maxTokenValue = 10000;
        }
      }

      setQuotaData({
        memberLevel: levelAktif,
        tokenUsed: profilRes.data?.token_used || 0,
        maxToken: maxTokenValue,
        isBlocked: profilRes.data?.is_blocked || false
      });

      const [kontakCount, followupCount, kampanyeCount, notifCount] = statsRes;
      setStats({
  kontak: kontakCount?.count ?? 0,
  followup: followupCount?.count ?? 0,
  kampanye: kampanyeCount?.count ?? 0,
  notif: notifCount?.count ?? 0,
});

    } catch (error) {
      console.error(error);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData(true);

    if (!user) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_sessions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          console.log('Perubahan data sesi WA terdeteksi secara real-time:', payload);
          if (payload.new) {
            setWaSession({
              status: payload.new.status || 'DISCONNECTED',
              qrString: payload.new.qr_string || ''
            });
          }
        }
      )
      .subscribe();

    const intervalCadangan = setInterval(() => {
      const currentSession = waSessionRef.current;
      if (currentSession.status === 'PAIRING' && !currentSession.qrString) {
        console.log('Mengambil ulang data QR secara berkala via backup polling...');
        fetchDashboardData(false);
      }
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(intervalCadangan);
    };
  }, [user, fetchDashboardData]);

  const handleHubungkanWhatsApp = async () => {
    if (!user) return;
    try {
      setTriggerLoading(true);
      
      const { error } = await supabase
        .from('whatsapp_sessions')
        .upsert({
          user_id: user.id,
          status: 'PAIRING',
          qr_string: '', 
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;
      
      await fetchDashboardData(false);
      console.log('Sinyal PAIRING dikirim. Menunggu WA-Engine lokal memproses...');
    } catch (err: any) {
      console.error('Gagal memicu tautan WhatsApp:', err.message);
    } finally {
      setTriggerLoading(false);
    }
  };

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

  const nilaiProgress = quotaData.maxToken > 0 ? (quotaData.tokenUsed / quotaData.maxToken) * 100 : 0;
  
  const getWaChipColor = (status: string) => {
    if (status === 'CONNECTED') return 'success';
    if (status === 'PAIRING') return 'warning';
    return 'default';
  };

  return (
    <Box p={3}>
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
              const nomorAdmin = "628xxxxxxxxxx"; 
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

      <Card sx={{ mb: 4, p: 3, borderRadius: '12px', backgroundColor: 'background.paper', backgroundImage: 'none' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
          <Box display="flex" alignItems="center" gap={3} flexWrap="wrap">
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

            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                Device WA:
              </Typography>
              <Chip 
                label={waSession.status} 
                color={getWaChipColor(waSession.status)} 
                size="small" 
                sx={{ fontWeight: 'bold' }}
              />
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              {quotaData.tokenUsed} / {quotaData.maxToken} Token Digunakan
            </Typography>
            
            <Button
              variant="contained"
              color={waSession.status === 'CONNECTED' ? 'success' : 'primary'}
              size="small"
              startIcon={triggerLoading ? <CircularProgress size={16} color="inherit" /> : <WhatsApp />}
              disabled={triggerLoading || waSession.status === 'CONNECTED' || waSession.status === 'PAIRING'}
              onClick={handleHubungkanWhatsApp}
              sx={{ fontWeight: 'bold', textTransform: 'none', borderRadius: '8px' }}
            >
              {waSession.status === 'CONNECTED' 
                ? 'WhatsApp Terhubung' 
                : waSession.status === 'PAIRING' 
                  ? 'Menyiapkan QR...' 
                  : 'Hubungkan WhatsApp'}
            </Button>
          </Box>
        </Box>

        <LinearProgress 
          variant="determinate" 
          value={nilaiProgress > 100 ? 100 : nilaiProgress} 
          color={quotaData.tokenUsed >= quotaData.maxToken * 0.9 ? "error" : "primary"}
          sx={{ height: 10, borderRadius: 5, bgcolor: 'action.hover' }}
        />

        {waSession.status === 'PAIRING' && (
          <Box 
            mt={3} 
            p={3} 
            border="2px dashed" 
            borderColor="primary.main" 
            borderRadius="12px" 
            bgcolor="action.hover" 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            justifyContent="center"
            textAlign="center"
          >
            <Typography variant="body1" color="primary.main" sx={{ fontWeight: 'bold', mb: 2 }}>
              📲 WhatsApp Siap Ditautkan!
            </Typography>
           <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: '400px' }}>
  Buka WhatsApp di HP Anda → Perangkat Tertaut → Tautkan Perangkat, lalu arahkan kamera HP Anda ke QR Code di bawah ini.
</Typography>

            <Box p={2} bgcolor="#ffffff" borderRadius="8px" display="inline-flex" boxShadow={1}>
              {waSession.qrString ? (
               <img
  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    waSession.qrString
  )}`}
  alt="QR WhatsApp"
  width={200}
  height={200}
  style={{ display: 'block' }}
/>
              ) : (
                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" width={200} height={200} gap={1}>
                  <CircularProgress size={30} />
                  <Typography variant="caption" color="text.secondary">Mengambil QR dari Engine...</Typography>
                </Box>
              )}
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
              Sistem mendeteksi pemindaian secara real-time. QR akan menutup jika sukses terhubung.
            </Typography>
          </Box>
        )}
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
