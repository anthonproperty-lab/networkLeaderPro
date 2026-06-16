import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextField, Button, Box, Typography, Card, CardContent, MenuItem } from '@mui/material';
import { schemaContact } from '../utils/validators';
import { supabase } from '../services/supabaseClient';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';

export const KontakForm: React.FC<{ mode: 'create' | 'edit' }> = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schemaContact) });

  useEffect(() => {
    if (mode === 'edit' && id) {
      const getContactDetail = async () => {
        const { data, error } = await supabase.from('contacts').select('*').eq('id', id).single();
        if (!error && data) {
          setValue('nama_depan', data.nama_depan);
          setValue('nama_belakang', data.nama_belakang);
          setValue('nomor_whatsapp', data.nomor_whatsapp);
          setValue('catatan', data.catatan);
          setValue('status', data.status);
        }
      };
      getContactDetail();
    }
  }, [mode, id, setValue]);

  const onSubmit = async (data: any) => {
    if (mode === 'create') {
      const { error } = await supabase.from('contacts').insert([data]);
      if (error) toast.error(error.message);
      else { toast.success('Kontak sukses ditambahkan'); navigate('/kontak'); }
    } else {
      const { error } = await supabase.from('contacts').update(data).eq('id', id);
      if (error) toast.error(error.message);
      else { toast.success('Perubahan kontak berhasil disimpan'); navigate('/kontak'); }
    }
  };

  return (
    <Box p={1}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>{mode === 'create' ? 'Tambah Kontak Baru' : 'Perbarui Data Kontak'}</Typography>
      <Card>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField fullWidth label="Nama Depan" margin="normal" {...register('nama_depan')} error={!!errors.nama_depan} helperText={errors.nama_depan?.message as string} />
            <TextField fullWidth label="Nama Belakang" margin="normal" {...register('nama_belakang')} />
            <TextField fullWidth label="Nomor WhatsApp (Format: 628xxx)" margin="normal" {...register('nomor_whatsapp')} error={!!errors.nomor_whatsapp} helperText={errors.nomor_whatsapp?.message as string} />
            <TextField fullWidth select label="Status Prospek" margin="normal" defaultValue="Baru" {...register('status')} error={!!errors.status}>
              {['Baru', 'Dihubungi', 'Prospek', 'Pelanggan', 'Tidak Tertarik'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
            <TextField fullWidth multiline rows={3} label="Catatan Tambahan" margin="normal" {...register('catatan')} />
            <Box display="flex" gap={2} mt={3} justifyContent="flex-end">
              <Button variant="outlined" onClick={() => navigate('/kontak')}>Batal</Button>
              <Button type="submit" variant="contained" disabled={isSubmitting}>{isSubmitting ? 'Menyimpan...' : 'Simpan Data'}</Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};
export default KontakForm;
