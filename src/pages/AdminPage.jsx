import React, { useState } from "react";
import DoctorPage from "./DoctorPage";
import styles from "./AdminPage.module.css";
import LeaveManagement from "./DoctorLeavePage";
import AppointmentManagement, { AppointmentOperation } from "./AppointmentPage";
import DepartmentsPage from "./DepartmentsPage";
import PrescriptionsPage from "./PrescriptionsPage";
import MedicineStorePage from "./MedicineStorePage";
import HospitalChargesPage from "./HospitalChargesPage";

const AdminPage = () => {
  const userRole = localStorage.getItem("role") || "patient";
  const isAdmin = ["admin", "super-admin"].includes(userRole);
  const [activeSection, setActiveSection] = useState(null);
  const [doctorOperation, setDoctorOperation] = useState(null);
  const [leaveOperation, setLeaveOperation] = useState(null);
  const [appointmentOperation, setAppointmentOperation] = useState(null);
  const [departmentOperation, setDepartmentOperation] = useState(null);
  const [prescriptionOperation, setPrescriptionOperation] = useState(null);
  const [medicineStoreOperation, setMedicineStoreOperation] = useState(null);
  const [hospitalChargesOperation, setHospitalChargesOperation] = useState(null);

  if (!isAdmin) {
    return (
      <div className={styles['access-denied']}>
        <h1>Admin Dashboard</h1>
        <p>Access Denied: You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className={styles['admin-container']}>
      <h1>WELCOME TO THE HOSPITAL MANAGEMENT SYSTEM</h1>
      <h2>ADMIN DASHBOARD</h2>

      <div className={styles['admin-layout']}>
        <aside className={styles['admin-sidebar']}>
          <div className={styles['sidebar-section']}>
            <h3>Doctor Operations</h3>
            <button
              onClick={() => {
                setActiveSection("doctors");
                setDoctorOperation("create");
                setLeaveOperation(null);
                setAppointmentOperation(null);
              }}
            >
              CREATE DOCTOR
            </button>
            <button
              onClick={() => {
                setActiveSection("doctors");
                setDoctorOperation("viewAll");
                setLeaveOperation(null);
                setAppointmentOperation(null);
              }}
            >
              VIEW ALL DOCTORS
            </button>
            <button
              onClick={() => {
                setActiveSection("doctors");
                setDoctorOperation("delete");
                setLeaveOperation(null);
                setAppointmentOperation(null);
              }}
            >
              DELETE DOCTOR
            </button>
          </div>

          <div className={styles['sidebar-section']}>
            <h3>Leave Operations</h3>
            <button
              onClick={() => {
                setActiveSection("leaves");
                setLeaveOperation("View All Leaves");
                setDoctorOperation(null);
                setAppointmentOperation(null);
              }}
            >
              VIEW ALL LEAVES
            </button>
            <button
              onClick={() => {
                setActiveSection("leaves");
                setLeaveOperation("View Pending Leaves");
                setDoctorOperation(null);
                setAppointmentOperation(null);
              }}
            >
              VIEW PENDING LEAVES
            </button>
            <button
              onClick={() => {
                setActiveSection("leaves");
                setLeaveOperation("Update Leave Status");
                setDoctorOperation(null);
                setAppointmentOperation(null);
              }}
            >
              UPDATE LEAVE STATUS
            </button>
            <button
              onClick={() => {
                setActiveSection("leaves");
                setLeaveOperation("Delete Leave");
                setDoctorOperation(null);
                setAppointmentOperation(null);
              }}
            >
              DELETE LEAVE
            </button>
          </div>

          <div className={styles['sidebar-section']}>
            <h3>Appointment Operations</h3>
            <button
              onClick={() => {
                setActiveSection("appointments");
                setAppointmentOperation("Create Appointment");
                setDoctorOperation(null);
                setLeaveOperation(null);
              }}
            >
              CREATE APPOINTMENT
            </button>
            <button
              onClick={() => {
                setActiveSection("appointments");
                setAppointmentOperation("View Appointment by ID");
                setDoctorOperation(null);
                setLeaveOperation(null);
              }}
            >
              VIEW APPOINTMENT BY ID
            </button>
            <button
              onClick={() => {
                setActiveSection("appointments");
                setAppointmentOperation("View All Appointments");
                setDoctorOperation(null);
                setLeaveOperation(null);
              }}
            >
              VIEW ALL APPOINTMENTS
            </button>
            <button
              onClick={() => {
                setActiveSection("appointments");
                setAppointmentOperation("View Appointments by Doctor and Date");
                setDoctorOperation(null);
                setLeaveOperation(null);
              }}
            >
              VIEW APPOINTMENTS BY DOCTOR AND DATE
            </button>
            <button
              onClick={() => {
                setActiveSection("appointments");
                setAppointmentOperation("Get Appointment Count by Doctor and Date");
                setDoctorOperation(null);
                setLeaveOperation(null);
              }}
            >
              GET APPOINTMENT COUNT BY DOCTOR AND DATE
            </button>
            <button
              onClick={() => {
                setActiveSection("appointments");
                setAppointmentOperation("Update Appointment");
                setDoctorOperation(null);
                setLeaveOperation(null);
              }}
            >
              UPDATE APPOINTMENT
            </button>
            <button
              onClick={() => {
                setActiveSection("appointments");
                setAppointmentOperation("Reschedule Appointment");
                setDoctorOperation(null);
                setLeaveOperation(null);
              }}
            >
              RESCHEDULE APPOINTMENT
            </button>
            <button
              onClick={() => {
                setActiveSection("appointments");
                setAppointmentOperation("Cancel Appointment");
                setDoctorOperation(null);
                setLeaveOperation(null);
              }}
            >
              CANCEL APPOINTMENT
            </button>
            <button
              onClick={() => {
                setActiveSection("appointments");
                setAppointmentOperation("Delete All Appointments");
                setDoctorOperation(null);
                setLeaveOperation(null);
              }}
            >
              DELETE ALL APPOINTMENTS
            </button>
          </div>

          <div className={styles['sidebar-section']}>
            <h3>Departments</h3>
            <button onClick={() => { setActiveSection("departments"); setDepartmentOperation("List Departments"); setDoctorOperation(null); setLeaveOperation(null); setAppointmentOperation(null); setPrescriptionOperation(null); setMedicineStoreOperation(null); setHospitalChargesOperation(null); }}>VIEW ALL DEPARTMENTS</button>
            <button onClick={() => { setActiveSection("departments"); setDepartmentOperation("Add Department"); setDoctorOperation(null); setLeaveOperation(null); setAppointmentOperation(null); setPrescriptionOperation(null); setMedicineStoreOperation(null); setHospitalChargesOperation(null); }}>ADD DEPARTMENT</button>
            <button onClick={() => { setActiveSection("departments"); setDepartmentOperation("Get Department"); setDoctorOperation(null); setLeaveOperation(null); setAppointmentOperation(null); setPrescriptionOperation(null); setMedicineStoreOperation(null); setHospitalChargesOperation(null); }}>VIEW DEPARTMENT</button>
            <button onClick={() => { setActiveSection("departments"); setDepartmentOperation("Update Department"); setDoctorOperation(null); setLeaveOperation(null); setAppointmentOperation(null); setPrescriptionOperation(null); setMedicineStoreOperation(null); setHospitalChargesOperation(null); }}>UPDATE DEPARTMENT</button>
            <button onClick={() => { setActiveSection("departments"); setDepartmentOperation("Delete Department"); setDoctorOperation(null); setLeaveOperation(null); setAppointmentOperation(null); setPrescriptionOperation(null); setMedicineStoreOperation(null); setHospitalChargesOperation(null); }}>DELETE DEPARTMENT</button>
            <button onClick={() => { setActiveSection("departments"); setDepartmentOperation("Doctors by Department"); setDoctorOperation(null); setLeaveOperation(null); setAppointmentOperation(null); setPrescriptionOperation(null); setMedicineStoreOperation(null); setHospitalChargesOperation(null); }}>DOCTORS BY DEPARTMENT</button>
          </div>

          <div className={styles['sidebar-section']}>
            <h3>Prescriptions</h3>
            <button onClick={() => { setActiveSection("prescriptions"); setPrescriptionOperation("List Prescriptions"); setDoctorOperation(null); setLeaveOperation(null); setAppointmentOperation(null); setDepartmentOperation(null); setMedicineStoreOperation(null); setHospitalChargesOperation(null); }}>VIEW ALL PRESCRIPTIONS</button>
            <button onClick={() => { setActiveSection("prescriptions"); setPrescriptionOperation("Prescriptions by Patient"); setDoctorOperation(null); setLeaveOperation(null); setAppointmentOperation(null); setDepartmentOperation(null); setMedicineStoreOperation(null); setHospitalChargesOperation(null); }}>PRESCRIPTIONS BY PATIENT</button>
            <button onClick={() => { setActiveSection("prescriptions"); setPrescriptionOperation("Create Prescription"); setDoctorOperation(null); setLeaveOperation(null); setAppointmentOperation(null); setDepartmentOperation(null); setMedicineStoreOperation(null); setHospitalChargesOperation(null); }}>CREATE PRESCRIPTION</button>
            <button onClick={() => { setActiveSection("prescriptions"); setPrescriptionOperation("View Prescription"); setDoctorOperation(null); setLeaveOperation(null); setAppointmentOperation(null); setDepartmentOperation(null); setMedicineStoreOperation(null); setHospitalChargesOperation(null); }}>VIEW PRESCRIPTION</button>
            <button onClick={() => { setActiveSection("prescriptions"); setPrescriptionOperation("Update Prescription"); setDoctorOperation(null); setLeaveOperation(null); setAppointmentOperation(null); setDepartmentOperation(null); setMedicineStoreOperation(null); setHospitalChargesOperation(null); }}>UPDATE PRESCRIPTION</button>
            <button onClick={() => { setActiveSection("prescriptions"); setPrescriptionOperation("Delete Prescription"); setDoctorOperation(null); setLeaveOperation(null); setAppointmentOperation(null); setDepartmentOperation(null); setMedicineStoreOperation(null); setHospitalChargesOperation(null); }}>DELETE PRESCRIPTION</button>
            <button onClick={() => { setActiveSection("prescriptions"); setPrescriptionOperation("Delete All Prescriptions"); setDoctorOperation(null); setLeaveOperation(null); setAppointmentOperation(null); setDepartmentOperation(null); setMedicineStoreOperation(null); setHospitalChargesOperation(null); }}>DELETE ALL PRESCRIPTIONS</button>
          </div>

          <div className={styles['sidebar-section']}>
            <h3>Medicine Store</h3>
            <button onClick={() => { setActiveSection("medicineStore"); setMedicineStoreOperation("List Medicine Store"); setDoctorOperation(null); setLeaveOperation(null); setAppointmentOperation(null); setDepartmentOperation(null); setPrescriptionOperation(null); setHospitalChargesOperation(null); }}>VIEW MEDICINE STORE</button>
            <button onClick={() => { setActiveSection("medicineStore"); setMedicineStoreOperation("Search Medicine"); setDoctorOperation(null); setLeaveOperation(null); setAppointmentOperation(null); setDepartmentOperation(null); setPrescriptionOperation(null); setHospitalChargesOperation(null); }}>SEARCH BY NAME</button>
            <button onClick={() => { setActiveSection("medicineStore"); setMedicineStoreOperation("Add to Store"); setDoctorOperation(null); setLeaveOperation(null); setAppointmentOperation(null); setDepartmentOperation(null); setPrescriptionOperation(null); setHospitalChargesOperation(null); }}>ADD TO STORE</button>
            <button onClick={() => { setActiveSection("medicineStore"); setMedicineStoreOperation("Delete from Store"); setDoctorOperation(null); setLeaveOperation(null); setAppointmentOperation(null); setDepartmentOperation(null); setPrescriptionOperation(null); setHospitalChargesOperation(null); }}>REMOVE FROM STORE</button>
            <button onClick={() => { setActiveSection("medicineStore"); setMedicineStoreOperation("Seed Store"); setDoctorOperation(null); setLeaveOperation(null); setAppointmentOperation(null); setDepartmentOperation(null); setPrescriptionOperation(null); setHospitalChargesOperation(null); }}>SEED STORE</button>
          </div>

          <div className={styles['sidebar-section']}>
            <h3>Hospital Charges</h3>
            <button onClick={() => { setActiveSection("hospitalCharges"); setHospitalChargesOperation("List Charges"); setDoctorOperation(null); setLeaveOperation(null); setAppointmentOperation(null); setDepartmentOperation(null); setPrescriptionOperation(null); setMedicineStoreOperation(null); }}>VIEW CHARGES</button>
            <button onClick={() => { setActiveSection("hospitalCharges"); setHospitalChargesOperation("Update Charge"); setDoctorOperation(null); setLeaveOperation(null); setAppointmentOperation(null); setDepartmentOperation(null); setPrescriptionOperation(null); setMedicineStoreOperation(null); }}>UPDATE CHARGE</button>
            <button onClick={() => { setActiveSection("hospitalCharges"); setHospitalChargesOperation("Seed Charges"); setDoctorOperation(null); setLeaveOperation(null); setAppointmentOperation(null); setDepartmentOperation(null); setPrescriptionOperation(null); setMedicineStoreOperation(null); }}>SEED CHARGES</button>
          </div>
        </aside>

        <main className={styles['admin-content']}>
          {activeSection === "doctors" && doctorOperation && (
            <DoctorPage
              allowedOperations={[doctorOperation]}
              initialOperation={doctorOperation}
              showHeaders={false} // Suppress headers in AdminPage
            />
          )}
          {activeSection === "leaves" && leaveOperation && (
            <LeaveManagement
              allowedOperations={[leaveOperation]}
              isEmbedded={true}
            />
          )}
          {activeSection === "appointments" && appointmentOperation && (
            <AppointmentManagement
              allowedOperations={[appointmentOperation]}
              operationMode={appointmentOperation}
              doctorId={userRole === "doctor" ? localStorage.getItem("id") || undefined : undefined}
              isEmbedded={true}
              user={{ role: userRole, id: localStorage.getItem("id") }}
            />
          )}
          {activeSection === "departments" && departmentOperation && (
            <DepartmentsPage
              allowedOperations={[departmentOperation]}
              initialOperation={departmentOperation}
              isEmbedded={true}
            />
          )}
          {activeSection === "prescriptions" && prescriptionOperation && (
            <PrescriptionsPage
              allowedOperations={[prescriptionOperation]}
              initialOperation={prescriptionOperation}
              isEmbedded={true}
            />
          )}
          {activeSection === "medicineStore" && medicineStoreOperation && (
            <MedicineStorePage
              allowedOperations={[medicineStoreOperation]}
              initialOperation={medicineStoreOperation}
              isEmbedded={true}
            />
          )}
          {activeSection === "hospitalCharges" && hospitalChargesOperation && (
            <HospitalChargesPage
              allowedOperations={[hospitalChargesOperation]}
              initialOperation={hospitalChargesOperation}
              isEmbedded={true}
            />
          )}
          {!activeSection && (
            <div className={styles['default-message']}>
              <p>Select an operation from the sidebar to begin.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminPage;