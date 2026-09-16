import React from 'react';
import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import AdminLayout from '../component/Layout/AdminLayout';
import AdminDashboardContent from '../pages/AdminDashboardContent';
import UserManagementPage from '../pages/UserManagementPage';
import PatientPage from '../pages/PatientPage';
import DoctorPage from '../pages/DoctorPage';
import DoctorLeavePage from '../pages/DoctorLeavePage';
import AppointmentPage from '../pages/AppointmentPage';
import DepartmentsPage from '../pages/DepartmentsPage';
import PrescriptionsPage from '../pages/PrescriptionsPage';
import MedicineStorePage from '../pages/MedicineStorePage';
import HospitalChargesPage from '../pages/HospitalChargesPage';
import StaffManagementPage from '../pages/StaffManagementPage';
import ShiftManagementPage from '../pages/ShiftManagementPage';
import AttendanceDashboard from '../pages/AttendanceDashboard';
import AuditLogsPage from '../pages/AuditLogsPage';

const AdminRouteWrapper = () => {
  const [searchParams] = useSearchParams();
  const op = searchParams.get('op') || undefined;

  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<AdminDashboardContent />} />
      <Route path="users" element={<UserManagementPage isEmbedded={true} initialOperation={op} key={`users-${op}`} />} />
      <Route path="patients" element={<PatientPage isEmbedded={true} showHeaders={false} initialOperation={op} key={`patients-${op}`} />} />
      <Route path="doctors" element={<DoctorPage isEmbedded={true} showHeaders={false} initialOperation={op} key={`doctors-${op}`} />} />
      <Route path="leaves" element={<DoctorLeavePage isEmbedded={true} initialOperation={op} key={`leaves-${op}`} />} />
      <Route path="appointments" element={<AppointmentPage isEmbedded={true} operationMode={op} initialOperation={op} key={`appts-${op}`} />} />
      <Route path="departments" element={<DepartmentsPage isEmbedded={true} initialOperation={op} key={`depts-${op}`} />} />
      <Route path="prescriptions" element={<PrescriptionsPage isEmbedded={true} initialOperation={op} key={`presc-${op}`} />} />
      <Route path="medicine-store" element={<MedicineStorePage isEmbedded={true} initialOperation={op} key={`med-${op}`} />} />
      <Route path="hospital-charges" element={<HospitalChargesPage isEmbedded={true} initialOperation={op} key={`charges-${op}`} />} />
      <Route path="staff" element={<StaffManagementPage />} />
      <Route path="shifts" element={<ShiftManagementPage />} />
      <Route path="attendance" element={<AttendanceDashboard />} />
      <Route path="audit-logs" element={<AuditLogsPage />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
};

const AdminRoutes = () => {
  return (
    <AdminLayout>
      <AdminRouteWrapper />
    </AdminLayout>
  );
};

export default AdminRoutes;
