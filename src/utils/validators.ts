import { z } from 'zod';

// Validasi Register Akun Baru
export const schemaRegister = z.object({
  nama: z.string().min(3, { message: 'Nama minimal harus 3 karakter' }),
  email: z.string().email({ message: 'Format email tidak valid' }),
  password: z.string().min(6, { message: 'Kata sandi minimal harus 6 karakter' }),
});

// Validasi Tambah/Edit Kontak CRM
export const schemaContact = z.object({
  nama_depan: z.string().min(2, { message: 'Nama depan minimal harus 2 karakter' }),
  nama_belakang: z.string().optional(),
  nomor_whatsapp: z.string()
    .min(10, { message: 'Nomor WhatsApp minimal harus 10 digit' })
    .regex(/^[0-9]+$/, { message: 'Nomor WhatsApp hanya boleh berisi angka' }),
  catatan: z.string().optional(),
  status: z.enum(['Baru', 'Dihubungi', 'Prospek', 'Pelanggan', 'Tidak Tertarik']),
});

export type RegisterInput = z.infer<typeof schemaRegister>;
export type ContactInput = z.infer<typeof schemaContact>;
