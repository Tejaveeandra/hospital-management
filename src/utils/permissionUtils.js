/**
 * Granular Dynamic Permission Utilities
 * Connects frontend UI components to PostgreSQL role_permissions
 */

// Retrieve active permissions array from localStorage
export const getStoredPermissions = () => {
  try {
    const raw = localStorage.getItem('permissions');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

// Check if user is Super Administrator (God Mode / All Privileges)
export const isSuperAdminUser = () => {
  const role = (localStorage.getItem('role') || '').toUpperCase().replace('-', '_');
  const perms = getStoredPermissions();
  return role === 'SUPER_ADMIN' || perms.includes('ALL_PRIVILEGES') || perms.includes('*');
};

// Check single permission
export const hasPermission = (permissionCode) => {
  if (isSuperAdminUser()) return true;
  const perms = getStoredPermissions();
  return perms.includes(permissionCode);
};

// Check if user has ANY of the specified permissions
export const hasAnyPermission = (...permissionCodes) => {
  if (isSuperAdminUser()) return true;
  const perms = getStoredPermissions();
  const flatCodes = permissionCodes.flat();
  return flatCodes.some(code => perms.includes(code));
};

// Check if user has ALL of the specified permissions
export const hasAllPermissions = (...permissionCodes) => {
  if (isSuperAdminUser()) return true;
  const perms = getStoredPermissions();
  const flatCodes = permissionCodes.flat();
  return flatCodes.every(code => perms.includes(code));
};

// Granular Resource Actions (READ, CREATE/WRITE, UPDATE, DELETE)
export const canRead = (resource) => {
  const res = resource.toUpperCase();
  return hasAnyPermission(
    `${res}_READ`,
    `${res}_MANAGE`,
    `${res}_VIEW`,
    `${res}_ALL`
  );
};

export const canCreate = (resource) => {
  const res = resource.toUpperCase();
  return hasAnyPermission(
    `${res}_CREATE`,
    `${res}_WRITE`,
    `${res}_MANAGE`
  );
};

export const canUpdate = (resource) => {
  const res = resource.toUpperCase();
  return hasAnyPermission(
    `${res}_UPDATE`,
    `${res}_WRITE`,
    `${res}_MANAGE`,
    `${res}_EDIT`
  );
};

export const canDelete = (resource) => {
  const res = resource.toUpperCase();
  return hasAnyPermission(
    `${res}_DELETE`,
    `${res}_MANAGE`,
    `${res}_CANCEL`
  );
};