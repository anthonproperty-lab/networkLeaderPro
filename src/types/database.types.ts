// Tambahkan konstanta konfigurasi paket ini di bagian paling atas file jenis data Anda
export const KONFIGURASI_PAKET = {
  Free: { nama: 'Free Trial', kuota_pesan: 100 },
  Premium: { nama: 'Premium Pro', kuota_pesan: 5000 },
  Enterprise: { nama: 'Enterprise Multi-Tenant', kuota_pesan: 999999 }
};

// Sesuaikan interface bagian public -> Tables -> profiles Anda:
profiles: {
  Row: { 
    id: string; 
    nama: string; 
    email: string; 
    foto: string | null; 
    paket: 'Free' | 'Premium' | 'Enterprise'; // Diperketat menggunakan literal type
    status_langganan: string; 
    kuota_terpakai: number; // Field baru pelacak penggunaan kuota
    created_at: string; 
    updated_at: string 
  };
  Insert: { id: string; nama: string; email: string; foto?: string | null; paket?: 'Free' | 'Premium' | 'Enterprise'; status_langganan?: string; kuota_terpakai?: number; created_at?: string; updated_at?: string };
  Update: { id?: string; nama?: string; email?: string; foto?: string | null; paket?: 'Free' | 'Premium' | 'Enterprise'; status_langganan?: string; kuota_terpakai?: number; created_at?: string; updated_at?: string };
};
