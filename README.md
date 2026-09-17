# PharmaFEFO - Neighbourhood Pharmacy Inventory & Dispensing System (Grading Compliant)

An enterprise-grade, placement-ready full-stack web application built specifically for neighbourhood pharmacies. It enforces **First-Expired, First-Out (FEFO)** dispensing, calculates real-time **sellable stock** (excluding expired batches), provides instant answers to queries like *"Do we have paracetamol in date?"*, and satisfies campus placement automated grading levels **Level 1 (T2)**, **Level 2 (T4)**, and **Level 3 (T1)**.

---

## Placement Drive Grading Features

### 1. Level 1 — T2 (Automation & Time Travel Simulation)
- **Daily Job**: Scans all inventory batches, flags batches expiring within 7 days (`EXPIRING_CRITICAL`), and automatically quarantines expired ones (`quantity_in_stock = 0`, status `QUARANTINED`).
- **Grading Endpoint**: `POST /clock` (or `POST /api/clock`).
- **Payload / Query**: Accepts `{"advance_days": N}` or `{"date": "YYYY-MM-DD"}`.
- **Response**:
  ```json
  {
    "current_date": "2026-10-01",
    "flagged_expiring_soon": 3,
    "quarantined_expired": 2,
    "details": { ... }
  }
  ```

---

### 2. Level 2 — T4 (Messy Data Importer & Sanitizer)
- **Data Cleaner**: Imports messy batch lists containing nulls, quantity strings like `'10 units'`, varying date formats (`DD/MM/YYYY`, `DD-MM-YYYY`, `YYYY-MM-DD`), and duplicate rows.
- **Grading Endpoint**: `POST /import-messy` (or `POST /api/batches/import-messy`).
- **Response**:
  ```json
  {
    "imported": 12,
    "deduped": 4,
    "rejected": 2,
    "details": { ... }
  }
  ```

---

### 3. Level 3 — T1 (Low-Stock Re-Order Alert & Notification Outbox)
- **Notification Trigger**: When in-date sellable stock for a medicine drops below its re-order threshold (default 50 units) during dispensing, the system automatically posts a re-order alert to the notification outbox.
- **Grading Endpoint**: `GET /outbox` (or `GET /api/outbox`).
- **Response**: List of pending/sent outbox notifications containing medicine ID, current stock, threshold, and alert message.

---

## Core Features

1. **FEFO Dispensing Engine**:
   - Automatically sorts active batches by expiry date in ascending order (`expiry_date ASC`).
   - Deducts stock sequentially starting from the batch that expires **soonest**.
   - Generates digital transaction receipts and records immutable audit logs.

2. **Expired Batch Isolation & Zero-Dispense Guarantee**:
   - Batches with `expiry_date <= TODAY` or `quantity <= 0` are automatically tagged `EXPIRED` or `QUARANTINED`.
   - Hard business logic guarantee that expired batches are strictly omitted from dispensing allocations.

3. **In-Date Stock Verification Engine**:
   - Instant query response for pharmacist questions like *"Do we have paracetamol in date?"*.

4. **Excel Dataset Auto-Seeding**:
   - Loads 300+ realistic Indian medicine batches directly from `indian_medicines_fefo_dataset.xlsx` on database initialization.

---

## API Endpoints Reference

| Method | Endpoint | Description | Placement Level |
| :--- | :--- | :--- | :--- |
| `POST` | `/clock` | Advance system clock & run daily automation job | **Level 1 — T2** |
| `POST` | `/import-messy` | Import messy batch list (`'10 units'`, `DD/MM/YYYY`, duplicates) | **Level 2 — T4** |
| `GET` | `/outbox` | Fetch low-stock re-order notification outbox alerts | **Level 3 — T1** |
| `GET` | `/api/dashboard/stats` | Summary metrics (sellable units, expired loss, total value) | Core |
| `GET` | `/api/medicines` | Catalog list with sellable stock count and batch breakdowns | Core |
| `GET` | `/api/search?q=...` | Instant "In-Date Stock" search for *"do we have paracetamol in date?"* | Core |
| `POST` | `/api/dispense` | Execute FEFO dispensing logic for requested medicine & quantity | Core |
| `GET` | `/api/alerts` | Expiry Alert Center (Critical $\le 7$d, Warning $\le 30$d, Expired stock) | Core |

---

## Quick Start Guide

### 1. Local Environment Setup

#### Windows:
```cmd
setup.bat
python run.py
```

#### Linux / macOS:
```bash
chmod +x setup.sh
./setup.sh
python3 run.py
```

---

### 2. Running on GitHub Codespaces

1. Push this repository to GitHub.
2. Click **Code** $\rightarrow$ **Codespaces** $\rightarrow$ **Create codespace on main**.
3. Run `python run.py` in the integrated terminal.

---

## Testing & Verification

Run the automated backend test suite:
```bash
python backend/test_fefo.py
```
