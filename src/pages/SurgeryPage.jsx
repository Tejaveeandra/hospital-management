import React, { useState, useEffect } from 'react';
import { getSurgeryCatalog, createSurgeryCatalog, scheduleSurgery } from '../api/clinicalApi';
import api from '../api/api';
import { getPatients } from '../api/facilityApi';
import styles from './ModulePages.module.css';
import { useSearchParams } from 'react-router-dom';
import { showToast } from '../components/ToastPopup';

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

  // Implants Registry State
  const [implantUhid, setImplantUhid] = useState('');
  const [implantHistory, setImplantHistory] = useState([]);
  const [implantForm, setImplantForm] = useState({
    surgeryScheduleId: '',
    implantName: '',
    implantType: 'PACEMAKER',
    itemCode: '',
    manufacturer: '',
    modelNumber: '',
    serialNumber: '',
    batchNumber: '',
    warrantyExpiryDate: '',
    quantity: '1',
    unitPrice: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsgState] = useState('');
  const setMsg = (m) => {
    setMsgState(m);
    if (m) showToast(m, (m.includes('Error') || m.includes('Failed')) ? 'error' : 'success');
  };

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

  const handleLoadImplantHistory = async (e) => {
    e.preventDefault();
    if (!implantUhid.trim()) return;
    setLoading(true); setMsg('');
    try {
      const res = await api.get(`/api/surgeries/patient/${encodeURIComponent(implantUhid.trim())}/implants`);
      setImplantHistory(res.data || []);
    } catch (e) {
      setMsg('Failed to load patient implant history.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddImplant = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg('');
    try {
      const res = await api.post(`/api/surgeries/schedule/${implantForm.surgeryScheduleId}/implants`, {
        implantName: implantForm.implantName,
        implantType: implantForm.implantType,
        itemCode: implantForm.itemCode || undefined,
        manufacturer: implantForm.manufacturer,
        modelNumber: implantForm.modelNumber,
        serialNumber: implantForm.serialNumber,
        batchNumber: implantForm.batchNumber,
        warrantyExpiryDate: implantForm.warrantyExpiryDate || null,
        quantity: parseInt(implantForm.quantity || '1', 10),
        unitPrice: parseFloat(implantForm.unitPrice || '0'),
        notes: implantForm.notes
      });
      setMsg(`Implant "${res.data.implantName}" (Serial: ${res.data.serialNumber}) recorded permanently & billed!`);
      if (res.data.patientUhid) {
        setImplantUhid(res.data.patientUhid);
        const hist = await api.get(`/api/surgeries/patient/${encodeURIComponent(res.data.patientUhid)}/implants`);
        setImplantHistory(hist.data || []);
      }
      setImplantForm({
        surgeryScheduleId: '', implantName: '', implantType: 'PACEMAKER', itemCode: '',
        manufacturer: '', modelNumber: '', serialNumber: '', batchNumber: '',
        warrantyExpiryDate: '', quantity: '1', unitPrice: '', notes: ''
      });
    } catch (e) {
      setMsg('Failed to record implant: ' + (e.response?.data?.message || e.message));
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

      {(op === 'viewAll' || op === 'implants') && (
        <>
          <div className={styles.formCard} style={{ marginTop: '1.5rem' }}>
            <h3>Record Surgical Implant / Device (Pacemaker, Stent, Ortho)</h3>
            <form onSubmit={handleAddImplant} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'end' }}>
              <div className={styles.fieldGroup}>
                <label>Surgery Schedule ID *</label>
                <input type="number" placeholder="e.g. 101" value={implantForm.surgeryScheduleId} onChange={e => setImplantForm({ ...implantForm, surgeryScheduleId: e.target.value })} required className={styles.formInput} />
              </div>
              <div className={styles.fieldGroup}>
                <label>Implant Type</label>
                <select value={implantForm.implantType} onChange={e => setImplantForm({ ...implantForm, implantType: e.target.value })} className={styles.formInput}>
                  <option value="PACEMAKER">PACEMAKER</option>
                  <option value="STENT">STENT</option>
                  <option value="ORTHO_IMPLANT">ORTHO_IMPLANT</option>
                  <option value="LENS">LENS</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
              <div className={styles.fieldGroup}>
                <label>Implant Name *</label>
                <input type="text" placeholder="e.g. Dual-Chamber Pacemaker" value={implantForm.implantName} onChange={e => setImplantForm({ ...implantForm, implantName: e.target.value })} required className={styles.formInput} />
              </div>
              <div className={styles.fieldGroup}>
                <label>Serial Number *</label>
                <input type="text" placeholder="Device Serial No" value={implantForm.serialNumber} onChange={e => setImplantForm({ ...implantForm, serialNumber: e.target.value })} required className={styles.formInput} />
              </div>
              <div className={styles.fieldGroup}>
                <label>Batch / Lot Number</label>
                <input type="text" placeholder="Batch / Lot" value={implantForm.batchNumber} onChange={e => setImplantForm({ ...implantForm, batchNumber: e.target.value })} className={styles.formInput} />
              </div>
              <div className={styles.fieldGroup}>
                <label>Manufacturer</label>
                <input type="text" placeholder="e.g. Medtronic" value={implantForm.manufacturer} onChange={e => setImplantForm({ ...implantForm, manufacturer: e.target.value })} className={styles.formInput} />
              </div>
              <div className={styles.fieldGroup}>
                <label>Model Number</label>
                <input type="text" placeholder="Model No" value={implantForm.modelNumber} onChange={e => setImplantForm({ ...implantForm, modelNumber: e.target.value })} className={styles.formInput} />
              </div>
              <div className={styles.fieldGroup}>
                <label>Tax Item Code (Optional)</label>
                <input type="text" placeholder="HSN / Tax Code" value={implantForm.itemCode} onChange={e => setImplantForm({ ...implantForm, itemCode: e.target.value })} className={styles.formInput} />
              </div>
              <div className={styles.fieldGroup}>
                <label>Quantity</label>
                <input type="number" min="1" placeholder="1" value={implantForm.quantity} onChange={e => setImplantForm({ ...implantForm, quantity: e.target.value })} className={styles.formInput} />
              </div>
              <div className={styles.fieldGroup}>
                <label>Unit Price (₹) *</label>
                <input type="number" step="0.01" placeholder="0.00" value={implantForm.unitPrice} onChange={e => setImplantForm({ ...implantForm, unitPrice: e.target.value })} required className={styles.formInput} />
              </div>
              <div className={styles.fieldGroup}>
                <label>Warranty Expiry Date</label>
                <input type="date" value={implantForm.warrantyExpiryDate} onChange={e => setImplantForm({ ...implantForm, warrantyExpiryDate: e.target.value })} className={styles.formInput} />
              </div>
              <div className={styles.fieldGroup}>
                <label>Clinical Notes</label>
                <input type="text" placeholder="Optional clinical notes" value={implantForm.notes} onChange={e => setImplantForm({ ...implantForm, notes: e.target.value })} className={styles.formInput} />
              </div>
              <div style={{ gridColumn: '1 / -1', marginTop: '0.25rem' }}>
                <button type="submit" disabled={loading} className={styles.submitBtn}>Save Implant & Bill</button>
              </div>
            </form>
          </div>

          <div className={styles.tableCard} style={{ marginTop: '1.5rem' }}>
            <h3>Patient Lifetime Implant History (Lookup by UHID)</h3>
            <form onSubmit={handleLoadImplantHistory} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center' }}>
              <input type="text" placeholder="Enter Patient UHID (e.g. UHID-2026-00123)" value={implantUhid} onChange={e => setImplantUhid(e.target.value)} required className={styles.formInput} style={{ flex: '1 1 320px', maxWidth: '420px' }} />
              <button type="submit" disabled={loading} className={styles.submitBtn}>Search Implants</button>
            </form>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Implant Name</th>
                  <th>Serial No</th>
                  <th>Manufacturer / Model</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {implantHistory.map(imp => (
                  <tr key={imp.id}>
                    <td>{imp.implantedAt ? new Date(imp.implantedAt).toLocaleDateString() : '-'}</td>
                    <td>{imp.implantType}</td>
                    <td>{imp.implantName}</td>
                    <td><strong>{imp.serialNumber}</strong></td>
                    <td>{[imp.manufacturer, imp.modelNumber].filter(Boolean).join(' / ') || '-'}</td>
                    <td>₹{imp.totalPrice}</td>
                  </tr>
                ))}
                {implantHistory.length === 0 && <tr><td colSpan="6">No implant records loaded. Search by Patient UHID above.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default SurgeryPage;

