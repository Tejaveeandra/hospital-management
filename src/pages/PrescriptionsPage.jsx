import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/api';
import { Pill, FileText, CheckCircle2, AlertCircle, PlusCircle, Search, RefreshCw, Send, ArrowLeft } from 'lucide-react';
import styles from './PrescriptionsPage.module.css';

const PrescriptionsPage = ({ initialOperation }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [operationMode, setOperationMode] = useState(initialOperation || searchParams.get('op') || null); // 'list' | 'create' | 'dispense' | 'byPatient'
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Dispense Form State
  const [dispenseCode, setDispenseCode] = useState('');

  // Search by Patient State
  const [patientSearchUhid, setPatientSearchUhid] = useState('');
  const [patientPrescriptions, setPatientPrescriptions] = useState([]);

  // Create Form State
  const [createForm, setCreateForm] = useState({
    patientUhid: '',
    doctorCode: '',
    prescriptionDate: new Date().toISOString().split('T')[0],
    diagnosis: '',
    medicines: [
      { medicineName: '', dosage: '1 tablet', duration: '5 days', isMorning: true, isAfternoon: false, isEvening: true, quantity: 10 }
    ]
  });

  const showNotification = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const fetchAllPrescriptions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/prescriptions');
      if (res.status === 200 && Array.isArray(res.data)) {
        setPrescriptions(res.data);
      }
    } catch (e) {
      console.warn('Could not load all prescriptions:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOperation = (mode) => {
    setOperationMode(mode);
    if (mode) {
      setSearchParams({ op: mode });
    } else {
      setSearchParams({});
    }
  };

  useEffect(() => {
    setOperationMode(initialOperation || null);
  }, [initialOperation]);

  useEffect(() => {
    fetchAllPrescriptions();
  }, []);

  useEffect(() => {
    if (operationMode === 'list') {
      fetchAllPrescriptions();
    }
  }, [operationMode]);

  const handleDispense = async (e) => {
    e.preventDefault();
    if (!dispenseCode.trim()) {
      showNotification('Please enter a valid prescription code', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.put(`/api/prescriptions/${encodeURIComponent(dispenseCode.trim())}/dispense`);
      showNotification(`Prescription ${dispenseCode} successfully dispensed!`, 'success');
      setDispenseCode('');
      fetchAllPrescriptions();
    } catch (err) {
      const errDetail = err.response?.data?.message || err.message || 'Invalid prescription code or already dispensed';
      showNotification(`Failed to dispense: ${errDetail}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSearch = async (e) => {
    e.preventDefault();
    if (!patientSearchUhid.trim()) {
      showNotification('Please enter a patient UHID or ID', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/api/prescriptions/patient/${encodeURIComponent(patientSearchUhid.trim())}`);
      if (res.status === 200 && Array.isArray(res.data)) {
        setPatientPrescriptions(res.data);
        showNotification(`Found ${res.data.length} prescription(s) for patient ${patientSearchUhid}`, 'success');
      } else {
        setPatientPrescriptions([]);
        showNotification('No prescriptions found for this patient', 'info');
      }
    } catch (err) {
      // Fallback endpoint check
      try {
        const fallback = await api.get(`/api/prescriptions/getPrescriptionByPatientId/${encodeURIComponent(patientSearchUhid.trim())}`);
        setPatientPrescriptions(Array.isArray(fallback.data) ? fallback.data : []);
      } catch {
        setPatientPrescriptions([]);
        showNotification('No prescriptions found matching patient identifier', 'info');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicineRow = () => {
    setCreateForm(prev => ({
      ...prev,
      medicines: [
        ...prev.medicines,
        { medicineName: '', dosage: '1 tablet', duration: '5 days', isMorning: true, isAfternoon: false, isEvening: true, quantity: 10 }
      ]
    }));
  };

  const handleRemoveMedicineRow = (index) => {
    setCreateForm(prev => ({
      ...prev,
      medicines: prev.medicines.filter((_, idx) => idx !== index)
    }));
  };

  const handleMedicineChange = (index, field, value) => {
    setCreateForm(prev => {
      const updated = [...prev.medicines];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, medicines: updated };
    });
  };

  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    if (!createForm.patientUhid.trim()) {
      showNotification('Please enter a valid Patient UHID', 'error');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        patientUhid: createForm.patientUhid.trim(),
        doctorCode: createForm.doctorCode.trim() || 'DOC-GEN',
        prescriptionDate: createForm.prescriptionDate,
        medicines: createForm.medicines.map(m => ({
          medicineName: m.medicineName,
          dosage: m.dosage,
          duration: m.duration,
          isMorning: Boolean(m.isMorning),
          isAfternoon: Boolean(m.isAfternoon),
          isEvening: Boolean(m.isEvening),
          quantity: Number(m.quantity) || 10
        }))
      };

      const res = await api.post('/api/prescriptions', payload);
      showNotification(`Prescription created successfully! Code: ${res.data?.prescriptionCode || 'Generated'}`, 'success');
      setCreateForm({
        patientUhid: '',
        doctorCode: '',
        prescriptionDate: new Date().toISOString().split('T')[0],
        diagnosis: '',
        medicines: [
          { medicineName: '', dosage: '1 tablet', duration: '5 days', isMorning: true, isAfternoon: false, isEvening: true, quantity: 10 }
        ]
      });
      handleSelectOperation('list');
      fetchAllPrescriptions();
    } catch (err) {
      const errDetail = err.response?.data?.message || err.message || 'Error creating prescription';
      showNotification(`Failed to create prescription: ${errDetail}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>

      {message && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '10px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: message.type === 'success' ? '#f0fdf4' : message.type === 'error' ? '#fef2f2' : '#f0f9ff',
          color: message.type === 'success' ? '#166534' : message.type === 'error' ? '#991b1b' : '#0369a1',
          border: `1px solid ${message.type === 'success' ? '#bbf7d0' : message.type === 'error' ? '#fecaca' : '#bae6fd'}`
        }}>
          {message.type === 'success' && <CheckCircle2 size={18} />}
          {message.type === 'error' && <AlertCircle size={18} />}
          {message.type === 'info' && <RefreshCw size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* HUB VIEW: Operation Cards ONLY when no operation is selected */}
      {!operationMode && (
        <div className={styles.hubWrapper}>
          <div className={styles.hubHeader}>
            <h2 className={styles.hubTitle}>Prescriptions Management</h2>
            <p className={styles.hubSubtitle}>
              Select an operation below to open its dedicated page
            </p>
          </div>

          <div className={styles.operationCardsGrid}>
            <div 
              className={styles.opCard}
              onClick={() => handleSelectOperation('list')}
            >
              <div className={styles.opCardIcon}>
                <FileText size={22} />
              </div>
              <div className={styles.opCardInfo}>
                <h4>Prescription Registry</h4>
                <p>Browse and review all patient medication records</p>
              </div>
              <span className={styles.opCardBadge}>{prescriptions.length} Records</span>
            </div>

            <div 
              className={styles.opCard}
              onClick={() => handleSelectOperation('create')}
            >
              <div className={styles.opCardIcon}>
                <PlusCircle size={22} />
              </div>
              <div className={styles.opCardInfo}>
                <h4>Issue Prescription</h4>
                <p>Prescribe medications, dosage, and frequencies</p>
              </div>
              <span className={`${styles.opCardBadge} ${styles.badgeGreen}`}>+ New Rx</span>
            </div>

            <div 
              className={styles.opCard}
              onClick={() => handleSelectOperation('dispense')}
            >
              <div className={styles.opCardIcon}>
                <Pill size={22} />
              </div>
              <div className={styles.opCardInfo}>
                <h4>Pharmacy Dispense</h4>
                <p>Fulfill and dispense prescribed medicines</p>
              </div>
              <span className={`${styles.opCardBadge} ${styles.badgeOrange}`}>Dispense</span>
            </div>

            <div 
              className={styles.opCard}
              onClick={() => handleSelectOperation('byPatient')}
            >
              <div className={styles.opCardIcon}>
                <Search size={22} />
              </div>
              <div className={styles.opCardInfo}>
                <h4>Patient Rx Lookup</h4>
                <p>Search medication history by Patient UHID</p>
              </div>
              <span className={`${styles.opCardBadge} ${styles.badgeBlue}`}>Lookup</span>
            </div>
          </div>
        </div>
      )}

      {operationMode && (
        <div className={styles.backBar}>
          <button
            type="button"
            onClick={() => handleSelectOperation(null)}
            className={styles.backButton}
          >
            <ArrowLeft size={16} className={styles.backIcon} />
            <span>Back to Prescriptions Hub</span>
          </button>
        </div>
      )}

      {/* TAB 1: LIST PRESCRIPTIONS */}
      {operationMode === 'list' && (
        <div className={styles.section}>
          <h3>Active Hospital Prescriptions</h3>
          {loading ? (
            <p className={styles.loading}>Loading prescription records...</p>
          ) : prescriptions.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Rx Code</th>
                  <th>Date</th>
                  <th>Patient UHID</th>
                  <th>Doctor</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map((p, idx) => (
                  <tr key={p.prescriptionId || p.prescriptionCode || idx}>
                    <td><strong>{p.prescriptionCode || `#${p.prescriptionId}`}</strong></td>
                    <td>{p.prescriptionDate || p.createdAt || 'N/A'}</td>
                    <td>{p.patientUhid || `Patient #${p.patientId}`}</td>
                    <td>{p.doctorName || p.doctorCode || 'Attending Doctor'}</td>
                    <td>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: p.dispensed ? '#ecfdf5' : '#fef3c7',
                        color: p.dispensed ? '#059669' : '#d97706'
                      }}>
                        {p.dispensed ? 'DISPENSED' : 'PENDING'}
                      </span>
                    </td>
                    <td>
                      {!p.dispensed && (
                        <button 
                          type="button" 
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          onClick={() => {
                            setDispenseCode(p.prescriptionCode);
                            handleSelectOperation('dispense');
                          }}
                        >
                          Dispense
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: '#64748b' }}>No prescription logs recorded yet. Click "Issue Prescription" to create one.</p>
          )}
        </div>
      )}

      {/* TAB 2: CREATE PRESCRIPTION */}
      {operationMode === 'create' && (
        <div className={styles.section}>
          <h3>Issue New Medical Prescription</h3>
          <form onSubmit={handleCreatePrescription}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label>Patient UHID *</label>
                <input 
                  type="text" 
                  placeholder="e.g. UHID-2026-00001" 
                  value={createForm.patientUhid} 
                  onChange={e => setCreateForm({ ...createForm, patientUhid: e.target.value })} 
                  required 
                  style={{ width: '100%', maxWidth: '100%' }}
                />
              </div>

              <div>
                <label>Doctor Code *</label>
                <input 
                  type="text" 
                  placeholder="e.g. DOC-101" 
                  value={createForm.doctorCode} 
                  onChange={e => setCreateForm({ ...createForm, doctorCode: e.target.value })} 
                  style={{ width: '100%', maxWidth: '100%' }}
                />
              </div>

              <div>
                <label>Prescription Date *</label>
                <input 
                  type="date" 
                  value={createForm.prescriptionDate} 
                  onChange={e => setCreateForm({ ...createForm, prescriptionDate: e.target.value })} 
                  required 
                  style={{ width: '100%', maxWidth: '100%' }}
                />
              </div>
            </div>

            <h4>Medication Items</h4>
            {createForm.medicines.map((med, idx) => (
              <div key={idx} className={styles.medicineRow}>
                <div style={{ flex: 2, minWidth: '180px' }}>
                  <label>Medicine Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Paracetamol 500mg" 
                    value={med.medicineName} 
                    onChange={e => handleMedicineChange(idx, 'medicineName', e.target.value)} 
                    required 
                    style={{ width: '100%', margin: 0 }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: '120px' }}>
                  <label>Dosage</label>
                  <input 
                    type="text" 
                    placeholder="1 tablet" 
                    value={med.dosage} 
                    onChange={e => handleMedicineChange(idx, 'dosage', e.target.value)} 
                    required 
                    style={{ width: '100%', margin: 0 }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: '100px' }}>
                  <label>Duration</label>
                  <input 
                    type="text" 
                    placeholder="5 days" 
                    value={med.duration} 
                    onChange={e => handleMedicineChange(idx, 'duration', e.target.value)} 
                    required 
                    style={{ width: '100%', margin: 0 }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '20px' }}>
                  <label><input type="checkbox" checked={med.isMorning} onChange={e => handleMedicineChange(idx, 'isMorning', e.target.checked)} /> M</label>
                  <label><input type="checkbox" checked={med.isAfternoon} onChange={e => handleMedicineChange(idx, 'isAfternoon', e.target.checked)} /> A</label>
                  <label><input type="checkbox" checked={med.isEvening} onChange={e => handleMedicineChange(idx, 'isEvening', e.target.checked)} /> E</label>
                </div>

                {createForm.medicines.length > 1 && (
                  <div style={{ paddingTop: '18px' }}>
                    <button type="button" className={styles.danger} onClick={() => handleRemoveMedicineRow(idx)}>
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))}

            <button type="button" onClick={handleAddMedicineRow} style={{ backgroundColor: '#64748b', marginRight: '12px' }}>
              + Add Another Medicine
            </button>

            <button type="submit" disabled={loading}>
              <Send size={15} style={{ display: 'inline', marginRight: '6px' }} />
              {loading ? 'Submitting...' : 'Issue Prescription'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: DISPENSE MEDICINES */}
      {operationMode === 'dispense' && (
        <div className={styles.section}>
          <h3>Pharmacy Medicine Dispensing</h3>
          <p style={{ color: '#64748b', marginBottom: '16px' }}>Enter the unique prescription code to verify and dispense medication.</p>
          <form onSubmit={handleDispense} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, maxWidth: '400px' }}>
              <label>Prescription Code *</label>
              <input 
                type="text" 
                placeholder="e.g. RX-2026-0001" 
                value={dispenseCode} 
                onChange={e => setDispenseCode(e.target.value)} 
                required 
                style={{ width: '100%', margin: 0 }}
              />
            </div>
            <button type="submit" disabled={loading} style={{ margin: 0 }}>
              <Pill size={16} style={{ display: 'inline', marginRight: '6px' }} />
              {loading ? 'Dispensing...' : 'Dispense Prescription'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: PATIENT SEARCH */}
      {operationMode === 'byPatient' && (
        <div className={styles.section}>
          <h3>Lookup Prescriptions by Patient</h3>
          <form onSubmit={handlePatientSearch} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '20px' }}>
            <div style={{ flex: 1, maxWidth: '400px' }}>
              <label>Patient UHID or ID *</label>
              <input 
                type="text" 
                placeholder="e.g. UHID-2026-00001" 
                value={patientSearchUhid} 
                onChange={e => setPatientSearchUhid(e.target.value)} 
                required 
                style={{ width: '100%', margin: 0 }}
              />
            </div>
            <button type="submit" disabled={loading} style={{ margin: 0 }}>
              <Search size={16} style={{ display: 'inline', marginRight: '6px' }} />
              {loading ? 'Searching...' : 'Find Prescriptions'}
            </button>
          </form>

          {patientPrescriptions.length > 0 && (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Rx Code</th>
                  <th>Date</th>
                  <th>Doctor</th>
                  <th>Medicines Count</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {patientPrescriptions.map((p, idx) => (
                  <tr key={p.prescriptionId || p.prescriptionCode || idx}>
                    <td><strong>{p.prescriptionCode || `#${p.prescriptionId}`}</strong></td>
                    <td>{p.prescriptionDate || p.createdAt || 'N/A'}</td>
                    <td>{p.doctorName || p.doctorCode || 'Doctor'}</td>
                    <td>{p.medicines ? p.medicines.length : 0} items</td>
                    <td>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: p.dispensed ? '#ecfdf5' : '#fef3c7',
                        color: p.dispensed ? '#059669' : '#d97706'
                      }}>
                        {p.dispensed ? 'DISPENSED' : 'PENDING'}
                      </span>
                    </td>
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

export default PrescriptionsPage;
