# 🎱 VAMOS POS - Panduan Instalasi (Komersial)

Selamat! Anda baru saja memiliki engine VAMOS POS yang sudah disatukan (Backend + Frontend). Ikuti langkah-langkah di bawah ini untuk instalasi pada komputer kasir lokal.

## 1. Persyaratan Sistem (Prerequisites)

Sebelum instalasi, pastikan komputer kasir memiliki:
*   **Sistem Operasi**: Windows 10/11 (64-bit).
*   **Database**: PostgreSQL 15 ke atas.
*   **Runtimes**: Node.js v18/v20 (untuk menjalankan perintah inisialisasi database melalui npx).

## 2. Persiapan Database

1.  Buka **pgAdmin 4** atau **SQL Shell**.
2.  Buat database baru dengan nama `vamos_pos`.
    ```sql
    CREATE DATABASE vamos_pos;
    ```
3.  Catat **Username** dan **Password** database PostgreSQL Anda.

## 3. Persiapan File

Pindahkan 3 file utama & 1 folder berikut ke dalam satu folder instalasi (misalnya `D:\VAMOS-POS\`):
*   `vamous-pos.exe` (Aplikasi Utama)
*   `START-VAMOS.bat` (Tombol Start)
*   `.env` (File Konfigurasi)
*   Folder `prisma/` (Berisi skema database)

## 4. Konfigurasi Sistem (.env)

Buka file `.env` menggunakan Notepad, lalu sesuaikan isinya:
```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/vamos_pos"
PORT=3000
```
> [!IMPORTANT]
> Ganti `USERNAME` dan `PASSWORD` sesuai dengan akun PostgreSQL Anda.

## 5. Jalankan Aplikasi

1.  Klik dua kali file **`START-VAMOS.bat`**.
2.  Jendela Hitam (CMD) akan muncul dan melakukan:
    *   **Sync DB**: Menyiapkan tabel biliar, harga, dan loyalty secara otomatis.
    *   **Start Server**: Menyalakan engine POS.
3.  Browser akan terbuka secara otomatis ke alamat `http://localhost:3000`.

## 6. Penyelesaian & Troubleshooting

*   **Lampu Tidak Menyala**: Pastikan kabel relay sudah terpasang di `COM3` (atau cek di Pengaturan POS).
*   **Koneksi Gagal**: Pastikan status database PostgreSQL di Windows Service dalam keadaan `Running`.
*   **Auto-Start**: Untuk menyalakan POS otomatis saat PC hidup, masukkan shortcut `START-VAMOS.bat` ke folder `Startup` Windows.

---
*© 2026 VAMOS Pool & Cafe. All rights reserved.*
