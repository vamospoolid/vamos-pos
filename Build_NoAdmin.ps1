# ======================================================
# VAMOS POOL & CAFE - MASTER ELECTRON BUILDER
# ======================================================
# This script will build a STANDALONE Windows Installer (.exe)
# that includes both the Backend Engine and Frontend UI.
# ======================================================

$ErrorActionPreference = "Stop"

# --- RUN AS ADMINISTRATOR ---
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if ($false) {([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Please run this script as Administrator to ensure PostgreSQL and permissions are correct." -ForegroundColor Red
    pause
    exit
}

Write-Host "######################################################" -ForegroundColor Cyan
Write-Host "#          VAMOS POOL & CAFE - BUILD SYSTEM         #" -ForegroundColor Cyan
Write-Host "######################################################" -ForegroundColor Cyan
Write-Host ""

# 1. PRE-REQUISITE CHECK
Write-Host "[1/6] Checking for PostgreSQL service..." -ForegroundColor Yellow
$pgService = Get-Service -Name "postgresql*"
if ($pgService) {
    Set-Service -Name $pgService.Name -StartupType Automatic
    # Start-Service -Name $pgService.Name -ErrorAction SilentlyContinue
    Write-Host "   -> PostgreSQL service ($($pgService.Name)) is active." -ForegroundColor Green
} else {
    Write-Host "   -> WARNING: PostgreSQL service not found! Is it installed on this machine?" -ForegroundColor Gray
}

# 2. BUILD FRONTEND (Vite/React)
Write-Host "`n[2/6] Building Frontend (React/Vite)..." -ForegroundColor Yellow
Set-Location "d:\APPS\vamosmobile\vamos-pos-frontend"
npm install --silent
npm run build
Write-Host "   -> Frontend build COMPLETE." -ForegroundColor Green

# 3. SYNC FRONTEND TO BACKEND PUBLIC
Write-Host "`n[3/6] Syncing UI to Backend..." -ForegroundColor Yellow
$publicDir = "d:\APPS\vamosmobile\vamos-pos-backend\public"
if (Test-Path $publicDir) { Remove-Item -Path "$publicDir\*" -Recurse -Force }
else { New-Item -ItemType Directory -Path $publicDir }

Copy-Item -Path "d:\APPS\vamosmobile\vamos-pos-frontend\dist\*" -Destination $publicDir -Recurse -Force
Write-Host "   -> Sync COMPLETE." -ForegroundColor Green

# 4. BUILD & BUNDLE BACKEND (Node/Express/Prisma)
Write-Host "`n[4/6] Building & Bundling Backend (pkg)..." -ForegroundColor Yellow
Set-Location "d:\APPS\vamosmobile\vamos-pos-backend"
npm install --silent
npm run build
npx prisma db push # Ensure local DB schema is ready
npm run bundle     # produces vamous-pos.exe
Write-Host "   -> Backend Engine bundle COMPLETE." -ForegroundColor Green

# 5. PACKAGING ELECTRON STANDALONE
Write-Host "`n[5/6] Packaging Electron App (Windows Installer)..." -ForegroundColor Yellow
Set-Location "d:\APPS\vamosmobile\vamos-pos-frontend"
# Build electron installer
npm run electron:build
Write-Host "   -> Electron installer packaging COMPLETE." -ForegroundColor Green

# 6. ALL DONE
$installerPath = "d:\APPS\vamosmobile\vamos-pos-frontend\dist\Vamos Pool POS.exe"
Write-Host "`n######################################################" -ForegroundColor Cyan
Write-Host "#            POWERFULL INSTALLER CREATED!            #" -ForegroundColor Cyan
Write-Host "######################################################" -ForegroundColor Cyan
Write-Host ""
Write-Host "Installer siap digunakan:" -ForegroundColor Yellow
Write-Host "$installerPath" -ForegroundColor Green
Write-Host ""
Write-Host "Tips: Pindahkan file EXE di atas ke komputer kasir." -ForegroundColor Gray
Write-Host ""
# pause
