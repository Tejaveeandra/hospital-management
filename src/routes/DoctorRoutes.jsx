import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../component/Layout/AdminLayout';
import DoctorPage from '../pages/DoctorPage';
import PrescriptionsPage from '../pages/PrescriptionsPage';
import DoctorLeavePage from '../pages/DoctorLeavePage';
import PayrollManagementPage from '../pages/PayrollManagementPage';
import ClinicalRecordsPage from '../pages/ClinicalRecordsPage';

const DoctorRoutes = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DoctorPage isEmbedded={true} showHeaders={false} initialOperation="viewAll" />} />
        <Route path="appointments" element={<DoctorPage isEmbedded={true} showHeaders={false} initialOperation="viewAll" />} />
        <Route path="prescriptions" element={<PrescriptionsPage isEmbedded={true} initialOperation="create" />} />
        <Route path="leaves" element={<DoctorLeavePage isEmbedded={true} />} />
        <Route path="payslips" element={<PayrollManagementPage defaultTab="my" />} />
        <Route path="clinical-records" element={<ClinicalRecordsPage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default DoctorRoutes;
