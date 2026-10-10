import api from './api';

// --- AUTH & AUDIT ---
export const checkUserStatus = () => api.get('/users/check-status');
export const checkIsRevoked = () => api.get('/users/is-revoked');
export const getRolesPermissions = () => api.get('/users/roles/permissions');
export const getUserByUsername = (username) => api.get('/users/username/' + username);
export const refreshUserToken = (data) => api.post('/users/refresh', data);
export const registerUser = (data) => api.post('/users/register', data);
export const updateUser = (userId, data) => api.put('/users/' + userId, data);
export const activateUser = (userId) => api.put('/users/' + userId + '/activate');
export const deactivateUser = (userId) => api.put('/users/' + userId + '/deactivate');
export const updateRole = (id, data) => api.put('/users/roles/' + id, data);
export const logAudit = (data) => api.post('/audit/log', data);

// --- DOCTOR ENDPOINTS ---
export const getDoctorByCode = (doctorCode) => api.get('/doctors/' + doctorCode);
export const getDoctorsByBranch = (branchId) => api.get('/doctors/branch/' + branchId);
export const getDoctorsByBranchDept = (branchId, deptId) => api.get('/doctors/branch/' + branchId + '/dept/' + deptId);
export const getDoctorsByDept = (departmentId) => api.get('/doctors/by-department/' + departmentId);
export const getDoctorsBySubDept = (subDeptId) => api.get('/doctors/by-sub-department/' + subDeptId);
export const filterDoctors = (params) => api.get('/doctors/filter', { params });
export const terminateDoctor = (doctorId) => api.put('/doctors/' + doctorId + '/terminate');
export const updateDoctor = (doctorCode, data) => api.put('/doctors/updateDoctor/' + doctorCode, data);

// --- PATIENT ENDPOINTS ---
export const getPatientByUhid = (uhid) => api.get('/patients/' + uhid);
export const getPatientsCount = () => api.get('/patients/count');
export const searchPatients = (params) => api.get('/patients/search', { params });
export const closePatientFile = (id) => api.put('/patients/' + id + '/close-file');
export const updatePatientMetadata = (uhid, data) => api.put('/patients/update-metadata/' + uhid, data);

// --- APPOINTMENT ENDPOINTS ---
export const getAppointment = (id) => api.get('/appointments/' + id);
export const getAvailableSlots = (params) => api.get('/appointments/available-slots', { params });
export const getAppointmentsByBranch = (branchId) => api.get('/appointments/branch/' + branchId);
export const updateAppointmentStatus = (id, status) => api.put('/appointments/' + id + '/status', { status });
export const rescheduleAppointment = (id, data) => api.put('/appointments/appointments/reschedule/' + id, data);

// --- HR & STAFF ---
export const hireCandidate = (id, data) => api.post('/api/hr/recruitment/candidates/' + id + '/hire', data);
export const getShifts = () => api.get('/api/hr/shifts');
export const getStaffCredentialStatus = (userId) => api.get('/api/hr/staff/' + userId + '/credential-status');
export const getStaffPresence = (userId) => api.get('/api/hr/staff/' + userId + '/is-present');
export const batchUploadCredentials = (data) => api.post('/api/hr/staff/credentials/batch', data);
export const submitHeartbeat = (data) => api.post('/api/hr/attendance/heartbeat', data);

// --- PRESCRIPTION ENDPOINTS ---
export const distributePrescription = (code) => api.post('/api/prescriptions/' + code + '/distribute');
export const dispensePrescription = (code) => api.put('/api/prescriptions/' + code + '/dispense');

