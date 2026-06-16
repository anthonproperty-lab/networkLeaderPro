import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextField, Button, Box, Typography, Card, CardContent, Link } from '@mui/material';
import { schemaLogin } from '../utils/validators';
import { supabase } from '../services/supabaseClient';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schemaLogin) });

  const onSubmit = async (data: any) => {
    const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
    if (error) toast.error(`Autentikasi Gagal: ${error.message}`);
    else {
      toast.success('Selamat datang kembali!');
      window.location.href = '/dashboard';
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="background.default">
      <Card sx={{ maxWidth: 400, width: '100%', p: 2 }}>
        <CardContent>
          <Typography variant="h5" align="center" sx={{ fontWeight: 'bold', mb: 3 }}>Masuk Akun CRM</Typography>
          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField fullWidth label="Email" margin="normal" {...register('email')} error={!!errors.email} helperText={errors.email?.message as string} />
            <TextField fullWidth label="Kata Sandi" type="password" margin="normal" {...register('password')} error={!!errors.password} helperText={errors.password?.message as string} />
            <Button fullWidth type="submit" variant="contained" size="large" disabled={isSubmitting} sx={{ mt: 3, mb: 2 }}>{isSubmitting ? 'Memverifikasi...' : 'Masuk Sistem'}</Button>
          </form>
          <Box display="flex" justifyContent="space-between" mt={1}>
            <Link href="/lupa-password" variant="body2" color="primary">Lupa Sandi?</Link>
            <Link href="/register" variant="body2" color="primary">Daftar Tenant Baru</Link>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
export default Login;
