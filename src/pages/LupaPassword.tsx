import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextField, Button, Box, Typography, Card, CardContent } from '@mui/material';
import { schemaLupaPassword } from '../utils/validators';
import { supabase } from '../services/supabaseClient';
import { toast } from 'react-toastify';

export const LupaPassword: React.FC = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schemaLupaPassword) });

  const onSubmit = async (data: any) => {
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, { redirectTo: `${window.location.origin}/profil` });
    if (error) toast.error(error.message);
    else toast.success('Tautan pemulihan kata sandi telah dikirim ke email Anda.');
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="background.default">
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>Lupa Kata Sandi</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>Masukkan alamat email Anda untuk menerima tautan pembuatan kata sandi baru.</Typography>
          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField fullWidth label="Email" margin="normal" {...register('email')} error={!!errors.email} helperText={errors.email?.message as string} />
            <Button fullWidth type="submit" variant="contained" disabled={isSubmitting} sx={{ mt: 2 }}>{isSubmitting ? 'Mengirim...' : 'Kirim Link Pemulihan'}</Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};
export default LupaPassword;
