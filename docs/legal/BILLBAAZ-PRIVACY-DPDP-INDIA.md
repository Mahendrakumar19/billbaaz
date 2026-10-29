# BillBaaz: Data Privacy Policy & Compliance Architecture
## (Under the Digital Personal Data Protection Act, 2023 & Indian IT Act, 2000)

**Applicability:** For BillBaaz deployments, cloud sync services, and restaurant installations across India.  
**Effective Date:** 28 October 2026

---

## 1. Regulatory Roles & Structure

Under the **Digital Personal Data Protection Act, 2023 ("DPDP Act")**:

| Role | Entity | Legal Responsibility |
|---|---|---|
| **Data Fiduciary** | **The Restaurant / Operating Business** | Determines the purpose of collecting customer phone numbers, names, birthdays, and staff records. Directly responsible to Data Principals (patrons and staff). |
| **Data Processor** | **BillBaaz (Technology Provider)** | Provides the software infrastructure, local database, and optional cloud backup systems. Processes personal data strictly on behalf of the Restaurant. |

---

## 2. Categories of Personal Data Handled

BillBaaz collects and processes only the minimum data required to facilitate food service operations:

1. **Guest & Customer Data (CRM / Loyalty / Digital Invoices):**
   * Customer Name, Mobile Number, Email (optional), Dining History, Loyalty Points Balance, and Delivery Address.
   * *Purpose:* Printing GST tax receipts, sending digital invoices via SMS/WhatsApp, delivering food orders, and managing loyalty rewards.
2. **Staff & Employee Data:**
   * Employee Full Name, Role, Phone Number, 4-digit Security PIN, and Clock-In / Clock-Out Attendance Timestamps.
   * *Purpose:* Authentication, shift audit trails, tip allocation, and payroll computation.
3. **Financial & Transactional Records:**
   * Payment Mode (Cash, UPI VPA Reference, Card Transaction ID), GST Tax Breakup (CGST / SGST), and Itemized Bill Lines.
   * *Note:* BillBaaz **never** stores customer credit/debit card numbers or CVVs. All card transactions take place on external bank-certified EDC hardware terminals.

---

## 3. Data Residency & Offline Architecture Advantage

* **100% On-Premises Data Sovereignty:** For restaurants deploying BillBaaz on a local mini-PC or server appliance, all database tables (PostgreSQL) reside inside the restaurant's physical premises. 
* **Zero Cross-Border Data Transfer:** No guest or transaction data is routed through international servers unless explicitly configured by the restaurant owner to use foreign S3 backup endpoints.
* **Network Isolation:** In standard LAN operation, POS terminals communicate directly with the local server without transmitting customer profiles over public internet infrastructure.

---

## 4. Technical & Reasonable Security Safeguards (IT Rules, 2011)

In compliance with the **Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011**:

1. **Password & Credential Security:** All passwords are encrypted with industry-standard **bcrypt** (cost factor 12). Plaintext passwords are never logged, stored, or visible to managers.
2. **Role-Based Access Control (RBAC):** Junior staff (waiters, line cooks) cannot export customer phone numbers or view cumulative restaurant revenue. Exporting customer records requires explicit `customers.manage` and `export_data` permissions.
3. **Session Hardening:** Session tokens utilize HTTP-only, SameSite-restricted cookies (`billbaaz_session`) preventing cross-site scripting (XSS) extraction.
4. **Tenant Isolation:** Multi-location databases enforce cryptographic tenant isolation at the schema/query level; one outlet cannot access or view patron records from another brand.

---

## 5. Fulfillment of Data Principal Rights (DPDP Act, 2023)

BillBaaz provides built-in user interface controls for restaurant operators to comply with Data Principal requests:
* **Right to Correction:** Staff with appropriate clearance can update customer names and contact numbers directly in the **Customers** module.
* **Right to Erasure ("Right to Be Forgotten"):** Customers requesting deletion of their phone numbers from the restaurant's marketing list can be wiped or anonymized via the customer management panel while preserving required financial audit logs.
* **Grievance Redressal:** Every deploying restaurant is advised to publish a designated contact email or phone number for data grievances on their printed receipts or digital QR menu footers.

---

## 6. Grievance Officer & Contact Information

For technical queries regarding the data processing mechanisms of the BillBaaz platform:
* **Grievance Redressal:** Support & Legal Desk, BillBaaz
* **Contact Email:** legal@billbaaz.in (or your commercial support address)
* **Website:** https://billbaaz.in

