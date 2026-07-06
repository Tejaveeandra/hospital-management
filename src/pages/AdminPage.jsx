import React, { useState } from "react";
import AdminLayout from "../component/Layout/AdminLayout";
import AdminDashboardContent from "./AdminDashboardContent";
import DoctorPage from "./DoctorPage";
import LeaveManagement from "./DoctorLeavePage";
import AppointmentManagement from "./AppointmentPage";
import DepartmentsPage from "./DepartmentsPage";
import PrescriptionsPage from "./PrescriptionsPage";
import MedicineStorePage from "./MedicineStorePage";
import HospitalChargesPage from "./HospitalChargesPage";

const AdminPage = () => {
  const userRole = localStorage.getItem("role") || "patient";
  const isAdmin = ["admin", "super-admin", "ADMIN", "SUPER_ADMIN"].includes(userRole);
  
  const [activeSection, setActiveSection] = useState("dashboard");

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
      case 'doctors':
        return <DoctorPage allowedOperations={["viewAll", "create", "delete"]} isEmbedded={true} showHeaders={false} />;
      case 'leaves':
        return <LeaveManagement allowedOperations={["View All Leaves", "View Pending Leaves", "Update Leave Status", "Delete Leave"]} isEmbedded={true} />;
      case 'appointments':
        return <AppointmentManagement allowedOperations={["View All Appointments", "Create Appointment", "Update Appointment", "Cancel Appointment", "Delete All Appointments"]} isEmbedded={true} user={{ role: userRole }} />;
      case 'departments':
        return <DepartmentsPage allowedOperations={["List Departments", "Add Department", "Update Department", "Delete Department", "Doctors by Department"]} isEmbedded={true} />;
      case 'prescriptions':
        return <PrescriptionsPage allowedOperations={["List Prescriptions", "Create Prescription", "Update Prescription", "Delete Prescription", "Delete All Prescriptions"]} isEmbedded={true} />;
      case 'medicineStore':
        return <MedicineStorePage allowedOperations={["List Medicine Store", "Add to Store", "Delete from Store", "Seed Store"]} isEmbedded={true} />;
      case 'hospitalCharges':
        return <HospitalChargesPage allowedOperations={["List Charges", "Update Charge", "Seed Charges"]} isEmbedded={true} />;
      default:
        return (
          <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px' }}>
            <h2>{activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} Module</h2>
            <p>This module is currently under construction.</p>
          </div>
        );
    }
  };

  return (
    <AdminLayout 
      activeSection={activeSection} 
      setActiveSection={setActiveSection}
      userRole={userRole}
      handleLogout={handleLogout}
    >
      {renderContent()}
    </AdminLayout>
  );
};

export default AdminPage;