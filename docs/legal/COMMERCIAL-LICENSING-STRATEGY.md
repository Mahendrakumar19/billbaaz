# BillBaaz: Commercial Licensing Architecture & Legal Strategy

**Product:** BillBaaz ("Billing Ka Baaz! / Billing ka baazigar")  
**Target Market:** Restaurants, Cafes, Cloud Kitchens, Bars, and Food Chains in India & Global Markets  
**Document Purpose:** Formulate the legal, intellectual property, and architectural boundaries to distribute, license, and sell BillBaaz commercially with 100% ownership retention and zero copyleft risks.

---

## 1. Navigating Upstream AGPL-3.0 vs. Commercial Ownership

The foundation codebase was originally authored under the GNU Affero General Public License v3 (AGPL-3.0). AGPL-3.0 is a "strong copyleft" license designed for network services.

### Understanding the Legal Mechanics of AGPL-3.0
1. **Network Copyleft Clause (Section 13):** If an end-user interacts with an AGPL-3.0 software instance over a computer network (e.g., staff accessing the POS via Wi-Fi or customers browsing QR menus), they theoretically possess the right to receive the corresponding source code of *that specific software build and its direct modifications*.
2. **Proprietary Modifications Dilemma:** If you develop proprietary modules directly linked into an AGPL codebase, those modifications could fall under copyleft obligations unless properly isolated.

---

## 2. The Two Paths to Complete Proprietary Commercial Freedom

To sell BillBaaz to paying restaurants as a closed-source or proprietary product under your sole brand, you have two clear paths:

```
                               ┌────────────────────────────────────────────────────────┐
                               │           COMMERCIAL INTELLECTUAL PROPERTY             │
                               │                STRATEGY FOR BILLBAAZ                   │
                               └──────────────────────────┬─────────────────────────────┘
                                                          │
                       ┌──────────────────────────────────┴──────────────────────────────────┐
                       │                                                                     │
                       ▼                                                                     ▼
            OPTION A: COMMERCIAL BUYOUT                                           OPTION B: PROPRIETARY WRAPPER
             (Dual-Licensing Contract)                                              (Microservices Architecture)
    • Contact NodeDR Infotech / Raktim Ranjit                             • Keep core server running as an internal engine
    • One-time payment or royalty for commercial waiver                   • All proprietary additions (Zomato/Swiggy sync,
    • 100% Closed-Source Proprietary Rights                                 licensing daemon, soundbox, payments) written
    • Complete right to relicense, patent, and sell                         as separate proprietary sidecars & mobile apps
    • Cleanest corporate valuation for venture capital                    • Zero copyleft contamination on your IP
```

### Option A: Upstream Commercial Buyout / Dual-Licensing (Cleanest & Recommended)
* **What it is:** The original copyright holder (NodeDR Infotech Private Limited / Raktim Ranjit) owns 100% of the copyright for the upstream code. Under copyright law, the author is legally permitted to issue an independent **Commercial / Proprietary Sublicensing Agreement** to you.
* **Benefits:**
  - You receive an unrestricted, perpetual, exclusive or non-exclusive commercial license.
  - The AGPL copyleft obligations are completely waived for your commercial builds.
  - You can close the entire source code, patent your customizations, and package it as your own proprietary commercial software.
  - Essential if you plan to seek venture capital or sell the company later.
* **Actionable Step:** Use the draft outreach letter provided in Section 5 of this document to execute a commercial buyout agreement.

### Option B: The "Modular Proprietary Wrapper" Architecture (Zero Buyout Needed)
If you operate without an upstream buyout, you can legally protect your commercial IP by maintaining architectural separation:
1. **Isolated Core Service:** Keep the core POS server running within its own container or process boundary as an AGPL base engine.
2. **Independent Proprietary Microservices:** Build your high-value commercial IP as independent external applications communicating via network APIs (HTTP/gRPC/Webhooks):
   - **BillBaaz Aggregator Hub** (Zomato & Swiggy auto-sync engine) -> *100% Proprietary Closed Source*.
   - **BillBaaz License Guardian** (Cryptographic hardware dongle/license key daemon) -> *100% Proprietary Closed Source*.
   - **BillBaaz Soundbox & EDC Bridge** (Hardware payment connectors) -> *100% Proprietary Closed Source*.
   - **BillBaaz Mobile Owner Companion App** (Flutter/React Native mobile app for owners) -> *100% Proprietary Closed Source*.
3. **Legal Precedent:** Under FSF guidelines, independent software communicating over standard network boundaries (TCP/REST) without static/dynamic memory linkage does not form a derivative work, keeping your proprietary software closed and proprietary.

---

## 3. Commercial Deployment Models

When selling BillBaaz to restaurant owners, you can offer three models:

| Deployment Model | Hardware / Hosting | Billing Model | Best Suited For |
|---|---|---|---|
| **Model 1: Turnkey Appliance Box** | Pre-configured Intel N100 Mini PC or Raspberry Pi 5 with BillBaaz installed locally. | One-time hardware charge (₹15,000–₹25,000) + Annual Software AMC (₹5,000–₹10,000/year). | Fine dining, cafes, busy bars requiring 100% offline uptime and direct LAN thermal printing. |
| **Model 2: Cloud Hosted (SaaS)** | Multi-tenant cloud instance hosted on AWS / DigitalOcean / Hetzner with SSL domain. | Recurring monthly/annual subscription (₹999–₹2,499/month per outlet). | Cloud kitchens, quick-service food stalls with stable internet, multi-outlet food chains. |
| **Model 3: Hybrid Appliance + Cloud Sync** | Local Mini PC in the restaurant + automatic background sync to BillBaaz Cloud Dashboard. | Setup fee + monthly software subscription (₹1,499/month). | The ultimate PetPooja competitor. Outlets bill offline locally, owners monitor from anywhere. |

---

## 4. IP Protection & Non-Disclosure (Client Contracts)

Regardless of the underlying software architecture, your relationship with the restaurant owner is governed strictly by your **Commercial Service Agreement & EULA**:
1. **License, Not Sale:** You do not sell the software code to the restaurant; you grant them a revocable, non-exclusive, non-transferable **License to Use** for specific branches/terminals.
2. **Trade Secrets & Reverse Engineering:** The EULA strictly prohibits decompilation, disassembly, or reverse engineering of your custom builds, APIs, or hardware firmware.
3. **Data Ownership Guarantee:** The restaurant owns 100% of its customer transactions, recipes, and menu data; you act as the Technology Service Provider.

---

## 5. Draft Commercial License Acquisition Letter (To Original Creator)

If pursuing Option A (Commercial Buyout), here is the formal commercial proposal template:

```text
To: NodeDR Infotech Private Limited / Raktim Ranjit
Subject: Commercial Dual-Licensing Inquiry — BillBaaz Commercial Expansion

Dear Raktim Ranjit / NodeDR Infotech Team,

We have evaluated OrderRestro and appreciate the architectural engineering of the platform.

We are developing a branded commercial restaurant technology suite under our brand "BillBaaz" targeted at restaurant chains and hospitality operators in India and overseas. We are adding proprietary omnichannel delivery aggregator bridges, hardware EDC integrations, and localized enterprise services.

We wish to negotiate and purchase a Commercial Dual-Licensing / Proprietary Buyout Agreement for the codebase that:
1. Grants us a perpetual, worldwide, royalty-bearing (or one-time buyout) commercial license to sub-license, distribute, modify, and sell the software as a proprietary closed-source product under our brand BillBaaz.
2. Waives AGPL-3.0 copyleft obligations for our commercial deployments and proprietary add-ons.

Please let us know your standard terms, corporate entity details, and commercial pricing for an enterprise commercial dual-licensing grant.

Warm regards,
Founding Team, BillBaaz
[Your Contact Details & Company Name]
```

