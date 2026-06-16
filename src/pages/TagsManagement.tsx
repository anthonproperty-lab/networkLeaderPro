import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, TextField, Button, Card, CardContent, 
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, Grid 
} from '@mui/material';
import { Delete, Add, Label } from '@mui/icons-material';
import { supabase } from '../services/supabaseClient';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'react-toastify';

export const TagsManagement: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [tags, setTags] = useState<any[]>([]);
  const [newTagName, setNewTagName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // 1. Ambil daftar tag milik user yang sedang aktif
  const fetchTags = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // Fallback jika skema database Anda menggunakan 'nama_tag' dan bukan 'name'
        const { data: dataAlt, error: errAlt } = await supabase
          .from('tags')
          .select('id, nama_tag, created_at')
          .order('created_at', { ascending: false });
        
        if (!errAlt) {
          setTags(dataAlt?.map(t => ({ id: t.id, name: t.nama_tag })) || []);
          return;
        }
        throw error;
      }
      setTags(data || []);
    } catch (err: any) {
      toast.error(`Gagal memuat label: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchTags();
  }, [user]);

  // 2. Tambah Label Baru
  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    setLoading(true);
    try {
      // Cek dulu apakah nama kolom Anda di Supabase 'name' atau 'nama_tag'
      // Kita coba masukkan dengan struktur default 'name' terlebih dahulu
      const { error } = await supabase
        .from('tags')
        .insert([{ user_id: user?.id, name: newTagName.trim() }]);

      if (error) {
        // Jika error, kemungkinan nama kolom di DB adalah 'nama_tag'
        const { error: errAlt } = await supabase
          .from('tags')
          .insert([{ user_id: user?.id, nama_tag: newTagName.trim() }]);
        
        if (errAlt) throw errAlt;
      }

      toast.success('Label baru berhasil ditambahkan!');
      setNewTagName('');
      fetchTags(); // Refresh list tabel
    } catch (err: any) {
      toast.error(`Gagal menambahkan label: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 3. Hapus Label
  const handleDeleteTag = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus label ini? Kontak yang menggunakan label ini akan otomatis dilepas labelnya.')) return;

    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Label berhasil dihapus');
      fetchTags();
    } catch (err: any) {
      toast.error(`Gagal menghapus label: ${err.message}`);
    }
  };

  return (
    <Box p={1}>
      <Box mb={3}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Manajemen Label Kontak</Typography>
        <Typography variant="body2" color="textSecondary">
          Buat dan kelola kategori/label untuk mempermudah pengelompokan kontak broadcast Anda.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* FORM TAMBAH TAG */}
        <Grid item xs={12} md={4}>
          <Card sx={{ boxShadow: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, fontSize: '1.1rem' }}>
                Tambah Label Baru
              </Typography>
              <form onSubmit={handleAddTag}>
                <TextField
                  fullWidth
                  label="Nama Label / Tag"
                  placeholder="Contoh: Agen Jatim, Brosur Mei"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  margin="normal"
                  required
                />
                <Button 
                  type="submit" 
                  fullWidth 
                  variant="contained" 
                  startIcon={<Add />}
                  disabled={loading}
                  sx={{ mt: 2, bgcolor: '#0984e3', '&:hover': { bgcolor: '#74b9ff' } }}
                >
                  {loading ? 'Menyimpan...' : 'Simpan Label'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* DAFTAR TABEL TAG YANG SUDAH ADA */}
        <Grid item xs={12} md={8}>
          <Card sx={{ boxShadow: 2 }}>
            <CardContent sx={{ p: 0 }}>
              <Table>
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Nama Label</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', align: 'right', width: '15%' }}>Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tags.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        Belum ada label yang dibuat. Silakan tambah di panel sebelah kiri.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tags.map((tag) => (
                      <TableRow key={tag.id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Label fontSize="small" sx={{ color: '#0984e3' }} />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {tag.name || tag.nama_tag}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton 
                            color="error" 
                            onClick={() => handleDeleteTag(tag.id)}
                            size="small"
                          >
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
        </Grid>
      </Grid>
    </Box>
  );
};

export default TagsManagement;
