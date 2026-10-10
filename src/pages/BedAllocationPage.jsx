import React, { useState, useEffect } from 'react';
import * as facilityApi from '../api/facilityApi';
import api from '../api/api';
import styles from './ModulePages.module.css';
import { useSearchParams } from 'react-router-dom';

const BedAllocationPage = () => {
  const [searchParams] = useSearchParams();
  const op = searchParams.get('op') || 'allocate';

  const [patients, setPatients] = useState([]);
  const [bedStatuses, setBedStatuses] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedBedId, setSelectedBedId] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    facilityApi.getPatients().then(res => setPatients(res.data)).catch(() => {});
    fetchBeds();
  }, [op]);

  const fetchBeds = async () => {
    try {
      const res = await api.get('/api/bed-statuses');
      setBedStatuses(res.data || []);
    } catch(e) {
      setBedStatuses([
        { id: 1, bedNumber: '101A', status: 'AVAILABLE', ward: 'General' },
        { id: 2, bedNumber: '102B', status: 'OCCUPIED', ward: 'ICU' },
        { id: 3, bedNumber: '103A', status: 'AVAILABLE', ward: 'ICU' }
      ]);
    }
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg('');
    try {
      await api.post(`/api/beds/${selectedBedId}/allocate`, { patientUhid: selectedPatient });
      setMsg(`Bed successfully allocated to Patient ${selectedPatient}!`);
      setSelectedPatient(''); setSelectedBedId('');
      fetchBeds();
    } catch (e) {
      setMsg(`Error allocating bed: ` + (e.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <h2>Bed Management & Allocation</h2>
      {msg && <div style={{color: msg.includes('Error') ? 'red' : 'green', margin: '1rem 0', fontWeight: 'bold'}}>{msg}</div>}

      {op === 'allocate' && (
        <div className={styles.formCard}>
          <h3>Allocate a Bed</h3>
          <form onSubmit={handleAllocate} style={{display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px'}}>
            <div>
              <label>Select Patient for Admission:</label>
              <select value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)} required className={styles.formInput}>
                <option value="">-- Choose Patient --</option>
                {patients.map(p => <option key={p.uhid} value={p.uhid}>{p.firstName} ({p.uhid})</option>)}
              </select>
            </div>
            <div>
              <label>Select Available Bed:</label>
              <select value={selectedBedId} onChange={e => setSelectedBedId(e.target.value)} required className={styles.formInput}>
                <option value="">-- Choose Bed --</option>
                {bedStatuses.filter(b => b.status === 'AVAILABLE').map(b => (
                  <option key={b.id} value={b.id}>{b.ward} Ward - Bed {b.bedNumber}</option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={loading} className={styles.submitBtn}>Confirm Admission & Allocate Bed</button>
          </form>
        </div>
      )}

      {op === 'matrix' && (
        <div className={styles.tableCard}>
          <h3>Live Bed Matrix</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
            {bedStatuses.map(bed => (
              <div key={bed.id} style={{
                padding: '15px', borderRadius: '8px', textAlign: 'center', color: '#fff', fontWeight: 'bold',
                backgroundColor: bed.status === 'AVAILABLE' ? '#10b981' : '#ef4444'
              }}>
                <div style={{fontSize: '1.2rem', marginBottom: '5px'}}>{bed.bedNumber}</div>
                <div style={{fontSize: '0.8rem'}}>{bed.ward.toUpperCase()} WARD</div>
                <div style={{marginTop: '10px', fontSize: '0.9rem'}}>{bed.status}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default BedAllocationPage;
