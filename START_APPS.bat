@echo off
title VAMOS SMART POS - STARTER
color 0A

echo ======================================================
echo    VAMOS POOL & CAFE - SMART POS (ELECTRON MODE)
echo ======================================================
echo.

:: 1. Jalankan Backend
echo [1/2] Menjalankan Backend Engine...
cd vamos-pos-backend
start /b vamous-pos.exe
echo Backend engine started in background.
cd ..

:: 2. Jalankan Frontend (Electron)
echo [2/2] Membuka Aplikasi Desktop...
cd vamos-pos-frontend

:: Cek apakah sudah ada build dist, jika belum bangun dulu
if not exist "dist" (
    echo [INFO] Membangun paket UI untuk pertama kali...
    call npm run build
)

:: Jalankan electron
start "" npx electron .

echo.
echo ======================================================
echo    Aplikasi Sedang Memuat...
echo    JANGAN TUTUP jendala ini jika ingin backend tetap jalan.
echo ======================================================
echo.
pause
