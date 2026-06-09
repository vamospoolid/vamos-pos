# Split Bill Feature Request

## Deskripsi Fitur
Fitur untuk memungkinkan pelanggan membayar satu tagihan dengan menggunakan lebih dari satu metode pembayaran secara bersamaan (misal: sebagian dengan Cash, dan sisanya dengan QRIS).

## Area yang Perlu Diperbarui

### 1. Database Schema (`vamos-pos-backend/prisma/schema.prisma`)
- Mengubah/menambahkan struktur penyimpanan transaksi agar bisa menerima `multiple payment methods`.
- Contoh: Menambahkan tabel `TransactionPayment` atau mengubah tipe `paymentMethod` menjadi JSON Array `[{ method: 'CASH', amount: 50000 }, { method: 'QRIS', amount: 100000 }]`.

### 2. Backend API (`vamos-pos-backend`)
- Menyesuaikan endpoint pembayaran (checkout/tutup sesi meja).
- Validasi total pembayaran dari gabungan seluruh metode yang digunakan harus sama dengan *Grand Total* transaksi.
- Menyesuaikan logika pada endpoint Laporan (Reports) agar `split bill` ini terekam dengan benar (Pemasukan Cash vs QRIS).

### 3. Frontend POS (`vamos-pos-frontend`)
- Merombak Dialog Pembayaran (Payment Modal) di halaman Kasir.
- Menambahkan kapabilitas bagi kasir untuk memasukkan nominal *partial payment* (misal: "Bayar QRIS: Rp 100.000"), lalu sistem menghitung sisa tagihan untuk dibayarkan dengan metode lain.

---
**Status:** Dicatat untuk pengembangan selanjutnya berdasarkan diskusi.
