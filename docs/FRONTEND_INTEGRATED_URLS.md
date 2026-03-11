# Frontend Integrated URLs

This document lists **every backend URL that the frontend currently uses** (via the proxy). All calls go through `src/api/api.js` → `POST /raja` with obfuscated payload.

**Last scanned:** Frontend codebase (src/pages, src/component).

---

## Summary by Module

| Module        | Integrated | Not integrated in frontend |
|---------------|------------|----------------------------|
| **Users**     | Login only | Register, user list, get/update/delete/activate/deactivate |
| **Patients**  | Full CRUD + list (paginated) | Delete single patient, DeleteAll |
| **Doctors**   | Full CRUD + list (paginated) | — |
| **Departments** | — | All endpoints |
| **Appointments** | Fix, get one, view all, update, reschedule, cancel, delete all, by doctor/date, count by doctor/date | — |
| **Prescriptions** | — | All endpoints |
| **Medicines (catalog)** | — | All endpoints |
| **Medicine store** | — | All endpoints |
| **Hospital charges** | — | All endpoints |
| **Doctor leaves** | Add, list all, by doctor, pending, update status, delete | deleteAllLeaves |
| **Payments** | Initiate, webhook/process | — |

---

## 1. Users (`/users`)

| Method | URL (path in payload) | Where used |
|--------|------------------------|------------|
| POST   | `/users/login` | `LoginPage.jsx` – login form |

**Not integrated:** `/users/register`, `/users`, `/users/{userId}`, `/users/username/{username}`, PUT/DELETE user, activate/deactivate.

---

## 2. Patients (`/patients`)

| Method | URL (path in payload) | Where used |
|--------|------------------------|------------|
| GET    | `/patients/{id}` | `PatientPage.jsx` – fetch one patient |
| GET    | `/patients/getAllPatients` | `PatientPage.jsx` – list with `params: { page, size, sortBy }` |
| POST   | `/patients/addPatient` | `PatientPage.jsx` – add patient form |
| PUT    | `/patients/update/{id}` | `PatientPage.jsx` – update patient form |

**Not integrated:** `DELETE /patients/delete/{patientId}`, `DELETE /patients/DeleteAll`.

---

## 3. Doctors (`/doctors`)

| Method | URL (path in payload) | Where used |
|--------|------------------------|------------|
| GET    | `/doctors/` | `DoctorPage.jsx` – list with `params: { page, size, sortBy }` |
| GET    | `/doctors/{doctorId}` | `DoctorPage.jsx` – fetch one doctor |
| POST   | `/doctors/addDoctor` | `DoctorPage.jsx` – add doctor form |
| PUT    | `/doctors/updateDoctor/{doctorId}` | `DoctorPage.jsx` – update doctor form |
| DELETE | `/doctors/deleteDoctor/{doctorId}` | `DoctorPage.jsx` – delete doctor |

**All doctor endpoints used by frontend are integrated.**

---

## 4. Departments (`/api/departments`)

| Method | URL | Where used |
|--------|-----|------------|
| — | — | **None** – no department API calls in frontend |

---

## 5. Appointments (`/appointments`)

| Method | URL (path in payload) | Where used |
|--------|------------------------|------------|
| POST   | `/appointments/fixAppointment` | `AppointmentPage.jsx` – book appointment |
| GET    | `/appointments/{appointmentId}` | `AppointmentPage.jsx` – get one appointment |
| GET    | `/appointments/ViewAllAppointments` | `AppointmentPage.jsx` – list all |
| PUT    | `/appointments/{appointmentId}` | `AppointmentPage.jsx` – update appointment |
| PUT    | `/appointments/reschedule/{appointmentId}` | `AppointmentPage.jsx` – reschedule (params: `newAppointmentDate`, `newTimeSlot`) |
| DELETE | `/appointments/cancel/{appointmentId}` | `AppointmentPage.jsx` – cancel |
| DELETE | `/appointments/deleteAll` | `AppointmentPage.jsx` – delete all |
| GET    | `/appointments/doctor/{doctorId}/date/{date}` | `AppointmentPage.jsx` – by doctor and date |
| GET    | `/appointments/doctor/{doctorId}/count/date/{date}` | `AppointmentPage.jsx` – count by doctor/date |

**Path note:** Frontend uses `/appointments/cancel/{id}` and `/appointments/reschedule/{id}`. If your backend expects `/appointments/appointments/cancel/{id}` or `/appointments/appointments/reschedule/{id}`, either align backend or update frontend paths.

---

## 6. Prescriptions (`/api/prescriptions`)

| Method | URL | Where used |
|--------|-----|------------|
| — | — | **None** – no prescription API calls in frontend |

---

## 7. Medicines – Catalog (`/api/medicines`)

| Method | URL | Where used |
|--------|-----|------------|
| — | — | **None** – no medicine catalog API calls in frontend |

---

## 8. Medicine Store (`/api/medicine-store`)

| Method | URL | Where used |
|--------|-----|------------|
| — | — | **None** – no medicine store API calls in frontend |

---

## 9. Hospital Charges (`/api/hospital-charges`)

| Method | URL | Where used |
|--------|-----|------------|
| — | — | **None** – no hospital charges API calls in frontend |

---

## 10. Doctor Leaves (`/doctor-leaves`)

Frontend uses paths **without** `/api/` prefix: `/doctor-leaves/...`. Ensure backend or proxy serves these (or add `/api` if backend expects `/api/doctor-leaves`).

| Method | URL (path in payload) | Where used |
|--------|------------------------|------------|
| POST   | `/doctor-leaves/addLeave` | `DoctorLeavePage.jsx` – apply leave |
| GET    | `/doctor-leaves` | `DoctorLeavePage.jsx` – all leaves |
| GET    | `/doctor-leaves/doctorLeave/{doctorId}` | `DoctorLeavePage.jsx` – leaves by doctor |
| GET    | `/doctor-leaves/doctor-leave/pending` | `DoctorLeavePage.jsx` – pending leaves |
| PUT    | `/doctor-leaves/doctor-leave/{leaveId}/status` | `DoctorLeavePage.jsx` – approve/reject (params: `status`) |
| DELETE | `/doctor-leaves/{leaveId}` | `DoctorLeavePage.jsx` – delete leave |

**Not integrated:** `GET /doctor-leaves/{leaveId}` (single leave detail), `DELETE /doctor-leaves/deleteAllLeaves`.

---

## 11. Payments (`/api/payments`)

| Method | URL (path in payload) | Where used |
|--------|------------------------|------------|
| POST   | `/api/payments/initiate` | `PaymentModal.jsx` – start payment |
| POST   | `/api/payments/webhook/process` | `PaymentModal.jsx` – simulated webhook after success/failure |

---

## File Reference (Where each URL is used)

| File | URLs used |
|------|-----------|
| `src/pages/LoginPage.jsx` | `POST /users/login` |
| `src/pages/PatientPage.jsx` | `GET /patients/{id}`, `GET /patients/getAllPatients`, `POST /patients/addPatient`, `PUT /patients/update/{id}` |
| `src/pages/DoctorPage.jsx` | `GET /doctors/`, `GET /doctors/{id}`, `POST /doctors/addDoctor`, `PUT /doctors/updateDoctor/{id}`, `DELETE /doctors/deleteDoctor/{id}` |
| `src/pages/AppointmentPage.jsx` | `POST /appointments/fixAppointment`, `GET /appointments/{id}`, `GET /appointments/ViewAllAppointments`, `PUT /appointments/{id}`, `PUT /appointments/reschedule/{id}`, `DELETE /appointments/cancel/{id}`, `DELETE /appointments/deleteAll`, `GET /appointments/doctor/{doctorId}/date/{date}`, `GET /appointments/doctor/{doctorId}/count/date/{date}` |
| `src/pages/DoctorLeavePage.jsx` | `POST /doctor-leaves/addLeave`, `GET /doctor-leaves`, `GET /doctor-leaves/doctorLeave/{doctorId}`, `GET /doctor-leaves/doctor-leave/pending`, `PUT /doctor-leaves/doctor-leave/{leaveId}/status`, `DELETE /doctor-leaves/{leaveId}` |
| `src/component/PaymentModal.jsx` | `POST /api/payments/initiate`, `POST /api/payments/webhook/process` |

---

## Quick checklist: backend URLs not yet in frontend

- **Users:** register, GET users, GET user by id/username, PUT/DELETE user, activate, deactivate  
- **Patients:** DELETE delete/{patientId}, DELETE DeleteAll  
- **Departments:** all (`/api/departments` CRUD + get doctors by department)  
- **Prescriptions:** all (`/api/prescriptions` CRUD + get by patient, delete all)  
- **Medicines catalog:** all (`/api/medicines` add, get, update, delete)  
- **Medicine store:** all (`/api/medicine-store` list, add, by name, delete, seed)  
- **Hospital charges:** all (list, update, seed)  
- **Doctor leaves:** GET single leave, DELETE deleteAllLeaves  

Use **BACKEND_TO_FRONTEND_INTEGRATION_GUIDE.md** for the full backend list and suggested order of integration.
