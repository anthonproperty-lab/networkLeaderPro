import { z } from 'zod';

export const schemaLogin = z.object({
  email: z.string().email({ message: 'Alamat email tidak valid' }),
  password: z.string().min(6, { message: 'Kata sandi minimal 6 karakter' }),
});

export const schemaRegister = z.object({
  nama: z.string().min(3, { message: 'Nama minimal terdiri dari 3 karakter' }),
  email: z.string().email({ message: 'Alamat email tidak valid' }),
  password: z.string().min(6, { message: 'Kata sandi minimal 6 karakter' }),
});

export const schemaLupaPassword = z.object({
  email: z.string().email({ message: 'Alamat email tidak valid' }),
});

export const schemaContact = z.object({
  nama_depan: z.string().min(2, { message: 'Nama depan minimal 2 karakter' }),
  nama_belakang: z.string().optional().nullable(),
  nomor_whatsapp: z.string().min(10, { message: 'Nomor WhatsApp minimal 10 digit angka' }).regex(/^[0-9]+$/, { message: 'Hanya diperbolehkan karakter angka' }),
  catatan: z.string().optional().nullable(),
  group_id: z.string().optional().nullable().or(z.literal('')), 
});

export const schemaFollowUp = z.object({
  contact_id: z.string().uuid({ message: 'Wajib memilih kontak prospek' }),
  judul: z.string().min(3, { message: 'Judul aktivitas minimal 3 karakter' }),
  catatan: z.string().optional().nullable(),
  tanggal_followup: z.string().min(1, { message: 'Tanggal dan waktu wajib ditentukan' }),
  status: z.enum(['Belum Selesai', 'Selesai', 'Batal']),
});

export const schemaTemplate = z.object({
  kategori: z.enum(['Edukasi', 'Promosi', 'Follow Up', 'Sapaan']),
  judul: z.string().min(3, { message: 'Judul template minimal 3 karakter' }),
  isi_pesan: z.string().min(5, { message: 'Isi template pesan terlalu pendek' }),
});

export const schemaCampaign = z.object({
  judul: z.string().min(3, { message: 'Nama kampanye minimal 3 karakter' }),
  pesan: z.string().min(5, { message: 'Isi pesan penyiaran wajib diisi' }),
  status: z.enum(['Draft', 'Dijadwalkan', 'Berjalan', 'Selesai', 'Gagal']),
  jadwal_kirim: z.string().optional().nullable(),
});
