import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Box, Typography, Button, Card, CardContent, Grid, Dialog, 
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem, 
  IconButton, Table, TableHead, TableRow, TableCell, TableBody, Chip 
} from '@mui/material';
import { Add, Delete, CheckCircle, RadioButtonUnchecked, CalendarMonth } from '@mui/icons-material';
import { supabase } from '../services/supabaseClient';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'react-toastify';

interface FollowUpFormInput {
  contact_id: string;
  judul: string;
  catatan: string;
  tanggal_followup: string;
}

export const FollowUps: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [followups, setFollowups] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FollowUpFormInput>();

  // 1. Ambil data follow up dan daftar kontak dari Supabase
  const fetchData = async () => {
    if (!user) return;
    try {
      // Ambil data follow up beserta data nama kontak (Join Table)
      const { data: dataFollowUp, error: errFollow } = await supabase
        .from('followups')
        .select(`
          *,
          contacts (nama_lengkap, nomor_whatsapp)
        `)
        .order('tanggal_followup', { ascending: true });

      if (errFollow) throw errFollow;
      setFollowups(dataFollowUp || []);

      // Ambil daftar kontak untuk opsi pilihan di dalam Form Dropdown
      const { data: dataKontak, error: errKontak } = await supabase
        .from('contacts')
        .select('id, nama_lengkap');

      if (errKontak) throw errKontak;
      setContacts(dataKontak || []);
    } catch (err: any) {
      toast.error(`Gagal mengambil data: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // 2. Buka Modal Form Baru
  const handleOpenModal = () => {
    reset();
    setOpenModal(true);
  };

  // 3. Simpan Agenda Baru ke Supabase
  const handleSimpanFollowUp = async (data: FollowUpFormInput) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('followups')
        .insert([
          {
            user_id: user?.id,
            contact_id: data.contact_id,
            judul: data.judul,
            catatan: data.catatan,
            tanggal_followup: new Date(data.tanggal_followup).toISOString(),
            status: 'Belum Selesai'
          }
        ]);

      if (error) throw error;
      toast.success('Agenda follow up baru berhasil dijadwalkan');
      setOpenModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(`Gagal menyimpan agenda: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 4. Ubah Status Agenda (Belum Selesai <-> Selesai)
  const handleToggleStatus = async (id: string, statusSaatIni: string) => {
    const statusBaru = statusSaatIni === 'Belum Selesai' ? 'Selesai' : 'Belum Selesai';
    try {
      const { error } = await supabase
        .from('followups')
        .update({ status: statusBaru })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Agenda ditandai sebagai ${statusBaru}`);
      fetchData();
    } catch (err: any) {
      toast.error(`Gagal memperbarui status: ${err.message}`);
    }
  };

  // 5. Hapus Agenda
  const handleHapusFollowUp = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) return;
    try {
      const { error } = await supabase.from('followups').delete().eq('id', id);
      if (error) throw error;
      toast.success('Jadwal follow up berhasil dihapus');
      fetchData();
    } catch (err: any) {
      toast.error(`Gagal menghapus: ${err.message}`);
    }
  };

  return (
    <Box>
      {/* HEADER UTAMA & TOMBOL BUAT AGENDA */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Agenda & Pelacakan Follow Up</Typography>
          <Typography variant="body2" color="textSecondary">
            Atur pengingat dan pantau aktivitas follow up klien Anda secara teratur.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={handleOpenModal}
          sx={{ bgcolor: '#0984e3', '&:hover': { bgcolor: '#0773c5' } }}
        >
          Buat Agenda Baru
        </Button>
      </Box>

      {/* TABEL DATA AGENDA FOLLOW UP */}
      <Card sx={{ boxShadow: 2 }}>
        <CardContent sx={{ p: 0 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', width: 60, align: 'center' }}>Check</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Kontak / Klien</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Aktivitas / Judul</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Catatan</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Tanggal & Waktu</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold', align: 'center', width: 80 }}>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {followups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    Jadwal follow up kosong. Klik tombol "Buat Agenda Baru" untuk menjadwalkan aktivitas pertama Anda.
                  </TableCell>
                </TableRow>
              ) : (
                followups.map((item) => (
                  <TableRow key={item.id} hover sx={{ opacity: item.status === 'Selesai' ? 0.6 : 1 }}>
                    <TableCell align="center">
                      <IconButton onClick={() => handleToggleStatus(item.id, item.status)} color="primary">
                        {item.status === 'Selesai' ? (
                          <CheckCircle color="success" />
                        ) : (
                          <RadioButtonUnchecked />
                        )}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.contacts?.nama_lengkap || 'Kontak Dihapus'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {item.contacts?.nomor_whatsapp || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 500, 
                      textDecoration: item.status === 'Selesai' ? 'line-through' : 'none' 
                    }}>
                      {item.judul}
                    </TableCell>
                    <TableCell color="textSecondary" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.catatan || '-'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <CalendarMonth fontSize="small" color="action" />
                        {new Date(item.tanggal_followup).toLocaleString('id-ID', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={item.status} 
                        size="small" 
                        color={item.status === 'Selesai' ? 'success' : 'warning'} 
                        variant={item.status === 'Selesai' ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton color="error" onClick={() => handleHapusFollowUp(item.id)} size="small">
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODAL / DIALOG FORM TAMBAH AGENDA */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 'bold' }}>Buat Jadwal Agenda Follow Up Baru</DialogTitle>
        <form onSubmit={handleSubmit(handleSimpanFollowUp)}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Pilih Kontak / Klien"
                  defaultValue=""
                  {...register('contact_id', { required: 'Pilih salah satu kontak tujuan' })}
                  error={!!errors.contact_id}
                  helperText={errors.contact_id?.message}
                  margin="dense"
                >
                  {contacts.length === 0 ? (
                    <MenuItem disabled value=""><em>Belum ada kontak terdata. Tambahkan kontak terlebih dahulu.</em></MenuItem>
                  ) : (
                    contacts.map((c) => (
                      <MenuItem key={c.id} value={c.id}>{c.nama_lengkap}</MenuItem>
                    ))
                  )}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Judul Aktivitas"
                  placeholder="Contoh: Telepon penawaran ulang paket Premium"
                  {...register('judul', { required: 'Judul aktivitas wajib diisi' })}
                  error={!!errors.judul}
                  helperText={errors.judul?.message}
                  margin="dense"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Tanggal & Waktu Follow Up"
                  InputLabelProps={{ shrink: true }}
                  {...register('tanggal_followup', { required: 'Tentukan waktu pengingat' })}
                  error={!!errors.tanggal_followup}
                  helperText={errors.tanggal_followup?.message}
                  margin="dense"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Catatan Tambahan"
                  placeholder="Masukkan detail poin pembicaraan atau draf singkat..."
                  {...register('catatan')}
                  margin="dense"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenModal(false)} color="inherit">Batal</Button>
            <Button type="submit" variant="contained" disabled={loading || contacts.length === 0} sx={{ bgcolor: '#0984e3' }}>
              {loading ? 'Menyimpan...' : 'Jadwalkan Agenda'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default FollowUps;
