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

// 2. Fungsi pengambilan data dengan Fitur Realtime agar sinkron instan dengan Admin Panel
useEffect(() => {
  if (!user) return;

  // Fungsi internal untuk menarik kuota token berdasarkan level paket
  const fetchTokenLimit = async (level: string) => {
    const { data: packageData, error: packageError } = await supabase
      .from('subscription_packages')
      .select('max_token')
      .eq('level', level)
      .maybeSingle();

    if (!packageError && packageData) {
      setMaxToken(packageData.max_token);
    } else {
      // Fallback cadangan sesuai tabel database Anda
      if (level === 'free') setMaxToken(50);
      else if (level === 'standard') setMaxToken(2000);
      else if (level === 'vip') setMaxToken(10000);
    }
  };

  // Fungsi untuk mengambil data profil awal
  const getInitialProfileData = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('nama, member_level')
        .eq('id', user.id)
        .single();
      
      if (profileError) throw profileError;

      if (profileData) {
        setNama(profileData.nama || '');
        const levelAktif = profileData.member_level || 'free';
        setPaket(levelAktif);
        await fetchTokenLimit(levelAktif);
      }
    } catch (err: any) {
      console.error("Gagal memuat data profil awal:", err.message);
    }
  };

  getInitialProfileData();

  // 🛠️ AKTIFKAN REALTIME LISTENERS: Mendengarkan perubahan dari Admin Panel secara instan
  const profileSubscription = supabase
    .channel(`realtime-profile-${user.id}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`
      },
      (payload) => {
        const dataBaru = payload.new;
        if (dataBaru) {
          if (dataBaru.nama) setNama(dataBaru.nama);
          
          const levelBaru = dataBaru.member_level || 'free';
          setPaket(levelBaru);
          
          // Tarik kuota token yang baru secara otomatis dari tabel subscription_packages
          fetchTokenLimit(levelBaru);
        }
      }
    )
    .subscribe();

  // Bersihkan fungsi subskripsi saat komponen tidak lagi digunakan
  return () => {
    supabase.removeChannel(profileSubscription);
  };
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
