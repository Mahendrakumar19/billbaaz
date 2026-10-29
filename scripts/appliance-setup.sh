#!/usr/bin/env bash
# ==============================================================================
# BillBaaz Appliance Setup Script (Linux / Mini-PC / Raspberry Pi / Ubuntu Server)
# "Billing Ka Baaz!"
# ==============================================================================
set -euo pipefail

echo "=========================================================="
echo "          🦅 BillBaaz Commercial Appliance Setup         "
echo "           Billing Ka Baaz! (Standalone POS)            "
echo "=========================================================="

APP_DIR="/opt/billbaaz"
SYSTEMD_SERVICE="/etc/systemd/system/billbaaz.service"

# 1. Update OS & install prerequisites
echo "==> Step 1: Updating packages & installing Docker Engine..."
sudo apt-get update -y
sudo apt-get install -y curl git ufw fail2ban jq

if ! command -v docker >/dev/null 2>&1; then
  echo "==> Installing Docker Engine..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER" || true
  sudo systemctl enable --now docker
fi

# 2. Setup Directory
echo "==> Step 2: Preparing application directory in $APP_DIR..."
sudo mkdir -p "$APP_DIR"
sudo chown -R "$USER":"$USER" "$APP_DIR"

if [ ! -f "$APP_DIR/docker-compose.yml" ]; then
  echo "==> Copying project files..."
  cp -r ./* "$APP_DIR/" 2>/dev/null || true
fi

# 3. Configure Local Firewall
echo "==> Step 3: Hardening local network firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment "SSH administration"
sudo ufw allow 80/tcp comment "BillBaaz Web POS"
sudo ufw allow 443/tcp comment "BillBaaz Web SSL"
sudo ufw allow 3000/tcp comment "BillBaaz Local POS Port"
sudo ufw --force enable || true

# 4. Create systemd Standalone Service
echo "==> Step 4: Configuring auto-boot systemd service..."
sudo bash -c "cat > $SYSTEMD_SERVICE" <<EOF
[Unit]
Description=BillBaaz Restaurant POS Appliance Stack
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable billbaaz.service

# 5. Setup Chromium Kiosk Mode Auto-start (if graphical desktop is detected)
KIOSK_DESKTOP="/etc/xdg/autostart/billbaaz-kiosk.desktop"
if [ -d "/etc/xdg/autostart" ]; then
  echo "==> Step 5: Configuring kiosk touchscreen auto-launch..."
  sudo bash -c "cat > $KIOSK_DESKTOP" <<EOF
[Desktop Entry]
Type=Application
Name=BillBaaz POS Kiosk
Exec=chromium-browser --noerrdialogs --disable-infobars --kiosk http://localhost:3000
Hidden=false
X-GNOME-Autostart-enabled=true
EOF
fi

echo "=========================================================="
echo " ✅ BillBaaz Appliance configuration completed!          "
echo " Server is configured to boot on power-on automatically.   "
echo " Access UI on: http://localhost:3000 or your LAN IP.       "
echo "=========================================================="
