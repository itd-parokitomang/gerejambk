# Network ASRO - Sistem Manajemen Pelanggan Internet

Aplikasi manajemen pelanggan internet berbasis React Native dengan Expo untuk mengelola pelanggan, tagihan, paket internet, dan sistem komisi. Dibangun dengan teknologi modern untuk memberikan pengalaman yang optimal di berbagai platform (iOS, Android, dan Web).

## 📋 Fitur Utama

### 👥 Manajemen Pelanggan
- Daftar pelanggan dengan informasi lengkap
- Registrasi pelanggan baru
- Edit dan hapus data pelanggan
- Filter dan pencarian pelanggan
- Status pelanggan (Active, Inactive, Suspended)

### 💰 Manajemen Tagihan
- Daftar tagihan pelanggan
- Input pembayaran tagihan
- Verifikasi pembayaran
- Status tagihan (Pending, Paid, Verified, Overdue)
- **Sistem Pembuatan Tagihan Otomatis** (7 hari sebelum jatuh tempo)

### 📦 Manajemen Paket
- Daftar paket internet
- Tambah, edit, dan hapus paket
- Konfigurasi kecepatan dan harga bulanan

### 💵 Sistem Komisi
- Pengaturan komisi per pelanggan
- Perhitungan komisi otomatis
- Tracking komisi sales
- Status pembayaran komisi

### 👤 Multi-Role User System
- **Owner**: Akses penuh ke semua fitur
- **Admin**: Manajemen pelanggan, tagihan, dan paket
- **Sales**: Input pelanggan dan tracking komisi

### 🔄 Fitur Tambahan
- Sistem autentikasi dengan Supabase
- Real-time data synchronization
- UI/UX modern dengan iOS 16 design system
- Responsive design untuk semua platform

## 🛠 Teknologi yang Digunakan

### Frontend
- **React Native** (0.81.5)
- **Expo** (~54.0.23)
- **Expo Router** (~6.0.14) - File-based routing
- **TypeScript** (~5.9.2)
- **React Navigation** - Navigation library

### Backend & Database
- **Supabase** - Backend as a Service
  - PostgreSQL Database
  - Authentication
  - Row Level Security (RLS)
- **PostgreSQL Functions** - Business logic di database

### Tools & Libraries
- **ESLint** - Code linting
- **Expo Vector Icons** - Icon library

## 📁 Struktur Proyek

```
networkasro/
├── app/                    # Halaman aplikasi (Expo Router)
│   ├── (admin)/           # Halaman untuk role Admin
│   ├── (owner)/           # Halaman untuk role Owner
│   ├── (sales)/           # Halaman untuk role Sales
│   └── (tabs)/            # Tab navigation
├── components/            # Komponen React reusable
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
│   ├── supabase.ts       # Supabase client
│   └── utils/            # Helper functions
├── constants/             # Constants dan theme
├── scripts/               # Scripts dan SQL functions
│   ├── create_auto_invoice_function.sql
│   ├── test_auto_invoice_function.sql
│   └── README_AUTO_INVOICE.md
└── assets/                # Images dan assets
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 atau lebih baru)
- npm atau yarn
- Expo CLI (terinstall global atau via npx)
- Akun Supabase
- Git

### Instalasi

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd networkasro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   
   Buat file `.env.local` di root project:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Setup database**
   
   - Buat project di Supabase
   - Jalankan migrations dari folder `supabase/migrations` (jika ada)
   - Atau setup manual melalui Supabase Dashboard

5. **Jalankan aplikasi**
   ```bash
   npm start
   ```

   Pilih platform:
   - Tekan `i` untuk iOS simulator
   - Tekan `a` untuk Android emulator
   - Tekan `w` untuk web browser
   - Scan QR code dengan Expo Go app (untuk device fisik)

## 📊 Database Schema

### Tabel Utama

- **user_profiles**: Profile pengguna (Owner, Admin, Sales)
- **customers**: Data pelanggan
- **packages**: Paket internet yang tersedia
- **invoices**: Tagihan pelanggan
- **commission_settings**: Pengaturan komisi per pelanggan
- **commissions**: Data komisi yang telah dibayar

### Relasi

- `customers.package_id` → `packages.id`
- `customers.sales_id` → `auth.users.id`
- `invoices.customer_id` → `customers.id`
- `commissions.customer_id` → `customers.id`
- `commissions.invoice_id` → `invoices.id`

## 🔧 Sistem Pembuatan Tagihan Otomatis

Aplikasi dilengkapi dengan sistem pembuatan tagihan otomatis yang membuat tagihan 7 hari sebelum tanggal jatuh tempo untuk setiap pelanggan aktif.

### Cara Kerja

1. Periode berlangganan dimulai dari `created_at` (tanggal pertama berlangganan)
2. Setiap periode = 30 hari
3. Tanggal jatuh tempo setiap bulan = `due_date` (1-31) yang diisi saat pendaftaran
4. Tagihan dibuat 7 hari sebelum tanggal jatuh tempo

### Contoh

- Pelanggan berlangganan: 12 Desember 2025
- `due_date`: 12
- Periode pertama: 12 Des 2025 - 12 Jan 2026 (30 hari)
- Jatuh tempo: 12 Januari 2026
- **Tagihan dibuat: 5 Januari 2026** (7 hari sebelum jatuh tempo)

### Menggunakan Function

Jalankan function secara manual:
```sql
SELECT * FROM create_invoices_for_upcoming_period();
```

Untuk detail lengkap, lihat [README_AUTO_INVOICE.md](scripts/README_AUTO_INVOICE.md)

## 👥 Test Users

Aplikasi dilengkapi dengan sistem user testing. Lihat [README-TEST-USERS.md](README-TEST-USERS.md) untuk informasi lengkap.

## 🚢 Deployment

### Web Deployment

```bash
npm run deploy:web
```

### Mobile App Deployment

Untuk Android/iOS, gunakan EAS Build:

```bash
eas build --platform android
eas build --platform ios
```

Lihat [README-DEPLOYMENT.md](README-DEPLOYMENT.md) untuk panduan lengkap.

## 📝 Scripts Tersedia

- `npm start` - Jalankan development server
- `npm run android` - Jalankan di Android emulator
- `npm run ios` - Jalankan di iOS simulator
- `npm run web` - Jalankan di web browser
- `npm run lint` - Lint code
- `npm run export:web` - Export untuk web static
- `npm run deploy:web` - Deploy ke web hosting

## 🔐 Authentication & Authorization

Aplikasi menggunakan Supabase Authentication dengan Row Level Security (RLS) untuk keamanan data. Setiap role memiliki akses yang berbeda:

- **Owner**: Full access
- **Admin**: Manage customers, invoices, packages
- **Sales**: Input customers, view own commissions

## 📱 Platform Support

- ✅ iOS
- ✅ Android
- ✅ Web

## 🤝 Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📄 License

Private project - All rights reserved

## 📞 Support

Untuk pertanyaan dan support, silakan hubungi tim development.

---

**Dibuat dengan ❤️ menggunakan React Native & Expo**
