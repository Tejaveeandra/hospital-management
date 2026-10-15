# MedCenter Enterprise - Hospital Management System (Frontend)

[![React](https://img.shields.io/badge/React-18.x-61dafb.svg?style=flat&logo=react)](https://reactjs.org/)
[![React Router](https://img.shields.io/badge/Router-v6-ca4245.svg?style=flat&logo=react-router)](https://reactrouter.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production--Ready-success.svg)]()

A state-of-the-art, responsive **Enterprise Hospital Management Frontend Portal** built with **React 18**, **Lucide Icons**, and modern CSS Design Systems. Engineered for high-throughput healthcare workflows, fine-grained Role-Based Access Control (RBAC), and seamless connectivity with Spring Cloud microservices via an API Gateway.

---

## Architecture Overview

The frontend serves as the unified interface across 4 distinct operational tiers, dynamically adapting views, navigation bars, and data tables based on PostgreSQL-backed user permissions:

```
                    ┌───────────────────────────────────────────────┐
                    │     MedCenter React Application (SPA)         │
                    └───────────────────────┬───────────────────────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    │      SessionManager & JWT Interceptor         │
                    └───────────────────────┬───────────────────────┘
                                            │
         ┌──────────────────┬───────────────┴───────────────┬──────────────────┐
         ▼                  ▼                               ▼                  ▼
┌──────────────────┐┌──────────────────┐    ┌──────────────────────┐┌──────────────────┐
│  Enterprise /    ││ Doctor Workspace │    │   Reception Desk     ││  Patient Portal  │
│  Staff Portal    ││ (/doctor/*)      │    │   (/receptionist/*)  ││  (/patient/*)    │
│  (/admin/*)      ││                  │    │                      ││                  │
└──────────────────┘└──────────────────┘    └──────────────────────┘└──────────────────┘
```

---

## Core Features & Modules

### 1. Enterprise Staff & Operations Portal (`/admin/*`)
* **Dynamic Role & User Administration**: User lifecycle provisioning, role assignment, and granular permission mapping.
* **Master Patient Directory**: Multi-branch patient records, encrypted PII management, and advanced criteria search.
* **Doctor Roster & Leave Tracking**: Medical specialist profiles, department assignments, and leave scheduling.
* **Master Appointment Engine**: Multi-mode scheduling, emergency priority tagging, doctor leave conflict detection.
* **Inpatient & Live Bed Matrix**: Real-time visualization of hospital wings, ward categories, bed allocation, and sanitization tracking.
* **Pharmacy & Inventory Store**: Real-time pharmaceutical stock levels, batch monitoring, and automated low-stock warnings.
* **Prescription Ledger**: Electronic health records, diagnostic linking, and pharmacy fulfillment status.
* **Hospital Billing & Charges**: Fee schedule management, multi-line invoices, insurance claim processing, and Stripe integration.
* **Clinical Diagnostics & Surgery**: Laboratory test ordering, pathology tracking, operating theater schedules, and surgical team rosters.
* **HR & Walk-in Interview Portal**:
  - **Walk-in Candidate Registry**: Dedicated interview scheduling, evaluation notes, and candidate status tracking (`public.candidates`).
  - **One-Click Staff Onboarding**: Direct promotion of selected interviewees into active hospital staff records.
  - **Attendance Pulse & Shifts**: Shift allocation, automated telemetry, and biometrics synchronization.

### 2. Specialized Workspaces
* **Doctor Workspace (`/doctor/*`)**: Real-time consultation queue, electronic medical prescriptions, and personal leave requests.
* **Receptionist Desk (`/receptionist/*`)**: Fast-track patient walk-in onboarding, immediate bed inquiries, and emergency appointment bookings.
* **Patient Portal (`/patient/*`)**: Patient self-service health overview, appointment booking, digital prescription history, and invoice payments.

---

## Security & Dynamic RBAC Architecture

The application enforces **Permission-Based Access Control (PBAC)** rather than fragile static role checks:

1. **Dynamic Screen Rendering**: Navigation items and action buttons evaluate granular authorities (`canRead`, `canCreate`, `hasPermission`) retrieved dynamically from the backend JWT token.
2. **Zero Hardcoded Dependencies**: New roles created in PostgreSQL automatically gain immediate access to permitted screens upon login without requiring frontend redeployments.
3. **Session & Security Interceptors**: Axios interceptors automatically attach Bearer JWT tokens, enforce CSRF/Double-Lock gateway headers, and gracefully handle token refresh and session expirations.

---

## Project Structure

```
src/
├── api/                   # Centralized Axios client & API endpoints
├── component/             # Modular reusable UI widgets
│   ├── Common/            # Global UI elements (Cards, Buttons, Modals)
│   ├── Form/              # InputBox, SelectDropdown, DatePickers
│   └── Layout/            # AdminLayout, Sidebar, Navbar
├── components/            # Route guards (ProtectedRoute, SessionManager)
├── pages/                 # Full-screen module views
│   ├── CandidateRecruitmentPage.jsx # Dedicated Walk-in Interview Portal
│   ├── StaffManagementPage.jsx      # Active Hospital Staff Roster
│   ├── AdminDashboardContent.jsx    # Executive Operations Metrics
│   └── ...
├── routes/                # Tiered routing manifests (Admin, Doctor, Patient, Receptionist)
└── utils/                 # RBAC helpers, JWT decoders, formatters
```

---

## Getting Started

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### Environment Setup
Create a `.env` file in the root directory:
```env
REACT_APP_API_BASE_URL=http://localhost:9191
PORT=3000
```

### Installation & Execution
```bash
# Install dependencies
npm install

# Start local development server
npm start
```
Access the portal at `http://localhost:3000`.

### Production Build
```bash
# Generate optimized production bundle
npm run build
```

---

## Docker Deployment

The application includes an optimized multi-stage `Dockerfile` serving production assets via high-performance Nginx:

```bash
# Build Docker image
docker build -t medcenter-frontend .

# Run container on port 3001
docker run -d -p 3001:80 --name hospital-frontend medcenter-frontend
```

---

## License

This software is distributed under the **MIT License**.
