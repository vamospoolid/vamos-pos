@echo off
setlocal enabledelayedexpansion
title VAMOS POS - OFFICIAL SETUP ^& INSTALLER
color 0A

:: --- 1. ADMINISTRATOR CHECK ---
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo [ERROR] Harap jalankan script ini sebagai ADMINISTRATOR.
    echo (Klik kanan MASTER_SETUP.bat -> Run as Administrator)
    echo.
    pause
    exit /b
)

echo ======================================================
echo    VAMOS POOL ^& CAFE - SMART INSTALLER v2.5
echo ======================================================
echo.

set "CURRENT_DIR=%~dp0"
set "APP_DIR=%CURRENT_DIR%Vamos_POS_App"
set "EXE_NAME=Vamos Pool POS.exe"
set "EXE_PATH=%APP_DIR%\%EXE_NAME%"

:: --- 2. AUTOMATIC POSTGRESQL SETUP ---
echo [1/4] Menyiapkan PostgreSQL Database Engine...
powershell -NoProfile -ExecutionPolicy Bypass -File "%CURRENT_DIR%AUTO_INSTALL_POSTGRES.ps1"
if %errorLevel% neq 0 (
    echo.
    echo [ERROR] Gagal melakukan inisialisasi database PostgreSQL.
    echo Harap periksa log error di atas.
    pause
    exit /b
)

:: --- 3. CREATE DEFAULT ENV & RUN DB MIGRATIONS ---
echo [2/4] Melakukan Migrasi Database ^& Seed Data Awal...
cd /d "%CURRENT_DIR%vamos-pos-backend"

:: Buat .env default jika belum ada
if not exist ".env" (
    echo PORT=3000 > .env
    echo HOST=0.0.0.0 >> .env
    echo DATABASE_URL="postgresql://postgres:admin@localhost:5432/vamos_pos?schema=public" >> .env
    echo JWT_SECRET="admin" >> .env
    echo JWT_EXPIRES_IN="1d" >> .env
    echo IS_LOCAL_ELECTRON=true >> .env
    echo ENABLE_BRIDGE=true >> .env
    echo CLOUD_BASE_URL=https://pos.vamospool.id >> .env
    echo RELAY_COM_PORT=COM3 >> .env
    echo SYNC_SECRET=sync_secret_key >> .env
    echo VPS_SYNC_URL=https://pos.vamospool.id >> .env
    echo VENUE_TIMEZONE=8 >> .env
    echo [✓] Membuat file .env default.
)

:: Jalankan Prisma DB Push & Seed Data Awal
call npx prisma db push --accept-data-loss
if %errorLevel% neq 0 (
    echo [ERROR] Gagal melakukan migrasi database (npx prisma db push).
    pause
    exit /b
)

:: Panggil script seed-complete untuk data default
call npx ts-node src/database/seed-complete.ts
if %errorLevel% neq 0 (
    echo [WARNING] Gagal menjalankan script seeding default, namun database siap digunakan.
) else (
    echo [✓] Database dan data awal berhasil diinisialisasi!
)

cd /d "%CURRENT_DIR%"

:: --- 4. FIREWALL & DESKTOP SHORTCUT ---
echo [3/4] Mengatur Firewall Windows (Port 3000)...
netsh advfirewall firewall add rule name="Vamos POS Backend" dir=in action=allow protocol=TCP localport=3000 >nul 2>&1

echo [4/4] Membuat Shortcut di Desktop...
if exist "%EXE_PATH%" (
    powershell -Command "$s=[WScript.Shell]::new().CreateShortcut([System.IO.Path]::Combine([System.Environment]::GetFolderPath('Desktop'), 'VAMOS POS.lnk')); $s.TargetPath='%EXE_PATH%'; $s.WorkingDirectory='%APP_DIR%'; $s.Save()"
    echo [✓] Shortcut Desktop berhasil dibuat.
) else (
    echo [WARNING] File aplikasi "%EXE_NAME%" tidak ditemukan di folder "%APP_DIR%".
    echo Lewati pembuatan shortcut desktop.
)

echo.
echo ======================================================
echo    INSTALASI SELESAI DENGAN SUKSES!
echo ======================================================
echo.
echo Database PostgreSQL Anda siap digunakan.
echo Kredensial Database:
echo - Host: localhost (5432)
echo - DB Name: vamos_pos
echo - User: postgres / Password: admin
echo.
pause

