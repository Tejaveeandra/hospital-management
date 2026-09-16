import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import LockoutScreen from './pages/LockoutScreen';
import ProtectedRoute from './components/ProtectedRoute';

import AdminRoutes from './routes/AdminRoutes';
import DoctorRoutes from './routes/DoctorRoutes';
import PatientRoutes from './routes/PatientRoutes';
import ReceptionistRoutes from './routes/ReceptionistRoutes';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public Authentication Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/lockout" element={<LockoutScreen />} />

        {/* Protected Admin & Super Admin Portal (/admin/*) */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'SUPER-ADMIN']} />}>
          <Route path="/admin/*" element={<AdminRoutes />} />
          <Route path="/super-admin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        {/* Protected Doctor Portal (/doctor/*) */}
        <Route element={<ProtectedRoute allowedRoles={['DOCTOR']} />}>
          <Route path="/doctor/*" element={<DoctorRoutes />} />
        </Route>

        {/* Protected Patient Portal (/patient/*) */}
        <Route element={<ProtectedRoute allowedRoles={['PATIENT']} />}>
          <Route path="/patient/*" element={<PatientRoutes />} />
        </Route>

        {/* Protected Receptionist Portal (/receptionist/*) */}
        <Route element={<ProtectedRoute allowedRoles={['RECEPTIONIST']} />}>
          <Route path="/receptionist/*" element={<ReceptionistRoutes />} />
        </Route>

        {/* Fallback to Login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
