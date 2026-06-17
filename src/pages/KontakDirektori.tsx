import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Button, Box, Typography, IconButton } from '@mui/material';
import { Delete, Edit, WhatsApp } from '@mui/icons-material';
import { supabase } from '../services/supabaseClient';
import { toast } from 'react-toastify';

interface Contact {
  id: string;
  nama_lengkap: string;
  nomor_whatsapp: string;
  status: string;
}

export const KontakDirektori: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');

  const fetchContacts = async () => {
    let query = supabase.from('contacts').select('id, nama_lengkap, nomor_whatsapp, status');
    if (search) {
      query = query.ilike('nama_lengkap', `%${search}%`);
    }
    const { data, error } = await query;
    if (!error && data) setContacts(data as unknown as Contact[]);
  };

  useEffect(() => {
    fetchContacts();
  }, [search]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus kontak ini?')) {
      const { error } = await supabase.from('contacts').delete().eq('id', id);
      if (!error) {
        toast.success('Kontak berhasil dihapus');
        fetchContacts();
      } else {
        toast.error('Gagal menghapus kontak');
      }
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        {/* ✅ PERBAIKAN 1: Judul menggunakan 'text.primary' agar dinamis hitam/putih */}
        <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
          Direktori Kontak Prospek
        </Typography>
        <Button variant="contained" color="primary" href="/kontak/tambah">+ Tambah Kontak Baru</Button>
      </Box>

      {/* ✅ PERBAIKAN 2: TextField disesuaikan agar warna input & label mengikuti tema bawaan theme MUI */}
      <TextField
        fullWidth
        label="Cari nama kontak di sini..."
        variant="outlined"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ 
          mb: 3, 
          backgroundColor: 'background.paper',
          borderRadius: '4px'
        }}
      />

      {/* ✅ PERBAIKAN 3: TableContainer menggunakan 'background.paper' dan border adaptif */}
      <TableContainer component={Paper} sx={{ backgroundColor: 'background.paper', backgroundImage: 'none', border: '1px solid', borderColor: 'divider' }}>
        <Table>
          <TableHead>
            <TableRow>
              {/* ✅ PERBAIKAN 4: Header tabel menggunakan 'text.secondary' bawaan MUI */}
              <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Nama Lengkap</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Nomor WhatsApp</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold', textAlign: 'center' }}>Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow key={contact.id} hover>
                {/* ✅ PERBAIKAN 5: Teks nama diubah ke 'text.primary' */}
                <TableCell sx={{ color: 'text.primary' }}>{contact.nama_lengkap}</TableCell>
                <TableCell>
                  <Button 
                    size="small" 
                    startIcon={<WhatsApp color="success" />} 
                    href={`https://wa.me/${contact.nomor_whatsapp}`} 
                    target="_blank"
                    sx={{ color: 'success.main', fontWeight: 'medium' }} // Menggunakan token warna tema utama sukses
                  >
                    {contact.nomor_whatsapp}
                  </Button>
                </TableCell>
                {/* ✅ PERBAIKAN 6: Status menggunakan token warna info/primary bawaan tema agar kontras */}
                <TableCell sx={{ color: 'info.main', fontWeight: 'medium' }}>{contact.status}</TableCell>
                <TableCell align="center">
                  <IconButton href={`/kontak/edit/${contact.id}`} sx={{ color: 'primary.main' }}><Edit /></IconButton>
                  <IconButton onClick={() => handleDelete(contact.id)} sx={{ color: 'error.main' }}><Delete /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default KontakDirektori;
