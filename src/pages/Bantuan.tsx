import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Card, Grid, Accordion, AccordionSummary, AccordionDetails, 
  TextField, Button, MenuItem, Tabs, Tab, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Paper, CircularProgress 
} from '@mui/material';
import { ExpandMore, HelpOutline, ConfirmationNumber, Send, Lock } from '@mui/icons-material';
import { supabase } from '../services/supabaseClient';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'react-toastify';

interface Tiket {
  id: string;
  subjek: string;
  kategori: string;
  status: string;
  created_at: string;
}

export const Bantuan: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  
  // State untuk kontrol Tab
  const [activeTab, setActiveTab] = useState<number>(0);

  // State Form Tiket
  const [subjek, setSubjek] = useState<string>('');
  const [kategori, setKategori] = useState<string>('Paket/Token');
  const [pesan, setPesan] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // State Riwayat Tiket
  const [tickets, setTickets] = useState<Tiket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState<boolean>(false);

  // Data Konten FAQ (Bisa Anda sesuaikan sesuai kebutuhan SaaS Anda)
  const faqData = [
    {
      q: "Bagaimana cara kerja perhitungan token pengiriman WhatsApp?",
      a: "1 Token digunakan untuk setiap 1 pesan WhatsApp yang sukses terkirim melalui sistem broadcast atau follow-up. Jika pengiriman gagal, token Anda tidak akan berkurang."
    },
    {
      q: "Apa yang terjadi jika kuota token saya habis di tengah jalan?",
      a: "Sistem pengiriman akan dihentikan secara otomatis untuk menjaga integritas server, dan akun Anda akan ditangguhkan sementara. Anda akan menerima notifikasi di dasbor dan dapat segera menghubungi admin untuk upgrade paket agar pemblokiran dibuka."
    },
    {
      q: "Apakah ada risiko nomor WhatsApp saya diblokir oleh pihak WhatsApp official?",
      a: "Aplikasi kami menyediakan fitur jeda waktu (delay) otomatis selama 5 detik antar pesan untuk meminimalkan risiko ban. Namun, kami sangat menyarankan agar Anda hanya mengirim pesan kepada kontak yang memang mengenal bisnis Anda untuk menghindari laporan spam dari penerima."
    },
    {
      q: "Bagaimana cara melakukan upgrade paket dari Free ke Standard atau VIP?",
      a: "Anda dapat masuk ke Tab 'Kirim Tiket Bantuan' di halaman ini, pilih kategori 'Paket/Token', dan tuliskan permintaan upgrade. Anda juga dapat langsung menekan tombol WhatsApp Admin pada banner dasbor jika akun Anda sudah telanjur terblokir."
    }
  ];

  // Mengambil riwayat tiket bantuan milik user yang sedang login
  const fetchUserTickets = async () => {
    if (!user) return;
    try {
      setLoadingTickets(true);
      const { data, error } = await supabase
        .from('support_tickets')
        .select('id, subjek, kategori, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (activeTab === 1) {
      fetchUserTickets();
    }
  }, [activeTab, user]);

  // Fungsi submit tiket ke Supabase
  const handleKirimTiket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!subjek || !pesan) {
      toast.warn("Mohon isi subjek dan pesan terlebih dahulu!");
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase.from('support_tickets').insert({
        user_id: user.id,
        user_email: user.email,
        subjek,
        kategori,
        pesan,
        status: 'Terbuka'
      });

      if (error) throw error;

      toast.success("Tiket bantuan berhasil dikirim! Admin akan segera memproses.");
      setSubjek('');
      setPesan('');
      // Refresh riwayat tiket
      fetchUserTickets();
    } catch (err: any) {
      toast.error(`Gagal mengirim tiket: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const dapatkanWarnaStatus = (status: string) => {
    switch (status) {
      case 'Diproses': return 'warning';
      case 'Selesai': return 'success';
      default: return 'primary';
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}>
        Pusat Bantuan & Dukungan
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Cari jawaban cepat melalui FAQ atau hubungi tim teknis kami dengan membuat tiket bantuan internal.
      </Typography>

      {/* Navigasi Tab */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} color="primary">
          <Tab icon={<HelpOutline />} iconPosition="start" label="FAQ & Panduan" sx={{ fontWeight: 'bold' }} />
          <Tab icon={<ConfirmationNumber />} iconPosition="start" label="Kirim Tiket Bantuan" sx={{ fontWeight: 'bold' }} />
        </Tabs>
      </Box>

      {/* ================= TAB 1: FAQ ================= */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Pertanyaan yang Sering Diajukan (FAQ)</Typography>
            {faqData.map((item, index) => (
              <Accordion key={index} sx={{ mb: 1.5, borderRadius: '8px', '&:before': { display: 'none' } }}>
                <AccordionSummary expandIcon={<ExpandMore />} sx={{ fontWeight: 600 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{item.q}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {item.a}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, borderRadius: '12px', bgcolor: 'action.hover' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Butuh Bantuan Cepat?</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
                Jika Anda tidak menemukan solusi dari FAQ di samping, jangan ragu untuk membuka tiket dukungan atau beralih ke layanan WhatsApp interaktif.
              </Typography>
              <Button variant="outlined" fullWidth onClick={() => setActiveTab(1)} sx={{ fontWeight: 'bold' }}>
                Buka Tiket Sekarang
              </Button>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ================= TAB 2: KIRIM TIKET ================= */}
      {activeTab === 1 && (
        <Grid container spacing={4}>
          {/* Form Buat Tiket */}
          <Grid item xs={12} md={5}>
            <Card sx={{ p: 3, borderRadius: '12px' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Buat Tiket Baru</Typography>
              <form onSubmit={handleKirimTiket}>
                <TextField
                  label="Subjek Masalah / Judul"
                  fullWidth
                  variant="outlined"
                  size="small"
                  value={subjek}
                  onChange={(e) => setSubjek(e.target.value)}
                  placeholder="Contoh: Upgrade paket VIP keanggotaan"
                  sx={{ mb: 2.5 }}
                />
                
                <TextField
                  select
                  label="Kategori Kendala"
                  fullWidth
                  size="small"
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  sx={{ mb: 2.5 }}
                >
                  <MenuItem value="Paket/Token">Masalah Paket / Pengisian Token</MenuItem>
                  <MenuItem value="Teknis Engine">Kendala Sistem Broadcast / Server</MenuItem>
                  <MenuItem value="Kendala WhatsApp">Nomor WA Tidak Bisa Terhubung</MenuItem>
                  <MenuItem value="Lainnya">Pertanyaan Umum / Lainnya</MenuItem>
                </TextField>

                <TextField
                  label="Detail Pesan / Deskripsi Kendala"
                  fullWidth
                  multiline
                  rows={4}
                  variant="outlined"
                  value={pesan}
                  onChange={(e) => setPesan(e.target.value)}
                  placeholder="Jelaskan kendala Anda secara mendetail di sini..."
                  sx={{ mb: 3 }}
                />

                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary" 
                  fullWidth 
                  startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <Send />}
                  disabled={submitting}
                  sx={{ fontWeight: 'bold' }}
                >
                  {submitting ? 'Mengirim...' : 'Kirim Tiket Dukungan'}
                </Button>
              </form>
            </Card>
          </Grid>

          {/* Riwayat Tiket Masuk */}
          <Grid item xs={12} md={7}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Riwayat Tiket Anda</Typography>
            {loadingTickets ? (
              <Box textAlign="center" p={4}><CircularProgress /></Box>
            ) : tickets.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', color: 'text.secondary', borderRadius: '12px' }}>
                <Lock sx={{ fontSize: 40, color: 'action.disabled', mb: 1 }} />
                <Typography variant="body2">Anda belum pernah membuat tiket bantuan sebelumnya.</Typography>
              </Paper>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'action.hover' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', py: 1.5 }}>Subjek</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Kategori</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Tanggal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tickets.map((ticket) => (
                      <TableRow key={ticket.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell sx={{ py: 1.5, fontWeight: 500 }}>{ticket.subjek}</TableCell>
                        <TableCell>{ticket.kategori}</TableCell>
                        <TableCell>
                          <Chip label={ticket.status} size="small" color={dapatkanWarnaStatus(ticket.status)} sx={{ fontWeight: 'bold', fontSize: '11px' }} />
                        </TableCell>
                        <TableCell color="text.secondary">
                          {new Date(ticket.created_at).toLocaleDateString('id-ID')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Bantuan;
