import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Button, Box, Typography, IconButton, Chip } from '@mui/material';
import { Delete, Edit, WhatsApp } from '@mui/icons-material';
import { supabase } from '../services/supabaseClient';
import { toast } from 'react-toastify';

interface Contact {
  id: string;
  nama_lengkap: string;
  nomor_whatsapp: string;
  status: string;
  // Memetakan relasi dari tabel contact_tags dan tags
  contact_tags?: {
    tags: {
      nama_tag: string; // Sesuaikan 'nama_tag' dengan nama kolom teks di tabel 'tags' Anda (misal: 'name' atau 'label')
    } | null;
  }[];
}

export const KontakDirektori: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');

  const fetchContacts = async () => {
  // Melakukan join query: contacts -> contact_tags -> tags
  // Silakan sesuaikan nama tabel 'tags(nama_tag)' dengan struktur riil database Anda
  let query = supabase
    .from('contacts')
    .select(`
      id, 
      nama_lengkap, 
      nomor_whatsapp, 
      status,
      contact_tags(
        tags(nama_tag)
      )
    `);

  if (search) {
    query = query.ilike('nama_lengkap', `%${search}%`);
  }

  const { data, error } = await query;
  if (!error && data) {
    setContacts(data as unknown as Contact[]);
  }
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
    <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Nama Lengkap</TableCell>
    <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Nomor WhatsApp</TableCell>
    {/* 👈 HEADER BARU */}
    <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Label / Tag</TableCell> 
    <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Status</TableCell>
    <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold', textAlign: 'center' }}>Aksi</TableCell>
  </TableRow>
</TableHead>
          <TableBody>
  {contacts.map((contact) => (
    <TableRow key={contact.id} hover>
      <TableCell sx={{ color: 'text.primary' }}>{contact.nama_lengkap}</TableCell>
      <TableCell>
        <Button 
          size="small" 
          startIcon={<WhatsApp color="success" />} 
          href={`https://wa.me/${contact.nomor_whatsapp}`} 
          target="_blank" 
          sx={{ color: 'success.main', fontWeight: 'medium' }}
        >
          {contact.nomor_whatsapp}
        </Button>
      </TableCell>
      
      {/* 👈 CELL DATA BARU (Render Multi-Tags via Chip) */}
      <TableCell>
        <Box display="flex" gap={0.5} flexWrap="wrap">
          {contact.contact_tags && contact.contact_tags.length > 0 ? (
            contact.contact_tags.map((ct, idx) => 
              ct.tags?.nama_tag ? (
                <Chip 
                  key={idx} 
                  label={ct.tags.nama_tag} 
                  size="small" 
                  color="primary" 
                  variant="outlined" 
                />
              ) : null
            )
          ) : (
            <Typography variant="body2" sx={{ color: 'text.disabled' }}>-</Typography>
          )}
        </Box>
      </TableCell>

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
