import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextField, Button, Box, Typography, Card, CardContent, MenuItem } from '@mui/material';
import { schemaContact, ContactInput } from '../utils/validators';
import { supabase } from '../services/supabaseClient';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

export const KontakForm: React.FC = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ContactInput>({
    resolver: zodResolver(schemaContact),
    defaultValues: { status: 'Baru' }
  });

  const onSubmit = async (data: ContactInput) => {
    // user_id tidak perlu dikirim manual karena ditangani oleh default SQL value & RLS aman
    const { error } = await supabase.from('contacts').insert([
      {
        nama_depan: data.nama_depan,
        nama_belakang: data.nama_belakang || null,
        nomor_whatsapp: data.nomor_whatsapp,
        catatan: data.catatan || null,
        status: data.status
      }
    ]);

    if (error) {
      toast.error(`Gagal Menyimpan Kontak: ${error.message}`);
    } else {
      toast.success('Kontak Prospek Berhasil Ditambahkan!');
      navigate('/kontak');
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h5" sx={{ color: '#fff', fontWeight: 'bold', mb: 3 }}>
        Tambah Kontak Prospek Baru
      </Typography>
      <Card sx={{ background: '#181c23', border: '1px solid #1f252f', borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Box display="flex" gap={2}>
              <TextField
                fullWidth
                label="Nama Depan"
                variant="outlined"
                margin="normal"
                {...register('nama_depan')}
                error={!!errors.nama_depan}
                helperText={errors.nama_depan?.message}
                InputLabelProps={{ style: { color: '#7f8c8d' } }}
                inputProps={{ style: { color: '#fff' } }}
              />
              <TextField
                fullWidth
                label="Nama Belakang (Opsional)"
                variant="outlined"
                margin="normal"
                {...register('nama_belakang')}
                InputLabelProps={{ style: { color: '#7f8c8d' } }}
                inputProps={{ style: { color: '#fff' } }}
              />
            </Box>
            <TextField
              fullWidth
              label="Nomor WhatsApp (Contoh: 62812345678)"
              variant="outlined"
              margin="normal"
              {...register('nomor_whatsapp')}
              error={!!errors.nomor_whatsapp}
              helperText={errors.nomor_whatsapp?.message}
              InputLabelProps={{ style: { color: '#7f8c8d' } }}
              inputProps={{ style: { color: '#fff' } }}
            />
            <TextField
              fullWidth
              select
              label="Status Prospek"
              variant="outlined"
              margin="normal"
              defaultValue="Baru"
              {...register('status')}
              error={!!errors.status}
              InputLabelProps={{ style: { color: '#7f8c8d' } }}
              sx={{ '& .MuiSelect-select': { color: '#fff' } }}
            >
              <MenuItem value="Baru">Baru (Lead)</MenuItem>
              <MenuItem value="Dihubungi">Sudah Dihubungi</MenuItem>
              <MenuItem value="Prospek">Prospek Hangat</MenuItem>
              <MenuItem value="Pelanggan">Pelanggan Aktif</MenuItem>
              <MenuItem value="Tidak Tertarik">Tidak Tertarik</MenuItem>
            </TextField>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Catatan Mengenai Prospek"
              variant="outlined"
              margin="normal"
              {...register('catatan')}
              InputLabelProps={{ style: { color: '#7f8c8d' } }}
              inputProps={{ style: { color: '#fff' } }}
            />
            <Box display="flex" gap={2} mt={3}>
              <Button variant="outlined" color="inherit" onClick={() => navigate('/kontak')} sx={{ color: '#fff' }}>
                Batal
              </Button>
              <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan Kontak'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};
export default KontakForm;
