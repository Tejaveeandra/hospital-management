import React, { useState, useEffect } from 'react';
import * as generatedApi from '../api/generatedApi';
import styles from './ModulePages.module.css';
import { useSearchParams } from 'react-router-dom';

const HRManagementPage = () => {
  const [searchParams] = useSearchParams();
  const op = searchParams.get('op') || 'staff';

  const [staff, setStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [credentials, setCredentials] = useState(null);
  
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generatedApi.filterDoctors({}).then(res => setStaff(res.data)).catch(() => {});
  }, []);

  const handleCheckCredentials = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg(''); setCredentials(null);
    try {
      const res = await generatedApi.getStaffCredentialStatus(selectedStaff);
      setCredentials(res.data);
      setMsg('Credentials fetched successfully.');
    } catch (e) {
      setMsg('Error fetching credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleHire = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg('');
    try {
      await generatedApi.hireCandidate(1, {}); // Mocking candidate ID 1
      setMsg('Candidate Hired successfully!');
    } catch(e) {
      setMsg('Error hiring candidate.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <h2>HR & Staff Management</h2>
      {msg && <div style={{color: msg.includes('Error') ? 'red' : 'green', margin: '1rem 0'}}>{msg}</div>}

      {op === 'credentials' && (
        <div className={styles.formCard}>
          <h3>Check Staff Credentials</h3>
          <form onSubmit={handleCheckCredentials} style={{display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px'}}>
            <div>
              <label>Select Staff Member:</label>
              <select value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)} required className={styles.formInput}>
                <option value="">-- Choose Staff --</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.doctorCode})</option>)}
              </select>
            </div>
            <button type="submit" disabled={loading} className={styles.submitBtn}>Check Status</button>
          </form>

          {credentials && (
            <div style={{marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px'}}>
              <strong>Status:</strong> {JSON.stringify(credentials)}
            </div>
          )}
        </div>
      )}

      {op === 'hire' && (
        <div className={styles.formCard}>
          <h3>Hire New Candidate</h3>
          <form onSubmit={handleHire} style={{display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px'}}>
            <div>
              <label>Candidate ID (From Recruitment):</label>
              <input type="number" required className={styles.formInput} defaultValue="1" />
            </div>
            <button type="submit" disabled={loading} className={styles.submitBtn}>Process Hire</button>
          </form>
        </div>
      )}
    </div>
  );
};
export default HRManagementPage;
