import React, { useState, useEffect } from 'react';
import { getDiagnosticsCatalog, createDiagnosticsCatalog, createDiagnosticOrder } from '../api/clinicalApi';
import { getPatients } from '../api/facilityApi';
import styles from './ModulePages.module.css';
import { useSearchParams } from 'react-router-dom';

const DiagnosticsPage = () => {
  const [searchParams] = useSearchParams();
  const op = searchParams.get('op') || 'viewAll';

  // Catalog State
  const [catalog, setCatalog] = useState([]);
  const [testName, setTestName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');

  // Order State
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedTestId, setSelectedTestId] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    loadCatalog();
    if (op === 'order') {
      loadPatients();
    }
  }, [op]);

  const loadCatalog = async () => {
    try {
      const res = await getDiagnosticsCatalog();
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
      await createDiagnosticsCatalog({ testName, description, basePrice: parseFloat(basePrice) });
      setTestName(''); setDescription(''); setBasePrice('');
      setMsg('Test added to Catalog!');
      loadCatalog();
    } catch (e) {
      setMsg('Error adding test.');
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg('');
    try {
      await createDiagnosticOrder({
        patientUhid: selectedPatient,
        catalogId: selectedTestId,
        notes: orderNotes
      });
      setMsg('Diagnostic Test Ordered Successfully!');
      setSelectedPatient(''); setSelectedTestId(''); setOrderNotes('');
    } catch (e) {
      setMsg('Failed to order test.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <h2>Diagnostics Management</h2>
      {msg && <div style={{color: msg.includes('Error') || msg.includes('Failed') ? 'red' : 'green', margin: '1rem 0', fontWeight: 'bold'}}>{msg}</div>}

      {op === 'create' && (
        <div className={styles.formCard}>
          <h3>Add New Test to Catalog</h3>
          <form onSubmit={handleCreateCatalog} style={{display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px'}}>
            <div>
              <label>Test Name:</label>
              <input type="text" value={testName} onChange={e => setTestName(e.target.value)} required className={styles.formInput} />
            </div>
            <div>
              <label>Description:</label>
              <input type="text" value={description} onChange={e => setDescription(e.target.value)} required className={styles.formInput} />
            </div>
            <div>
              <label>Base Price ($):</label>
              <input type="number" step="0.01" value={basePrice} onChange={e => setBasePrice(e.target.value)} required className={styles.formInput} />
            </div>
            <button type="submit" disabled={loading} className={styles.submitBtn}>Add to Catalog</button>
          </form>
        </div>
      )}

      {op === 'order' && (
        <div className={styles.formCard}>
          <h3>Order a Diagnostic Test</h3>
          <form onSubmit={handleOrder} style={{display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px'}}>
            
            {/* PATIENT DROPDOWN */}
            <div>
              <label>Select Patient:</label>
              <select value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)} required className={styles.formInput}>
                <option value="">-- Choose Patient --</option>
                {patients.map(p => (
                  <option key={p.uhid || p.patientId} value={p.uhid || p.patientId}>
                    {p.patientName || p.firstName} (ID: {p.uhid || p.patientId})
                  </option>
                ))}
              </select>
            </div>

            {/* TEST DROPDOWN */}
            <div>
              <label>Select Test from Catalog:</label>
              <select value={selectedTestId} onChange={e => setSelectedTestId(e.target.value)} required className={styles.formInput}>
                <option value="">-- Choose Test --</option>
                {catalog.map(c => (
                  <option key={c.id} value={c.id}>{c.testName} ()</option>
                ))}
              </select>
            </div>

            <div>
              <label>Clinical Notes / Reason:</label>
              <textarea value={orderNotes} onChange={e => setOrderNotes(e.target.value)} className={styles.formInput} rows="2"></textarea>
            </div>

            <button type="submit" disabled={loading} className={styles.submitBtn}>Submit Order</button>
          </form>
        </div>
      )}

      {op === 'viewAll' && (
        <div className={styles.tableCard}>
          <h3>Master Diagnostics Catalog</h3>
          <table className={styles.dataTable}>
            <thead>
              <tr><th>ID</th><th>Test Name</th><th>Description</th><th>Price</th></tr>
            </thead>
            <tbody>
              {catalog.map(t => (
                <tr key={t.id}>
                  <td>{t.id}</td><td>{t.testName}</td><td>{t.description}</td><td></td>
                </tr>
              ))}
              {catalog.length === 0 && <tr><td colSpan="4">No diagnostic tests found in catalog.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DiagnosticsPage;
