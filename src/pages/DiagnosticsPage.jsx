import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { getDiagnosticsCatalog, createDiagnosticsCatalog, createDiagnosticOrder } from '../api/clinicalApi';
import { getPatients } from '../api/facilityApi';
import styles from './ModulePages.module.css';
import { useSearchParams } from 'react-router-dom';
import { showToast } from '../components/ToastPopup';

const DiagnosticsPage = () => {
  const [searchParams] = useSearchParams();
  const op = searchParams.get('op') || 'viewAll';
  const role = (localStorage.getItem('role') || '').toUpperCase();

  // Catalog State
  const [catalog, setCatalog] = useState([]);
  const [orders, setOrders] = useState([]);
  const [testName, setTestName] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [department, setDepartment] = useState('PATHOLOGY');
  const [modality, setModality] = useState('BLOOD');
  const [requiresSample, setRequiresSample] = useState(true);
  const [requiresFasting, setRequiresFasting] = useState(false);
  const [preparationInstructions, setPreparationInstructions] = useState('');

  // Order State
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedTestId, setSelectedTestId] = useState('');
  const [bodyPart, setBodyPart] = useState('');
  const [contrastUsed, setContrastUsed] = useState(false);

  const [loading, setLoading] = useState(false);
  const [msg, setMsgState] = useState('');
  const setMsg = (m) => {
    setMsgState(m);
    if (m) showToast(m, (m.includes('Error') || m.includes('Failed') || m.includes('No ')) ? 'error' : 'success');
  };

  useEffect(() => {
    loadCatalog();
    loadOrders();
    if (op === 'order') {
      loadPatients();
    }
  }, [op]);

  const loadCatalog = async () => {
    try {
      const res = await getDiagnosticsCatalog();
      setCatalog(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadOrders = async () => {
    try {
      const res = await api.get('/api/diagnostics/orders');
      setOrders(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadPatients = async () => {
    try {
      const res = await getPatients();
      setPatients(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const selectedCatalogItem = catalog.find(c => String(c.id) === String(selectedTestId));

  const handleCreateCatalog = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg('');
    try {
      await createDiagnosticsCatalog({
        testName,
        price: parseFloat(basePrice),
        department,
        modality,
        requiresSample,
        requiresFasting,
        preparationInstructions
      });
      setTestName(''); setBasePrice(''); setPreparationInstructions('');
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
        testCatalog: { id: Number(selectedTestId) },
        bodyPart: selectedCatalogItem?.department === 'RADIOLOGY' ? bodyPart : null,
        contrastUsed: selectedCatalogItem?.department === 'RADIOLOGY' ? contrastUsed : false
      });
      setMsg('Diagnostic Test Ordered Successfully!');
      setSelectedPatient(''); setSelectedTestId(''); setBodyPart(''); setContrastUsed(false);
      loadOrders();
    } catch (e) {
      setMsg('Failed to order test.');
    } finally {
      setLoading(false);
    }
  };

  const handleCollectSample = async (orderId, defaultType) => {
    try {
      await api.put(`/api/diagnostics/order/${orderId}/collect-sample?sampleType=${encodeURIComponent(defaultType || 'BLOOD')}`);
      setMsg(`Sample collected for Order #${orderId}`);
      loadOrders();
    } catch (e) {
      setMsg('Error collecting sample.');
    }
  };

  const handleUploadReport = async (orderId, file) => {
    if (!file) return;
    setLoading(true); setMsg('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`/api/diagnostics/order/${orderId}/upload-report`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMsg(`Report uploaded for Order #${orderId}!`);
      loadOrders();
    } catch (e) {
      setMsg('Error uploading report file.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = async (orderId) => {
    try {
      const res = await api.get(`/api/diagnostics/order/${orderId}/report-file`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(res.data);
      window.open(url, '_blank');
    } catch (e) {
      setMsg('No uploaded report file found.');
    }
  };

  const handleCompleteOrder = async (order) => {
    const isRadiology = order.testCatalog?.department === 'RADIOLOGY';
    const resultNote = window.prompt(isRadiology ? 'Enter Radiology Findings:' : 'Enter Lab Result Notes:');
    if (!resultNote) return;
    const impression = isRadiology ? window.prompt('Enter Impression / Summary:', '') : '';
    const reportUrl = window.prompt('Enter Report / Scan URL (optional):', '');
    try {
      const params = new URLSearchParams({ resultNote });
      if (impression) params.append('impression', impression);
      if (reportUrl) params.append('reportUrl', reportUrl);
      await api.put(`/api/diagnostics/order/${order.id}/result?${params.toString()}`);
      setMsg(`Order #${order.id} completed.`);
      loadOrders();
    } catch (e) {
      setMsg('Error completing order.');
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Diagnostics Management</h2>
        <span style={{ padding: '0.3rem 0.7rem', borderRadius: 999, background: '#e0f2fe', color: '#0369a1', fontSize: '0.85rem', fontWeight: 600 }}>
          Scope: {role || 'ALL'}
        </span>
      </div>
      {msg && <div style={{ color: msg.includes('Error') || msg.includes('Failed') ? 'red' : 'green', margin: '1rem 0', fontWeight: 'bold' }}>{msg}</div>}

      {op === 'create' && (
        <div className={styles.formCard}>
          <h3>Add New Test to Catalog</h3>
          <form onSubmit={handleCreateCatalog} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '420px' }}>
            <div>
              <label>Test Name:</label>
              <input type="text" value={testName} onChange={e => setTestName(e.target.value)} required className={styles.formInput} />
            </div>
            <div>
              <label>Department:</label>
              <select value={department} onChange={e => {
                const d = e.target.value;
                setDepartment(d);
                setRequiresSample(d === 'PATHOLOGY');
                setModality(d === 'PATHOLOGY' ? 'BLOOD' : d === 'RADIOLOGY' ? 'MRI' : 'ECG');
              }} className={styles.formInput}>
                <option value="PATHOLOGY">PATHOLOGY (Blood / Urine)</option>
                <option value="RADIOLOGY">RADIOLOGY (MRI / CT / X-Ray)</option>
                <option value="CARDIOLOGY">CARDIOLOGY (ECG / Echo)</option>
              </select>
            </div>
            <div>
              <label>Modality:</label>
              <select value={modality} onChange={e => setModality(e.target.value)} className={styles.formInput}>
                <option value="BLOOD">BLOOD</option>
                <option value="URINE">URINE</option>
                <option value="MRI">MRI</option>
                <option value="CT">CT</option>
                <option value="XRAY">XRAY</option>
                <option value="USG">USG</option>
                <option value="ECG">ECG</option>
              </select>
            </div>
            <div>
              <label>Price (₹):</label>
              <input type="number" step="0.01" value={basePrice} onChange={e => setBasePrice(e.target.value)} required className={styles.formInput} />
            </div>
            <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input type="checkbox" checked={requiresSample} onChange={e => setRequiresSample(e.target.checked)} />
              Requires Blood/Lab Sample
            </label>
            <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input type="checkbox" checked={requiresFasting} onChange={e => setRequiresFasting(e.target.checked)} />
              Requires Fasting
            </label>
            <div>
              <label>Preparation Instructions:</label>
              <input type="text" value={preparationInstructions} onChange={e => setPreparationInstructions(e.target.value)} placeholder="e.g., Remove metal objects / 8hr fasting" className={styles.formInput} />
            </div>
            <button type="submit" disabled={loading} className={styles.submitBtn}>Add to Catalog</button>
          </form>
        </div>
      )}

      {op === 'order' && (
        <div className={styles.formCard}>
          <h3>Order a Diagnostic Test</h3>
          <form onSubmit={handleOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '420px' }}>
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

            <div>
              <label>Select Test from Catalog:</label>
              <select value={selectedTestId} onChange={e => setSelectedTestId(e.target.value)} required className={styles.formInput}>
                <option value="">-- Choose Test --</option>
                {catalog.map(c => (
                  <option key={c.id} value={c.id}>{c.testName} ({c.department} / {c.modality || '-'}) — ₹{c.price}</option>
                ))}
              </select>
            </div>

            {selectedCatalogItem?.department === 'RADIOLOGY' && (
              <>
                <div>
                  <label>Body Part (Radiology):</label>
                  <input type="text" value={bodyPart} onChange={e => setBodyPart(e.target.value)} placeholder="e.g., Brain, Spine, Right Knee" required className={styles.formInput} />
                </div>
                <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input type="checkbox" checked={contrastUsed} onChange={e => setContrastUsed(e.target.checked)} />
                  Contrast Required
                </label>
              </>
            )}

            <button type="submit" disabled={loading} className={styles.submitBtn}>Submit Order</button>
          </form>
        </div>
      )}

      {op === 'viewAll' && (
        <>
          <div className={styles.tableCard} style={{ marginBottom: '1.5rem' }}>
            <h3>Diagnostic Orders Queue (Filtered by Login)</h3>
            <table className={styles.dataTable}>
              <thead>
                <tr><th>ID</th><th>Patient UHID</th><th>Test</th><th>Category</th><th>Details</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td>{o.patientUhid}</td>
                    <td>{o.testCatalog?.testName}</td>
                    <td>{o.testCatalog?.department} / {o.testCatalog?.modality || '-'}</td>
                    <td>
                      {o.testCatalog?.department === 'RADIOLOGY'
                        ? `${o.bodyPart || '-'} ${o.contrastUsed ? '(Contrast)' : ''}`
                        : (o.testCatalog?.requiresSample ? (o.sampleCollected ? `Sample: ${o.sampleType}` : 'Sample Pending') : 'No Sample')}
                    </td>
                    <td>{o.status}</td>
                      <td style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {o.testCatalog?.requiresSample && o.status === 'PENDING' && (
                          <button onClick={() => handleCollectSample(o.id, o.testCatalog?.modality)}>Collect Sample</button>
                        )}
                        {o.status !== 'COMPLETED' && (
                          <button onClick={() => handleCompleteOrder(o)}>Enter Result</button>
                        )}
                        <label style={{ cursor: 'pointer', padding: '0.2rem 0.5rem', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: '0.8rem', background: '#f8fafc' }}>
                          Upload PDF/Scan
                          <input type="file" accept=".pdf,.png,.jpg,.jpeg,.dcm" style={{ display: 'none' }} onChange={(e) => handleUploadReport(o.id, e.target.files?.[0])} />
                        </label>
                        {o.reportUrl && (
                          <button onClick={() => handleViewReport(o.id)}>View Report</button>
                        )}
                      </td>
                  </tr>
                ))}
                {orders.length === 0 && <tr><td colSpan="7">No orders found for your department/modality.</td></tr>}
              </tbody>
            </table>
          </div>

          <div className={styles.tableCard}>
            <h3>Diagnostics Catalog (Filtered by Login)</h3>
            <table className={styles.dataTable}>
              <thead>
                <tr><th>ID</th><th>Test Name</th><th>Department</th><th>Modality</th><th>Sample?</th><th>Price</th></tr>
              </thead>
              <tbody>
                {catalog.map(t => (
                  <tr key={t.id}>
                    <td>{t.id}</td><td>{t.testName}</td><td>{t.department}</td><td>{t.modality || '-'}</td><td>{t.requiresSample ? 'Yes' : 'No'}</td><td>₹{t.price}</td>
                  </tr>
                ))}
                {catalog.length === 0 && <tr><td colSpan="6">No diagnostic tests found for your scope.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default DiagnosticsPage;
