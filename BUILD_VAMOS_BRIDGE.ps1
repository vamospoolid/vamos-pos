$ErrorActionPreference = "Continue"

Write-Host "######################################################" -ForegroundColor Cyan
Write-Host "#         VAMOS HARDWARE BRIDGE - BUILD SYSTEM       #" -ForegroundColor Cyan
Write-Host "######################################################" -ForegroundColor Cyan

# 1. BUILD BACKEND ENGINE (Jembatan Hardware)
Write-Host "`n[1/3] Building Hardware Engine (vamous-pos.exe)..." -ForegroundColor Yellow
Set-Location "d:\vamosmobile\vamos-pos-backend"
npm run build
npm run bundle
# Copy engine Prisma yang diperlukan
Copy-Item -Path "d:\vamosmobile\vamos-pos-backend\node_modules\.prisma\client\query_engine-windows.dll.node" -Destination "d:\vamosmobile\vamos-pos-backend\" -Force
Write-Host "   -> Engine Bridge SIAP." -ForegroundColor Green

# 2. PERSIAPAN ELECTRON (Ringan)
Write-Host "`n[2/3] Preparing Lightweight Electron Shell..." -ForegroundColor Yellow
Set-Location "d:\vamosmobile\vamos-pos-frontend"
# Buat folder dist minimal agar electron-builder tidak error
if (-not (Test-Path "dist")) { New-Item -ItemType Directory -Path "dist" }
"<h1>VAMOS BRIDGE ACTIVE</h1><p>Menghubungkan ke pos.vamospool.id...</p>" | Out-File "dist/index.html"

# 3. PACKAGING ELECTRON
Write-Host "`n[3/3] Packaging Electron Portable..." -ForegroundColor Yellow
# Kita gunakan --win --portable agar cepat dan hanya menghasilkan satu file exe
npm run electron:build -- --win --portable
Write-Host "   -> Electron Portable SIAP di folder dist." -ForegroundColor Green

Write-Host "`n######################################################" -ForegroundColor Cyan
Write-Host "#          VAMOS HARDWARE BRIDGE BERHASIL!           #" -ForegroundColor Cyan
Write-Host "######################################################" -ForegroundColor Cyan
Write-Host "File ada di: d:\vamosmobile\vamos-pos-frontend\dist\Vamos_POS_Portable.exe"
pause
