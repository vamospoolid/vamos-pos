# ==============================================================================
# VAMOS POS - AUTOMATIC DATABASE INSTALLER & CONFIGURATION (PostgreSQL)
# ==============================================================================
# Script ini secara otomatis mengunduh, menginstal, dan membuat database PostgreSQL
# dengan kredensial default untuk Vamos POS tanpa interaksi manual.
# ==============================================================================

$ProgressPreference = 'SilentlyContinue'
$ErrorActionPreference = 'Stop'

# Kredensial Default POS
$PG_PASSWORD = "admin"
$PG_PORT = 5432
$DB_NAME = "vamos_pos"

Write-Host "======================================================" -ForegroundColor Green
Write-Host "   VAMOS POOL & CAFE - DATABASE AUTO-INSTALLER" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host ""

# --- 1. MEMERIKSA INSTALASI POSTGRESQL ---
Write-Host "[*] Memeriksa apakah PostgreSQL sudah terpasang..." -ForegroundColor Yellow

$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
$pgPath = ""

if ($pgService) {
    Write-Host "[✓] PostgreSQL terdeteksi berjalan sebagai Service." -ForegroundColor Green
} else {
    # Cek folder default program files
    $searchPaths = @(
        "C:\Program Files\PostgreSQL\16\bin\pg_ctl.exe",
        "C:\Program Files\PostgreSQL\15\bin\pg_ctl.exe",
        "C:\Program Files\PostgreSQL\14\bin\pg_ctl.exe"
    )
    foreach ($path in $searchPaths) {
        if (Test-Path $path) {
            $pgPath = $path
            break
        }
    }

    if ($pgPath) {
        Write-Host "[✓] PostgreSQL ditemukan di $pgPath" -ForegroundColor Green
    } else {
        # --- 2. UNDUH & INSTAL POSTGRESQL SECARA SILENT ---
        Write-Host "[!] PostgreSQL belum terpasang. Memulai proses unduhan..." -ForegroundColor Yellow
        $installerUrl = "https://get.enterprisedb.com/postgresql/postgresql-16.1-1-windows-x64.exe"
        $tempPath = "$env:TEMP\postgresql-installer.exe"

        Write-Host "[*] Mengunduh PostgreSQL 16 (Installer Resmi)..." -ForegroundColor Yellow
        try {
            Invoke-WebRequest -Uri $installerUrl -OutFile $tempPath -TimeoutSec 300
            Write-Host "[✓] Unduhan selesai." -ForegroundColor Green
        } catch {
            Write-Host "[ERROR] Gagal mengunduh PostgreSQL. Periksa koneksi internet Anda." -ForegroundColor Red
            Exit 1
        }

        Write-Host "[*] Memulai Instalasi Unattended (Silent)... Mohon tunggu beberapa menit." -ForegroundColor Yellow
        $arguments = "--mode unattended --unattendedmodeui none --superpassword `"$PG_PASSWORD`" --serverport $PG_PORT"
        try {
            $process = Start-Process -FilePath $tempPath -ArgumentList $arguments -Wait -NoNewWindow -PassThru
            if ($process.ExitCode -ne 0) {
                Write-Host "[ERROR] Instalasi PostgreSQL gagal dengan kode keluar: $($process.ExitCode)" -ForegroundColor Red
                Exit 1
            }
            Write-Host "[✓] Instalasi PostgreSQL 16 Sukses!" -ForegroundColor Green
            Start-Sleep -Seconds 5
        } catch {
            Write-Host "[ERROR] Gagal menjalankan installer PostgreSQL." -ForegroundColor Red
            Exit 1
        } finally {
            if (Test-Path $tempPath) { Remove-Item $tempPath -Force }
        }
    }
}

# --- 3. MEMBUAT DATABASE VAMOS_POS ---
Write-Host "[*] Menyiapkan database '$DB_NAME'..." -ForegroundColor Yellow

# Cari psql.exe
$psqlPath = ""
$searchPsql = @(
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files\PostgreSQL\14\bin\psql.exe"
)
foreach ($p in $searchPsql) {
    if (Test-Path $p) {
        $psqlPath = $p
        break
    }
}

if (-not $psqlPath) {
    Write-Host "[ERROR] Utilitas 'psql.exe' tidak ditemukan. Pastikan instalasi berhasil." -ForegroundColor Red
    Exit 1
}

# Set environment variable untuk password psql agar tidak meminta input user
$env:PGPASSWORD = $PG_PASSWORD

# Buat database jika belum ada
try {
    # Cek apakah db sudah ada
    $dbExists = & $psqlPath -h localhost -p $PG_PORT -U postgres -t -c "SELECT 1 FROM pg_database WHERE datname='$DB_NAME';"
    if ($dbExists.Trim() -eq "1") {
        Write-Host "[✓] Database '$DB_NAME' sudah ada di sistem." -ForegroundColor Green
    } else {
        Write-Host "[*] Membuat database '$DB_NAME'..." -ForegroundColor Yellow
        & $psqlPath -h localhost -p $PG_PORT -U postgres -c "CREATE DATABASE $DB_NAME;"
        Write-Host "[✓] Database '$DB_NAME' berhasil dibuat!" -ForegroundColor Green
    }
} catch {
    Write-Host "[ERROR] Gagal berkomunikasi dengan server PostgreSQL untuk membuat database." -ForegroundColor Red
    Exit 1
}

Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "   KONFIGURASI DATABASE SELESAI DENGAN SUKSES!" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host ""
