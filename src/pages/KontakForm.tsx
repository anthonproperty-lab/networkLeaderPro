import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextField, Button, Box, Typography, Card, CardContent, MenuItem } from '@mui/material';
import { schemaContact } from '../utils/validators';
import { supabase } from '../services/supabaseClient';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

type ContactFormValues = z.infer<typeof schemaContact>;

export const KontakForm: React.FC<{ mode: 'create' | 'edit' }> = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [tags, setTags] = useState<any[]>([]);

  const { register, handleSubmit, setValue, control, formState: { errors, isSubmitting } } = useForm<ContactFormValues>({ 
    resolver: zodResolver(schemaContact),
    defaultValues: {
      nama_depan: '',
      nama_belakang: '',
      nomor_whatsapp: '',
      status: 'Baru',
      tag_id: '', 
      catatan: ''
    }
  });

  // 1. Ambil daftar dari tabel 'tags' asli Supabase
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const { data, error } = await supabase
          .from('tags')
          .select('id, name')
          .order('name', { ascending: true });

        if (error) {
          const { data: dataAlt, error: errAlt } = await supabase
            .from('tags')
            .select('id, nama_tag') 
            .order('nama_tag', { ascending: true });
          
          if (!errAlt) {
            setTags(dataAlt?.map(t => ({ id: t.id, name: t.nama_tag })) || []);
            return;
          }
          throw error;
        }
        setTags(data || []);
      } catch (err: any) {
        console.error('Gagal mengambil data tags:', err.message);
      }
    };
    
    fetchTags();
  }, []);

  // 2. Ambil detail kontak jika dalam mode Edit beserta tag-nya
  useEffect(() => {
    if (mode === 'edit' && id) {
      const getContactDetail = async () => {
        const { data: contact, error } = await supabase.from('contacts').select('*').eq('id', id).single();
        if (!error && contact) {
          setValue('nama_depan', contact.nama_depan || '');
          setValue('nama_belakang', contact.nama_belakang || '');
          setValue('nomor_whatsapp', contact.nomor_whatsapp || '');
          setValue('catatan', contact.catatan || '');
          setValue('status', contact.status || 'Baru');
        }

        const { data: contactTag } = await supabase
          .from('contact_tags')
          .select('tag_id')
          .eq('contact_id', id)
          .maybeSingle();
        
        if (contactTag) {
          setValue('tag_id', contactTag.tag_id || '');
        }
      };
      getContactDetail();
    }
  }, [mode, id, setValue]);

  // 3. Proses pengiriman data ke Supabase
  const onSubmit = async (formData: ContactFormValues) => {
    try {
      const contactPayload = {
        nama_depan: formData.nama_depan,
        nama_belakang: formData.nama_belakang || null,
        nomor_whatsapp: formData.nomor_whatsapp,
        status: formData.status || 'Baru',
        catatan: formData.catatan || null
      };

      let contactId = id;

      if (mode === 'create') {
        const { data: newContact, error: errContact } = await supabase
          .from('contacts')
          .insert([contactPayload])
          .select('id')
          .single();

        if (errContact) throw errContact;
        contactId = newContact.id;
      } else {
        const { error: errUpdate } = await supabase
          .from('contacts')
          .update(contactPayload)
          .eq('id', id);

        if (errUpdate) throw errUpdate;
      }

      await supabase.from('contact_tags').delete().eq('contact_id', contactId);

      if (formData.tag_id && formData.tag_id !== '') {
        const { error: errLink } = await supabase
          .from('contact_tags')
          .insert([{ contact_id: contactId, tag_id: formData.tag_id }]);
        
        if (errLink) throw errLink;
      }

      toast.success(mode === 'create' ? 'Kontak sukses ditambahkan' : 'Perubahan kontak berhasil disimpan');
      navigate('/kontak');
    } catch (error: any) {
      toast.error(`Terjadi kesalahan: ${error.message}`);
    }
  };

  return (
    <Box p={1}>
      {/* ✅ PERBAIKAN 1: Menggunakan 'text.primary' agar judul otomatis hitam di light mode dan putih di dark mode */}
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: 'text.primary' }}>
        {mode === 'create' ? 'Tambah Kontak Baru' : 'Perbarui Data Kontak'}
      </Typography>
      
      <Card>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            
            {/* ✅ PERBAIKAN 2: Menambahkan InputLabelProps={{ shrink: true }} agar label tidak menabrak teks */}
            <TextField 
              fullWidth 
              label="Nama Depan" 
              margin="normal" 
              {...register('nama_depan')} 
              error={!!errors.nama_depan} 
              helperText={errors.nama_depan?.message || ''} 
              InputLabelProps={{ shrink: true }}
            />
            
            <TextField 
              fullWidth 
              label="Nama Belakang" 
              margin="normal" 
              {...register('nama_belakang')} 
              InputLabelProps={{ shrink: true }}
            />
            
            <TextField 
              fullWidth 
              label="Nomor WhatsApp (Format: 628xxx)" 
              margin="normal" 
              {...register('nomor_whatsapp')} 
              error={!!errors.nomor_whatsapp} 
              helperText={errors.nomor_whatsapp?.message || ''} 
              InputLabelProps={{ shrink: true }}
            />
            
            <TextField 
              fullWidth 
              select 
              label="Status Prospek" 
              margin="normal" 
              {...register('status')} 
              error={!!errors.status}
              defaultValue="Baru"
              InputLabelProps={{ shrink: true }}
            >
              {['Baru', 'Dihubungi', 'Prospek', 'Pelanggan', 'Tidak Tertarik'].map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>

            <Controller
              name="tag_id"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  select
                  label="Pilih Label / Kelompok Kontak"
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                >
                  <MenuItem value="">-- Tanpa Label (Umum) --</MenuItem>
                  {tags?.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <TextField 
              fullWidth 
              multiline 
              rows={3} 
              label="Catatan Tambahan" 
              margin="normal" 
              {...register('catatan')} 
              InputLabelProps={{ shrink: true }}
            />
            
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
