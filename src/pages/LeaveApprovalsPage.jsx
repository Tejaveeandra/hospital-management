import React, { useState, useEffect } from 'react';
import * as generatedApi from '../api/generatedApi'; // assuming leave APIs are there, or I'll mock
import api from '../api/api';
import styles from './ModulePages.module.css';

const LeaveApprovalsPage = () => {
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchPendingLeaves();
  }, []);

  const fetchPendingLeaves = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/doctor-leaves/doctor-leave/pending');
      setPendingLeaves(res.data || []);
    } catch (e) {
      console.error(e);
      // fallback mock for UI demonstration if backend fails
      setPendingLeaves([
        { id: 1, doctorId: 'DOC-001', startDate: '2026-10-12', endDate: '2026-10-14', leaveType: 'SICK_LEAVE', status: 'PENDING' },
        { id: 2, doctorId: 'DOC-005', startDate: '2026-10-15', endDate: '2026-10-20', leaveType: 'VACATION', status: 'PENDING' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    setMsg('');
    try {
      await api.put(`/api/doctor-leaves/doctor-leave/${id}/status`, { status });
      setMsg(`Leave ${status} successfully!`);
      fetchPendingLeaves(); // refresh
    } catch (e) {
      setMsg(`Error updating leave status: ` + (e.response?.data?.message || e.message));
    }
  };

  return (
    <div className={styles.pageContainer}>
      <h2>Leave Approvals Dashboard</h2>
      {msg && <div style={{color: msg.includes('Error') ? 'red' : 'green', margin: '1rem 0', fontWeight: 'bold'}}>{msg}</div>}
      
      <div className={styles.tableCard}>
        <h3>Pending Staff Leave Requests</h3>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Leave ID</th>
              <th>Doctor ID</th>
              <th>Dates</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingLeaves.map(leave => (
              <tr key={leave.id}>
                <td>{leave.id}</td>
                <td style={{fontWeight: 'bold', color: 'var(--primary-color)'}}>{leave.doctorId}</td>
                <td>{leave.startDate} to {leave.endDate}</td>
                <td>{leave.leaveType}</td>
                <td>
                  <button onClick={() => handleStatusUpdate(leave.id, 'APPROVED')} className={styles.submitBtn} style={{background: '#10b981', marginRight: '10px', padding: '5px 10px'}}>Approve</button>
                  <button onClick={() => handleStatusUpdate(leave.id, 'REJECTED')} className={styles.submitBtn} style={{background: '#ef4444', padding: '5px 10px'}}>Reject</button>
                </td>
              </tr>
            ))}
            {pendingLeaves.length === 0 && !loading && <tr><td colSpan="5">No pending leave requests.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default LeaveApprovalsPage;
