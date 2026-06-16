import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextField, Button, Box, Typography, Card, CardContent, MenuItem } from '@mui/material';
import { schemaContact } from '../utils/validators';
import { supabase } from '../services/supabaseClient';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';

export const KontakForm: React.FC<{ mode: 'create' | 'edit' }> = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [groups, setGroups] = useState<any[]>([]); // Menyimpan list grup kontak dari Supabase

  // Inisialisasi React Hook Form dengan defaultValues agar terkontrol penuh oleh Controller
  const { register, handleSubmit, setValue, control, formState: { errors, isSubmitting } } = useForm({ 
    resolver: zodResolver(schemaContact),
    defaultValues: {
      nama_depan: '',
      nama_belakang: '',
      nomor_whatsapp: '',
      status: 'Baru',
      group_id: '', // Diinisialisasi string kosong agar aman saat render awal
      catatan: ''
    }
  });

  // 1. Ambil daftar grup dari database saat halaman dibuka
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const { data, error } = await supabase
          .from('contact_groups')
          .select('id, nama_grup')
          .order('nama_grup', { ascending: true });

        if (error) throw error;
        setGroups(data || []);
      } catch (err: any) {
        console.error('Gagal mengambil grup:', err.message);
      }
    };
    
    fetchGroups();
  }, []);

  // 2. Ambil detail kontak jika dalam mode Edit
  useEffect(() => {
    if (mode === 'edit' && id) {
      const getContactDetail = async () => {
        const { data, error } = await supabase.from('contacts').select('*').eq('id', id).single();
        if (!error && data) {
          setValue('nama_depan', data.nama_depan || '');
          setValue('nama_belakang', data.nama_belakang || '');
          setValue('nomor_whatsapp', data.nomor_whatsapp || '');
          setValue('catatan', data.catatan || '');
          setValue('status', data.status || 'Baru');
          // Jika di DB bernilai null, isi dengan string kosong agar dropdown tidak error
          setValue('group_id', data.group_id || ''); 
        }
      };
      getContactDetail();
    }
  }, [mode, id, setValue]);

  // 3. Proses pengiriman data ke Supabase
  const onSubmit = async (formData: any) => {
    // Normalisasi data: Jika group_id bernilai string kosong, ubah menjadi null agar sesuai tipe UUID di postgres
    const payload = {
      ...formData,
      group_id: formData.group_id === '' ? null : formData.group_id
    };

    if (mode === 'create') {
      const { error } = await supabase.from('contacts').insert([payload]);
      if (error) toast.error(error.message);
      else { 
        toast.success('Kontak sukses ditambahkan'); 
        navigate('/kontak'); 
      }
    } else {
      const { error } = await supabase.from('contacts').update(payload).eq('id', id);
      if (error) toast.error(error.message);
      else { 
        toast.success('Perubahan kontak berhasil disimpan'); 
        navigate('/kontak'); 
      }
    }
  };

  return (
    <Box p={1}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
        {mode === 'create' ? 'Tambah Kontak Baru' : 'Perbarui Data Kontak'}
      </Typography>
      <Card>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            
            <TextField fullWidth label="Nama Depan" margin="normal" {...register('nama_depan')} error={!!errors.nama_depan} helperText={errors.nama_depan?.message as string} />
            
            <TextField fullWidth label="Nama Belakang" margin="normal" {...register('nama_belakang')} />
            
            <TextField fullWidth label="Nomor WhatsApp (Format: 628xxx)" margin="normal" {...register('nomor_whatsapp')} error={!!errors.nomor_whatsapp} helperText={errors.nomor_whatsapp?.message as string} />
            
            <TextField fullWidth select label="Status Prospek" margin="normal" {...register('status')} error={!!errors.status}>
              {['Baru', 'Dihubungi', 'Prospek', 'Pelanggan', 'Tidak Tertarik'].map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>

            {/* DROPDOWN BARU: PILIHAN GRUP KONTAK (MENGGUNAKAN CONTROLLER AGAR SINKRON) */}
            <Controller
              name="group_id"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  select
                  label="Pilih Grup / Kelompok Kontak"
                  margin="normal"
                >
                  <MenuItem value="">-- Tanpa Grup (Umum) --</MenuItem>
                  {groups?.map((g) => (
                    <MenuItem key={g.id} value={g.id}>
                      {g.nama_grup}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <TextField fullWidth multiline rows={3} label="Catatan Tambahan" margin="normal" {...register('catatan')} />
            
            <Box display="flex" gap={2} mt={3} justifyContent="flex-end">
              <Button variant="outlined" onClick={() => navigate('/kontak')}>Batal</Button>
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default KontakForm;
