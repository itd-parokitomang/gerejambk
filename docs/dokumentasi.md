# Panduan Admin: Kelola Konten Aplikasi Paroki Tomang

Dokumen ini ditujukan untuk admin/pengelola konten. Fokusnya adalah cara mengatur konten yang tampil di aplikasi: menu beranda, halaman & sub halaman, slider beranda, serta pengaturan umum.

## Akses Admin Panel

1. Buka beranda aplikasi.
2. Tekan ikon profil (ikon orang) di kanan atas.
3. Masukkan email dan password admin, lalu tekan `Masuk`.
4. Setelah berhasil, Anda masuk ke `Admin Panel`.

## Navigasi di Admin Panel

Di sisi kiri (atau lewat tombol menu di mobile) tersedia:

- `Dashboard`
- `Settings Umum`
- `Slider Beranda`
- `Kelola Halaman`
- `Kelola User` (fitur belum tersedia)

Tombol yang sering dipakai:

- Ikon panah kiri: kembali ke beranda aplikasi.
- Ikon keluar: logout dari admin panel.

## Slider Beranda

Slider beranda adalah kartu kecil horizontal di bawah bagian hero beranda.

### Tambah slider

1. Masuk ke `Slider Beranda`.
2. Tekan `Tambah Slider`.
3. Isi:
   - `Judul *`
   - `Deskripsi` (opsional)
   - `Tujuan saat slider diklik`
     - `Tidak ada aksi`: hanya tampil sebagai informasi.
     - `Halaman aplikasi`: pilih halaman yang akan dibuka.
     - `URL / Tautan`: isi tautan internal atau eksternal.
   - `Icon` (opsional): tekan `Pilih Icon`.
   - `Gambar (opsional)`: tekan area gambar untuk memilih gambar.
   - `Urutan`: angka untuk menentukan posisi tampil (semakin kecil, semakin awal).
   - `Status`: `Aktif` atau `Nonaktif`.
4. Tekan `Simpan`.

### Edit / aktif-nonaktif / hapus slider

- Edit: tekan ikon pensil pada kartu slider.
- Aktif/Nonaktif cepat: tekan tombol `Nonaktifkan` atau `Aktifkan` pada kartu slider.
- Hapus: tekan ikon tempat sampah, lalu konfirmasi.

### Catatan tujuan klik (URL)

- URL internal: contoh `/pages/misa`.
- URL eksternal: contoh `https://paroki.or.id`.

Jika URL eksternal, tautan akan dibuka di tampilan web tanpa keluar dari aplikasi.

## Menu Beranda, Halaman, dan Sub Halaman

Menu beranda dibentuk dari daftar `Halaman` yang:

- berstatus `Aktif`, dan
- bukan `Sub Halaman` (halaman tanpa induk).

Sub halaman hanya muncul di dalam `Halaman Induk`.

### Istilah penting

- `Halaman`: item menu yang bisa dibuka dari beranda.
- `Halaman Induk (Group Menu)`: halaman yang berfungsi sebagai “folder” untuk menampung sub halaman.
- `Sub Halaman`: halaman yang berada di dalam halaman induk.

### Tambah halaman baru

1. Masuk ke `Kelola Halaman`.
2. Tekan `Tambah Halaman Baru`.
3. Isi:
   - `Judul Halaman *`
   - `Slug (URL) *`
     - Slug biasanya otomatis terisi dari judul untuk halaman baru.
     - Gunakan huruf kecil dan tanda `-` (misal: `jadwal-misa`).
   - `Tipe Halaman *` (pilih salah satu)
   - `Icon`: tekan `Pilih Icon`.
   - `Urutan`: angka untuk menentukan posisi di menu.
4. Tekan `Simpan`.

### Edit, hapus, dan status aktif

Di daftar halaman, setiap kartu punya:

- Badge `Aktif/Nonaktif` (bisa ditekan untuk mengubah status).
- Tombol `Edit`.
- Tombol `Hapus`.

### Membuat sub halaman

1. Buat dulu `Halaman Induk (Group Menu)` (lihat bagian tipe halaman).
2. Pada kartu halaman induk, tekan tombol `Sub Halaman`.
3. Isi form seperti halaman biasa, lalu `Simpan`.

Sub halaman:

- Tidak tampil di menu beranda.
- Tampil ketika pengguna membuka halaman induknya.

### Mengatur urutan menu

- Aplikasi mengurutkan berdasarkan `Urutan` (angka kecil tampil lebih dulu).
- Jika ingin “paling atas”, set `Urutan` ke `0`, berikutnya `1`, dst.

## Tipe Halaman dan Cara Mengelolanya

### Halaman Statis

Dipakai untuk konten artikel/pengumuman yang berisi teks, daftar, tautan, dan gambar.

- Gunakan mode `Edit` untuk menulis.
- Gunakan `Preview` untuk mengecek tampilan sebelum disimpan.
- Saat mengedit halaman yang sudah ada, konten biasanya tersimpan otomatis setelah berhenti mengetik beberapa saat. Untuk memastikan perubahan lain (judul/slug/tipe/icon/urutan) ikut tersimpan, tetap tekan `Simpan`.

### Halaman Induk (Group Menu)

Dipakai untuk membuat grup menu (misal: “Pelayanan”) yang berisi beberapa sub halaman.

- Buat halaman dengan tipe `Halaman Induk (Group Menu)`.
- Setelah tersimpan, gunakan tombol `Sub Halaman` pada kartu halaman induk untuk menambahkan isi di dalamnya.

### WebView

Dipakai untuk menampilkan sebuah website di dalam aplikasi.

- Pilih tipe `WebView`.
- Isi `URL Website` (misal: `https://example.com`).
- Saat pengguna membuka menu ini, website akan tampil fullscreen.

### Video YouTube

Dipakai untuk menampilkan daftar beberapa video YouTube.

- Pilih tipe `Video YouTube`.
- Tekan `Tambah Video` untuk menambah item.
- Isi `Judul Video` dan `Video ID`.
  - Video ID bisa diambil dari tautan YouTube: `youtube.com/watch?v=VIDEO_ID`.
- Gunakan ikon tempat sampah pada setiap item untuk menghapus video.

### Channel YouTube

Dipakai untuk mengarahkan pengguna ke halaman channel YouTube.

- Pilih tipe `Channel YouTube`.
- Isi `URL Channel (beranda)` (misal: `https://www.youtube.com/@namaChannel`).
- Isi `Nama Channel` (opsional, untuk judul tampilan).

### Tabel Data

Dipakai untuk menyajikan informasi dalam bentuk tabel (contoh: jadwal, daftar layanan).

- Isi `Judul Tabel` (opsional).
- Di bagian `Kolom Tabel`, tekan `Tambah Kolom`, lalu isi:
  - Label kolom (misal: “Hari”, “Jam”, “Keterangan”)
  - Tipe data: `Teks`, `Angka`, atau `Tanggal`
- Di bagian `Data Baris`, tekan `Tambah Baris`, lalu isi data setiap kolom.
- Menghapus kolom akan ikut menghapus data pada kolom tersebut di semua baris.

## Settings Umum

Masuk ke `Settings Umum` untuk mengatur tampilan global aplikasi.

Yang bisa diubah:

- `Informasi Aplikasi`
  - `Nama Aplikasi *`
  - `Nama Paroki *`
  - `Text Header` (opsional)
  - `Text Footer` (opsional, bisa multi-baris)
- `Logo & Icon`
  - `Logo Aplikasi`
  - `Icon PWA`
  - `Favicon`
- `Warna Tema`
  - `Primary Color` dan `Secondary Color` (format warna seperti `#8B4513`)
- `Hero Beranda`
  - `Judul` dan `Nilai` (misal: “Jadwal Misa” / “Lihat”)
  - `Aksi Klik`: `Tidak ada`, `Buka Halaman`, atau `Buka URL`
  - Jika `Buka Halaman`: isi `Slug Halaman` yang dituju
  - Jika `Buka URL`: isi `URL`

Terakhir tekan `Simpan Perubahan`.

## Checklist Publikasi Konten

- Pastikan `Status` halaman/slider adalah `Aktif` jika ingin ditampilkan.
- Pastikan `Urutan` sudah sesuai (angka kecil tampil lebih dulu).
- Pastikan `Slug` unik dan mudah dibaca.
- Untuk konten yang masih draft, set `Nonaktif` dulu.

## Troubleshooting Cepat

- Menu beranda tidak muncul:
  - Pastikan halaman `Aktif`.
  - Pastikan halaman tersebut bukan `Sub Halaman`.
- Sub halaman tidak terlihat di dalam halaman induk:
  - Pastikan sub halaman dibuat dari tombol `Sub Halaman` pada halaman induk.
  - Pastikan status sub halaman `Aktif`.
- Slider tidak tampil:
  - Pastikan slider `Aktif`.
  - Cek `Urutan` untuk memastikan posisinya.
- Video YouTube tidak tampil:
  - Pastikan `Video ID` benar (bukan URL penuh).
