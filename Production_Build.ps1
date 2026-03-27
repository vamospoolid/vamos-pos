# ======================================================
# VAMOS POOL & CAFE - PRODUCTION BUILD & SETUP SCRIPT
# ======================================================
# This script will:
# 1. Set PostgreSQL service to "Automatic"
# 2. Build Frontend (React/Vite)
# 3. Build Backend (Express/TypeScript)
# 4. Generate a standalone .exe for the backend
# ======================================================

# --- RUN AS ADMINISTRATOR ---
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Please run this script as Administrator to configure PostgreSQL Service." -ForegroundColor Red
    pause
    exit
}

Write-Host "######################################################" -ForegroundColor Cyan
Write-Host "#          VAMOS POOL & CAFE - BUILD SYSTEM         #" -ForegroundColor Cyan
Write-Host "######################################################" -ForegroundColor Cyan
Write-Host ""

# 1. SET POSTGRES SERVICE TO AUTOMATIC
Write-Host "[1/5] Configuring PostgreSQL Service..." -ForegroundColor Yellow
$pgService = Get-Service -Name "postgresql*"
if ($pgService) {
    Set-Service -Name $pgService.Name -StartupType Automatic
    Start-Service -Name $pgService.Name -ErrorAction SilentlyContinue
    Write-Host "   -> PostgreSQL service ($($pgService.Name)) set to AUTOMATIC and STARTED." -ForegroundColor Green
} else {
    Write-Host "   -> ERROR: PostgreSQL service not found!" -ForegroundColor Red
}

# 2. BUILD FRONTEND
Write-Host "`n[2/5] Building Frontend..." -ForegroundColor Yellow
Set-Location "d:\vamosmobile\vamos-pos-frontend"
npm install --silent
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "   -> ERROR: Frontend build failed!" -ForegroundColor Red
    exit
}
Write-Host "   -> Frontend build COMPLETE." -ForegroundColor Green

# 3. SYNC TO BACKEND PUBLIC DIR
Write-Host "`n[3/5] Syncing build to Backend..." -ForegroundColor Yellow
$publicDir = "d:\vamosmobile\vamos-pos-backend\public"
if (Test-Path $publicDir) {
    Remove-Item -Path "$publicDir\*" -Recurse -Force
} else {
    New-Item -ItemType Directory -Path $publicDir
}
Copy-Item -Path "d:\vamosmobile\vamos-pos-frontend\dist\*" -Destination $publicDir -Recurse -Force
Write-Host "   -> Sync COMPLETE." -ForegroundColor Green

# 4. BUILD BACKEND & BUNDLE (EXE)
Write-Host "`n[4/5] Building & Bundling Backend..." -ForegroundColor Yellow
Set-Location "d:\vamosmobile\vamos-pos-backend"
npm install --silent
npm run build
npx prisma db push # Ensure DB schema is up to date
npm run bundle     # pkg . --output vamous-pos.exe

# Copy Prisma engine for the bundled EXE to use (resides in same folder as EXE)
Copy-Item -Path "d:\vamosmobile\vamos-pos-backend\node_modules\.prisma\client\query_engine-windows.dll.node" -Destination "d:\vamosmobile\vamos-pos-backend\" -Force

if ($LASTEXITCODE -ne 0) {
    Write-Host "   -> ERROR: Backend bundling failed!" -ForegroundColor Red
    exit
}
Write-Host "   -> Backend build & vamous-pos.exe bundle COMPLETE." -ForegroundColor Green

# 5. ALL DONE
Write-Host "`n######################################################" -ForegroundColor Cyan
Write-Host "#               BUILD & SETUP SUCCESS!               #" -ForegroundColor Cyan
Write-Host "######################################################" -ForegroundColor Cyan
Write-Host ""
Write-Host "Aplikasi siap dijalankan melalui:" -ForegroundColor Yellow
Write-Host "D:\vamosmobile\vamos-pos-backend\vamous-pos.exe" -ForegroundColor Green
Write-Host ""
Write-Host "Buka browser ke: http://localhost:3000" -ForegroundColor Green
Write-Host ""
pause
