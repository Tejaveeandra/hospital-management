import api from './api';

// --- DIAGNOSTICS ---
export const getDiagnosticsCatalog = () => api.get('/api/diagnostics/catalog');
export const createDiagnosticsCatalog = (data) => api.post('/api/diagnostics/catalog', data);
export const getDiagnosticsOrderByPatient = (uhid) => api.get('/api/diagnostics/order/patient/' + uhid);
export const getCompletedDiagnosticsCount = (uhid) => api.get('/api/diagnostics/order/patient/' + uhid + '/completed-count');
export const createDiagnosticOrder = (data) => api.post('/api/diagnostics/order', data);
export const updateDiagnosticResult = (orderId, result) => api.put('/api/diagnostics/order/' + orderId + '/result', result);

// --- SURGERIES ---
export const getSurgeryCatalog = () => api.get('/api/surgeries/catalog');
export const createSurgeryCatalog = (data) => api.post('/api/surgeries/catalog', data);
export const getSurgeriesByPatient = (uhid) => api.get('/api/surgeries/patient/' + uhid);
export const scheduleSurgery = (data) => api.post('/api/surgeries/schedule', data);
export const completeSurgery = (id, result) => api.put('/api/surgeries/schedule/' + id + '/complete', result);

