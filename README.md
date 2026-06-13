# Bogie Thermal Inspection & Analytics Portal
### Indian Railway Thermal Detection System

A high-performance, role-based digital portal designed for Indian Railways to digitize bogie thermal diagnostics. Field inspectors log zone-wise electrical and mechanical temperatures per coach sequentially, while administrators access live charts, breach alarms, staff KPI scoreboards, and compliance exports.

---

## 🚀 Key Features

* **Role-Based Workflows**:
  * **Inspector**: Sequential, zero-skipping mobile-responsive checklist to log bogie axle and panel temperatures. Auto-saves drafts, checks thresholds in real-time, and logs history.
  * **Administrator**: Live dashboard with Recharts trend lines and breach levels, alarm management, train inventory config (with bulk Excel import), staff KPI configurations, system audits, and PDF/Excel report generator.
* **Production Security**: JWT state guards, 30-min idle timeouts, bcrypt cryptography, and independent system-wide transaction audits.
* **Zero Configuration Database**: Operates out-of-the-box using Node's new native `sqlite` module.

---

## 🛠️ Tech Stack

* **Frontend**: React 18 (Vite SPA) + Tailwind CSS + Lucide Icons + Recharts
* **Backend**: Node.js + Express.js + Native SQLite (`node:sqlite`) + JWT
* **Exports**: PDFKit (PDF generation) + ExcelJS (Excel sheets formatting) + Multer (Multipart parsing)

---

## ⚙️ Quick Start

### 1. Backend Bootup
```bash
cd backend
npm install
npm run seed     # Seeds DB with 30 days of real history & trains
npm run dev      # Starts API on http://localhost:5000
```

### 2. Frontend Bootup
```bash
cd frontend
npm install
npm run dev      # Starts Vite server on http://localhost:5173
```

---

## 🔑 Seeding Accounts

* **Administrator**: `admin@thermalportal.in` / `Admin@123`
* **Field Inspector**: `suresh.patil@thermalportal.in` / `Inspector@123`
