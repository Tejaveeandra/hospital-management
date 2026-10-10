import api from './api';

export const getInvoicesByPatient = (uhid) => api.get('/api/payments/patient/' + uhid);
export const claimInsurance = (invoiceId, data) => api.post('/api/payments/invoices/' + invoiceId + '/insurance/claim', data);
export const settleInsurance = (invoiceId, data) => api.post('/api/payments/invoices/' + invoiceId + '/insurance/settle', data);
