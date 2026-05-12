@echo off
title VAMOS POS - DIAGNOSA HARDWARE
color 0B

echo ======================================================
echo    VAMOS POOL & CAFE - HARDWARE DIAGNOSTIC
echo ======================================================
echo.

:: 1. Cek apakah ada bundled exe
if exist "vamous-pos.exe" (
    echo [INFO] Menjalankan diagnosa via Bundled Engine...
    vamous-pos.exe --diagnose
    goto end
)

:: 2. Cek apakah ada node
where node >nul 2>&1
if %errorlevel% equ 0 (
    if exist "diagnose_hardware.js" (
        echo [INFO] Menjalankan diagnosa via Node.js...
        node diagnose_hardware.js
        goto end
    )
)

echo [ERROR] Tidak dapat menjalankan diagnosa.
echo Pastikan vamous-pos.exe atau Node.js tersedia.

:end
echo.
echo Selesai.
pause
