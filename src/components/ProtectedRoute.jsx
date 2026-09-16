import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const token = localStorage.getItem('token') || localStorage.getItem('_raja_t');
  const role = (localStorage.getItem('role') || '').toUpperCase();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.map(r => r.toUpperCase()).includes(role)) {
    // If not authorized for this role, redirect to their default home
    if (role === 'DOCTOR') return <Navigate to="/doctor/dashboard" replace />;
    if (role === 'PATIENT') return <Navigate to="/patient/dashboard" replace />;
    if (role === 'RECEPTIONIST') return <Navigate to="/receptionist/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
