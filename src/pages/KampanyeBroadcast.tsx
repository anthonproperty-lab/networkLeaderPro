import React, { useEffect, useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { 
  Box, Typography, Button, Card, CardContent, Grid, Dialog, 
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem, 
  Table, TableHead, TableRow, TableCell, TableBody, Chip, LinearProgress, IconButton
} from '@mui/material';
import { Send, Add, Groups, Person, Delete, AccessTime } from '@mui/icons-material';
import { supabase } from '../services/supabaseClient';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'react-toastify';
import { useLocation, useNavigate } from 'react-router-dom';

interface SingleBroadcastItem {
  nama_kampanye: string; // 📋 Sesuai kolom database Anda
  target_tipe: 'semua' | 'grup'; // 📋 Sesuai kolom database Anda
  group_id: string; // 📋 Sesuai kolom database Anda
  pesan: string; // 📋 Sesuai kolom database Anda
  scheduled_at: string; // 📋 Sesuai kolom database Anda (Format HTML: YYYY-MM-DDTHH:mm)
}

interface MultiBroadcastFormInput {
  campaigns: SingleBroadcastItem[];
}

export const Broadcasts: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const navigate = useNavigate();
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Fungsi helper mendapatkan waktu lokal untuk default datetime picker
  const getLocalCurrentDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const { handleSubmit, control, reset, watch } = useForm<MultiBroadcastFormInput>({
    defaultValues: {
      campaigns: [
        { nama_kampanye: '', target_tipe: 'semua', group_id: '', pesan: '', scheduled_at: getLocalCurrentDateTime() }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "campaigns"
  });

  const watchCampaigns = watch("campaigns");

  // 1. Ambil Riwayat Langsung dari Tabel 'broadcasts'
  const fetchData = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('broadcasts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBroadcasts(data || []);

      // Ambil data tags/label untuk opsi dropdown
      const { data: dataGrup, error: errGrup } = await supabase
        .from('tags')
        .select('id, name')
        .order('name', { ascending: true });

      if (errGrup) {
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

  // 2. Tangkap Pelemparan Data dari Template Pesan
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const templateId = searchParams.get('use_template');

    if (templateId && user) {
      const loadSelectedTemplate = async () => {
        try {
          const { data, error } = await supabase
            .from('templates')
            .select('*')
            .eq('id', templateId)
            .single();

          if (error) throw error;

          if (data) {
            reset({
              campaigns: [
                {
                  nama_kampanye: `Kampanye - ${data.judul || 'Template'}`,
                  pesan: data.pesan || '',
                  target_tipe: 'semua',
                  group_id: '',
                  scheduled_at: getLocalCurrentDateTime()
                }
              ]
            });
            setOpenModal(true);
            toast.info(`Menggunakan draf template: ${data.judul}`);
            navigate('/kampanye_broadcast', { replace: true });
          }
        } catch (err: any) {
          console.error('Gagal memuat template:', err.message);
        }
      };
      loadSelectedTemplate();
    }
  }, [location.search, user, reset, navigate]);

  const handleOpenModal = () => {
    reset({
      campaigns: [{ nama_kampanye: '', target_tipe: 'semua', group_id: '', pesan: '', scheduled_at: getLocalCurrentDateTime() }]
    });
    setOpenModal(true);
  };

  // 3. Simpan Banyak Kampanye Sekaligus (Bulk Insert) ke Tabel 'broadcasts'
  const handleSimpanBanyakBroadcast = async (formData: MultiBroadcastFormInput) => {
    setLoading(true);
    try {
      const payloadInsert = [];

      for (const item of formData.campaigns) {
        let totalTarget = 0;
        
        if (item.target_tipe === 'semua') {
          const { count } = await supabase.from('contacts').select('*', { count: 'exact', head: true });
          totalTarget = count || 0;
        } else if (item.group_id) {
          const { count, error: errCount } = await supabase
            .from('contact_tags')
            .select('*', { count: 'exact', head: true })
            .eq('tag_id', item.group_id);
            
          if (errCount) throw errCount;
          totalTarget = count || 0;
        }

        if (totalTarget === 0) {
          throw new Error(`Target kontak kosong pada variasi: "${item.nama_kampanye || 'Tanpa Nama'}".`);
        }

        const skrg = new Date();
        const waktuKirim = new Date(item.scheduled_at);
        const statusKampanye = waktuKirim > skrg ? 'Scheduled' : 'Pending';

        payloadInsert.push({
          user_id: user?.id,
          nama_kampanye: item.nama_kampanye,
          target_tipe: item.target_tipe,
          group_id: item.target_tipe === 'grup' ? item.group_id : null,
          pesan: item.pesan,
          total_target: totalTarget,
          terkirim: 0,
          status: statusKampanye,
          scheduled_at: waktuKirim.toISOString(), // 📋 Masuk dengan format timestamptz aman
          failed: 0
        });
      }

      // Langsung push sekaligus dalam 1 request ke Supabase
      const { error } = await supabase.from('broadcasts').insert(payloadInsert);
      if (error) throw error;

      toast.success(`${payloadInsert.length} Kampanye terjadwal berhasil disimpan!`);
      setOpenModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(`Gagal menyimpan: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box p={1}>
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Kampanye Broadcast Massal</Typography>
          <Typography variant="body2" color="text.secondary">
            Konfigurasi variasi isi tampilan pesan dan waktu peluncuran terjadwal.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={handleOpenModal}
          sx={{ bgcolor: '#20bf6b', '&:hover': { bgcolor: '#199d56' }, textTransform: 'none' }}
        >
          Buat Banyak Kampanye
        </Button>
      </Box>

      {/* TABEL DATA UTAMA */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Nama Kampanye / Tanggal</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Target</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '30%' }}>Isi Teks</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Waktu Peluncuran</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Statistik (Kirim/Target)</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {broadcasts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    Belum ada riwayat kampanye broadcast massal.
                  </TableCell>
                </TableRow>
              ) : (
                broadcasts.map((item) => {
                  const persentase = item.total_target > 0 ? Math.round((item.terkirim / item.total_target) * 100) : 0;
                  return (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.nama_kampanye}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Dibuat: {new Date(item.created_at).toLocaleString('id-ID')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          {item.target_tipe === 'semua' ? <Person fontSize="small" color="primary" /> : <Groups fontSize="small" color="secondary" />}
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {item.target_tipe === 'semua' ? 'Semua' : 'Tag'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {item.pesan}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={0.5} color="text.secondary">
                          <AccessTime fontSize="inherit" />
                          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                            {item.scheduled_at ? new Date(item.scheduled_at).toLocaleString('id-ID') : 'Instan'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ width: '100%' }}>
                          <Typography variant="caption" color="text.secondary">
                            {`${item.terkirim}/${item.total_target} (${persentase}%)`}
                          </Typography>
                          <LinearProgress variant="determinate" value={persentase} sx={{ height: 4, borderRadius: 2 }} />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={item.status} 
                          size="small" 
                          color={
                            item.status === 'Completed' || item.status === 'Selesai' ? 'success' : 
                            item.status === 'Berjalan' ? 'primary' : 
                            item.status === 'Scheduled' ? 'secondary' : 'warning'
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

      {/* MODAL BATCH FORM MULTIPLE CAMPAIGN */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="lg">
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Buat Beberapa Broadcast Terjadwal Sekaligus</span>
          <Button 
            variant="outlined" 
            size="small" 
            startIcon={<Add />}
            onClick={() => append({ nama_kampanye: '', target_tipe: 'semua', group_id: '', pesan: '', scheduled_at: getLocalCurrentDateTime() })}
          >
            Tambah Variasi Kampanye
          </Button>
        </DialogTitle>
        <form onSubmit={handleSubmit(handleSimpanBanyakBroadcast)}>
          <DialogContent dividers sx={{ bgcolor: 'action.hover', maxHeight: '70vh' }}>
            
            {fields.map((field, index) => {
              const currentTargetTipe = watchCampaigns?.[index]?.target_tipe;

              return (
                <Card key={field.id} sx={{ mb: 3, p: 2, position: 'relative', border: '1px solid', borderColor: 'divider', boxShadow: 1 }}>
                  {fields.length > 1 && (
                    <IconButton 
                      color="error" 
                      onClick={() => remove(index)} 
                      sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}
                    >
                      <Delete />
                    </IconButton>
                  )}
                  
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#0984e3', mb: 2 }}>
                    🚀 Model Variasi Kampanye #{index + 1}
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      {/* Nama Kampanye */}
                      <Controller
                        name={`campaigns.${index}.nama_kampanye`}
                        control={control}
                        rules={{ required: 'Nama kampanye wajib diisi' }}
                        render={({ field, fieldState: { error } }) => (
                          <TextField
                            {...field}
                            fullWidth
                            size="small"
                            label="Nama Kampanye"
                            placeholder="Contoh: Diskon Pelanggan Baru"
                            error={!!error}
                            helperText={error?.message}
                            InputLabelProps={{ shrink: true }}
                          />
                        )}
                      />

                      {/* Tipe Target */}
                      <Controller
                        name={`campaigns.${index}.target_tipe`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            select
                            size="small"
                            label="Target Penerima"
                            sx={{ mt: 2 }}
                            InputLabelProps={{ shrink: true }}
                          >
                            <MenuItem value="semua">Semua Kontak</MenuItem>
                            <MenuItem value="grup">Spesifik Label/Tag</MenuItem>
                          </TextField>
                        )}
                      />

                      {/* Group ID */}
                      {currentTargetTipe === 'grup' && (
                        <Controller
                          name={`campaigns.${index}.group_id`}
                          control={control}
                          rules={{ required: 'Pilih Label/Tag wajib diisi' }}
                          render={({ field, fieldState: { error } }) => (
                            <TextField
                              {...field}
                              select
                              fullWidth
                              size="small"
                              label="Pilih Label / Tag"
                              error={!!error}
                              helperText={error?.message}
                              sx={{ mt: 2 }}
                              InputLabelProps={{ shrink: true }}
                            >
                              {groups.length === 0 ? (
                                <MenuItem value="" disabled>Tidak ada label</MenuItem>
                              ) : (
                                groups.map((g) => <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>)
                              )}
                            </TextField>
                          )}
                        />
                      )}

                      {/* Waktu Peluncuran (Timer) */}
                      <Controller
                        name={`campaigns.${index}.scheduled_at`}
                        control={control}
                        rules={{ required: 'Tentukan waktu pengiriman' }}
                        render={({ field, fieldState: { error } }) => (
                          <TextField
                            {...field}
                            fullWidth
                            type="datetime-local"
                            size="small"
                            label="Waktu Peluncuran (Timer)"
                            error={!!error}
                            helperText={error ? error.message : 'Pesan otomatis dikirim pada waktu ini.'}
                            sx={{ mt: 2 }}
                            InputLabelProps={{ shrink: true }}
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} md={8}>
                      {/* Isi Pesan */}
                      <Controller
                        name={`campaigns.${index}.pesan`}
                        control={control}
                        rules={{ required: 'Konten pesan tidak boleh kosong' }}
                        render={({ field, fieldState: { error } }) => (
                          <TextField
                            {...field}
                            fullWidth
                            multiline
                            rows={6}
                            label="Isi Teks Pesan"
                            placeholder="Tulis model isi pesan Anda di sini..."
                            error={!!error}
                            helperText={error?.message || 'Mendukung tag custom {name}'}
                            InputLabelProps={{ shrink: true }}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </Card>
              );
            })}

          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenModal(false)} color="inherit">Batal</Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading} 
              sx={{ bgcolor: '#20bf6b', '&:hover': { bgcolor: '#199d56' }, textTransform: 'none' }}
            >
              {loading ? 'Menyimpan...' : `Jadwalkan ${fields.length} Broadcast`}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Broadcasts;
