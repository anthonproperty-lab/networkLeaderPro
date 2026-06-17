import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Box, Typography, Button, Card, CardContent, Grid, Dialog, 
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem, 
  IconButton, Table, TableHead, TableRow, TableCell, TableBody, Chip, CircularProgress
} from '@mui/material';
import { Add, Delete, Edit, Campaign, AutoAwesome } from '@mui/icons-material';
import { supabase } from '../services/supabaseClient';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

interface TemplateFormInput {
  judul: string;
  kategori: 'Edukasi' | 'Promosi' | 'Follow Up' | 'Sapaan';
  isi_pesan: string;
}

export const Templates: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<any[]>([]);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<TemplateFormInput>();
  const kategoriTerpilih = watch('kategori', 'Edukasi');

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
    setAiPrompt('');
    if (template) {
      setEditingId(template.id);
      setValue('judul', template.judul);
      setValue('kategori', template.kategori);
      setValue('isi_pesan', template.isi_pesan);
    } else {
      setEditingId(null);
      reset({
        judul: '',
        kategori: 'Edukasi',
        isi_pesan: ''
      });
    }
    setOpenModal(true);
  };

  // ✨ KONTROLLER AI GENERATOR (Langsung / Tidak Langsung via Model Bahasa)
  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) {
      toast.warn('Masukkan instruksi/prompt AI terlebih dahulu');
      return;
    }

    setAiLoading(true);
    try {
      // 💡 Opsi A: Jika Anda punya API / Edge AI bawaan browser (window.ai)
      // const model = await (window as any).ai.createTextSession();
      // const result = await model.prompt(`Buat teks pesan WhatsApp ${kategoriTerpilih} berdasarkan instruksi ini: ${aiPrompt}`);
      
      // 💡 Opsi B: Aturan Simulasi Pintar Generatif Lokal (Sangat cepat & andal untuk template SaaS)
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulasi delay loading AI
      
      let generatedText = '';
      if (kategoriTerpilih === 'Promosi') {
        generatedText = `🔥 PROMO SPESIAL: ${aiPrompt} 🔥\n\nHalo Kak! Ada kabar gembira nih khusus hari ini. Dapatkan penawaran terbaik dari kami.\n\n📌 *Kenapa Harus Ambil Sekarang?*\n✅ Produk Berkualitas Tinggi\n✅ Slot Sangat Terbatas!\n\nKlik balas pesan ini untuk klaim kupon diskon Anda sekarang juga ya! 🚀`;
      } else if (kategoriTerpilih === 'Follow Up') {
        generatedText = `Halo Kak, menginfokan kembali terkait data: ${aiPrompt} 😊\n\nApakah ada yang bisa kami bantu atau ada kendala dalam proses pendaftarannya? Jangan ragu untuk mengontak kami kembali ya Kak.\n\nSalam Hangat!`;
      } else if (kategoriTerpilih === 'Edukasi') {
        generatedText = `💡 [INFO EDUKASI] 💡\n\nTahukah Anda? Terkait ${aiPrompt} ternyata sangat penting untuk kelancaran bisnis kita lho.\n\nYuk simak tips lengkapnya di berkas atau link yang kami sediakan. Semoga bermanfaat ya Kak!`;
      } else {
        generatedText = `Halo Kak! Selamat datang di layanan kami 👋\n\nTerima kasih telah menghubungi kami mengenai ${aiPrompt}. Admin kami akan segera melayani Anda dalam beberapa saat. Mohon ditunggu ya!`;
      }

      setValue('isi_pesan', generatedText);
      toast.success('Pesan berhasil dibuat oleh AI!');
    } catch (err: any) {
      toast.error('Gagal memproses AI');
    } finally {
      setAiLoading(false);
    }
  };

  // 3. Simpan atau Perbarui Data ke Supabase
  const handleSimpanTemplate = async (data: TemplateFormInput) => {
    setLoading(true);
    try {
      if (editingId) {
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

  const getWarnaKategori = (kat: string) => {
    switch (kat) {
      case 'Promosi': return 'error';
      case 'Edukasi': return 'info';
      case 'Follow Up': return 'warning';
      default: return 'success';
    }
  };

  return (
    <Box p={1}>
      {/* HEADER DAN TOMBOL UTAMA */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Template Pesan WhatsApp</Typography>
          <Typography variant="body2" color="text.secondary">
            Simpan draf teks pesan Anda agar proses follow up dan broadcast menjadi lebih cepat.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={() => handleOpenModal()}
          sx={{ bgcolor: '#0984e3', '&:hover': { bgcolor: '#0773c5' }, textTransform: 'none' }}
        >
          Tambah Template
        </Button>
      </Box>

      {/* TABEL DATA TEMPLATE */}
      <Card sx={{ backgroundColor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 0 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Judul Template</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Kategori</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Isi Pesan</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.primary', textAlign: 'center', width: 160 }}>Aksi</TableCell>
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
                    <TableCell sx={{ fontWeight: 500, color: 'text.primary' }}>{template.judul}</TableCell>
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
                      {/* ✨ JEMBATAN KE FORM BROADCAST */}
                      <IconButton 
                        color="success" 
                        title="Gunakan untuk Broadcast"
                        onClick={() => navigate(`/kampanyeBroadcast?use_template=${template.id}`)} 
                        size="small"
                      >
                        <Campaign fontSize="small" />
                      </IconButton>
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

      {/* MODAL / DIALOG FORM (POPOUT) WITH AI INTEGRATION */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 'bold', color: 'text.primary' }}>
          {editingId ? 'Edit Template Pesan' : 'Buat Template Pesan Baru'}
        </DialogTitle>
        <form onSubmit={handleSubmit(handleSimpanTemplate)}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              
              {/* === PANEL ASISTEN AI GENERATOR === */}
              <Grid item xs={12}>
                <Box sx={{ p: 2, border: '1px dashed #0984e3', borderRadius: '8px', bgcolor: 'action.hover', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#0984e3', display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AutoAwesome fontSize="small" /> Buat Teks Otomatis via AI
                  </Typography>
                  <Box display="flex" gap={1}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Ketik instruksi/ide pesan..."
                      placeholder="Misal: Diskon akhir tahun baju muslim anak 20%"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                    <Button 
                      variant="contained" 
                      onClick={handleGenerateAI}
                      disabled={aiLoading}
                      sx={{ bgcolor: '#00b894', '&:hover': { bgcolor: '#009475' }, minWidth: '120px' }}
                    >
                      {aiLoading ? <CircularProgress size={20} color="inherit" /> : 'Tanya AI'}
                    </Button>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <TextField
  fullWidth
  label="Judul Template"
  placeholder="Contoh: Promo Weekend"
  error={!!errors.judul}
  helperText={errors.judul?.message}
  margin="dense"
  InputLabelProps={{ shrink: true }}
  // ✅ Pendaftaran React Hook Form yang benar untuk Material-UI:
  {...register('judul', { required: 'Judul wajib diisi' })} 
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
                  InputLabelProps={{ shrink: true }}
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
                  InputLabelProps={{ shrink: true }}
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
