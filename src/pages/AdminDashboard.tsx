import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Grid, Card, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, Chip, Button, 
  Tabs, Tab, CircularProgress, IconButton, Select, MenuItem, FormControl 
} from '@mui/material';
import { SupervisorAccount, ConfirmationNumber, Block, CheckCircle, Refresh, Stars } from '@mui/icons-material';
import { supabase } from '../services/supabaseClient';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'react-toastify';

interface UserProfile {
  id: string;
  member_level: string;
  token_used: number;
  is_blocked: boolean;
  role: string;
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

export const AdminDashboard: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user); // Mengambil data admin yang sedang login
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<UserProfile[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      // 1. Ambil data semua profile
      const { data: profilesData, error: errProfiles } = await supabase
        .from('profiles')
        .select('*')
        .order('role', { ascending: false });
      
      if (errProfiles) throw errProfiles;
      setTenants(profilesData || []);

      // 2. Ambil semua tiket bantuan
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

  // 🛠️ FUNGSI BARU: Mengubah Level Paket Tenant
  const handleUpdateLevelPaket = async (userId: string, levelBaru: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ member_level: levelBaru })
        .eq('id', userId);

      if (error) throw error;
      toast.success("Level paket berhasil diperbarui!");
      setTenants(prev => prev.map(t => t.id === userId ? { ...t, member_level: levelBaru } : t));
    } catch (error: any) {
      toast.error(`Gagal mengubah paket: ${error.message}`);
    }
  };

  // 🛠️ FUNGSI BARU: Menambah / Menghapus Jabatan Admin (Hanya untuk Super Admin)
  const handleUpdateRole = async (userId: string, roleBaru: string) => {
    if (currentUser?.role !== 'super_admin') {
      toast.error("Hanya Owner Utama (Super Admin) yang berhak mengubah struktur manajemen staf!");
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: roleBaru })
        .eq('id', userId);

      if (error) throw error;
      toast.success(`Akses user berhasil diubah menjadi ${roleBaru.toUpperCase()}!`);
      setTenants(prev => prev.map(t => t.id === userId ? { ...t, role: roleBaru } : t));
    } catch (error: any) {
      toast.error(`Gagal memperbarui role: ${error.message}`);
    }
  };

  const handleToggleBlokir = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_blocked: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      toast.success(currentStatus ? "Akun diaktifkan kembali!" : "Akun berhasil ditangguhkan!");
      setTenants(prev => prev.map(t => t.id === userId ? { ...t, is_blocked: !currentStatus } : t));
    } catch (error: any) {
      toast.error(`Gagal mengubah status akses: ${error.message}`);
    }
  };

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
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Panel Kendali Admin Utama</Typography>
          <Typography variant="body2" color="text.secondary">
            Kelola level paket tenant, otoritas tim admin, penangguhan akun, dan respon tiket kendala sistem.
          </Typography>
        </Box>
        <IconButton onClick={fetchAdminData} color="primary" sx={{ border: '1px solid', borderColor: 'divider' }}>
          <Refresh />
        </IconButton>
      </Box>

      {/* Widget Statistik */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Total Pengguna Terdaftar</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 0.5 }}>{tenants.length}</Typography>
            </Box>
            <SupervisorAccount fontSize="large" color="primary" />
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Akun Ditangguhkan</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 0.5, color: '#ff7675' }}>{totalTerblokir}</Typography>
            </Box>
            <Block fontSize="large" color="error" />
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Tiket Bantuan Aktif</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 0.5, color: '#f1c40f' }}>{tiketTerbuka}</Typography>
            </Box>
            <ConfirmationNumber fontSize="large" color="warning" />
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, nv) => setActiveTab(nv)}>
          <Tab label="Manajemen Otoritas & Paket Pengguna" sx={{ fontWeight: 'bold' }} />
          <Tab label={`Tiket Masuk (${tiketTerbuka})`} sx={{ fontWeight: 'bold' }} />
        </Tabs>
      </Box>

      {/* TAB 0: MANAJEMEN TENANT & ADMIN */}
      {activeTab === 0 && (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', py: 1.5 }}>User ID / Akun</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Aktor (Role)</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Level Paket</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Token Terpakai</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Aksi Kendali</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id} sx={{ bgcolor: tenant.role !== 'tenant' ? 'rgba(9, 132, 227, 0.05)' : 'inherit' }}>
                  <TableCell sx={{ py: 1.5, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {tenant.id} {tenant.id === currentUser?.id && ' (Anda)'}
                  </TableCell>
                  
                  {/* Otoritas Role (Tambah/Hapus Admin) */}
                  <TableCell>
                    {tenant.role === 'super_admin' ? (
                      <Chip icon={<Stars />} label="SUPER ADMIN" color="secondary" size="small" sx={{ fontWeight: 'bold' }} />
                    ) : (
                      <FormControl size="small" variant="standard">
                        <Select
                          value={tenant.role}
                          disabled={currentUser?.role !== 'super_admin'}
                          onChange={(e) => handleUpdateRole(tenant.id, e.target.value)}
                          sx={{ fontSize: '0.85rem', fontWeight: 600 }}
                        >
                          <MenuItem value="tenant">Tenant (User)</MenuItem>
                          <MenuItem value="admin">Admin Staf</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  </TableCell>

                  {/* Pengubah Level Paket Dropdown */}
                  <TableCell>
                    {tenant.role !== 'tenant' ? (
                      <Typography variant="caption" color="text.secondary">Akses Penuh</Typography>
                    ) : (
                      <FormControl size="small" variant="standard">
                        <Select
                          value={tenant.member_level || 'free'}
                          onChange={(e) => handleUpdateLevelPaket(tenant.id, e.target.value)}
                          sx={{ fontSize: '0.85rem', fontWeight: 600 }}
                        >
                          <MenuItem value="free">FREE</MenuItem>
                          <MenuItem value="basic">BASIC</MenuItem>
                          <MenuItem value="premium">PREMIUM</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  </TableCell>

                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {tenant.role === 'tenant' ? `${tenant.token_used} Pesan` : '-'}
                  </TableCell>
                  
                  <TableCell>
                    <Chip 
                      label={tenant.is_blocked ? "DIBLOKIR" : "AKTIF"} 
                      size="small" 
                      color={tenant.is_blocked ? "error" : "success"} 
                      sx={{ fontWeight: 'bold' }} 
                    />
                  </TableCell>

                  <TableCell align="center">
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={tenant.role === 'super_admin' || tenant.id === currentUser?.id}
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
                <TableCell sx={{ fontWeight: 'bold', py: 1.5 }}>Pengirim</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Kategori / Subjek</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Isi Pesan</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Tindakan</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    Tidak ada tiket bantuan masuk.
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
                    <TableCell align="center">
                      <Box display="flex" gap={1} justifyContent="center">
                        {ticket.status === 'Terbuka' && (
                          <Button variant="contained" color="warning" size="small" onClick={() => handleUpdateStatusTiket(ticket.id, 'Diproses')} sx={{ fontWeight: 'bold', fontSize: '11px' }}>
                            Proses
                          </Button>
                        )}
                        {ticket.status !== 'Selesai' && (
                          <Button variant="contained" color="success" size="small" onClick={() => handleUpdateStatusTiket(ticket.id, 'Selesai')} sx={{ fontWeight: 'bold', fontSize: '11px' }}>
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
    </Box>
  );
};

export default AdminDashboard;
