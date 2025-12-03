# Sistem Pembuatan Tagihan Otomatis

## Deskripsi

Function database untuk membuat tagihan otomatis 7 hari sebelum tanggal jatuh tempo untuk setiap pelanggan aktif.

## Logika Sistem

1. **Periode Berlangganan:**
   - Periode pertama dimulai dari `created_at` (tanggal pertama berlangganan)
   - Setiap periode = 30 hari
   - Tanggal jatuh tempo setiap bulan = `due_date` (1-31) yang diisi saat pendaftaran

2. **Contoh:**
   - Pelanggan berlangganan: 12 Desember 2025
   - `due_date`: 12
   - Periode pertama: 12 Des 2025 - 12 Jan 2026 (30 hari)
   - Jatuh tempo: 12 Januari 2026
   - **Tagihan dibuat: 5 Januari 2026** (7 hari sebelum jatuh tempo)

3. **Periode Tagihan Berikutnya:**
   - Periode 2: 12 Jan 2026 - 12 Feb 2026 → Tagihan dibuat: 5 Feb 2026
   - Periode 3: 12 Feb 2026 - 12 Mar 2026 → Tagihan dibuat: 5 Mar 2026
   - dst. Setiap bulan pada tanggal `due_date`

## Cara Menggunakan

### 1. Menjalankan Function secara Manual

Jalankan function melalui SQL:

```sql
SELECT * FROM create_invoices_for_upcoming_period();
```

Function akan:
- Mencari semua pelanggan aktif
- Menghitung tanggal jatuh tempo berikutnya berdasarkan `due_date`
- Membuat tagihan jika sudah waktunya (7 hari sebelum jatuh tempo)
- Mengembalikan daftar tagihan yang dibuat

### 2. Hasil Function

Function mengembalikan tabel dengan kolom:
- `customer_id`: ID pelanggan
- `invoice_id`: ID tagihan yang dibuat
- `month`: Bulan periode tagihan (1-12)
- `year`: Tahun periode tagihan
- `amount`: Jumlah tagihan (dari `packages.price_monthly`)
- `due_date_target`: Tanggal jatuh tempo

### 3. Menjadwalkan Eksekusi Otomatis (Opsional)

Untuk menjalankan function secara otomatis setiap hari, Anda bisa:

**A. Menggunakan Supabase Edge Function dengan Cron:**
- Buat Edge Function yang memanggil function database ini
- Setup cron job di Supabase Dashboard

**B. Menggunakan PostgreSQL pg_cron (jika tersedia):**
```sql
SELECT cron.schedule(
  'create-invoices-daily',
  '0 8 * * *',  -- Setiap hari jam 08:00
  $$SELECT create_invoices_for_upcoming_period();$$
);
```

## Validasi

Function akan:
- Hanya memproses pelanggan dengan status `'active'`
- Cek duplikasi tagihan berdasarkan (`customer_id`, `month`, `year`)
- Skip jika package tidak ditemukan atau tidak ada harga
- Handle edge case: `due_date` > jumlah hari di bulan (gunakan hari terakhir bulan)

## File Terkait

- `scripts/create_auto_invoice_function.sql`: SQL function
- `scripts/test_auto_invoice_function.sql`: Query untuk testing
- Migration: `create_auto_invoice_function` (sudah diterapkan ke database)

## Testing

Gunakan file `scripts/test_auto_invoice_function.sql` untuk testing:
1. Cek data pelanggan aktif
2. Cek tagihan yang sudah ada
3. Jalankan function
4. Cek tagihan setelah function dijalankan

## Contoh Output

```sql
SELECT * FROM create_invoices_for_upcoming_period();
```

Hasil:
```
 customer_id                          | invoice_id                          | month | year | amount    | due_date_target
--------------------------------------+--------------------------------------+-------+------+-----------+----------------
 766cb8e8-5218-4670-8ee2-1035779cb040 | 6f55fcb3-40ef-4ea0-902f-bbbd5ad04b01 |    12 | 2025 | 150000.00 | 2025-12-01
```

