import api from './api';

export const getAdminHourlyActivity = () => api.get('/api/appointments/stats/hourly-activity');
export const getAdminRevenueStats = () => api.get('/api/payments/stats/revenue');
export const getStaffOnDutyCount = () => api.get('/api/hr/staff/on-duty/count');
export const getBedStatusCounts = () => api.get('/api/bed-statuses'); // Mocking bed stats
