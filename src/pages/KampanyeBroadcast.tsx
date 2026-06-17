import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
  group_id: string;
  pesan: string;
}

export const Broadcasts: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const { handleSubmit, watch, reset, control, formState: { errors } } = useForm<BroadcastFormInput>({
    defaultValues: { 
      nama_kampanye: '',
      target_tipe: 'semua',
      group_id: '',
      pesan: ''
    }
  });

  const watchTargetTipe = watch('target_tipe');

  // 1. Ambil data Riwayat Kampanye dan Daftar Label/Tag dari Supabase
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

      // Ambil data dari tabel tags (sesuai struktur database asli Anda)
      const { data: dataGrup, error: errGrup } = await supabase
        .from('tags')
        .select('id, name')
        .order('name', { ascending: true });

      if (errGrup) {
        // Fallback jika nama kolom di tabel tags Anda adalah 'nama_tag'
        const { data: dataAlt, error: errAlt } = await supabase
          .from('tags')
          .select('id, nama_tag')
          .order('nama_tag', { ascending: true });
        
        if (!errAlt) {
          setGroups(dataAlt?.map(t => ({ id: t.id, name: t.nama_tag })) || []);
          return;
        }
        throw errGrup;
      }
      
      setGroups(dataGrup?.map(t => ({ id: t.id, name: t.name })) || []);
    } catch (err: any) {
      toast.error(`Gagal memuat data: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // 2. Buka Modal Pembuatan Kampanye
  const handleOpenModal = () => {
    reset({ nama_kampanye: '', target_tipe: 'semua', group_id: '', pesan: '' });
    setOpenModal(true);
  };

  // 3. Proses Submit & Pemicu Pengiriman Broadcast Massal
  const handleSimpanBroadcast = async (data: BroadcastFormInput) => {
    setLoading(true);
    try {
      let totalTarget = 0;
      
      if (data.target_tipe === 'semua') {
        const { count } = await supabase.from('contacts').select('*', { count: 'exact', head: true });
        totalTarget = count || 0;
      } else if (data.group_id) {
        // Mencari kontak yang terhubung ke tag pilihan melalui tabel jembatan contact_tags
        const { count, error: errCount } = await supabase
          .from('contact_tags')
          .select('*', { count: 'exact', head: true })
          .eq('tag_id', data.group_id);
          
        if (errCount) throw errCount;
        totalTarget = count || 0;
      }

      if (totalTarget === 0) {
        throw new Error('Target penerima kosong. Silakan periksa kembali daftar kontak pada kelompok ini.');
      }

      // PERBAIKAN: Menghapus properti 'gagal' dari payload karena kolom tidak ada di database
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
            status: 'Pending' // Kolom status bertipe varchar menerima string 'Pending' dengan aman
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
      {/* HEADER UTAMA */}
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

      {/* TABEL RIWAYAT */}
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
                            {item.target_tipe === 'semua' ? 'Semua Kontak' : 'Kelompok Tag'}
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

      {/* MODAL FORMULIR KAMPANYE BARU */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 'bold' }}>Konfigurasi Masal Broadcast WhatsApp</DialogTitle>
        <form onSubmit={handleSubmit(handleSimpanBroadcast)}>
          <DialogContent dividers>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                
                {/* 1. INPUT NAMA KAMPANYE MENGGUNAKAN CONTROLLER (MEMPERBAIKI ERROR BUILD VERCEL) */}
                <Controller
                  name="nama_kampanye"
                  control={control}
                  rules={{ required: 'Nama kampanye wajib diisi' }}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Nama Kampanye"
                      placeholder="Contoh: Promo Idul Fitri / Followup Prospek"
                      error={!!error}
                      helperText={error?.message}
                      margin="dense"
                    />
                  )}
                />

                {/* 2. DROPDOWN TARGET TIPE */}
                <Controller
                  name="target_tipe"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      select
                      label="Target Penerima Pesan"
                      margin="dense"
                      sx={{ mt: 2 }}
                    >
                      <MenuItem value="semua">Kirim ke Semua Kontak Anda</MenuItem>
                      <MenuItem value="grup">Kirim Spesifik Berdasarkan Label/Tag</MenuItem>
                    </TextField>
                  )}
                />

                {/* 3. DROPDOWN GRUP KONTAK / TAG */}
                {watchTargetTipe === 'grup' && (
                  <Controller
                    name="group_id"
                    control={control}
                    rules={{ required: 'Pilih Label/Tag wajib diisi' }}
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        {...field}
                        fullWidth
                        select
                        label="Pilih Label / Tag Kontak"
                        error={!!error}
                        helperText={error?.message}
                        margin="dense"
                        sx={{ mt: 2 }}
                      >
                        {groups.length === 0 ? (
                          <MenuItem value="" disabled>Tidak ada label kontak ditemukan</MenuItem>
                        ) : (
                          groups.map((g) => (
                            <MenuItem key={g.id} value={g.id}>
                              {g.name}
                            </MenuItem>
                          ))
                        )}
                      </TextField>
                    )}
                  />
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                {/* 4. INPUT ISI PESAN MENGGUNAKAN CONTROLLER (MEMPERBAIKI ERROR BUILD VERCEL) */}
                <Controller
                  name="pesan"
                  control={control}
                  rules={{ required: 'Konten pesan tidak boleh kosong' }}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      rows={7}
                      label="Isi Pesan WhatsApp"
                      placeholder="Tulis pesan Anda disini..."
                      error={!!error}
                      helperText={error?.message}
                      margin="dense"
                    />
                  )}
                />
                
                <Alert severity="info" sx={{ mt: 1, fontSize: '0.8rem' }}>
                  Gunakan tag <strong>{`{name}`}</strong> untuk memanggil nama kontak secara otomatis.<br/>
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
