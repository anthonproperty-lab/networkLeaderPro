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
        // 🛠️ PERBAIKAN: Menambahkan relasi eksplisit antara member_level dan tabel subscription_packages
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            nama,
            member_level,
            subscription_packages!member_level (
              max_token
            )
          `)
          .eq('id', user.id)
          .single();
        
        if (error) throw error;

        if (data) {
          setNama(data.nama);
          
          const level = data.member_level || 'free';
          setPaket(level);
          
          // 🛠️ PERBAIKAN: Membaca data array/object bersarang dari Supabase secara aman
          const targetPaket = data.subscription_packages;
          const tokenLimit = Array.isArray(targetPaket) 
            ? targetPaket[0]?.max_token 
            : (targetPaket as any)?.max_token;

          setMaxToken(tokenLimit || 10000); // Default ke 10000 jika data gagal termuat
        }
      } catch (err: any) {
        console.error("Gagal memuat data profil & paket:", err.message);
        // Fallback jika terjadi error jaringan agar tidak tampil 0
        setMaxToken(10000); 
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
