import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Box, Typography, Button, Card, CardContent, Grid, Dialog, 
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem, 
  IconButton, Table, TableHead, TableRow, TableCell, TableBody, Chip 
} from '@mui/material';
import { Add, Delete, Edit, Message } from '@mui/icons-material';
import { supabase } from '../services/supabaseClient';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'react-toastify';

interface TemplateFormInput {
  judul: string;
  kategori: 'Edukasi' | 'Promosi' | 'Follow Up' | 'Sapaan';
  isi_pesan: string;
}

export const Templates: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [templates, setTemplates] = useState<any[]>([]);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<TemplateFormInput>();

  // 1. Ambil data template dari Supabase
  const fetchTemplates = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err: any) {
      toast.error(`Gagal mengambil data: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [user]);

  // 2. Buka Modal Tambah / Edit
  const handleOpenModal = (template?: any) => {
    if (template) {
      setEditingId(template.id);
      setValue('judul', template.judul);
      setValue('kategori', template.kategori);
      setValue('isi_pesan', template.isi_pesan);
    } else {
      setEditingId(null);
      reset();
    }
    setOpenModal(true);
  };

  // 3. Simpan atau Perbarui Data ke Supabase
  const handleSimpanTemplate = async (data: TemplateFormInput) => {
    setLoading(true);
    try {
      if (editingId) {
        // Mode Update
        const { error } = await supabase
          .from('templates')
          .update({
            judul: data.judul,
            kategori: data.kategori,
            isi_pesan: data.isi_pesan,
          })
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Template pesan berhasil diperbarui');
      } else {
        // Mode Insert Baru
        const { error } = await supabase
          .from('templates')
          .insert([
            {
              user_id: user?.id,
              judul: data.judul,
              kategori: data.kategori,
              isi_pesan: data.isi_pesan,
            }
          ]);

        if (error) throw error;
        toast.success('Template pesan baru berhasil dibuat');
      }

      setOpenModal(false);
      reset();
      fetchTemplates();
    } catch (err: any) {
      toast.error(`Gagal menyimpan: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 4. Hapus Template
  const handleHapusTemplate = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus template ini?')) return;
    try {
      const { error } = await supabase.from('templates').delete().eq('id', id);
      if (error) throw error;
      toast.success('Template berhasil dihapus');
      fetchTemplates();
    } catch (err: any) {
      toast.error(`Gagal menghapus: ${err.message}`);
    }
  };

  // Pewarnaan Badge Kategori
  const getWarnaKategori = (kat: string) => {
    switch (kat) {
      case 'Promosi': return 'error';
      case 'Edukasi': return 'info';
      case 'Follow Up': return 'warning';
      default: return 'success';
    }
  };

  return (
    <Box>
      {/* HEADER DAN TOMBOL UTAMA */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Template Pesan WhatsApp</Typography>
          <Typography variant="body2" color="textSecondary">
            Simpan draf teks pesan Anda agar proses follow up dan broadcast menjadi lebih cepat.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={() => handleOpenModal()}
          sx={{ bgcolor: '#0984e3', '&:hover': { bgcolor: '#0773c5' } }}
        >
          Tambah Template
        </Button>
      </Box>

      {/* TABEL DATA TEMPLATE */}
      <Card sx={{ boxShadow: 2 }}>
        <CardContent sx={{ p: 0 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Judul Template</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Kategori</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Isi Pesan</TableCell>
                <TableCell sx={{ fontWeight: 'bold', align: 'center', width: 120 }}>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    Belum ada template pesan. Klik tombol "Tambah Template" di atas untuk membuat draf pertama Anda.
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((template) => (
                  <TableRow key={template.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{template.judul}</TableCell>
                    <TableCell>
                      <Chip 
                        label={template.kategori} 
                        size="small" 
                        color={getWarnaKategori(template.kategori)} 
                      />
                    </TableCell>
                    <TableCell sx={{ 
                      maxWidth: 300, 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      color: 'text.secondary'
                    }}>
                      {template.isi_pesan}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton color="primary" onClick={() => handleOpenModal(template)} size="small">
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleHapusTemplate(template.id)} size="small">
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

      {/* MODAL / DIALOG FORM (POPOUT) */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {editingId ? 'Edit Template Pesan' : 'Buat Template Pesan Baru'}
        </DialogTitle>
        <form onSubmit={handleSubmit(handleSimpanTemplate)}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Judul / Nama Template"
                  placeholder="Contoh: Sapaan Pelanggan Baru"
                  {...register('judul', { required: 'Judul wajib diisi' })}
                  error={!!errors.judul}
                  helperText={errors.judul?.message}
                  margin="dense"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Kategori Pesan"
                  defaultValue="Edukasi"
                  {...register('kategori', { required: 'Kategori wajib dipilih' })}
                  error={!!errors.kategori}
                  margin="dense"
                >
                  <MenuItem value="Edukasi">Edukasi</MenuItem>
                  <MenuItem value="Promosi">Promosi</MenuItem>
                  <MenuItem value="Follow Up">Follow Up</MenuItem>
                  <MenuItem value="Sapaan">Sapaan</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  label="Isi Pesan WhatsApp"
                  placeholder="Halo {nama}, terima kasih telah menghubungi kami..."
                  {...register('isi_pesan', { required: 'Isi pesan tidak boleh kosong' })}
                  error={!!errors.isi_pesan}
                  helperText={errors.isi_pesan?.message || 'Tips: Anda bisa menyisipkan tag makro seperti {nama} untuk personalisasi dinamis.'}
                  margin="dense"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenModal(false)} color="inherit">Batal</Button>
            <Button type="submit" variant="contained" disabled={loading} sx={{ bgcolor: '#0984e3' }}>
              {loading ? 'Menyimpan...' : 'Simpan Template'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Templates;
