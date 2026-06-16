import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Box, Typography, Button, Card, CardContent, Grid, Dialog, 
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem, 
  Table, TableHead, TableRow, TableCell, TableBody, Chip, LinearProgress, Alert
} from '@mui/material';
import { Send, Add, Campaign, Groups, Person } from '@mui/icons-material';
import { supabase } from '../services/supabaseClient';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'react-toastify';

interface BroadcastFormInput {
  nama_kampanye: string;
  target_tipe: 'semua' | 'grup';
  group_id?: string;
  pesan: string;
}

export const Broadcasts: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<BroadcastFormInput>({
    defaultValues: { target_tipe: 'semua' }
  });

  const watchTargetTipe = watch('target_tipe');

  // 1. Ambil data Riwayat Kampanye dan Daftar Grup Kontak dari Supabase
  const fetchData = async () => {
    if (!user) return;
    try {
      // Ambil data kampanye broadcast
      const { data: dataBroadcast, error: errBroadcast } = await supabase
        .from('broadcasts')
        .select('*')
        .order('created_at', { ascending: false });

      if (errBroadcast) throw errBroadcast;
      setBroadcasts(dataBroadcast || []);

      // Ambil data grup untuk opsi target broadcast
      const { data: dataGrup, error: errGrup } = await supabase
        .from('contact_groups')
        .select('id, nama_grup');

      if (errGrup) throw errGrup;
      setGroups(dataGrup || []);
    } catch (err: any) {
      toast.error(`Gagal memuat data: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // 2. Buka Modal Pembuatan Kampanye
  const handleOpenModal = () => {
    reset({ nama_kampanye: '', target_tipe: 'semua', pesan: '' });
    setOpenModal(true);
  };

  // 3. Proses Submit & Pemicu Pengiriman Broadcast Massal
  const handleSimpanBroadcast = async (data: BroadcastFormInput) => {
    setLoading(true);
    try {
      // Hitung total penerima berdasarkan target pilihan
      let totalTarget = 0;
      if (data.target_tipe === 'semua') {
        const { count } = await supabase.from('contacts').select('*', { count: 'exact', head: true });
        totalTarget = count || 0;
      } else if (data.group_id) {
        const { count } = await supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('group_id', data.group_id);
        totalTarget = count || 0;
      }

      if (totalTarget === 0) {
        throw new Error('Target penerima kosong. Silakan periksa kembali daftar kontak Anda.');
      }

      // Masukkan log data kampanye baru ke tabel broadcasts
      const { error } = await supabase
        .from('broadcasts')
        .insert([
          {
            user_id: user?.id,
            nama_kampanye: data.nama_kampanye,
            target_tipe: data.target_tipe,
            group_id: data.target_tipe === 'grup' ? data.group_id : null,
            pesan: data.pesan,
            total_target: totalTarget,
            terkirim: 0,
            gagal: 0,
            status: 'Pending' // Sistem antrean/engine WA Gateway backend akan mengubah ini menjadi 'Berjalan' -> 'Selesai'
          }
        ]);

      if (error) throw error;
      toast.success('Kampanye broadcast berhasil dibuat dan masuk antrean pengiriman!');
      setOpenModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(`Gagal membuat kampanye: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* HEADER UTAMA & TOMBOL BUAT KAMPANYE */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Kampanye Broadcast Massal</Typography>
          <Typography variant="body2" color="textSecondary">
            Kirim pesan WhatsApp massal secara terjadwal atau instan ke ratusan kontak sekaligus.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={handleOpenModal}
          sx={{ bgcolor: '#20bf6b', '&:hover': { bgcolor: '#26de81' } }}
        >
          Buat Kampanye Baru
        </Button>
      </Box>

      {/* TABEL RIWAYAT KAMPANYE BROADCAST */}
      <Card sx={{ boxShadow: 2 }}>
        <CardContent sx={{ p: 0 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Nama Kampanye / Tanggal</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Target Penerima</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '30%' }}>Isi Pesan</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Statistik Kirim</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status Pengiriman</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {broadcasts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    Belum ada riwayat kampanye broadcast massal. Klik "Buat Kampanye Baru" untuk memulai.
                  </TableCell>
                </TableRow>
              ) : (
                broadcasts.map((item) => {
                  const persentase = item.total_target > 0 ? Math.round((item.terkirim / item.total_target) * 100) : 0;
                  return (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.nama_kampanye}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {new Date(item.created_at).toLocaleString('id-ID')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {item.target_tipe === 'semua' ? <Person fontSize="small" color="primary" /> : <Groups fontSize="small" color="secondary" />}
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {item.target_tipe === 'semua' ? 'Semua Kontak' : 'Grup Tertentu'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', maxLines: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {item.pesan}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <Typography variant="caption" color="textSecondary">
                            {`${item.terkirim} / ${item.total_target} Terkirim (${persentase}%)`}
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={persentase} 
                            color={item.status === 'Selesai' ? 'success' : 'primary'} 
                            sx={{ height: 6, borderRadius: 3, mt: 0.5 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={item.status} 
                          size="small" 
                          color={
                            item.status === 'Selesai' ? 'success' : 
                            item.status === 'Berjalan' ? 'primary' : 'warning'
                          } 
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODAL DIALOG UNTUK MEMBUAT KAMPANYE BARU */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 'bold' }}>Konfigurasi Masal Broadcast WhatsApp</DialogTitle>
        <form onSubmit={handleSubmit(handleSimpanBroadcast)}>
          <DialogContent dividers>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nama Kampanye"
                  placeholder="Contoh: Promo Gila Idul Fitri / Followup Prospek Baru"
                  {...register('nama_kampanye', { required: 'Nama kampanye wajib diisi' })}
                  error={!!errors.nama_kampanye}
                  helperText={errors.nama_kampanye?.message}
                  margin="dense"
                />

                <TextField
                  fullWidth
                  select
                  label="Target Penerima Pesan"
                  {...register('target_tipe')}
                  margin="dense"
                  sx={{ mt: 2 }}
                >
                  <MenuItem value="semua">Kirim ke Semua Kontak Anda</MenuItem>
                  <MenuItem value="grup">Kirim Spesifik Berdasarkan Grup</MenuItem>
                </TextField>

                {watchTargetTipe === 'grup' && (
                  <TextField
                    fullWidth
                    select
                    label="Pilih Grup Kontak"
                    defaultValue=""
                    {...register('group_id', { required: watchTargetTipe === 'grup' ? 'Pilih grup wajib diisi' : false })}
                    error={!!errors.group_id}
                    helperText={errors.group_id?.message}
                    margin="dense"
                    sx={{ mt: 2 }}
                  >
                    {groups.map((g) => (
                      <MenuItem key={g.id} value={g.id}>{g.nama_grup}</MenuItem>
                    ))}
                  </TextField>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  multiline
                  rows={7}
                  label="Isi Pesan WhatsApp"
                  placeholder="Tulis pesan Anda disini..."
                  {...register('pesan', { required: 'Konten pesan tidak boleh kosong' })}
                  error={!!errors.pesan}
                  helperText={errors.pesan?.message}
                  margin="dense"
                />
                
                <Alert severity="info" sx={{ mt: 1, fontSize: '0.8rem' }}>
                  Gunakan tag <strong>{`{name}`}</strong> untuk memanggil nama kontak secara dinamis otomatis.<br/>
                  Contoh: <em>Halo {`{name}`}, ada penawaran khusus hari ini!</em>
                </Alert>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenModal(false)} color="inherit">Batal</Button>
            <Button 
              type="submit" 
              variant="contained" 
              startIcon={<Send />} 
              disabled={loading} 
              sx={{ bgcolor: '#20bf6b', '&:hover': { bgcolor: '#199d56' } }}
            >
              {loading ? 'Memproses Antrean...' : 'Mulai Jalankan Kampanye'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Broadcasts;
