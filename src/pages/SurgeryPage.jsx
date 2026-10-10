import React, { useState, useEffect } from 'react';
import { getSurgeryCatalog, createSurgeryCatalog, scheduleSurgery } from '../api/clinicalApi';
import api from '../api/api';
import { getPatients } from '../api/facilityApi';
import styles from './ModulePages.module.css';
import { useSearchParams } from 'react-router-dom';

const SurgeryPage = () => {
  const [searchParams] = useSearchParams();
  const op = searchParams.get('op') || 'viewAll';

  // Catalog State
  const [catalog, setCatalog] = useState([]);
  const [surgeryName, setSurgeryName] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedDurationMins, setEstimatedDurationMins] = useState('');

  // Scheduling State
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [surgeryDate, setSurgeryDate] = useState('');
  
  // Update State
  const [updateId, setUpdateId] = useState('');

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    loadCatalog();
    if (op === 'schedule') {
      loadPatients();
    }
  }, [op]);

  const loadCatalog = async () => {
    try {
      const res = await getSurgeryCatalog();
      setCatalog(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadPatients = async () => {
    try {
      const res = await getPatients();
      setPatients(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateCatalog = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg('');
    try {
      await createSurgeryCatalog({ surgeryName, description, estimatedDurationMins: parseInt(estimatedDurationMins) });
      setSurgeryName(''); setDescription(''); setEstimatedDurationMins('');
      setMsg('Catalog item added!');
      loadCatalog();
    } catch (e) {
      setMsg('Error adding to catalog.');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchForUpdate = (e) => {
    const selected = catalog.find(c => c.id.toString() === e.target.value);
    setUpdateId(e.target.value);
    if(selected) {
      setSurgeryName(selected.surgeryName);
      setDescription(selected.description);
      setEstimatedDurationMins(selected.estimatedDurationMins);
    } else {
      setSurgeryName(''); setDescription(''); setEstimatedDurationMins('');
    }
  };

  const handleUpdateCatalog = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg('');
    try {
      // Mocking update endpoint for catalog
      await api.put('/api/surgeries/catalog/', { surgeryName, description, estimatedDurationMins: parseInt(estimatedDurationMins) });
      setMsg('Catalog item UPDATED successfully!');
      loadCatalog();
    } catch (e) {
      setMsg('Error updating catalog.');
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg('');
    try {
      await scheduleSurgery({ patientUhid: selectedPatient, surgeryCatalogId: selectedCatalogId, scheduledDate: surgeryDate });
      setMsg('Surgery Successfully Scheduled!');
      setSelectedPatient(''); setSelectedCatalogId(''); setSurgeryDate('');
    } catch (e) {
      setMsg('Failed to schedule surgery.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <h2>Surgery Management</h2>
      {msg && <div style={{color: msg.includes('Error') || msg.includes('Failed') ? 'red' : 'green', margin: '1rem 0', fontWeight: 'bold'}}>{msg}</div>}

      {op === 'create' && (
        <div className={styles.formCard}>
          <h3>Add New Surgery to Catalog</h3>
          <form onSubmit={handleCreateCatalog} style={{display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px'}}>
            <div><label>Surgery Name:</label><input type="text" value={surgeryName} onChange={e => setSurgeryName(e.target.value)} required className={styles.formInput} /></div>
            <div><label>Description:</label><input type="text" value={description} onChange={e => setDescription(e.target.value)} required className={styles.formInput} /></div>
            <div><label>Duration (Mins):</label><input type="number" value={estimatedDurationMins} onChange={e => setEstimatedDurationMins(e.target.value)} required className={styles.formInput} /></div>
            <button type="submit" disabled={loading} className={styles.submitBtn}>Add Surgery to Catalog</button>
          </form>
        </div>
      )}

      {op === 'update' && (
        <div className={styles.formCard}>
          <h3>Update Existing Surgery</h3>
          <form onSubmit={handleUpdateCatalog} style={{display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px'}}>
            <div>
              <label>Select Surgery to Update:</label>
              <select value={updateId} onChange={handleFetchForUpdate} required className={styles.formInput}>
                <option value="">-- Select Surgery --</option>
                {catalog.map(c => <option key={c.id} value={c.id}>{c.surgeryName}</option>)}
              </select>
            </div>
            {updateId && (
              <>
                <div><label>Surgery Name:</label><input type="text" value={surgeryName} onChange={e => setSurgeryName(e.target.value)} required className={styles.formInput} /></div>
                <div><label>Description:</label><input type="text" value={description} onChange={e => setDescription(e.target.value)} required className={styles.formInput} /></div>
                <div><label>Duration (Mins):</label><input type="number" value={estimatedDurationMins} onChange={e => setEstimatedDurationMins(e.target.value)} required className={styles.formInput} /></div>
                <button type="submit" disabled={loading} className={styles.submitBtn} style={{background: '#f59e0b'}}>Update Surgery Details</button>
              </>
            )}
          </form>
        </div>
      )}

      {op === 'schedule' && (
        <div className={styles.formCard}>
          <h3>Schedule a Surgery</h3>
          <form onSubmit={handleSchedule} style={{display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px'}}>
            <div>
              <label>Select Patient:</label>
              <select value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)} required className={styles.formInput}>
                <option value="">-- Choose Patient --</option>
                {patients.map(p => <option key={p.uhid || p.patientId} value={p.uhid || p.patientId}>{p.patientName || p.firstName}</option>)}
              </select>
            </div>
            <div>
              <label>Select Procedure:</label>
              <select value={selectedCatalogId} onChange={e => setSelectedCatalogId(e.target.value)} required className={styles.formInput}>
                <option value="">-- Choose Surgery --</option>
                {catalog.map(s => <option key={s.id} value={s.id}>{s.surgeryName}</option>)}
              </select>
            </div>
            <div><label>Schedule Date & Time:</label><input type="datetime-local" value={surgeryDate} onChange={e => setSurgeryDate(e.target.value)} required className={styles.formInput} /></div>
            <button type="submit" disabled={loading} className={styles.submitBtn}>Book Surgery</button>
          </form>
        </div>
      )}

      {op === 'viewAll' && (
        <div className={styles.tableCard}>
          <h3>Master Surgery Catalog</h3>
          <table className={styles.dataTable}>
            <thead><tr><th>ID</th><th>Surgery Name</th><th>Description</th><th>Duration (Mins)</th></tr></thead>
            <tbody>
              {catalog.map(t => <tr key={t.id}><td>{t.id}</td><td>{t.surgeryName}</td><td>{t.description}</td><td>{t.estimatedDurationMins}</td></tr>)}
              {catalog.length === 0 && <tr><td colSpan="4">No surgeries found in catalog.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SurgeryPage;

