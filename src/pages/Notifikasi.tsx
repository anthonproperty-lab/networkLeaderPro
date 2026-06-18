import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Card, CardContent, List, ListItem, 
  ListItemText, Chip, Button, Divider, LinearProgress, IconButton 
} from '@mui/material';
import { 
  NotificationImportant, Drafts, DoneAll, 
  Payment, CardMembership, SettingsSuggest, Campaign 
} from '@mui/icons-material';
import { supabase } from '../services/supabaseClient';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'react-toastify';

export const Notifikasi: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [notifList, setNotifList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 1. Ambil data notifikasi milik user
  const fetchNotifikasi = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifList(data || []);
    } catch (err: any) {
      toast.error(`Gagal memuat notifikasi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifikasi();
  }, [user]);

  // 2. Fungsi pembantu untuk membedakan gaya tampilan berdasarkan tipe notifikasi
  const dapatkanGayaTipe = (tipe: string) => {
    switch (tipe) {
      case 'invoice':
        return { label: 'Tagihan / Invoice', color: 'error' as const, icon: <Payment fontSize="small" /> };
      case 'subscription':
        return { label: 'Langganan', color: 'warning' as const, icon: <CardMembership fontSize="small" /> };
      case 'maintenance':
        return { label: 'Pengumuman Admin', color: 'info' as const, icon: <Campaign fontSize="small" /> };
      default:
        return { label: 'Sistem WA', color: 'default' as const, icon: <SettingsSuggest fontSize="small" /> };
    }
  };

  // 3. Tandai satu notifikasi sebagai sudah dibaca
  const tandaiSudahDibaca = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
      
      // Update state lokal biar instan berubah di layar tanpa reload
      setNotifList(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // 4. Tandai SEMUA notifikasi milik user ini sebagai sudah dibaca sekaligus
  const tandaiSemuaMembaca = async () => {
    if (!user || notifList.length === 0) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      toast.success('Semua notifikasi ditandai telah dibaca');
      setNotifList(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Pusat Pemberitahuan</Typography>
          <Typography variant="body2" color="text.secondary">
            Pantau tagihan, status akun langganan, dan info pemeliharaan sistem dari Admin.
          </Typography>
        </Box>
        {notifList.some(n => !n.is_read) && (
          <Button 
            variant="outlined" 
            startIcon={<DoneAll />} 
            onClick={tandaiSemuaMembaca}
            size="small"
          >
            Tandai Semua Dibaca
          </Button>
        )}
      </Box>

      {/* Konten Utama */}
      <Card sx={{ borderRadius: '12px' }}>
        {loading ? (
          <Box p={4} textAlign="center">
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Memuat kotak masuk...</Typography>
          </Box>
        ) : notifList.length === 0 ? (
          <Box p={6} textAlign="center" color="text.secondary">
            <NotificationImportant sx={{ fontSize: 48, mb: 1, color: 'action.disabled' }} />
            <Typography variant="body1">Kotak masuk pemberitahuan Anda kosong.</Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notifList.map((item, indeks) => {
              const gaya = dapatkanGayaTipe(item.tipe);
              return (
                <React.Fragment key={item.id}>
                  <ListItem 
                    sx={{ 
                      p: 2.5, 
                      bgcolor: item.is_read ? 'transparent' : 'action.hover', // Latar belakang agak gelap jika belum dibaca
                      transition: '0.2s',
                      '&:hover': { bgcolor: 'action.selected' }
                    }}
                    secondaryAction={
                      !item.is_read && (
                        <IconButton 
                          edge="end" 
                          title="Tandai sudah dibaca"
                          onClick={() => tandaiSudahDibaca(item.id)}
                          color="primary"
                        >
                          <Drafts />
                        </IconButton>
                      )
                    }
                  >
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap" mb={0.5}>
                          <Chip 
                            icon={gaya.icon} 
                            label={gaya.label} 
                            color={gaya.color} 
                            size="small" 
                            variant={item.is_read ? "outlined" : "filled"}
                          />
                          <Typography 
                            variant="body1" 
                            sx={{ fontWeight: item.is_read ? 500 : 'bold', color: 'text.primary' }}
                          >
                            {item.judul}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
                          >
                            {item.isi_pesan}
                          </Typography>
                          <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 1 }}>
                            {new Date(item.created_at).toLocaleString('id-ID')}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {indeks < notifList.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Card>
    </Box>
  );
};

export default Notifikasi;
