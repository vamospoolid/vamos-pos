@echo off
setlocal
:: ======================================================
:: VAMOS POOL & CAFE - SMART POS SYSTEM
:: ======================================================
title VAMOS POOL & CAFE - POS ENGINE

echo ######################################################
echo #                                                    #
echo #          VAMOS POOL & CAFE - POS ENGINE            #
echo #          SYSTEM STARTUP SEQUENCE...                #
echo #                                                    #
echo ######################################################
echo.

:: 1. Validasi Environment
if not exist ".env" (
    echo [ERROR] File konfigurasi .env tidak ditemukan!
    echo Harap buat file .env di folder ini dengan isi:
    echo DATABASE_URL="postgresql://postgres:password@localhost:5432/vamos_pos"
    echo PORT=3000
    echo.
    pause
    exit /b
)

:: 2. Sinkronisasi Database (Opsional: Memastikan tabel ada)
echo [1/3] Sinkronisasi Database (Prisma Build)...
echo.
call npx prisma db push
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [WARNING] Sinkronisasi DB bermasalah. 
    echo Pastikan PostgreSQL Service sudah menyala.
    echo Mencoba melanjutkan startup...
    echo.
)

:: 3. Beri waktu server untuk persiapan
echo [2/3] Menyiapkan Server VAMOS...
timeout /t 2 /nobreak > nul

:: 4. Buka Dashboard Kasir secara otomatis
echo [3/3] Membuka Dashboard Kasir di Browser...
start http://localhost:3000

:: 5. Jalankan Aplikasi Utama
echo.
echo [INFO] VAMOS POS Sedang Berjalan! 
echo [INFO] JANGAN TUTUP JENDELA INI SELAMA KASIR BERJALAN.
echo.
vamous-pos.exe

pause
