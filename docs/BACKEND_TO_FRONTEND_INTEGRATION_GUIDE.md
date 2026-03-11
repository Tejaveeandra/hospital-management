# Backend-to-Frontend Integration Guide

This document lists **every backend API** and what the frontend must integrate, given you already have the **proxy and URL restrictions** (PROXY_AND_URL_RESTRICTIONS.md) in place. Use it as a single checklist so nothing is missed.

---

## What the Frontend Already Has (from Proxy Doc)

From your proxy documentation, the frontend already has:

- **Proxy layer**: All API calls go through `POST /raja` with obfuscated payload; token from `localStorage._raja_t`; response deobfuscated automatically.
- **API client**: `src/api/api.js` — use `api.get()`, `api.post()`, `api.put()`, `api.delete()`; 403 triggers logout.
- **Documented examples**: Login (`/users/login`), fetch patient (`/patients/${id}`), add patient (`/patients/addPatient`), update patient (`/patients/update/${id}`).

**Everything below must still go through the same proxy** (same `api` instance). No direct calls to `http://localhost:8088` from the browser.

---

## Backend Endpoints – Full List (for proxy)

All requests are sent **via your frontend proxy** (so the browser still talks to your dev server, which forwards to `http://localhost:8088`). Backend path = the path you put in the obfuscated payload (e.g. `p: "/patients/getAllPatients"`).

### 1. Users (`/users`)

| Method | Backend path | Auth (backend) | Integrate in frontend |
|--------|----------------|-----------------|------------------------|
| POST   | `/users/register` | No  | ✅ Register page |
| POST   | `/users/login`     | No  | ✅ Login page (you have this) |
| GET    | `/users`           | Yes | User list (admin) |
| GET    | `/users/{userId}`  | Yes | User profile / edit |
| GET    | `/users/username/{username}` | Yes | Profile by username |
| PUT    | `/users/{userId}`   | Yes | Update user |
| DELETE | `/users/{userId}`   | Yes | Delete user |
| PUT    | `/users/{userId}/deactivate` | Yes | Deactivate account |
| PUT    | `/users/{userId}/activate`   | Yes | Activate account |

---

### 2. Patients (`/patients`)

| Method | Backend path | Auth | Integrate in frontend |
|--------|----------------|------|------------------------|
| POST   | `/patients/addPatient` | Yes | ✅ Add patient form (you have example) |
| GET    | `/patients/getAllPatients` | Yes | Patient list with pagination |
| GET    | `/patients/{id}` | Yes | ✅ Patient detail (you have example) |
| PUT    | `/patients/update/{id}` | Yes | ✅ Update patient (you have example) |
| DELETE | `/patients/delete/{patientId}` | Yes | Delete patient (button/action) |
| DELETE | `/patients/DeleteAll` | Yes | "Delete all" (Super Admin only) |

**Pagination:** `getAllPatients` accepts query params: `page`, `size`, `sortBy` (e.g. `?page=0&size=10&sortBy=id`). Response is a **page object**: `{ content: [...], totalElements, totalPages, size, number }`.

---

### 3. Doctors (`/doctors`)

| Method | Backend path | Auth | Integrate in frontend |
|--------|----------------|------|------------------------|
| POST   | `/doctors/addDoctor` | Yes | Add doctor form |
| GET    | `/doctors/` | Yes | Doctor list (note trailing slash) |
| GET    | `/doctors/{doctorId}` | Yes | Doctor detail / edit |
| PUT    | `/doctors/updateDoctor/{doctorId}` | Yes | Update doctor |
| DELETE | `/doctors/deleteDoctor/{doctorId}` | Yes | Delete doctor |

---

### 4. Departments (`/api/departments`)

| Method | Backend path | Auth | Integrate in frontend |
|--------|----------------|------|------------------------|
| POST   | `/api/departments` | Yes | Add department |
| GET    | `/api/departments` | Yes | Department list (dropdowns, settings) |
| GET    | `/api/departments/{departmentId}` | Yes | Department detail |
| PUT    | `/api/departments/{departmentId}` | Yes | Update department |
| DELETE | `/api/departments/{departmentId}` | Yes | Delete department |
| GET    | `/api/departments/{id}/doctors` | Yes | Doctor names in department (for dropdowns) |

---

### 5. Appointments (`/appointments`)

| Method | Backend path | Auth | Integrate in frontend |
|--------|----------------|------|------------------------|
| POST   | `/appointments/fixAppointment` | Yes | Book appointment form |
| GET    | `/appointments/{appointmentId}` | Yes | Appointment detail |
| GET    | `/appointments/ViewAllAppointments` | Yes | All appointments list |
| PUT    | `/appointments/{updateAppointmentId}` | Yes | Update appointment (use same ID in path) |
| DELETE | `/appointments/appointments/cancel/{appointmentId}` | Yes | Cancel appointment |
| DELETE | `/appointments/deleteAll` | Yes | Delete all (Super Admin) |
| PUT    | `/appointments/appointments/reschedule/{appointmentId}` | Yes | Reschedule (query: `newAppointmentDate`, `newTimeSlot`) |
| GET    | `/appointments/doctor/{doctorId}/date/{appointmentDate}` | Yes | Appointments by doctor and date (e.g. doctor calendar) |
| GET    | `/appointments/doctor/{doctorId}/count/date/{appointmentDate}` | Yes | Count by doctor/date (e.g. slots left) |

**Path note:** Update uses path variable `updateAppointmentId` in the URL; use the same value as the appointment ID. Reschedule and cancel use the full path as above (with `appointments` in path).

---

### 6. Prescriptions (`/api/prescriptions`)

| Method | Backend path | Auth | Integrate in frontend |
|--------|----------------|------|------------------------|
| POST   | `/api/prescriptions` | Yes | Create prescription (with medicines list) |
| GET    | `/api/prescriptions` | Yes | All prescriptions list |
| GET    | `/api/prescriptions/{id}` | Yes | Prescription detail |
| GET    | `/api/prescriptions/getPrescriptionByPatientId/{patientId}` | Yes | Prescriptions for a patient |
| PUT    | `/api/prescriptions/{id}` | Yes | Update prescription |
| DELETE | `/api/prescriptions/{id}` | Yes | Delete prescription |
| DELETE | `/api/prescriptions/delete All` | Yes | Delete all (note space in path) |

**Create/update body:** `{ appointmentId, prescriptionDate (yyyy-MM-dd), medicines: [ { medicineName, dosage, duration, isMorning, isAfternoon, isEvening, price } ] }`.

---

### 7. Medicines – Catalog (`/api/medicines`)

Catalog = medicine definitions (name, dosage, duration, timing, price). No "list all" endpoint here.

| Method | Backend path | Auth | Integrate in frontend |
|--------|----------------|------|------------------------|
| POST   | `/api/medicines/add` | Yes | Add medicine (catalog) |
| GET    | `/api/medicines/{medicineId}` | Yes | Medicine detail by ID |
| PUT    | `/api/medicines/update/{medicineId}` | Yes | Update medicine |
| DELETE | `/api/medicines/delete/{medicineId}` | Yes | Delete medicine |

---

### 8. Medicine Store – Inventory (`/api/medicine-store`)

Inventory = available medicines with name, price, stock. Use this for "list all" medicines in store.

| Method | Backend path | Auth | Integrate in frontend |
|--------|----------------|------|------------------------|
| POST   | `/api/medicine-store/add` | Yes | Add medicine to store |
| GET    | `/api/medicine-store/list` | Yes | List all (store inventory) |
| GET    | `/api/medicine-store/name/{name}` | Yes | Search by name |
| DELETE | `/api/medicine-store/delete/{id}` | Yes | Remove from store |
| POST   | `/api/medicine-store/seed` | Yes | Seed default data (admin) |

**Body for add:** `{ name, price, stockCount }`.

---

### 9. Hospital Charges (`/api/hospital-charges`)

| Method | Backend path | Auth | Integrate in frontend |
|--------|----------------|------|------------------------|
| GET    | `/api/hospital-charges/list` | Yes | List charges (e.g. settings / billing config) |
| POST   | `/api/hospital-charges/update` | Yes | Create/update charge (query: `name`, `amount`) |
| POST   | `/api/hospital-charges/seed` | Yes | Seed defaults (e.g. GENERAL_CONSULTATION, EMERGENCY_CONSULTATION) |

---

### 10. Doctor Leaves (`/api/doctor-leaves`)

| Method | Backend path | Auth | Integrate in frontend |
|--------|----------------|------|------------------------|
| POST   | `/api/doctor-leaves/addLeave` | Yes | Apply for leave |
| GET    | `/api/doctor-leaves` | Yes | All leaves list |
| GET    | `/api/doctor-leaves/{leaveId}` | Yes | Leave detail |
| GET    | `/api/doctor-leaves/doctorLeave/{doctorId}` | Yes | Leaves by doctor |
| GET    | `/api/doctor-leaves/doctor-leave/pending` | Yes | Pending leaves (approve/reject UI) |
| PUT    | `/api/doctor-leaves/doctor-leave/{leaveId}/status` | Yes | Update status (query: `status=PENDING\|APPROVED\|REJECTED`) |
| DELETE | `/api/doctor-leaves/{leaveId}` | Yes | Delete leave |
| DELETE | `/api/doctor-leaves/deleteAllLeaves` | Yes | Delete all (Super Admin) |

**Add leave body:** `{ doctorId, startDate, endDate, leaveType: "FULL_DAY"|"HALF_DAY", startTime?, endTime? }`.

---

### 11. Payments (`/api/payments`)

These are **public** on the backend (no JWT required). If your proxy sends them through `/raja` with no token, backend still accepts them.

| Method | Backend path | Auth (backend) | Integrate in frontend |
|--------|----------------|-----------------|------------------------|
| POST   | `/api/payments/initiate` | No | Payment flow: initiate, then show Stripe/UPI/card UI as needed |

**Body:** PaymentDTO (appointmentId, amount, paymentMethod, etc.). Response may include `clientSecret` (Stripe), `transactionId`, etc.

---

### 12. Payment Webhook (`/api/payments/webhook`)

| Method | Backend path | Auth | Integrate in frontend |
|--------|----------------|------|------------------------|
| POST   | `/api/payments/webhook/process` | No | Optional: frontend can send **simulated** webhook to update payment status after success/failure |

**When to use:** After user completes payment in your UI, you can POST to this endpoint to sync status with backend (instead of waiting for real Stripe webhook).

**Simulated payload (JSON):**
```json
{
  "transactionId": "TXN_...",
  "appointmentId": 13,
  "status": "SUCCESS"
}
```
`status`: `SUCCESS`, `FAILED`, `PENDING`. Either `transactionId` or `appointmentId` is used to find the payment.

---

## Summary: What Is "Extra" vs Already in Proxy Doc

- **Already shown in proxy doc:** Login, get patient, add patient, update patient.
- **Everything else below is "extra" and must be integrated** (same proxy, new screens/API calls).

| Module | Likely already in UI? | What to add |
|--------|------------------------|-------------|
| Users | Login, maybe register | User list, get/update/delete user, activate/deactivate |
| Patients | Get one, add, update | List (paginated), delete, delete all |
| Doctors | — | Full CRUD + list |
| Departments | — | Full CRUD + get doctors by department |
| Appointments | — | Fix, list, get, update, cancel, reschedule, by doctor/date, count by doctor/date |
| Prescriptions | — | Create, list, get, get by patient, update, delete, delete all |
| Medicines (catalog) | — | Add, get by ID, update, delete (no list endpoint) |
| Medicine store | — | Add, list, get by name, delete, seed |
| Hospital charges | — | List, update (query params), seed |
| Doctor leaves | — | Add, list, get, by doctor, pending, update status, delete, delete all |
| Payments | — | Initiate payment; optional: call webhook/process with simulated payload after payment |

---

## Auth and Proxy Reminder

- **Protected endpoints:** Send JWT in the payload that your proxy forwards as `Authorization: Bearer <token>`. Token from login response; store in `localStorage._raja_t` (or as your proxy does).
- **Public endpoints:** `/users/register`, `/users/login`, `/api/payments/**` (including `/api/payments/webhook/process`). Backend does not require JWT for these; your proxy can still send them as POST `/raja` with no token in payload.
- **403 from backend:** Proxy doc says your interceptor clears auth and redirects to login — keep that for all protected APIs.

---

## Path Quirks to Copy Exactly

- **Prescriptions delete all:** path is `/api/prescriptions/delete All` (space before "All").
- **Appointments update:** path is `/appointments/{id}` (use appointment ID; backend param is `appointmentId`).
- **Appointments cancel:** path is `/appointments/appointments/cancel/{appointmentId}`.
- **Appointments reschedule:** path is `/appointments/appointments/reschedule/{appointmentId}` and query params `newAppointmentDate`, `newTimeSlot`.
- **Doctors list:** path is `/doctors/` (trailing slash).

---

## Suggested Order of Integration

1. **Auth & users:** Register, user list, get/update/deactivate/activate (if admin).
2. **Doctors & departments:** List departments and doctors; CRUD for both; department's doctors for dropdowns.
3. **Patients:** List with pagination, delete (you already have add, get, update).
4. **Appointments:** Fix appointment, list, get, update, cancel, reschedule; then doctor calendar: by doctor/date and count.
5. **Prescriptions:** Create (with medicines from catalog/store), list, get by patient, update, delete.
6. **Medicine catalog:** Add/get/update/delete by ID (for prescription builder).
7. **Medicine store:** List, add, search by name, delete, seed (for inventory/ordering).
8. **Hospital charges:** List, update amount, seed (for billing config).
9. **Doctor leaves:** Add leave, list, pending list, update status (approve/reject), delete.
10. **Payments:** Initiate; optionally call webhook/process with simulated payload after payment.

---

## Related Docs in This Project

- **PROXY_AND_URL_RESTRICTIONS.md** – How the proxy works; use the same `api` for every call.
- **JWT_AUTHENTICATION_DOCUMENTATION.md** – Login, token, roles.
- **FRONTEND_DEVELOPMENT_GUIDE.md** – Full API reference and DTOs for each module.

Use this document as the **single checklist** for "what from the backend must be integrated in the frontend" beyond the existing proxy and the few examples already documented.
