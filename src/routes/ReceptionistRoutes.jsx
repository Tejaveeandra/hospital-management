import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../component/Layout/AdminLayout';
import PatientPage from '../pages/PatientPage';
import AppointmentPage from '../pages/AppointmentPage';
import ShiftManagementPage from '../pages/ShiftManagementPage';

const ReceptionistRoutes = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<PatientPage isEmbedded={true} initialOperation="viewAll" />} />
        <Route path="patient-registration" element={<PatientPage isEmbedded={true} initialOperation="create" />} />
        <Route path="walk-in-appointments" element={<AppointmentPage isEmbedded={true} initialOperation="Create Appointment" />} />
        <Route path="doctor-availability" element={<ShiftManagementPage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default ReceptionistRoutes;
