# ==============================================================================
# BillBaaz Windows One-Click Standalone Desktop Installer
# "Billing Ka Baaz!"
# ==============================================================================
param(
  [string]$InstallPath = "$env:ProgramFiles\BillBaaz",
  [switch]$LaunchAfter = $true
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "       🦅 BillBaaz Commercial Windows Installer          " -ForegroundColor Yellow
Write-Host "         Billing ka baazigar! (Standalone POS)           " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Check Administrator Privileges
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
  Write-Warning "Please run this installer as Administrator to configure services and firewall."
}

# 2. Check Docker Desktop or Container Runtime
Write-Host "==> Step 1: Checking Docker Desktop environment..." -ForegroundColor Green
$hasDocker = Get-Command docker -ErrorAction SilentlyContinue
if (-not $hasDocker) {
  Write-Host "Docker is not detected on PATH. Checking Docker Desktop default installation..." -ForegroundColor Yellow
  if (Test-Path "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe") {
    $env:PATH += ";$env:ProgramFiles\Docker\Docker\resources\bin"
  } else {
    Write-Warning "Docker Desktop not found. Please install Docker Desktop for Windows to run the local database."
  }
}

# 3. Create Installation Directory
Write-Host "==> Step 2: Preparing destination directory at $InstallPath..." -ForegroundColor Green
New-Item -ItemType Directory -Force -Path $InstallPath | Out-Null

# Copy project files
Write-Host "==> Step 3: Copying BillBaaz runtime files..." -ForegroundColor Green
Copy-Item -Path ".\docker-compose.yml" -Destination "$InstallPath\" -Force -ErrorAction SilentlyContinue
Copy-Item -Path ".\apps" -Destination "$InstallPath\" -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item -Path ".\packages" -Destination "$InstallPath\" -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item -Path ".\windows" -Destination "$InstallPath\" -Recurse -Force -ErrorAction SilentlyContinue

# 4. Create Desktop Shortcut
Write-Host "==> Step 4: Creating Windows Desktop Shortcut..." -ForegroundColor Green
$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$Shortcut = $WshShell.CreateShortcut("$DesktopPath\BillBaaz POS.lnk")
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-ExecutionPolicy Bypass -NoExit -Command `"cd '$InstallPath'; docker compose up -d; Start-Process 'http://localhost:3000'`""
$Shortcut.Description = "BillBaaz - Billing Ka Baaz! (Standalone POS)"
if (Test-Path ".\windows\msix\Assets\app.ico") {
  $Shortcut.IconLocation = "$InstallPath\windows\msix\Assets\app.ico"
}
$Shortcut.Save()

# 5. Open Inbound Port in Windows Firewall for Tablet / Waiter Connections
Write-Host "==> Step 5: Configuring Windows Firewall for LAN Tablets (Port 3000)..." -ForegroundColor Green
try {
  netsh advfirewall firewall add rule name="BillBaaz Local POS Server" dir=in action=allow protocol=TCP localport=3000 | Out-Null
  Write-Host "Firewall rule configured successfully." -ForegroundColor Green
} catch {
  Write-Warning "Could not add firewall rule automatically. Please allow port 3000 manually if using LAN tablets."
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " ✅ BillBaaz Windows Installation Complete!             " -ForegroundColor Green
Write-Host " Shortcut created on Desktop: 'BillBaaz POS'             " -ForegroundColor White
Write-Host " Launch URL: http://localhost:3000                      " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

if ($LaunchAfter) {
  Write-Host "Starting BillBaaz services..." -ForegroundColor Cyan
  Start-Process "http://localhost:3000"
}
