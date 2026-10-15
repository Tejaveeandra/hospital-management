import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import LockoutScreen from './pages/LockoutScreen';
import ProtectedRoute from './components/ProtectedRoute';
import SessionManager from './components/SessionManager';

import AdminRoutes from './routes/AdminRoutes';
import DoctorRoutes from './routes/DoctorRoutes';
import PatientRoutes from './routes/PatientRoutes';
import ReceptionistRoutes from './routes/ReceptionistRoutes';

/**
 * Hospital Management Root Application
 * Dynamic RBAC Architecture:
 * Replaces hardcoded role arrays with dynamic, permission-driven access.
 */
const App = () => {
  return (
    <Router>
      <SessionManager />
      <Routes>
        {/* Public Authentication Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/lockout" element={<LockoutScreen />} />

        {/* 
          Hospital Enterprise / Staff Portal (/admin/*)
          Dynamic Access: Any authenticated staff member (Admin, HR, Nurse, Accountant, Doctor,
          Lab Tech, Security, Housekeeping, or any custom role created in DB) can access.
          Internal pages and menus are dynamically rendered based on the user's DB permissions.
          External PATIENT role is excluded.
        */}
        <Route element={<ProtectedRoute allowAllStaff={true} disallowedRoles={['PATIENT']} />}>
          <Route path="/admin/*" element={<AdminRoutes />} />
          <Route path="/super-admin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        {/* Doctor Portal (/doctor/*) - accessible by DOCTOR role or users with doctor clinical permissions */}
        <Route element={<ProtectedRoute allowedRoles={['DOCTOR']} requiredPermissions={['DOCTOR_READ', 'DOCTOR_MANAGE', 'PRESCRIPTION_CREATE']} />}>
          <Route path="/doctor/*" element={<DoctorRoutes />} />
        </Route>

        {/* Patient Portal (/patient/*) - accessible by PATIENT role */}
        <Route element={<ProtectedRoute allowedRoles={['PATIENT']} />}>
          <Route path="/patient/*" element={<PatientRoutes />} />
        </Route>

        {/* Receptionist Portal (/receptionist/*) - accessible by RECEPTIONIST role or appointment staff */}
        <Route element={<ProtectedRoute allowedRoles={['RECEPTIONIST']} requiredPermissions={['APPOINTMENT_CREATE', 'APPOINTMENT_READ', 'BILLING_READ']} />}>
          <Route path="/receptionist/*" element={<ReceptionistRoutes />} />
        </Route>

        {/* Fallback to Login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
