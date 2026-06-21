import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, TextField, Button, Avatar } from '@mui/material';
import { supabase } from '../services/supabaseClient';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'react-toastify';

export const Profil: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [nama, setNama] = useState('');
  const [paket, setPaket] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Tambahkan state baru untuk menyimpan batas token di bagian atas komponen
const [maxToken, setMaxToken] = useState<number>(0);

// 2. Ubah fungsi pengambilan data di useEffect
useEffect(() => {
  const getProfileData = async () => {
    if (user) {
      try {
        // Melakukan JOIN ke tabel subscription_packages berdasarkan relasi level
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            nama,
            member_level,
            subscription_packages (
              max_token
            )
          `)
          .eq('id', user.id)
          .single();
        
        if (error) throw error;

        if (data) {
          setNama(data.nama);
          
          // Set level paket (default 'free' jika kosong)
          const level = data.member_level || 'free';
          setPaket(level);
          
          // Ambil data max_token dari hasil join tabel
          // @ts-ignore
          const tokenLimit = data.subscription_packages?.max_token || 0;
          setMaxToken(tokenLimit);
        }
      } catch (err: any) {
        console.error("Gagal memuat data profil & paket:", err.message);
      }
    }
  };
  getProfileData();
}, [user]);

  const simpanProfil = async () => {
    if (!nama.trim()) return toast.error('Nama tidak boleh dikosongkan');
    setLoading(true);
    const { error } = await supabase.from('profiles').update({ nama }).eq('id', user?.id);
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success('Informasi akun berhasil disimpan');
  };

  return (
    <Box maxW={600}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>Pengaturan Profil Tenant</Typography>
      <Card>
        <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <Avatar sx={{ width: 80, height: 80, bgcolor: '#0984e3', fontSize: '2rem' }}>{nama.substring(0,1).toUpperCase()}</Avatar>
          <Box width="100%">
            <TextField fullWidth label="ID Tenant (Multi-Tenant ID)" disabled value={user?.id || ''} margin="normal" />
            <TextField fullWidth label="Alamat Email Akun" disabled value={user?.email || ''} margin="normal" />
            <TextField fullWidth label="Nama Pengguna/Perusahaan" value={nama} onChange={(e) => setNama(e.target.value)} margin="normal" />
            <TextField fullWidth label="Paket Berlangganan CRM" disabled value={`${paket.toUpperCase()} PACKAGE`} margin="normal" />
            <TextField fullWidth label="Batas Maksimal Kuota Token AI" disabled value={`${maxToken.toLocaleString('id-ID')} Token`} margin="normal" />
          </Box>
          <Button variant="contained" fullWidth disabled={loading} onClick={simpanProfil}>{loading ? 'Memproses...' : 'Simpan Pembaruan Profil'}</Button>
        </CardContent>
      </Card>
    </Box>
  );
};
export default Profil;
