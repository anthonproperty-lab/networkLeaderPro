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
        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 'bold' }}>Direktori Kontak Prospek</Typography>
        <Button variant="contained" color="primary" href="/kontak/tambah">+ Tambah Kontak Baru</Button>
      </Box>
      <TextField
        fullWidth
        label="Cari nama kontak di sini..."
        variant="outlined"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 3, background: '#181c23', input: { color: '#fff' }, label: { color: '#7f8c8d' } }}
      />
      <TableContainer component={Paper} sx={{ background: '#181c23', border: '1px solid #1f252f' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#7f8c8d', fontWeight: 'bold' }}>Nama Lengkap</TableCell>
              <TableCell sx={{ color: '#7f8c8d', fontWeight: 'bold' }}>Nomor WhatsApp</TableCell>
              <TableCell sx={{ color: '#7f8c8d', fontWeight: 'bold' }}>Status Status</TableCell>
              <TableCell sx={{ color: '#7f8c8d', fontWeight: 'bold', textAlign: 'center' }}>Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow key={contact.id} hover>
                <TableCell sx={{ color: '#fff' }}>{contact.nama_lengkap}</TableCell>
                <TableCell sx={{ color: '#fff' }}>
                  <Button 
                    size="small" 
                    startIcon={<WhatsApp color="success" />} 
                    href={`https://wa.me/${contact.nomor_whatsapp}`} 
                    target="_blank"
                    sx={{ color: '#00b894' }}
                  >
                    {contact.nomor_whatsapp}
                  </Button>
                </TableCell>
                <TableCell sx={{ color: '#0984e3' }}>{contact.status}</TableCell>
                <TableCell align="center">
                  <IconButton href={`/kontak/edit/${contact.id}`} sx={{ color: '#0984e3' }}><Edit /></IconButton>
                  <IconButton onClick={() => handleDelete(contact.id)} sx={{ color: '#d63031' }}><Delete /></IconButton>
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
