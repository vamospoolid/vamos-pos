# ======================================================
# VAMOS POOL & CAFE - PORTABLE BUILDER (NO ADMIN REQ)
# ======================================================
$ErrorActionPreference = "Continue"

Write-Host "######################################################" -ForegroundColor Cyan
Write-Host "#          VAMOS POOL & CAFE - BUILD SYSTEM         #" -ForegroundColor Cyan
Write-Host "######################################################" -ForegroundColor Cyan

# 1. BUILD FRONTEND (Vite/React)
Write-Host "`n[1/5] Building Frontend (React/Vite)..." -ForegroundColor Yellow
Set-Location ".\vamos-pos-frontend"
npm run build
Write-Host "   -> Frontend build COMPLETE." -ForegroundColor Green

# 2. SYNC FRONTEND TO BACKEND PUBLIC
Write-Host "`n[2/5] Syncing UI to Backend..." -ForegroundColor Yellow
$publicDir = "..\vamos-pos-backend\public"
if (Test-Path $publicDir) { Remove-Item -Path "$publicDir\*" -Recurse -Force }
else { New-Item -ItemType Directory -Path $publicDir }

Copy-Item -Path ".\dist\*" -Destination $publicDir -Recurse -Force
Write-Host "   -> Sync COMPLETE." -ForegroundColor Green

# 3. BUILD & BUNDLE BACKEND (Node/Express/Prisma)
Write-Host "`n[3/5] Building & Bundling Backend (pkg)..." -ForegroundColor Yellow
Set-Location "..\vamos-pos-backend"
npm run build
# npx prisma db push # Skiped because it might need admin or local DB access
npm run bundle     # produces vamous-pos.exe
Write-Host "   -> Backend Engine bundle COMPLETE." -ForegroundColor Green

# 4. PACKAGING ELECTRON PORTABLE
Write-Host "`n[4/5] Packaging Electron App (Portable)..." -ForegroundColor Yellow
Set-Location "..\vamos-pos-frontend"
npm run electron:build
Write-Host "   -> Electron Portable packaging COMPLETE." -ForegroundColor Green

# 5. ALL DONE
$installerPath = ".\dist\Vamos_POS_Portable.exe"
Write-Host "`n######################################################" -ForegroundColor Cyan
Write-Host "#            POWERFULL PORTABLE CREATED!             #" -ForegroundColor Cyan
Write-Host "######################################################" -ForegroundColor Cyan
Write-Host ""
Write-Host "Cek di folder dist:" -ForegroundColor Yellow
Write-Host "$installerPath" -ForegroundColor Green
Write-Host ""
pause
