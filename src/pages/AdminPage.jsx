import React, { useState } from "react";
import AdminLayout from "../component/Layout/AdminLayout";
import AdminDashboardContent from "./AdminDashboardContent";
import DoctorPage from "./DoctorPage";
import PatientPage from "./PatientPage";
import UserManagementPage from "./UserManagementPage";
import LeaveManagement from "./DoctorLeavePage";
import AppointmentManagement from "./AppointmentPage";
import DepartmentsPage from "./DepartmentsPage";
import PrescriptionsPage from "./PrescriptionsPage";
import MedicineStorePage from "./MedicineStorePage";
import HospitalChargesPage from "./HospitalChargesPage";

const AdminPage = () => {
  const userRole = localStorage.getItem("role") || "patient";
  const [activeSection, setActiveSection] = useState("dashboard");
  const [patientOperation, setPatientOperation] = useState("viewAll");
  const [userOperation, setUserOperation] = useState("viewAll");
  const [doctorOperation, setDoctorOperation] = useState("viewAll");
  const [leaveOperation, setLeaveOperation] = useState("View All Leaves");
  const [appointmentOperation, setAppointmentOperation] = useState("View All Appointments");
  const [departmentOperation, setDepartmentOperation] = useState("List Departments");
  const [prescriptionOperation, setPrescriptionOperation] = useState("List Prescriptions");
  const [medicineStoreOperation, setMedicineStoreOperation] = useState("List Medicine Store");
  const [hospitalChargesOperation, setHospitalChargesOperation] = useState("List Charges");
  const isAdmin = ["admin", "super-admin", "ADMIN", "SUPER_ADMIN"].includes(userRole);

  const handleLogout = () => {
    localStorage.removeItem('_raja_t');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    window.location.href = '/';
  };

  if (!isAdmin) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h1>Access Denied</h1>
        <p>You do not have permission to view the Admin Dashboard.</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <AdminDashboardContent />;
      case 'users':
        return <UserManagementPage isEmbedded={true} initialOperation={userOperation} />;
      case 'patients':
        return <PatientPage allowedOperations={["viewAll", "create", "update", "delete", "view", "bookAppointment"]} initialOperation={patientOperation} isEmbedded={true} showHeaders={false} />;
      case 'doctors':
        return <DoctorPage allowedOperations={["viewAll", "getById", "update", "create", "delete", "createLeave", "viewLeaveByDoctorId", "appointmentViewById", "appointmentUpdate", "appointmentReschedule", "appointmentCancel", "appointmentViewByDoctorDate", "appointmentCountByDoctorDate", "prescriptionCreate", "prescriptionByPatient", "prescriptionMy"]} initialOperation={doctorOperation} isEmbedded={true} showHeaders={false} />;
      case 'leaves':
        return <LeaveManagement allowedOperations={["View All Leaves", "View Pending Leaves", "Update Leave Status", "Delete Leave"]} initialOperation={leaveOperation} isEmbedded={true} />;
      case 'appointments':
        return <AppointmentManagement allowedOperations={["View All Appointments", "Create Appointment", "Update Appointment", "Cancel Appointment", "Delete All Appointments"]} operationMode={appointmentOperation} isEmbedded={true} user={{ role: userRole }} />;
      case 'departments':
        return <DepartmentsPage allowedOperations={["List Departments", "Add Department", "Update Department", "Delete Department", "Doctors by Department"]} initialOperation={departmentOperation} isEmbedded={true} />;
      case 'prescriptions':
        return <PrescriptionsPage allowedOperations={["List Prescriptions", "Create Prescription", "Update Prescription", "Delete Prescription", "Delete All Prescriptions"]} initialOperation={prescriptionOperation} isEmbedded={true} />;
      case 'medicineStore':
        return <MedicineStorePage allowedOperations={["List Medicine Store", "Add to Store", "Delete from Store", "Seed Store"]} initialOperation={medicineStoreOperation} isEmbedded={true} />;
      case 'hospitalCharges':
        return <HospitalChargesPage allowedOperations={["List Charges", "Update Charge", "Seed Charges"]} initialOperation={hospitalChargesOperation} isEmbedded={true} />;
      default:
        return (
          <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px' }}>
            <h2>{activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} Module</h2>
            <p>This module is currently under construction.</p>
          </div>
        );
    }
  };

  const handleSetSpecificOperation = (section, operation) => {
    if (section === 'users') setUserOperation(operation);
    if (section === 'patients') setPatientOperation(operation);
    if (section === 'doctors') setDoctorOperation(operation);
    if (section === 'leaves') setLeaveOperation(operation);
    if (section === 'appointments') setAppointmentOperation(operation);
    if (section === 'departments') setDepartmentOperation(operation);
    if (section === 'prescriptions') setPrescriptionOperation(operation);
    if (section === 'medicineStore') setMedicineStoreOperation(operation);
    if (section === 'hospitalCharges') setHospitalChargesOperation(operation);
  };

  return (
    <AdminLayout 
      activeSection={activeSection} 
      setActiveSection={setActiveSection}
      userRole={userRole}
      handleLogout={handleLogout}
      setSpecificOperation={handleSetSpecificOperation}
    >
      {renderContent()}
    </AdminLayout>
  );
};

export default AdminPage;