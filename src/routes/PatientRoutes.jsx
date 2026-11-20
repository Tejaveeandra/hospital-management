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
        <Route path="dashboard" element={<PatientPage isEmbedded={true} showHeaders={false} initialOperation="viewAll" />} />
        <Route path="book-appointment" element={<AppointmentPage isEmbedded={true} operationMode="create" initialOperation="create" />} />
        <Route path="my-prescriptions" element={<PrescriptionsPage isEmbedded={true} initialOperation="list" />} />
        <Route path="my-bills" element={<HospitalChargesPage isEmbedded={true} initialOperation="list" />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default PatientRoutes;
