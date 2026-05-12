# ======================================================
# VAMOS POOL & CAFE - RELEASE V2 BUILDER
# ======================================================

$ErrorActionPreference = "Stop"
$ReleaseDir = "d:\APPS\vamosmobile\RELEASE_KASIR_V2_FIXED"

Write-Host "######################################################" -ForegroundColor Cyan
Write-Host "#       VAMOS POOL & CAFE - RELEASE V2 SYSTEM        #" -ForegroundColor Cyan
Write-Host "######################################################" -ForegroundColor Cyan

# 1. CLEAN & PREPARE
if (Test-Path $ReleaseDir) { Remove-Item -Path $ReleaseDir -Recurse -Force }
New-Item -ItemType Directory -Path $ReleaseDir

# 2. BUILD FRONTEND
Write-Host "`n[1/4] Building Frontend..." -ForegroundColor Yellow
Set-Location "d:\APPS\vamosmobile\vamos-pos-frontend"
npm install --silent
npm run build
Write-Host "   -> Frontend build COMPLETE." -ForegroundColor Green

# 3. SYNC TO BACKEND & BUNDLE BACKEND
Write-Host "`n[2/4] Building & Bundling Backend Engine..." -ForegroundColor Yellow
Set-Location "d:\APPS\vamosmobile\vamos-pos-backend"
npm install --silent
# Sync Frontend to Backend public
$publicDir = "d:\APPS\vamosmobile\vamos-pos-backend\public"
if (Test-Path $publicDir) { Remove-Item -Path "$publicDir\*" -Recurse -Force }
else { New-Item -ItemType Directory -Path $publicDir }
Copy-Item -Path "d:\APPS\vamosmobile\vamos-pos-frontend\dist\*" -Destination $publicDir -Recurse -Force

npm run build
npm run bundle
# Copy necessary binaries for packaging
Copy-Item -Path "d:\APPS\vamosmobile\vamos-pos-backend\node_modules\.prisma\client\query_engine-windows.dll.node" -Destination "d:\APPS\vamosmobile\vamos-pos-backend\" -Force
Write-Host "   -> Backend bundle COMPLETE." -ForegroundColor Green

# 4. PACKAGING ELECTRON
Write-Host "`n[3/4] Packaging Electron App..." -ForegroundColor Yellow
Set-Location "d:\APPS\vamosmobile\vamos-pos-frontend"
npm run electron:build
Write-Host "   -> Electron packaging COMPLETE." -ForegroundColor Green

# 5. COPY TO RELEASE FOLDER
Write-Host "`n[4/4] Preparing Release V2 folder..." -ForegroundColor Yellow
$distDir = "d:\APPS\vamosmobile\vamos-pos-frontend\dist"

# Check if Standalone Exe exists, if not copy Unpacked folder
if (Test-Path "$distDir\Vamos_POS_Portable.exe") {
    Copy-Item -Path "$distDir\Vamos_POS_Portable.exe" -Destination "$ReleaseDir\" -Force
}
if (Test-Path "$distDir\Vamos_POS_Setup_*.exe") {
    Copy-Item -Path "$distDir\Vamos_POS_Setup_*.exe" -Destination "$ReleaseDir\" -Force
}

if (Test-Path "$distDir\win-unpacked") {
    Write-Host "   -> Copying Unpacked App (Fallback)..." -ForegroundColor Gray
    Copy-Item -Path "$distDir\win-unpacked" -Destination "$ReleaseDir\Vamos_POS_App" -Recurse -Force
}

# Copy Backend to root for diagnostic scripts
Copy-Item -Path "d:\APPS\vamosmobile\vamos-pos-backend\vamous-pos.exe" -Destination "$ReleaseDir\" -Force

# Copy Backend to the expected internal path for the Unpacked App
$InternalBackendDir = "$ReleaseDir\Vamos_POS_App\resources\backend"
if (!(Test-Path $InternalBackendDir)) { New-Item -ItemType Directory -Path $InternalBackendDir -Force }
Copy-Item -Path "d:\APPS\vamosmobile\vamos-pos-backend\vamous-pos.exe" -Destination "$InternalBackendDir\" -Force
Copy-Item -Path "d:\APPS\vamosmobile\vamos-pos-backend\.env" -Destination "$InternalBackendDir\" -Force

Copy-Item -Path "d:\APPS\vamosmobile\CARA_INSTALL_V2.txt" -Destination "$ReleaseDir\CARA_INSTALL.txt" -Force
Copy-Item -Path "d:\APPS\vamosmobile\diagnose_hardware.js" -Destination "$ReleaseDir\" -Force
Copy-Item -Path "d:\APPS\vamosmobile\DIAGNOSE_HARDWARE.bat" -Destination "$ReleaseDir\" -Force
Copy-Item -Path "d:\APPS\vamosmobile\MASTER_SETUP.bat" -Destination "$ReleaseDir\" -Force

# Create a fresh .env for the user with AUTO support
$envContent = @"
PORT=3000
HOST=0.0.0.0
DATABASE_URL="postgresql://postgres:vamos-root@localhost:5432/vamos_pos?schema=public"
JWT_SECRET="admin"
JWT_EXPIRES_IN="1d"
RELAY_BASE_URL="http://localhost:3000/api/relay"
RELAY_API_KEY="relay_secret_key"
IS_LOCAL_ELECTRON=true
ENABLE_BRIDGE=true
CLOUD_BASE_URL=https://api.vamospool.id
RELAY_COM_PORT=AUTO
SYNC_SECRET=sync_secret_key
VPS_SYNC_URL=https://api.vamospool.id
"@
$envContent | Out-File "$ReleaseDir\.env" -Encoding utf8
$envContent | Out-File "$ReleaseDir\env_TEMPLATE.txt" -Encoding utf8

Write-Host "`n######################################################" -ForegroundColor Cyan
Write-Host "#            RELEASE V2 BERHASIL DICIPTAKAN!         #" -ForegroundColor Cyan
Write-Host "######################################################" -ForegroundColor Cyan
Write-Host "Lokasi: $ReleaseDir" -ForegroundColor Green
Write-Host ""
