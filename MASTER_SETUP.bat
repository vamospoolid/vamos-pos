@echo off
setlocal enabledelayedexpansion
title VAMOS POS - OFFICIAL SETUP
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
echo    VAMOS POOL ^& CAFE - SMART INSTALLER v2.1
echo ======================================================
echo.

set "CURRENT_DIR=%~dp0"
set "APP_DIR=%CURRENT_DIR%Vamos_POS_App"
set "EXE_NAME=Vamos Pool POS.exe"
set "EXE_PATH=%APP_DIR%\%EXE_NAME%"

echo [*] Mengecek file aplikasi...
if not exist "%EXE_PATH%" (
    echo [ERROR] File "%EXE_NAME%" tidak ditemukan di folder Vamos_POS_App.
    echo Pastikan Anda telah mengekstrak semua file.
    pause
    exit /b
)

echo [1/3] Mengatur Firewall Windows (Port 3000)...
netsh advfirewall firewall add rule name="Vamos POS Backend" dir=in action=allow protocol=TCP localport=3000 >nul 2>&1

echo [2/3] Membuat Shortcut di Desktop...
powershell -Command "$s=[WScript.Shell]::new().CreateShortcut([System.IO.Path]::Combine([System.Environment]::GetFolderPath('Desktop'), 'VAMOS POS.lnk')); $s.TargetPath='%EXE_PATH%'; $s.WorkingDirectory='%APP_DIR%'; $s.Save()"

echo [3/3] Verifikasi Hardware...
if exist "%CURRENT_DIR%vamous-pos.exe" (
    echo [*] Menjalankan diagnosa singkat...
    "%CURRENT_DIR%vamous-pos.exe" --diagnose
)

echo.
echo ======================================================
echo    INSTALASI SELESAI!
echo ======================================================
echo.
echo Anda sekarang dapat membuka "VAMOS POS" dari DESKTOP.
echo.
pause
