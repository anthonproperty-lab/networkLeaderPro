export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; nama: string; email: string; foto: string | null; paket: string; status_langganan: string; created_at: string; updated_at: string };
        Insert: { id: string; nama: string; email: string; foto?: string | null; paket?: string; status_langganan?: string; created_at?: string; updated_at?: string };
        Update: { id?: string; nama?: string; email?: string; foto?: string | null; paket?: string; status_langganan?: string; created_at?: string; updated_at?: string };
      };
      contacts: {
        Row: { id: string; user_id: string; nama_depan: string; nama_belakang: string | null; nama_lengkap: string; nomor_whatsapp: string; catatan: string | null; status: 'Baru' | 'Dihubungi' | 'Prospek' | 'Pelanggan' | 'Tidak Tertarik'; created_at: string; updated_at: string };
        Insert: { id?: string; user_id?: string; nama_depan: string; nama_belakang?: string | null; nomor_whatsapp: string; catatan?: string | null; status?: 'Baru' | 'Dihubungi' | 'Prospek' | 'Pelanggan' | 'Tidak Tertarik'; created_at?: string; updated_at?: string };
        Update: { id?: string; user_id?: string; nama_depan?: string; nama_belakang?: string | null; nomor_whatsapp?: string; catatan?: string | null; status?: 'Baru' | 'Dihubungi' | 'Prospek' | 'Pelanggan' | 'Tidak Tertarik'; created_at?: string; updated_at?: string };
      };
      tags: {
        Row: { id: string; user_id: string; nama_tag: string; warna: string; created_at: string };
        Insert: { id?: string; user_id?: string; nama_tag: string; warna?: string; created_at?: string };
        Update: { id?: string; user_id?: string; nama_tag?: string; warna?: string; created_at?: string };
      };
      followups: {
        Row: { id: string; user_id: string; contact_id: string; judul: string; catatan: string | null; tanggal_followup: string; status: 'Belum Selesai' | 'Selesai' | 'Batal'; created_at: string };
        Insert: { id?: string; user_id?: string; contact_id: string; judul: string; catatan?: string | null; tanggal_followup: string; status?: 'Belum Selesai' | 'Selesai' | 'Batal'; created_at?: string };
        Update: { id?: string; user_id?: string; contact_id?: string; judul?: string; catatan?: string | null; tanggal_followup?: string; status?: 'Belum Selesai' | 'Selesai' | 'Batal'; created_at?: string };
      };
      templates: {
        Row: { id: string; user_id: string; kategori: 'Edukasi' | 'Promosi' | 'Follow Up' | 'Sapaan'; judul: string; isi_pesan: string; created_at: string };
        Insert: { id?: string; user_id?: string; kategori?: 'Edukasi' | 'Promosi' | 'Follow Up' | 'Sapaan'; judul: string; isi_pesan: string; created_at?: string };
        Update: { id?: string; user_id?: string; kategori?: 'Edukasi' | 'Promosi' | 'Follow Up' | 'Sapaan'; judul?: string; isi_pesan?: string; created_at?: string };
      };
      campaigns: {
        Row: { id: string; user_id: string; judul: string; pesan: string; status: 'Draft' | 'Dijadwalkan' | 'Berjalan' | 'Selesai' | 'Gagal'; jadwal_kirim: string | null; jumlah_target: number; jumlah_berhasil: number; jumlah_gagal: number; created_at: string };
        Insert: { id?: string; user_id?: string; judul: string; pesan: string; status?: 'Draft' | 'Dijadwalkan' | 'Berjalan' | 'Selesai' | 'Gagal'; jadwal_kirim?: string | null; jumlah_target?: number; jumlah_berhasil?: number; jumlah_gagal?: number; created_at?: string };
        Update: { id?: string; user_id?: string; judul?: string; pesan?: string; status?: 'Draft' | 'Dijadwalkan' | 'Berjalan' | 'Selesai' | 'Gagal'; jadwal_kirim?: string | null; jumlah_target?: number; jumlah_berhasil?: number; jumlah_gagal?: number; created_at?: string };
      };
      notifications: {
        Row: { id: string; user_id: string; judul: string; pesan: string; is_read: boolean; created_at: string };
        Insert: { id?: string; user_id?: string; judul: string; pesan: string; is_read?: boolean; created_at?: string };
        Update: { id?: string; user_id?: string; judul?: string; pesan?: string; is_read?: boolean; created_at?: string };
      };
    };
  };
}
