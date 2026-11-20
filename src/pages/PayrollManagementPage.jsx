import React, { useState, useEffect } from 'react';
import api from '../api/api';

const PayrollManagementPage = ({ defaultTab = 'my' }) => {
  const role = (localStorage.getItem('role') || '').toUpperCase();
  const isAdminOrHr = ['ADMIN', 'SUPER_ADMIN', 'HR'].includes(role);
  const [activeTab, setActiveTab] = useState(isAdminOrHr && defaultTab !== 'my' ? defaultTab : 'my');

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [payrolls, setPayrolls] = useState([]);
  const [myPayslips, setMyPayslips] = useState([]);
  const [extraDuties, setExtraDuties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [manualExtra, setManualExtra] = useState({
    employeeType: 'DOCTOR',
    doctorId: '',
    staffId: '',
    dutyType: 'NIGHT_DUTY',
    amount: '',
    remarks: ''
  });

  const loadPayrolls = async () => {
    if (!isAdminOrHr) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/hr/payroll?month=${month}&year=${year}`);
      setPayrolls(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payroll records');
    } finally {
      setLoading(false);
    }
  };

  const loadMyPayslips = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/hr/payroll/my-payslips');
      setMyPayslips(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your payslips');
    } finally {
      setLoading(false);
    }
  };

  const loadExtraDuties = async () => {
    if (!isAdminOrHr) return;
    setLoading(true);
    try {
      const res = await api.get('/api/hr/extra-duty');
      setExtraDuties(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load extra duty logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setError('');
    setMessage('');
    if (activeTab === 'payroll') loadPayrolls();
    else if (activeTab === 'extra') loadExtraDuties();
    else loadMyPayslips();
  }, [activeTab, month, year]);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await api.post(`/api/hr/payroll/generate?month=${month}&year=${year}`);
      setMessage(`Payroll generated for ${month}/${year}`);
      await loadPayrolls();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate payroll');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    setError('');
    try {
      await api.put(`/api/hr/payroll/${id}/${action}`);
      setMessage(`Payroll #${id} updated (${action}).`);
      await loadPayrolls();
    } catch (err) {
      setError(err.response?.data?.message || `Action ${action} failed`);
    }
  };

  const handleExtraStatus = async (id, status) => {
    try {
      await api.put(`/api/hr/extra-duty/${id}/status?status=${status}`);
      await loadExtraDuties();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update extra duty status');
    }
  };

  const handleAddExtra = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/hr/extra-duty', {
        employeeType: manualExtra.employeeType,
        doctorId: manualExtra.employeeType === 'DOCTOR' ? Number(manualExtra.doctorId) : null,
        staffId: manualExtra.employeeType === 'STAFF' ? Number(manualExtra.staffId) : null,
        dutyType: manualExtra.dutyType,
        amount: Number(manualExtra.amount),
        remarks: manualExtra.remarks,
        status: 'APPROVED'
      });
      setManualExtra({ employeeType: 'DOCTOR', doctorId: '', staffId: '', dutyType: 'NIGHT_DUTY', amount: '', remarks: '' });
      setMessage('Extra duty added and approved.');
      await loadExtraDuties();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add extra duty');
    }
  };

  const cardStyle = { background: '#fff', borderRadius: 12, padding: '1.25rem', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', marginBottom: '1.25rem' };

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ marginBottom: '1rem' }}>Payroll & Compensation</h2>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {isAdminOrHr && (
          <>
            <button onClick={() => setActiveTab('payroll')} style={{ padding: '0.5rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer', background: activeTab === 'payroll' ? '#2563eb' : '#e2e8f0', color: activeTab === 'payroll' ? '#fff' : '#1e293b' }}>
              Monthly Payroll Run
            </button>
            <button onClick={() => setActiveTab('extra')} style={{ padding: '0.5rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer', background: activeTab === 'extra' ? '#2563eb' : '#e2e8f0', color: activeTab === 'extra' ? '#fff' : '#1e293b' }}>
              Extra Duty / Overtime
            </button>
          </>
        )}
        <button onClick={() => setActiveTab('my')} style={{ padding: '0.5rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer', background: activeTab === 'my' ? '#2563eb' : '#e2e8f0', color: activeTab === 'my' ? '#fff' : '#1e293b' }}>
          My Payslips
        </button>
        <button onClick={() => window.print()} style={{ marginLeft: 'auto', padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>
          Print / Save PDF
        </button>
      </div>

      {message && <div style={{ padding: '0.75rem', background: '#dcfce7', color: '#166534', borderRadius: 8, marginBottom: '1rem' }}>{message}</div>}
      {error && <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: 8, marginBottom: '1rem' }}>{error}</div>}

      {activeTab === 'payroll' && isAdminOrHr && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
            <input type="number" min="1" max="12" value={month} onChange={e => setMonth(Number(e.target.value))} style={{ width: 80, padding: '0.4rem' }} />
            <input type="number" min="2020" max="2035" value={year} onChange={e => setYear(Number(e.target.value))} style={{ width: 100, padding: '0.4rem' }} />
            <button onClick={handleGenerate} disabled={loading} style={{ padding: '0.5rem 1rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
              Generate Payroll
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                  <th style={{ padding: '0.6rem' }}>Type</th>
                  <th style={{ padding: '0.6rem' }}>Name</th>
                  <th style={{ padding: '0.6rem' }}>Base</th>
                  <th style={{ padding: '0.6rem' }}>Consult Share</th>
                  <th style={{ padding: '0.6rem' }}>Extra Duty</th>
                  <th style={{ padding: '0.6rem' }}>Leave Ded.</th>
                  <th style={{ padding: '0.6rem' }}>Net Salary</th>
                  <th style={{ padding: '0.6rem' }}>Status</th>
                  <th style={{ padding: '0.6rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payrolls.map(p => (
                  <tr key={p.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.6rem' }}>{p.employeeType}</td>
                    <td style={{ padding: '0.6rem' }}>{p.employeeName}</td>
                    <td style={{ padding: '0.6rem' }}>₹{p.baseSalary}</td>
                    <td style={{ padding: '0.6rem' }}>₹{p.consultationEarnings}</td>
                    <td style={{ padding: '0.6rem' }}>₹{p.extraDutyPay}</td>
                    <td style={{ padding: '0.6rem' }}>₹{p.leaveDeductions}</td>
                    <td style={{ padding: '0.6rem', fontWeight: 'bold' }}>₹{p.netSalary}</td>
                    <td style={{ padding: '0.6rem' }}>{p.status}</td>
                    <td style={{ padding: '0.6rem', display: 'flex', gap: '0.4rem' }}>
                      {p.status === 'DRAFT' && <button onClick={() => handleAction(p.id, 'approve')}>Approve</button>}
                      {p.status === 'APPROVED' && <button onClick={() => handleAction(p.id, 'mark-paid')}>Mark Paid</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'extra' && isAdminOrHr && (
        <div style={cardStyle}>
          <form onSubmit={handleAddExtra} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <select value={manualExtra.employeeType} onChange={e => setManualExtra(prev => ({ ...prev, employeeType: e.target.value }))}>
              <option value="DOCTOR">DOCTOR</option>
              <option value="STAFF">STAFF</option>
            </select>
            {manualExtra.employeeType === 'DOCTOR' ? (
              <input placeholder="Doctor ID" value={manualExtra.doctorId} onChange={e => setManualExtra(prev => ({ ...prev, doctorId: e.target.value }))} required />
            ) : (
              <input placeholder="Staff ID" value={manualExtra.staffId} onChange={e => setManualExtra(prev => ({ ...prev, staffId: e.target.value }))} required />
            )}
            <select value={manualExtra.dutyType} onChange={e => setManualExtra(prev => ({ ...prev, dutyType: e.target.value }))}>
              <option value="NIGHT_DUTY">NIGHT_DUTY</option>
              <option value="EXTRA_SHIFT">EXTRA_SHIFT</option>
              <option value="EMERGENCY_CALL">EMERGENCY_CALL</option>
              <option value="BONUS">BONUS</option>
            </select>
            <input type="number" placeholder="Amount (₹)" value={manualExtra.amount} onChange={e => setManualExtra(prev => ({ ...prev, amount: e.target.value }))} required />
            <input placeholder="Remarks" value={manualExtra.remarks} onChange={e => setManualExtra(prev => ({ ...prev, remarks: e.target.value }))} />
            <button type="submit" style={{ padding: '0.4rem 0.9rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6 }}>Add Extra Duty</button>
          </form>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                <th style={{ padding: '0.6rem' }}>Date</th>
                <th style={{ padding: '0.6rem' }}>Type</th>
                <th style={{ padding: '0.6rem' }}>Duty</th>
                <th style={{ padding: '0.6rem' }}>Hours</th>
                <th style={{ padding: '0.6rem' }}>Amount</th>
                <th style={{ padding: '0.6rem' }}>Status</th>
                <th style={{ padding: '0.6rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {extraDuties.map(ex => (
                <tr key={ex.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '0.6rem' }}>{ex.dutyDate}</td>
                  <td style={{ padding: '0.6rem' }}>{ex.employeeType} #{ex.doctorId || ex.staffId}</td>
                  <td style={{ padding: '0.6rem' }}>{ex.dutyType}</td>
                  <td style={{ padding: '0.6rem' }}>{ex.hours ?? '-'}</td>
                  <td style={{ padding: '0.6rem' }}>₹{ex.amount}</td>
                  <td style={{ padding: '0.6rem' }}>{ex.status}</td>
                  <td style={{ padding: '0.6rem', display: 'flex', gap: '0.4rem' }}>
                    {ex.status === 'PENDING' && (
                      <>
                        <button onClick={() => handleExtraStatus(ex.id, 'APPROVED')}>Approve</button>
                        <button onClick={() => handleExtraStatus(ex.id, 'REJECTED')}>Reject</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'my' && (
        <div style={cardStyle}>
          {myPayslips.length === 0 ? (
            <p>No payslips generated yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                  <th style={{ padding: '0.6rem' }}>Period</th>
                  <th style={{ padding: '0.6rem' }}>Base</th>
                  <th style={{ padding: '0.6rem' }}>Consult Share</th>
                  <th style={{ padding: '0.6rem' }}>Extra Duty</th>
                  <th style={{ padding: '0.6rem' }}>Deductions</th>
                  <th style={{ padding: '0.6rem' }}>Net Salary</th>
                  <th style={{ padding: '0.6rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {myPayslips.map(p => (
                  <tr key={p.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.6rem' }}>{p.payMonth}/{p.payYear}</td>
                    <td style={{ padding: '0.6rem' }}>₹{p.baseSalary}</td>
                    <td style={{ padding: '0.6rem' }}>₹{p.consultationEarnings}</td>
                    <td style={{ padding: '0.6rem' }}>₹{p.extraDutyPay}</td>
                    <td style={{ padding: '0.6rem' }}>₹{(p.leaveDeductions || 0) + (p.otherDeductions || 0)}</td>
                    <td style={{ padding: '0.6rem', fontWeight: 'bold' }}>₹{p.netSalary}</td>
                    <td style={{ padding: '0.6rem' }}>{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default PayrollManagementPage;

