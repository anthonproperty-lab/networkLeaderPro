import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextField, Button, Box, Typography, Card, CardContent } from '@mui/material';
import { schemaRegister, RegisterInput } from '../utils/validators';
import { supabase } from '../services/supabaseClient';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterInput>({
    resolver: zodResolver(schemaRegister)
  });

  const onSubmit = async (data: RegisterInput) => {
    // Mendaftarkan user ke auth Supabase sekaligus menyisipkan metadata nama
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          nama: data.nama
        }
      }
    });

    if (error) {
      toast.error(`Pendaftaran Gagal: ${error.message}`);
    } else {
      toast.success('Pendaftaran Berhasil! Silakan periksa kotak masuk email Anda untuk verifikasi.');
      navigate('/login');
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#101318">
      <Card sx={{ maxWidth: 400, width: '100%', background: '#181c23', border: '1px solid #1f252f', borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" align="center" sx={{ color: '#fff', fontWeight: 'bold', mb: 3 }}>
            Daftar Network Lead Pro
          </Typography>
          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              fullWidth
              label="Nama Lengkap"
              variant="outlined"
              margin="normal"
              {...register('nama')}
              error={!!errors.nama}
              helperText={errors.nama?.message}
              InputLabelProps={{ style: { color: '#7f8c8d' } }}
              inputProps={{ style: { color: '#fff' } }}
            />
            <TextField
              fullWidth
              label="Email"
              variant="outlined"
              margin="normal"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
              InputLabelProps={{ style: { color: '#7f8c8d' } }}
              inputProps={{ style: { color: '#fff' } }}
            />
            <TextField
              fullWidth
              label="Kata Sandi"
              type="password"
              variant="outlined"
              margin="normal"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              InputLabelProps={{ style: { color: '#7f8c8d' } }}
              inputProps={{ style: { color: '#fff' } }}
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting}
              sx={{ mt: 3, py: 1.5, fontWeight: 'bold' }}
            >
              {isSubmitting ? 'Memproses...' : 'Daftar Sekarang'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};
export default Register;
