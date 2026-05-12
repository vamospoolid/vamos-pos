# ======================================================
# VAMOS POOL & CAFE - MASTER INSTALLER BUILDER (V2)
# ======================================================
# Target: Vamos_POS_Setup_2.0.0.exe
# ======================================================

$ErrorActionPreference = "Stop"
$CurrentDir = Get-Location
$Version = "2.0.0"

Write-Host "######################################################" -ForegroundColor Cyan
Write-Host "#       VAMOS POOL & CAFE - MASTER INSTALLER V2      #" -ForegroundColor Cyan
Write-Host "######################################################" -ForegroundColor Cyan
Write-Host ""

# 1. CLEANING
Write-Host "[1/5] Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path "d:\APPS\vamosmobile\vamos-pos-frontend\dist") { Remove-Item -Path "d:\APPS\vamosmobile\vamos-pos-frontend\dist" -Recurse -Force }
if (Test-Path "d:\APPS\vamosmobile\vamos-pos-backend\vamous-pos.exe") { Remove-Item -Path "d:\APPS\vamosmobile\vamos-pos-backend\vamous-pos.exe" -Force }

# 2. BUILD FRONTEND
Write-Host "`n[2/5] Building Frontend (React/Vite)..." -ForegroundColor Yellow
Set-Location "d:\APPS\vamosmobile\vamos-pos-frontend"
npm run build
Write-Host "   -> Frontend build COMPLETE." -ForegroundColor Green

# 3. BUILD & BUNDLE BACKEND
Write-Host "`n[3/5] Building & Bundling Backend Engine..." -ForegroundColor Yellow
Set-Location "d:\APPS\vamosmobile\vamos-pos-backend"
npm run build
npm run bundle
# Ensure prisma files are ready for extraResources
Copy-Item -Path "node_modules\.prisma\client\query_engine-windows.dll.node" -Destination ".\query_engine-windows.dll.node" -Force
Write-Host "   -> Backend bundle COMPLETE." -ForegroundColor Green

# 4. PACKAGING ELECTRON INSTALLER
Write-Host "`n[4/5] Packaging Electron Installer (.exe)..." -ForegroundColor Yellow
Set-Location "d:\APPS\vamosmobile\vamos-pos-frontend"

# Bypass code signing and force non-interactive build
$env:CSC_IDENTITY_AUTO_DISCOVERY = "false"
$env:ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES = "true"

npm run electron:build
Write-Host "   -> Electron packaging COMPLETE." -ForegroundColor Green

# 5. FINALIZING
Write-Host "`n[5/5] Finalizing Release..." -ForegroundColor Yellow
$SetupFile = Get-ChildItem -Path "dist" -Filter "Vamos_POS_Setup_*.exe" | Select-Object -First 1

if ($SetupFile) {
    $ReleaseFolder = "d:\APPS\vamosmobile\RELEASE_KASIR_MASTER"
    if (!(Test-Path $ReleaseFolder)) { New-Item -ItemType Directory -Path $ReleaseFolder }
    
    Copy-Item -Path $SetupFile.FullName -Destination "$ReleaseFolder\Vamos_POS_Master_Setup_v$Version.exe" -Force
    Write-Host "`n######################################################" -ForegroundColor Cyan
    Write-Host "#            INSTALLER BERHASIL DICIPTAKAN!          #" -ForegroundColor Cyan
    Write-Host "######################################################" -ForegroundColor Cyan
    Write-Host "Lokasi: $ReleaseFolder\Vamos_POS_Master_Setup_v$Version.exe" -ForegroundColor Green
} else {
    Write-Host "   -> WARNING: Setup file not found in dist/. Checking unpacked folder..." -ForegroundColor Yellow
    if (Test-Path "dist\win-unpacked") {
        Write-Host "   -> Unpacked app found. You can use this as a portable version." -ForegroundColor Gray
    } else {
        Write-Host "   -> ERROR: Build failed to produce output." -ForegroundColor Red
    }
}

Set-Location $CurrentDir
Write-Host "`nDone."
