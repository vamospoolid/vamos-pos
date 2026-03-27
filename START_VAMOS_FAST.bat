@echo off
title VAMOS SMART POS - FAST START
color 0A
chcp 65001 > nul

echo ======================================================
echo    VAMOS POOL ^& CAFE - SMART POS  [FAST START]
echo ======================================================
echo.

:: Pastikan kita di folder root project
cd /d "%~dp0"

:: ─── 1. CEK DATABASE ──────────────────────────────────────
echo [1/3] Mengecek Koneksi PostgreSQL...
sc query postgresql-x64-16 > nul 2>&1 && goto pg_ok
sc query postgresql-x64-15 > nul 2>&1 && goto pg_ok
sc query postgresql-x64-14 > nul 2>&1 && goto pg_ok

echo [WARN] PostgreSQL belum running. Mencoba start...
net start postgresql-x64-16 > nul 2>&1
net start postgresql-x64-15 > nul 2>&1
net start postgresql-x64-14 > nul 2>&1
timeout /t 2 /nobreak > nul

:pg_ok
echo [OK] PostgreSQL siap.

:: ─── 2. JALANKAN BACKEND DENGAN PRIORITAS TINGGI ──────────
echo.
echo [2/3] Menjalankan Backend Engine (HIGH PRIORITY)...
cd vamos-pos-backend

:: Cek apakah backend sudah dikompile
if not exist "dist\server.js" (
    echo [INFO] Backend belum dikompile. Menjalankan tsc...
    call npx tsc
)

:: Jalankan backend dengan HIGH priority di window terpisah
:: --max-old-space-size=512 = 512MB heap untuk Node
start "VAMOS-BACKEND" /HIGH cmd /c "node --max-old-space-size=512 dist/server.js"
echo [OK] Backend engine started (HIGH priority).
cd ..

:: ─── 3. JALANKAN ELECTRON ─────────────────────────────────
echo.
echo [3/3] Membuka Aplikasi Desktop...
cd vamos-pos-frontend

:: Cek apakah sudah ada build dist (jangan build ulang jika tidak perlu)
if not exist "dist\index.html" (
    echo [INFO] Build UI belum ada. Membangun sekarang...
    call npm run build
    if errorlevel 1 (
        echo [ERROR] Build gagal! Periksa error di atas.
        pause
        exit /b 1
    )
)

:: KUNCI: set VAMOS_PROD_MODE=1 agar Electron load localhost:3000
:: bukan localhost:5173 (Vite) yang tidak running saat mode ini
set VAMOS_PROD_MODE=1

:: Jalankan Electron dengan prioritas ABOVE NORMAL
start "VAMOS-FRONTEND" /ABOVENORMAL npx electron .

cd ..

echo.
echo ======================================================
echo    [DONE] Vamos POS sedang memuat...
echo    Backend berjalan di: http://localhost:3000
echo    Electron sedang terbuka...
echo ======================================================
echo.
echo Tekan tombol apa saja untuk tutup jendela ini.
echo (Backend tetap berjalan di background)
pause > nul
