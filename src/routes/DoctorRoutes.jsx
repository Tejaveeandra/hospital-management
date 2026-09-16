import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../component/Layout/AdminLayout';
import DoctorPage from '../pages/DoctorPage';
import PrescriptionsPage from '../pages/PrescriptionsPage';
import DoctorLeavePage from '../pages/DoctorLeavePage';

const DoctorRoutes = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DoctorPage isEmbedded={true} initialOperation="viewAll" />} />
        <Route path="appointments" element={<DoctorPage isEmbedded={true} initialOperation="appointmentViewByDoctorDate" />} />
        <Route path="prescriptions" element={<PrescriptionsPage isEmbedded={true} initialOperation="Create Prescription" />} />
        <Route path="leaves" element={<DoctorLeavePage isEmbedded={true} />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default DoctorRoutes;
