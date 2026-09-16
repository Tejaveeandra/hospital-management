import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../component/Layout/AdminLayout';
import PatientPage from '../pages/PatientPage';
import AppointmentPage from '../pages/AppointmentPage';
import PrescriptionsPage from '../pages/PrescriptionsPage';
import HospitalChargesPage from '../pages/HospitalChargesPage';

const PatientRoutes = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<PatientPage isEmbedded={true} initialOperation="view" />} />
        <Route path="book-appointment" element={<AppointmentPage isEmbedded={true} initialOperation="Create Appointment" />} />
        <Route path="my-prescriptions" element={<PrescriptionsPage isEmbedded={true} initialOperation="List Prescriptions" />} />
        <Route path="my-bills" element={<HospitalChargesPage isEmbedded={true} initialOperation="List Charges" />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default PatientRoutes;
