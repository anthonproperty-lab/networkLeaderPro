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

// 2. Fungsi pengambilan data di useEffect yang sudah disinkronkan dengan skema database asli
useEffect(() => {
  const getProfileData = async () => {
    if (user) {
      try {
        // Langkah 1: Ambil data utama dari tabel 'profiles'
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('nama, member_level')
          .eq('id', user.id)
          .single();
        
        if (profileError) throw profileError;

        if (profileData) {
          // Sinkronisasi Nama Pengguna asli dari database
          setNama(profileData.nama || '');
          
          // Sinkronisasi Level Paket (menggunakan huruf kecil sesuai isi database admin)
          const levelAktif = profileData.member_level || 'free';
          setPaket(levelAktif);

          // Langkah 2: Ambil max_token dari 'subscription_packages' berdasarkan level aktif
          const { data: packageData, error: packageError } = await supabase
            .from('subscription_packages')
            .select('max_token')
            .eq('level', levelAktif)
            .maybeSingle();

          if (!packageError && packageData) {
            setMaxToken(packageData.max_token);
          } else {
            // Pengaman (Fallback) jika baris paket di database belum dibuat/tidak cocok
            setMaxToken(levelAktif === 'free' ? 50 : 10000);
          }
        }
      } catch (err: any) {
        console.error("Gagal memuat data profil & paket:", err.message);
      }
    }
  };
  getProfileData();
}, [user, paket]);

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
