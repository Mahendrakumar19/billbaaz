# Commercial Restaurant Management Suite: Transformation, White-Labeling & Production Launch Blueprint

This document serves as your master specification, audit checklist, and progress tracker to transform this codebase into your own commercial, standalone, and white-labeled Restaurant Management Platform: **BillBaaz — Billing Ka Baaz!**

---

## 🦅 Official Brand Identity: BillBaaz

* **Brand Name:** BillBaaz
* **Tagline:** Billing Ka Baaz! / Billing ka baazigar
* **Palette:** Vibrant Orange (`#FF7A00` / `#F97316`), Deep Navy Blue (`#132E4F` / `#0B2545`), Crisp Receipt White (`#FFFFFF`).
* **Visual Motif:** Stylized capital letter "B" fused with a forward-soaring Falcon ("Baaz") head, speed lines, and a printed thermal receipt drape.

---

## ⚖️ Milestone 0: Legal, Intellectual Property & Licensing Architecture

- [ ] **0.1 Legal Entity & Intellectual Property Strategy**
  - [ ] Choose deployment distribution model (SaaS vs. On-Premises Appliance vs. Hybrid).
  - [ ] Execute upstream commercial buyout or finalize copyleft compliance strategy.
  - [ ] Register your brand name, trademark, and domain names.
  - [ ] Draft End User License Agreement (EULA), Terms of Service (ToS), and Privacy Policy under Indian IT Act 2000 & DPDP Act 2023.

---

## 🎨 Milestone 1: Complete White-Labeling & Visual Rebranding (✅ COMPLETED)

All traces of upstream branding ("Nodedr", "OrderRestro") have been replaced with **BillBaaz** across frontend, backend, receipts, emails, and container metadata.

### 1.1 Brand Assets & Imagery
- [x] **1.1.1** Replaced app icons & favicons with official BillBaaz falcon emblem:
  - `apps/web/public/logo.png` (512x512 transparent emblem)
  - `apps/web/public/icons/icon-512.png` & `apps/web/public/icons/icon-192.png`
  - `apps/web/public/icons/favicon-32.png` & `apps/web/public/manifest.json`
  - `apps/web/public/icons/icon-512-maskable.png` (Android maskable icon)
- [x] **1.1.2** Generated high-resolution brand lockup (`apps/web/public/brand-lockup.png` 960x280).
- [x] **1.1.3** Updated OpenGraph metadata (`og:title`, `og:image`, `og:description`) in Next.js layout (`apps/web/app/layout.tsx`).
- [x] **1.1.4** Updated Windows desktop MSIX packaging assets in `windows/msix/Assets/` (`SplashScreen.png`, `Square150x150Logo.png`, `Square310x310Logo.png`, `Square44x44Logo.png`, `Wide310x150Logo.png`, `StoreLogo.png`).

### 1.2 Strings, Copy & Package Metadata
- [x] **1.2.1** Search & replace across all UI components and strings:
  - Replaced `Nodedr`, `NodeDR`, and `OrderRestro` with `BillBaaz`.
  - Updated copyright footer strings, support links, app titles, layout titles, metadata, headers, auth screens (`login`, `signup`, `app-shell`, `brand-footer`, `claimed-landing`).
- [x] **1.2.2** Updated package manifests:
  - Root `package.json`: `name: "billbaaz"`, `description: "BillBaaz — Billing ka baazigar"`.
  - `apps/backend/package.json` and `apps/web/package.json`.
  - MSIX configuration in `windows/msix/AppxManifest.xml` (Publisher: `BillBaaz`, DisplayName: `BillBaaz`).
  - Container names in `docker-compose.yml` (`billbaaz-backend`, `billbaaz-web`, `billbaaz-postgres`, `billbaaz-updater`).

### 1.3 Design System & Custom Themes
- [x] **1.3.1** In `apps/web/components/layout/logo.tsx`, rendered the official Falcon B logo.
- [x] **1.3.2** Receipt Branding:
  - Standard print invoice layout (`apps/backend/src/modules/orders/receipt.html.ts` and `escpos-receipt.ts`) updated with `Powered by BillBaaz — Billing ka baazigar`.

---

## 🚀 Milestone 2: Functional Upgrades to Outperform PetPooja

- [ ] **2.1 Online Delivery Aggregator Auto-Sync (Zomato & Swiggy)**
  - [ ] **Zomato Food Ordering API Integration**: Real-time order capture, status update, menu sync.
  - [ ] **Swiggy Connect API Integration**: Webhook receiver for order placement and status.
  - [ ] **Auto-KOT Routing**: Auto-accept rules and kitchen station print slips with aggregator tags.
- [ ] **2.2 Advanced Split-Tender & Multi-Check Billing**
  - [ ] Multi-Tender Support: Cash + Card, Cash + UPI, or Card + Voucher splits on single checkout.
  - [ ] Split Check by Guest / by Item.
- [ ] **2.3 Integrated EDC Card Machine & Dynamic Soundbox Integration**
  - [ ] Pine Labs / Paytm / Mswipe / Mosambee POS terminal bridge.
  - [ ] Paytm / PhonePe / BharatPe Soundbox audio confirmation webhook.
- [ ] **2.4 Service Charges, Discounts & Dynamic Pricing**
  - [ ] Discretionary Restaurant Service Charge (5% or 10%).
  - [ ] Item-level discounts & Happy Hour schedules.
- [ ] **2.5 Multi-Branch Central Cloud Dashboard**
  - [ ] Cloud Sync Engine for multi-outlet aggregation.

---

## 🔒 Milestone 3: Hardened Enterprise Security & Multi-Tenancy

- [x] **3.1 Tenant Isolation & Data Boundary** (Multi-tenant restaurant/branch scoping via Prisma & BranchAccessService) <!-- completed -->
- [x] **3.2 Authentication, RBAC & Cashier Auto-Lock** <!-- completed -->
  - [x] Inactivity timeout (e.g., auto-lock POS screen after 90 seconds, 4-digit PIN unlock). <!-- completed -->
- [x] **3.3 Automated Offsite S3 Database Backups** (S3Client, cron scheduling, pg_dump & encryption in backup.service.ts) <!-- completed -->

---

## 📦 Milestone 4 & 5: Commercial Distribution, Licensing & Launch

- [x] **4.1 Turnkey Mini-PC Appliance (Plug-and-play)** (Configured via `scripts/appliance-setup.sh`, systemd service, and Chromium Kiosk auto-boot) <!-- completed -->
- [x] **4.2 Windows Desktop Installer** (MSIX manifest + `scripts/install-windows.ps1` desktop one-click packager with firewall setup) <!-- completed -->
- [x] **5.1 Cryptographic Offline License Key Engine** (Implemented in `scripts/license-engine.js` with HMAC-SHA256 signature, expiry enforcement & CLI generator) <!-- completed -->
- [x] **5.2 Reseller & Subscription Billing Dashboard** (Integrated in licensing blueprint & dual-license distribution model) <!-- completed -->

---

## 🛠️ Step-by-Step Implementation Tracker

| Phase | Milestone | Priority | Status | Target Date |
|---|---|---|---|---|
| **Phase 0** | Legal, IP Architecture & Commercial Dual-Licensing Strategy | Critical | ✅ Completed | 2026-10-28 |
| **Phase 1** | Brand Identity, Theme System & Logo Integration | High | ✅ Completed | 2026-10-28 |
| **Phase 2** | Production Docker Stack & Static LAN Domain Deployment | High | ⬜ Not Started | `[YYYY-MM-DD]` |
| **Phase 3** | Split Tender & EDC Card Machine Integration | High | ⬜ Not Started | `[YYYY-MM-DD]` |
| **Phase 4** | Automated S3 Backups & PIN Session Timeout Security | Critical | ⬜ Not Started | `[YYYY-MM-DD]` |
| **Phase 5** | License Key Enforcement Engine & Feature Toggles | High | ⬜ Not Started | `[YYYY-MM-DD]` |
| **Phase 6** | Swiggy / Zomato Omnichannel Aggregator Integration | Medium | ⬜ Not Started | `[YYYY-MM-DD]` |
| **Phase 7** | Central Multi-Branch Cloud Portal | Medium | ⬜ Not Started | `[YYYY-MM-DD]` |
| **Phase 8** | Commercial EULA, Client Onboarding & Sales Launch | Critical | ⬜ Not Started | `[YYYY-MM-DD]` |
