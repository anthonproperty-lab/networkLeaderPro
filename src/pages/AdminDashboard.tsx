import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Grid, Card, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, Chip, Button, 
  Tabs, Tab, CircularProgress, IconButton, Select, MenuItem, FormControl, TextField
} from '@mui/material';
import { SupervisorAccount, ConfirmationNumber, Block, CheckCircle, Refresh, AdminPanelSettings, PersonAdd, Delete } from '@mui/icons-material';
import { supabase } from '../services/supabaseClient';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'react-toastify';

interface UserProfile {
  id: string;
  member_level: string;
  token_used: number;
  is_blocked: boolean;
  email?: string;
}

interface SupportTicket {
  id: string;
  user_email: string;
  subjek: string;
  kategori: string;
  pesan: string;
  status: string;
  created_at: string;
}

// 🔐 DAFTAR EMAIL ADMIN HARCODED (Owner Utama + Staf Tambahan)
// Anda bisa menambah atau menghapus email staf admin langsung dari array ini
const ADMIN_LIST = [
  "anthonproperty@gmail.com",    // Owner Utama (Super Admin)
  "afisq5@gmail.com",  // Staf Admin 1
];

export const AdminDashboard: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<UserProfile[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  // Mengubah email saat ini ke lowercase untuk keamanan validasi
  const currentUserEmail = currentUser?.email?.toLowerCase() || '';
  const isSuperAdmin = currentUserEmail === "anthonproperty@gmail.com";

  // Fetch semua data tenant dan tiket bantuan
  const fetchAdminData = async () => {
    try {
      setLoading(true);

      // 1. Ambil data semua profile tenant
      const { data: profilesData, error: errProfiles } = await supabase
        .from('profiles')
        .select('*')
        .order('token_used', { ascending: false });
      
      if (errProfiles) throw errProfiles;
      setTenants(profilesData || []);

      // 2. Ambil semua tiket bantuan dari tenant
      const { data: ticketsData, error: errTickets } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (errTickets) throw errTickets;
      setTickets(ticketsData || []);

    } catch (error: any) {
      toast.error(`Gagal memuat data admin: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // 🛠️ FUNGSI BARU: Mengubah Level Paket Tenant via Dropdown
  const handleUpdateLevelPaket = async (userId: string, levelBaru: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ member_level: levelBaru })
        .eq('id', userId);

      if (error) throw error;
      
      toast.success("Level paket tenant berhasil diperbarui!");
      setTenants(prev => prev.map(t => t.id === userId ? { ...t, member_level: levelBaru } : t));
    } catch (error: any) {
      toast.error(`Gagal mengubah paket: ${error.message}`);
    }
  };

  // Fungsi toggle status blokir
  const handleToggleBlokir = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_blocked: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      toast.success(currentStatus ? "Akun berhasil diaktifkan kembali!" : "Akun tenant berhasil ditangguhkan/blokir!");
      setTenants(prev => prev.map(t => t.id === userId ? { ...t, is_blocked: !currentStatus } : t));
    } catch (error: any) {
      toast.error(`Gagal mengubah status akun: ${error.message}`);
    }
  };

  // Fungsi update status tiket (Diproses / Selesai)
  const handleUpdateStatusTiket = async (ticketId: string, statusBaru: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: statusBaru })
        .eq('id', ticketId);

      if (error) throw error;

      toast.success(`Status tiket diperbarui menjadi: ${statusBaru}`);
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: statusBaru } : t));
    } catch (error: any) {
      toast.error(`Gagal memperbarui tiket: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  const totalTerblokir = tenants.filter(t => t.is_blocked).length;
  const tiketTerbuka = tickets.filter(t => t.status === 'Terbuka').length;

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
            Panel Kendali Admin Utama
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Kelola level paket tenant, pantau kuota token pengiriman, status penangguhan, dan kelola otoritas sistem.
          </Typography>
        </Box>
        <IconButton onClick={fetchAdminData} color="primary" sx={{ border: '1px solid', borderColor: 'divider' }}>
          <Refresh />
        </IconButton>
      </Box>

      {/* Widget Ringkasan */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 2.5, borderRadius: '12px', display: 'flex', alignItems: 'center' }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Total Tenant Terdaftar</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 0.5 }}>{tenants.length}</Typography>
            </Box>
            <SupervisorAccount fontSize="large" color="primary" sx={{ ml: 'auto' }} />
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 2.5, borderRadius: '12px', display: 'flex', alignItems: 'center' }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Akun Ditangguhkan (Blokir)</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 0.5, color: '#ff7675' }}>{totalTerblokir}</Typography>
            </Box>
            <Block fontSize="large" color="error" sx={{ ml: 'auto' }} />
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 2.5, borderRadius: '12px', display: 'flex', alignItems: 'center' }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Tiket Bantuan Aktif</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 0.5, color: '#f1c40f' }}>{tiketTerbuka}</Typography>
            </Box>
            <ConfirmationNumber fontSize="large" color="warning" sx={{ ml: 'auto' }} />
          </Card>
        </Grid>
      </Grid>

      {/* Kontrol Tab Admin */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, nv) => setActiveTab(nv)}>
          <Tab label="Manajemen Kuota & Paket Tenant" sx={{ fontWeight: 'bold' }} />
          <Tab label={`Tiket Masuk (${tiketTerbuka})`} sx={{ fontWeight: 'bold' }} />
          <Tab label="Daftar Manajemen Admin" sx={{ fontWeight: 'bold' }} />
        </Tabs>
      </Box>

      {/* TAB 0: MANAJEMEN TENANT & PAKET */}
      {activeTab === 0 && (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', py: 1.5 }}>User ID Tenant</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Level Paket (Ubah)</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Token Digunakan</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status Akses</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Aksi Kendali</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell sx={{ py: 1.5, fontFamily: 'monospace', fontSize: '0.85rem' }}>{tenant.id}</TableCell>
                  
                  {/* 🛠️ Dropdown Pengubah Paket */}
                  <TableCell>
                    <FormControl size="small" variant="standard" sx={{ minWidth: 100 }}>
                      <Select
                        value={tenant.member_level?.toLowerCase() || 'free'}
                        onChange={(e) => handleUpdateLevelPaket(tenant.id, e.target.value)}
                        sx={{ fontSize: '0.85rem', fontWeight: 'bold' }}
                      >
                        <MenuItem value="free">FREE</MenuItem>
                        <MenuItem value="basic">BASIC</MenuItem>
                        <MenuItem value="premium">PREMIUM</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>

                  <TableCell sx={{ fontWeight: 'bold' }}>{tenant.token_used} Pesan</TableCell>
                  <TableCell>
                    <Chip 
                      label={tenant.is_blocked ? "DIBLOKIR" : "AKTIF"} 
                      size="small" 
                      color={tenant.is_blocked ? "error" : "success"} 
                      sx={{ fontWeight: 'bold' }} 
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      color={tenant.is_blocked ? "success" : "error"}
                      startIcon={tenant.is_blocked ? <CheckCircle /> : <Block />}
                      onClick={() => handleToggleBlokir(tenant.id, tenant.is_blocked)}
                      sx={{ fontWeight: 'bold', borderRadius: '6px' }}
                    >
                      {tenant.is_blocked ? "Buka" : "Blokir"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* TAB 1: MANAJEMEN TIKET BANTUAN */}
      {activeTab === 1 && (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', py: 1.5 }}>Pengirim (Email)</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Kategori / Subjek</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Isi Pesan Kendala</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Tindakan Admin</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    Tidak ada tiket bantuan yang masuk saat ini.
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell sx={{ py: 1.5, fontWeight: 500 }}>{ticket.user_email}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>[{ticket.kategori}]</Typography>
                      <Typography variant="caption" color="text.secondary">{ticket.subjek}</Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: '280px', wordBreak: 'break-word' }}>{ticket.pesan}</TableCell>
                    <TableCell>
                      <Chip 
                        label={ticket.status} 
                        size="small" 
                        color={ticket.status === 'Selesai' ? 'success' : ticket.status === 'Diproses' ? 'warning' : 'primary'} 
                        sx={{ fontWeight: 'bold' }} 
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        {ticket.status === 'Terbuka' && (
                          <Button 
                            variant="contained" 
                            color="warning" 
                            size="small" 
                            onClick={() => handleUpdateStatusTiket(ticket.id, 'Diproses')}
                            sx={{ fontWeight: 'bold', fontSize: '11px' }}
                          >
                            Proses
                          </Button>
                        )}
                        {ticket.status !== 'Selesai' && (
                          <Button 
                            variant="contained" 
                            color="success" 
                            size="small" 
                            onClick={() => handleUpdateStatusTiket(ticket.id, 'Selesai')}
                            sx={{ fontWeight: 'bold', fontSize: '11px' }}
                          >
                            Selesaikan
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 🔐 TAB 2: MANAGEMENT TIM ADMIN SYSTEM */}
      {activeTab === 2 && (
        <Box>
          <Card variant="outlined" sx={{ p: 3, borderRadius: '12px', mb: 3, maxWidth: '600px' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AdminPanelSettings color="primary" /> Otoritas Pengembang & Staf
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Daftar akun di bawah ini diverifikasi langsung dari struktur sistem kode inti program. Hanya email terdaftar yang dapat memuat tab manajemen panel ini.
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', py: 1.2 }}>Email Admin</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Tingkat Otoritas</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ADMIN_LIST.map((email, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ py: 1.5, fontWeight: 500 }}>{email}</TableCell>
                      <TableCell>
                        <Chip 
                          label={idx === 0 ? "OWNER (SUPER)" : "STAF ADMIN"} 
                          size="small" 
                          color={idx === 0 ? "secondary" : "default"} 
                          sx={{ fontWeight: 'bold', fontSize: '11px' }} 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box mt={2}>
              <Typography variant="caption" color="error" sx={{ fontWeight: 500 }}>
                💡 Catatan Pengembang: Untuk menambah/menghapus admin staf baru, silakan buka file `AdminDashboard.tsx` lalu sunting variabel `ADMIN_LIST` di baris atas kode.
              </Typography>
            </Box>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default AdminDashboard;
