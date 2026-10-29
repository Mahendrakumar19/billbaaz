# 🛡️ BillBaaz — Multi-Tenant Architecture & Client Onboarding Master Playbook
**Confidential & Proprietary — For Nighwan Technology Private Limited Only**  
*Author:* Nighwan Technology (<https://nighwantech.com>)  
*Platform:* BillBaaz ("Billing ka baazigar")  
*Version:* 2.0 Production Ready

---

## 📌 Executive Summary

BillBaaz is engineered as an enterprise-grade, **schema-isolated logical multi-tenant restaurant operating system**. With a single deployment on your server (Hostinger VPS `72.61.242.223`), you can onboard hundreds of individual restaurants, cloud kitchens, franchises, and multi-branch chains. Each restaurant operates in absolute privacy with zero data leakage, customized branding, independent menus, staff roles, and hardware profiles.

This master playbook is your blueprint for operating, onboarding, scaling, and commercializing BillBaaz as a SaaS product competing directly with PetPooja, POSist, and UrbanPiper.

---

## 🏗️ 1. Multi-Tenant Architecture & Data Isolation

### 1.1 Tenant Hierarchy
```
┌──────────────────────────────────────────────────────────────┐
│                    Nighwan Cloud (BillBaaz)                  │
└──────────────────────────────┬───────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌───────────────────────┐             ┌───────────────────────┐
│ Restaurant A (Tenant) │             │ Restaurant B (Tenant) │
│ "Biryani Darbar"      │             │ "Chai Junction"       │
├───────────────────────┤             ├───────────────────────┤
│ • Restaurant ID (CUID)│             │ • Restaurant ID (CUID)│
│ • Custom Logo & UPI   │             │ • Custom Logo & UPI   │
│ • Owner & Staff Roles │             │ • Owner & Staff Roles │
└───────────┬───────────┘             └───────────┬───────────┘
            │                                     │
   ┌────────┴────────┐                   ┌────────┴────────┐
   ▼                 ▼                   ▼                 ▼
Branch 1          Branch 2            Branch 1          Branch 2
(Kolkata)         (Patna)             (Bangalore)       (Hyderabad)
• KDS & Tables    • KDS & Tables      • KDS & Tables    • KDS & Tables
• Printers        • Printers          • Printers        • Printers
• Orders & KOTs   • Orders & KOTs     • Orders & KOTs   • Orders & KOTs
```

### 1.2 Data Isolation Guarantee
Every table in the PostgreSQL database is strictly partitioned by foreign keys:
- **Tenant Level (`restaurantId`):** All `roles`, `users`, `integration_api_keys`, `webhook_endpoints`, and `loyalty_settings` belong directly to a `Restaurant`.
- **Branch Level (`branchId`):** All `orders`, `order_items`, `kots`, `tables`, `floors`, `menu_items`, `inventory`, `shifts`, `expenses`, and `attendance` are tied to a `Branch`.
- **Enforcement Mechanism:**
  1. **JWT Auth Guards:** The backend's `JwtAuthGuard` extracts `user.restaurantId` and authorized `branchIds` from the cryptographically signed JWT token.
  2. **Service Layer Constraints:** Every Prisma query explicitly includes `{ where: { restaurantId: req.user.restaurantId } }` or `{ where: { branchId: { in: req.user.allowedBranchIds } } }`.
  3. **No Cross-Tenant Leaks:** Even if an operator manually tampers with an ID in an API call, Prisma fails with `404 Not Found` because the record does not belong to their tenant context.

---

## ⚡ 2. Current System Checklist (Apne System Me Abhi Kya Karna Hai)

Before onboarding external clients, execute these immediate steps on your VPS to verify your primary deployment:

### Step 2.1 — Pull Latest Code & Build Containers
On your Hostinger VPS:
```bash
# 1. Go to repository folder
cd /opt/billbaaz

# 2. Fetch the latest codebase
git pull origin master

# 3. Build & start all containers
docker compose up -d --build
```

### Step 2.2 — Run DB Migrations & Database Seed
```bash
# Apply all Prisma migrations
docker compose exec backend npx prisma migrate deploy

# Seed initial roles, permissions, demo owner, and menu categories
docker compose exec backend npx prisma db seed
```

### Step 2.3 — Verify Status
```bash
# Check running containers
docker compose ps
```
You should see 3 healthy services:
- `billbaaz-backend` (Port 4000)
- `billbaaz-web` (Port 3000)
- `billbaaz-postgres` (Port 5432)

### Step 2.4 — Log in to the System
- Open browser: `https://billbaaz.com` (or `http://72.61.242.223` if DNS is propagating).
- Seed Owner Credentials:
  - **Email:** `demo@billbaaz.com` (or default seed email in `seed.ts`)
  - **Password:** `Admin@1234`
  - **Quick Unlock PIN:** `1234`

---

## 🚀 3. How to Onboard a New Client / Restaurant (Multi-Tenant Setup)

There are **two ways** to onboard a new restaurant onto BillBaaz:

### Method A: Self-Service Automated Onboarding (SaaS Mode)
Give the restaurant owner your public registration link:
`https://billbaaz.com/signup`

**What Happens Automatically:**
1. Client enters:
   - **Restaurant Name** (e.g., *Royal Punjab Dhaba*)
   - **Branch / Outlet Name** (e.g., *Connaught Place*)
   - **Owner Name**
   - **Email & Password**
2. The system executes a single atomic PostgreSQL transaction:
   - Inserts new `Restaurant` record.
   - Inserts initial `Branch` record.
   - Generates isolated staff roles: `OWNER`, `MANAGER`, `CASHIER`, `WAITER`, `CHEF`, `DELIVERY_DRIVER`.
   - Maps 50+ granular permissions.
   - Links the owner user and automatically logs them into their blank dashboard.
3. No manual developer intervention required!

---

### Method B: Manual White-Glove Onboarding (Admin / Super-Owner Mode)
When charging clients a setup fee (₹5,000 – ₹15,000), follow this standard operating procedure:

#### Step 1: Create Client Account
Either sign them up via `/signup` or use the backend CLI to create their tenant account.

#### Step 2: Configure Restaurant Profile & GST
Go to **Settings ➔ General**:
1. **Restaurant Legal Name:** Enter registered company name.
2. **GST / Tax ID:** Enter 15-digit Indian GSTIN (e.g. `07AAAAA0000A1Z5`).
3. **Tax Regime:** Select `INDIA_GST` (Automatic 5% / 18% CGST + SGST splitting).
4. **Currency:** `INR (₹)`.
5. **Timezone:** `Asia/Kolkata`.
6. **Upload Logo:** Upload client's custom circular or rectangular logo.

#### Step 3: Setup UPI Dynamic QR (Zero Transaction Charges)
Go to **Settings ➔ General ➔ UPI QR**:
1. **UPI VPA:** Enter the client's business UPI handle (e.g. `restaurantname@icici` or `9876543210@paytm`).
2. **Payee Name:** Legal business name matching their bank account.
*Result:* At POS checkout, dynamic NPCI QR codes generate automatically with exact bill amounts, crediting 100% of the money straight to their bank account with 0% gateway fee!

#### Step 4: Import / Create Client Menu
Go to **Menu ➔ Categories & Items**:
1. Create core categories: Starters, Main Course, Breads, Beverages, Desserts.
2. Add Items:
   - Name & Short Code (e.g., `PAN01` for Paneer Butter Masala).
   - Tax Rate: Standard 5% GST (or 18% for AC/Liquor if applicable).
   - Base Price (Tax Inclusive).
   - Half / Full portion pricing.
   - Modifiers (e.g., Spice Level: Mild / Medium / Spicy).

#### Step 5: Configure Floor Plan & Tables
Go to **Tables ➔ Add Floor**:
1. Create sections: *Ground Floor (AC)*, *First Floor*, *Rooftop*, *Takeaway / Bar Counter*.
2. Add tables (T1, T2, T3... Table 20).
3. Generate **Guest QR Codes** for table self-ordering:
   - Print the generated QR code PDF and paste on each table.
   - Guests scan ➔ browse live digital menu ➔ place order without app install.

#### Step 6: Setup Staff & Quick-PINs
Go to **Staff & Roles**:
1. Invite or create staff profiles:
   - **Cashier / Counter:** Access only to POS, Billing, and Cash Drawer.
   - **Captains / Waiters:** Access only to Table Management and KOT creation.
   - **Chefs / Kitchen:** Access only to KDS (Kitchen Display System).
2. Assign each staff a **4-digit PIN** (e.g. `2024`, `5511`).
3. Fast switching allows staff to tap their PIN and punch orders within 2 seconds.

---

## 🛵 4. Online Delivery (Zomato & Swiggy) Client Onboarding

Every client wants Zomato and Swiggy orders on the same screen:

1. In the client dashboard, click **Online Orders (🛵)** on the sidebar.
2. Click **Connect Accounts**:
   - **Zomato:** Enter Zomato Restaurant ID (`ResId`) and API Secret.
   - **Swiggy:** Enter Swiggy Merchant / Store ID and API Secret.
   - Toggle: `[✓] Auto-accept orders straight to kitchen`.
3. Copy their unique Webhook URL:
   `https://billbaaz.com/api/v1/integrations/aggregators/order`
4. Submit this webhook in the **Zomato Merchant Partner Portal** and **Swiggy Partner Dashboard**.
5. Test integration using the **"+ Test Zomato"** and **"+ Test Swiggy"** simulator buttons.

---

## 🖨️ 5. Client Hardware & Peripheral Setup

BillBaaz uses direct raw thermal ESC/POS printing over WebUSB, Network (Ethernet/Wi-Fi), and Bluetooth:

### 5.1 Thermal Receipt Printers (Billing & KOT)
- **Supported Sizes:** 80 mm (standard 3-inch, 48 columns) and 58 mm (2-inch, 32 columns).
- **Billing Printer:** Connect via USB or LAN IP (e.g., `192.168.1.100:9100`).
- **Kitchen (KOT) Printer:** Set IP of the kitchen printer in **Settings ➔ Hardware**.
- **Cut & Drawer Kick:** BillBaaz automatically sends hex command `0x1B 0x70 0x00` to pop open the physical cash drawer upon cash payment.

### 5.2 Card Machine (EDC) & Soundbox
- **Soundbox:** Webhooks can be pointed to Paytm/PhonePe soundbox APIs for instant voice confirmation: *"BillBaaz par ₹450 prapt hue"*.
- **Pine Labs / Mswipe EDC:** Integration available via local API bridge over LAN.

---

## 🔒 6. Custom Subdomain & Domain Routing (Per-Client Whitelabel)

If a high-value client wants their own branded domain (e.g. `pos.haldiramspatna.com` or `client.billbaaz.com`):

### 6.1 Subdomain Architecture
You can route wildcard subdomains `*.billbaaz.com` directly in Caddy or Nginx:
```caddyfile
# /etc/caddy/Caddyfile on Hostinger VPS

*.billbaaz.com, billbaaz.com {
    reverse_proxy 127.0.0.1:3000
}

api.billbaaz.com {
    reverse_proxy 127.0.0.1:4000
}
```
Caddy automatically provisions free, auto-renewing Let's Encrypt SSL certificates for every subdomain with zero downtime!

---

## 💾 7. Automated Backups & Disaster Recovery

Run this nightly cron script on your Hostinger VPS to ensure zero data loss:

```bash
#!/bin/bash
# /opt/scripts/backup-billbaaz.sh
BACKUP_DIR="/opt/backups/billbaaz"
DATE=$(date +'%Y-%m-%d_%H%M%S')
mkdir -p "$BACKUP_DIR"

# Dump entire PostgreSQL database
docker compose -f /opt/billbaaz/docker-compose.yml exec -T postgres \
  pg_dump -U billbaaz -d billbaaz | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Keep last 14 days, delete older
find "$BACKUP_DIR" -type f -mtime +14 -name "*.sql.gz" -exec rm {} +

echo "Backup completed successfully at $DATE"
```
Set in crontab (`crontab -e`):
```cron
0 3 * * * /opt/scripts/backup-billbaaz.sh >> /var/log/billbaaz-backup.log 2>&1
```

---

## 💰 8. Commercial Packaging & Pricing Strategy (Beat PetPooja)

| Feature Comparison | PetPooja (Annual ₹15,000+) | BillBaaz (Nighwan Technology) |
| :--- | :--- | :--- |
| **Pricing Model** | High annual fees + add-on charges | Affordable Monthly / Lifetime SaaS |
| **Zomato & Swiggy Relay** | ₹3,000/yr extra add-on | **Included Free** |
| **WhatsApp Invoicing** | 25p per message + gateway setup | **Included via Cloud API** |
| **Dynamic UPI QR** | Transaction gateway fees | **0% MDR (Straight to bank)** |
| **Kiosk & Table QR Self-Order**| Expensive hardware proprietary | **Runs on any Android tablet/iPad** |
| **Hardware Lock-in** | Proprietary drivers & locks | **Open WebUSB / LAN / Bluetooth** |

### Recommended Subscription Tiers:
- **Starter (Single Outlet):** ₹799 / month or ₹7,999 / year (POS + Unlimited KOT + Menu).
- **Pro (Restaurant + Aggregators):** ₹1,299 / month or ₹12,999 / year (Includes Zomato/Swiggy Hub + WhatsApp Bills).
- **Enterprise / Franchise:** Custom pricing (Multi-branch centralized inventory & reporting).

---

## 📞 Support & Maintenance Contact
*Developed and maintained by:*  
**Nighwan Technology Private Limited**  
Website: [https://nighwantech.com](https://nighwantech.com)  
Platform: **BillBaaz ("Billing ka baazigar")**

