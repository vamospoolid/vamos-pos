# ======================================================
# VAMOS POOL & CAFE - STARTUP SCRIPT
# ======================================================

Write-Host "######################################################" -ForegroundColor Cyan
Write-Host "#          VAMOS POOL & CAFE - STARTING SYSTEM       #" -ForegroundColor Cyan
Write-Host "######################################################" -ForegroundColor Cyan
Write-Host ""

# Ensure Postgres is running
Write-Host "[1/2] Checking PostgreSQL Service..." -ForegroundColor Yellow
$pgService = Get-Service -Name "postgresql*"
if ($pgService) {
    if ($pgService.Status -ne "Running") {
        Write-Host "   -> Starting PostgreSQL ($($pgService.Name))..." -ForegroundColor Green
        Start-Service -Name $pgService.Name
    } else {
        Write-Host "   -> PostgreSQL is already running." -ForegroundColor Green
    }
} else {
    Write-Host "   -> ERROR: PostgreSQL service not found!" -ForegroundColor Red
    pause
    exit
}

# Start Backend EXE and Browser
Write-Host "`n[2/2] Launching VAMOS POS ENGINE..." -ForegroundColor Yellow
Write-Host "   -> App starting at http://localhost:3000" -ForegroundColor Cyan
Write-Host "   -> JANGAN TUTUP JENDELA INI SELAMA KASIR BERJALAN." -ForegroundColor Red

# Force browser open
Start-Process "http://localhost:3000"

# Navigate to backend and run the exe
Set-Location "d:\vamosmobile\vamos-pos-backend"
.\vamous-pos.exe
