import React, { useState, useEffect } from 'react';
import { getShifts, submitHeartbeat } from '../api/generatedApi';
import { getDoctorsByBranch } from '../api/generatedApi'; // Using doctor API for staff selection for simplicity
import styles from './ModulePages.module.css';

const AttendanceDashboard = () => {
  const [staff, setStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [shiftId, setShiftId] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    // Mocking branch 1 for staff list
    getDoctorsByBranch(1).then(res => setStaff(res.data)).catch(() => {});
  }, []);

  const handleClockIn = async (e) => {
    e.preventDefault();
    try {
      await submitHeartbeat({ userId: selectedStaff, status: 'ONLINE', coordinates: '0,0' });
      setMsg('Clocked In Successfully!');
    } catch(e) {
      setMsg('Error clocking in.');
    }
  };

  return (
    <div className={styles.pageContainer}>
      <h2>HR Attendance & Shifts</h2>
      {msg && <div style={{color: 'green', marginBottom: '1rem'}}>{msg}</div>}
      
      <div className={styles.formCard}>
        <h3>Staff Clock In (Heartbeat)</h3>
        <form onSubmit={handleClockIn} style={{display: 'flex', gap: '1rem', alignItems: 'flex-end'}}>
          <div>
            <label>Select Staff Member:</label>
            <select value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)} className={styles.formInput} required>
              <option value="">-- Choose Staff --</option>
              {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
            </select>
          </div>
          <button type="submit" className={styles.submitBtn}>Record Clock-In</button>
        </form>
      </div>
    </div>
  );
};
export default AttendanceDashboard;
