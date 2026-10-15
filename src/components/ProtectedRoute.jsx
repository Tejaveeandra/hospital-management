import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { isSuperAdminUser, getStoredPermissions } from '../utils/permissionUtils';

/**
 * Dynamic Permission & Role Protected Route
 * Prioritizes dynamic DB permissions over static hardcoded roles.
 */
const ProtectedRoute = ({
  allowedRoles = [],
  disallowedRoles = [],
  allowAllStaff = false,
  requiredPermission,
  requiredPermissions = [],
  children
}) => {
  const token = localStorage.getItem('token') || localStorage.getItem('_raja_t');
  const role = (localStorage.getItem('role') || '').toUpperCase().replace(/-/g, '_');
  const permissions = getStoredPermissions();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Super Admin has universal access
  if (isSuperAdminUser()) {
    return children ? children : <Outlet />;
  }

  // 1. Explicit Disallow List (e.g. PATIENT cannot access staff portals)
  if (disallowedRoles.length > 0) {
    const isDisallowed = disallowedRoles
      .map(r => r.toUpperCase().replace(/-/g, '_'))
      .includes(role);
    if (isDisallowed) {
      if (role === 'PATIENT') return <Navigate to="/patient/dashboard" replace />;
      return <Navigate to="/" replace />;
    }
  }

  // 2. Dynamic Staff Portal Mode:
  // Any authenticated user who is not an external patient (staff, admin, HR, doctor, nurse, tech, etc.)
  if (allowAllStaff) {
    if (role !== 'PATIENT') {
      return children ? children : <Outlet />;
    }
  }

  // 3. Dynamic Permission Check:
  // If required permissions are specified, check if user has at least one
  const neededPermissions = [
    ...(requiredPermission ? [requiredPermission] : []),
    ...requiredPermissions
  ];
  if (neededPermissions.length > 0) {
    const hasPerm = neededPermissions.some(p => permissions.includes(p));
    if (hasPerm) {
      return children ? children : <Outlet />;
    }
  }

  // 4. Role Match Check (fallback compatibility):
  if (allowedRoles.length > 0) {
    const normalizedAllowed = allowedRoles.map(r => r.toUpperCase().replace(/-/g, '_'));
    if (normalizedAllowed.includes(role)) {
      return children ? children : <Outlet />;
    }
  }

  // If no restrictions were set at all (just auth required):
  if (allowedRoles.length === 0 && neededPermissions.length === 0 && !allowAllStaff) {
    return children ? children : <Outlet />;
  }

  // Default redirect for unauthorized access based on role
  if (role === 'DOCTOR') return <Navigate to="/doctor/dashboard" replace />;
  if (role === 'PATIENT') return <Navigate to="/patient/dashboard" replace />;
  if (role === 'RECEPTIONIST') return <Navigate to="/receptionist/dashboard" replace />;
  return <Navigate to="/" replace />;
};

export default ProtectedRoute;
