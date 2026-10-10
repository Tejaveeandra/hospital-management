import React, { useState, useEffect } from 'react';
import { 
  Bed, 
  UserPlus, 
  ArrowRightLeft, 
  Sparkles, 
  History, 
  Building2, 
  Filter, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Wrench,
  Search,
  RefreshCw,
  LogOut,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import styles from './BedManagementPage.module.css';
import { 
  getLiveBedMatrix, 
  allocateBed, 
  transferBed, 
  releaseBed, 
  updateBedStatus, 
  getBedHistory, 
  getBranches, 
  getPatients 
} from '../api/facilityApi';

const BedManagementPage = ({ initialOperation, isEmbedded = false }) => {
  // Navigation / Operation State
  const [activeTab, setActiveTab] = useState(initialOperation || 'matrix');

  // Core Data
  const [matrixData, setMatrixData] = useState(null);
  const [branches, setBranches] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedWardFilter, setSelectedWardFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Modal States
  const [admitModal, setAdmitModal] = useState({ open: false, bed: null });
  const [transferModal, setTransferModal] = useState({ open: false, fromBed: null });
  const [dischargeModal, setDischargeModal] = useState({ open: false, bed: null });
  const [historyModal, setHistoryModal] = useState({ open: false, bed: null, logs: [] });

  // Form States
  const [admitForm, setAdmitForm] = useState({ patientId: '', patientName: '', admittedBy: '', notes: '' });
  const [transferForm, setTransferForm] = useState({ toBedId: '', reason: '', performedBy: '' });
  const [dischargeForm, setDischargeForm] = useState({ releasedBy: '', notes: '' });

  useEffect(() => {
    if (initialOperation) {
      const opMap = {
        'matrix': 'matrix',
        'Live Bed Matrix': 'matrix',
        'admit': 'admit',
        'allocate': 'admit',
        'Admit Patient to Bed': 'admit',
        'Admit / Allocate Patient': 'admit',
        'transfer': 'transfer',
        'Bed Transfers': 'transfer',
        'Patient Bed Transfers': 'transfer',
        'housekeeping': 'housekeeping',
        'Housekeeping & Sanitization': 'housekeeping',
        'history': 'history',
        'logs': 'history',
        'Bed Stay Audit History': 'history',
        'Bed Stay Audit Logs': 'history'
      };
      setActiveTab(opMap[initialOperation] || 'matrix');
    }
  }, [initialOperation]);

  useEffect(() => {
    loadBranches();
    loadPatients();
  }, []);

  useEffect(() => {
    if (selectedBranchId) {
      loadMatrix(selectedBranchId);
    }
  }, [selectedBranchId]);

  const loadBranches = async () => {
    try {
      const res = await getBranches();
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setBranches(list);
      if (list.length > 0 && !selectedBranchId) {
        setSelectedBranchId(list[0].branchId || list[0].id);
      }
    } catch (err) {
      console.error('Failed to load branches', err);
    }
  };

  const loadPatients = async () => {
    try {
      const res = await getPatients();
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setPatients(list);
    } catch (err) {
      console.error('Failed to load registered patients', err);
    }
  };

  const loadMatrix = async (branchId) => {
    setLoading(true);
    try {
      const res = await getLiveBedMatrix(branchId);
      setMatrixData(res.data);
    } catch (err) {
      console.error('Failed to load live bed matrix', err);
      setMessage({ type: 'error', text: 'Could not fetch live bed matrix. Please ensure backend is running.' });
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS ---

  const handleOpenAdmit = (bed) => {
    setAdmitModal({ open: true, bed });
    setAdmitForm({ 
      patientId: '', 
      patientName: '', 
      admittedBy: localStorage.getItem('username') || 'Admissions Desk', 
      notes: '' 
    });
  };

  const handleConfirmAdmit = async (e) => {
    e.preventDefault();
    if (!admitModal.bed) {
      alert('Please select an available target bed first');
      return;
    }
    if (!admitForm.patientId) {
      alert('Please select a registered patient');
      return;
    }

    const patientObj = patients.find(p => String(p.patientId || p.patient_id || p.id) === String(admitForm.patientId));
    const pName = patientObj ? (patientObj.patientName || patientObj.patient_name || patientObj.name) : (admitForm.patientName || 'Admitted Patient');

    try {
      await allocateBed(admitModal.bed.id, {
        patientId: Number(admitForm.patientId),
        patientName: pName,
        admittedBy: admitForm.admittedBy || localStorage.getItem('username') || 'Admissions Desk',
        notes: admitForm.notes
      });
      setMessage({ type: 'success', text: `Patient '${pName}' admitted successfully to Bed ${admitModal.bed.bedNumber}!` });
      setAdmitModal({ open: false, bed: null });
      setAdmitForm({ patientId: '', patientName: '', admittedBy: '', notes: '' });
      loadMatrix(selectedBranchId);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Admission failed');
    }
  };

  const handleOpenTransfer = (bed) => {
    setTransferModal({ open: true, fromBed: bed });
    setTransferForm({ 
      toBedId: '', 
      reason: '', 
      performedBy: localStorage.getItem('username') || 'Duty Nurse' 
    });
  };

  const handleConfirmTransfer = async (e) => {
    e.preventDefault();
    if (!transferForm.toBedId) {
      alert('Please select a destination empty bed');
      return;
    }
    try {
      await transferBed({
        fromBedId: transferModal.fromBed.id,
        toBedId: Number(transferForm.toBedId),
        patientId: transferModal.fromBed.currentPatientId,
        patientName: transferModal.fromBed.currentPatientName,
        reason: transferForm.reason,
        performedBy: transferForm.performedBy || localStorage.getItem('username') || 'Duty Nurse'
      });
      setMessage({ type: 'success', text: `Patient successfully transferred from Bed ${transferModal.fromBed.bedNumber} to new bed!` });
      setTransferModal({ open: false, fromBed: null });
      loadMatrix(selectedBranchId);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Transfer failed');
    }
  };

  const handleOpenDischarge = (bed) => {
    setDischargeModal({ open: true, bed });
    setDischargeForm({ 
      releasedBy: localStorage.getItem('username') || 'Attending Physician', 
      notes: '' 
    });
  };

  const handleConfirmDischarge = async (e) => {
    e.preventDefault();
    try {
      await releaseBed(dischargeModal.bed.id, {
        releasedBy: dischargeForm.releasedBy || localStorage.getItem('username') || 'Attending Physician',
        notes: dischargeForm.notes
      });
      setMessage({ type: 'success', text: `Patient discharged. Bed ${dischargeModal.bed.bedNumber} is now Under Cleaning.` });
      setDischargeModal({ open: false, bed: null });
      loadMatrix(selectedBranchId);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Discharge failed');
    }
  };

  const handleMarkCleaned = async (bedId) => {
    try {
      await updateBedStatus(bedId, {
        statusCode: 'AVAILABLE',
        reason: 'Housekeeping sanitization completed and inspected',
        performedBy: localStorage.getItem('username') || 'Housekeeping Supervisor'
      });
      setMessage({ type: 'success', text: 'Housekeeping verified! Bed is now Available for admission.' });
      loadMatrix(selectedBranchId);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update status');
    }
  };

  const handleOpenHistory = async (bed) => {
    try {
      const res = await getBedHistory(bed.id);
      setHistoryModal({ open: true, bed, logs: res.data || [] });
    } catch (err) {
      alert('Failed to load bed history');
    }
  };

  // --- FILTERED DATA ---
  const allBeds = matrixData?.beds || [];
  const availableBedsForTransfer = allBeds.filter(b => b.statusCode === 'AVAILABLE');

  // Admitted patient IDs across all beds
  const admittedPatientIds = new Set(allBeds.filter(b => b.currentPatientId).map(b => String(b.currentPatientId)));

  // Filter out FILE_CLOSED patients and patients who are already admitted to a bed
  const eligiblePatients = patients.filter(p => {
    const isClosed = p.status === 'FILE_CLOSED';
    const patId = String(p.patientId || p.patient_id || p.id);
    const isAlreadyAdmitted = admittedPatientIds.has(patId);
    return !isClosed && !isAlreadyAdmitted;
  });

  const filteredBeds = allBeds.filter(b => {
    if (selectedWardFilter !== 'ALL' && b.wardName !== selectedWardFilter) return false;
    if (selectedStatusFilter !== 'ALL' && b.statusCode !== selectedStatusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchNum = b.bedNumber?.toLowerCase().includes(term);
      const matchRoom = b.roomNumber?.toLowerCase().includes(term);
      const matchPat = b.currentPatientName?.toLowerCase().includes(term);
      if (!matchNum && !matchRoom && !matchPat) return false;
    }
    return true;
  });

  // Group beds by Ward
  const wardGroups = filteredBeds.reduce((acc, bed) => {
    const w = bed.wardName || 'Unassigned Ward';
    if (!acc[w]) acc[w] = [];
    acc[w].push(bed);
    return acc;
  }, {});

  const wardNames = Array.from(new Set(allBeds.map(b => b.wardName).filter(Boolean)));

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <h2><Bed size={26} color="#2563eb" /> Inpatient & Bed Management</h2>
          <p>Real-time bed occupancy, admissions, patient transfers, and housekeeping sanitization</p>
        </div>

        {/* Tab Controls */}
        <div className={styles.tabNav}>
          <button 
            className={activeTab === 'matrix' ? styles.activeTab + ' ' + styles.tabBtn : styles.tabBtn}
            onClick={() => setActiveTab('matrix')}
          >
            <Activity size={16} /> Live Bed Matrix
          </button>
          <button 
            className={activeTab === 'admit' ? styles.activeTab + ' ' + styles.tabBtn : styles.tabBtn}
            onClick={() => setActiveTab('admit')}
          >
            <UserPlus size={16} /> Admit Patient
          </button>
          <button 
            className={activeTab === 'transfer' ? styles.activeTab + ' ' + styles.tabBtn : styles.tabBtn}
            onClick={() => setActiveTab('transfer')}
          >
            <ArrowRightLeft size={16} /> Bed Transfers
          </button>
          <button 
            className={activeTab === 'housekeeping' ? styles.activeTab + ' ' + styles.tabBtn : styles.tabBtn}
            onClick={() => setActiveTab('housekeeping')}
          >
            <Sparkles size={16} /> Housekeeping
          </button>
          <button 
            className={activeTab === 'history' ? styles.activeTab + ' ' + styles.tabBtn : styles.tabBtn}
            onClick={() => setActiveTab('history')}
          >
            <History size={16} /> Audit History
          </button>
        </div>
      </div>

      {message && (
        <div className={styles.filterBar} style={{ borderColor: message.type === 'error' ? '#fca5a5' : '#86efac', background: message.type === 'error' ? '#fef2f2' : '#f0fdf4', marginBottom: '16px' }}>
          <span style={{ fontWeight: 600, color: message.type === 'error' ? '#b91c1c' : '#15803d' }}>{message.text}</span>
          <button onClick={() => setMessage(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconBox} style={{ background: '#eff6ff', color: '#2563eb' }}><Bed size={22} /></div>
          <div className={styles.kpiInfo}>
            <h4>{matrixData?.totalBeds || 0}</h4>
            <span>Total Beds</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconBox} style={{ background: '#f0fdf4', color: '#16a34a' }}><CheckCircle2 size={22} /></div>
          <div className={styles.kpiInfo}>
            <h4>{matrixData?.availableBeds || 0}</h4>
            <span>Available / Vacant</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconBox} style={{ background: '#fef2f2', color: '#dc2626' }}><Activity size={22} /></div>
          <div className={styles.kpiInfo}>
            <h4>{matrixData?.occupiedBeds || 0}</h4>
            <span>Admitted / Occupied</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconBox} style={{ background: '#fffbeb', color: '#d97706' }}><Sparkles size={22} /></div>
          <div className={styles.kpiInfo}>
            <h4>{matrixData?.cleaningBeds || 0}</h4>
            <span>Under Cleaning</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconBox} style={{ background: '#f8fafc', color: '#64748b' }}><Wrench size={22} /></div>
          <div className={styles.kpiInfo}>
            <h4>{matrixData?.occupancyRatePercentage || 0}%</h4>
            <span>Campus Occupancy</span>
          </div>
        </div>
      </div>

      {/* Branch & Filter Selector Bar */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <Building2 size={16} color="#64748b" />
          <label>Campus Branch:</label>
          <select 
            className={styles.selectInput}
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
          >
            {branches.map(b => (
              <option key={b.branchId || b.id} value={b.branchId || b.id}>
                {b.branchName || b.name} ({b.city || 'Campus'})
              </option>
            ))}
          </select>
        </div>

        {activeTab === 'matrix' && (
          <>
            <div className={styles.filterGroup}>
              <Filter size={16} color="#64748b" />
              <label>Ward:</label>
              <select 
                className={styles.selectInput}
                value={selectedWardFilter}
                onChange={(e) => setSelectedWardFilter(e.target.value)}
              >
                <option value="ALL">All Wards ({wardNames.length})</option>
                {wardNames.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Status:</label>
              <select 
                className={styles.selectInput}
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="OCCUPIED">Occupied</option>
                <option value="CLEANING">Cleaning</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>

            <div className={styles.filterGroup} style={{ flex: 1, minWidth: '220px' }}>
              <Search size={16} color="#64748b" />
              <input 
                type="text" 
                className={styles.searchInput}
                placeholder="Search bed, room, or patient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button 
              className={styles.btnAction} 
              style={{ background: '#f1f5f9', color: '#334155' }}
              onClick={() => loadMatrix(selectedBranchId)}
              title="Refresh Live Status"
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </>
        )}
      </div>

      {/* ================= TAB 1: LIVE BED MATRIX ================= */}
      {activeTab === 'matrix' && (
        <div className={styles.matrixArea}>
          {loading ? (
            <div className={styles.emptyState}>
              <Activity className={styles.spin} size={32} color="#2563eb" />
              <p>Syncing live telemetry from hospital inpatient wards...</p>
            </div>
          ) : Object.keys(wardGroups).length === 0 ? (
            <div className={styles.emptyState}>
              <AlertCircle size={36} color="#94a3b8" />
              <h4>No beds match your filter criteria</h4>
              <p>Adjust ward or status filters to view bed telemetry.</p>
            </div>
          ) : (
            Object.entries(wardGroups).map(([wardName, beds]) => (
              <div key={wardName} className={styles.wardSection}>
                <div className={styles.wardHeader}>
                  <div className={styles.wardTitle}>
                    <h3>{wardName}</h3>
                    <span className={styles.wardSub}>{beds[0]?.blockName} • {beds[0]?.buildingName}</span>
                  </div>
                  <div className={styles.wardMetrics}>
                    <span>{beds.length} Total</span>
                    <span style={{ color: '#16a34a' }}>{beds.filter(b => b.statusCode === 'AVAILABLE').length} Vacant</span>
                    <span style={{ color: '#dc2626' }}>{beds.filter(b => b.statusCode === 'OCCUPIED').length} Occupied</span>
                  </div>
                </div>

                <div className={styles.bedGrid}>
                  {beds.map(bed => {
                    const isAvailable = bed.statusCode === 'AVAILABLE';
                    const isOccupied = bed.statusCode === 'OCCUPIED';
                    const isCleaning = bed.statusCode === 'CLEANING';
                    const isMaintenance = bed.statusCode === 'MAINTENANCE';

                    return (
                      <div 
                        key={bed.id} 
                        className={styles.bedCard}
                        style={{ borderTop: `4px solid ${bed.colorCode || '#94a3b8'}` }}
                      >
                        <div className={styles.bedCardHeader}>
                          <div className={styles.bedTitle}>
                            <span className={styles.bedNum}>{bed.bedNumber}</span>
                            <span className={styles.roomNum}>Room {bed.roomNumber}</span>
                          </div>
                          <span 
                            className={styles.statusBadge}
                            style={{ 
                              background: (bed.colorCode || '#94a3b8') + '22', 
                              color: bed.colorCode || '#334155' 
                            }}
                          >
                            {bed.statusName || bed.statusCode}
                          </span>
                        </div>

                        <div className={styles.bedSpecs}>
                          <span>{bed.bedTypeName}</span>
                          <span>{bed.roomTypeName}</span>
                        </div>

                        {isOccupied && (
                          <div className={styles.patientInfoBox}>
                            <div className={styles.patientName}>
                              <strong>{bed.currentPatientName || 'Admitted Patient'}</strong>
                            </div>
                            <div className={styles.patientId}>
                              ID: #{bed.currentPatientId} • {bed.allocatedAt ? new Date(bed.allocatedAt).toLocaleDateString() : 'Active'}
                            </div>
                          </div>
                        )}

                        {isCleaning && (
                          <div className={styles.cleaningBox}>
                            <Sparkles size={14} color="#d97706" />
                            <span>Housekeeping Sanitization in progress</span>
                          </div>
                        )}

                        {isMaintenance && (
                          <div className={styles.cleaningBox} style={{ background: '#f1f5f9', color: '#475569' }}>
                            <Wrench size={14} color="#475569" />
                            <span>Under Bio-Medical Maintenance</span>
                          </div>
                        )}

                        {/* Quick Action Footer */}
                        <div className={styles.bedCardActions}>
                          {isAvailable && (
                            <button 
                              className={styles.btnAction + ' ' + styles.btnAdmit}
                              onClick={() => handleOpenAdmit(bed)}
                            >
                              <UserPlus size={13} /> Admit Patient
                            </button>
                          )}

                          {isOccupied && (
                            <>
                              <button 
                                className={styles.btnAction + ' ' + styles.btnTransfer}
                                onClick={() => handleOpenTransfer(bed)}
                                title="Transfer Patient to Another Bed"
                              >
                                <ArrowRightLeft size={13} /> Transfer
                              </button>
                              <button 
                                className={styles.btnAction + ' ' + styles.btnDischarge}
                                onClick={() => handleOpenDischarge(bed)}
                                title="Discharge Patient and Sanitize Bed"
                              >
                                <LogOut size={13} /> Discharge
                              </button>
                            </>
                          )}

                          {isCleaning && (
                            <button 
                              className={styles.btnAction + ' ' + styles.btnClean}
                              onClick={() => handleMarkCleaned(bed.id)}
                            >
                              <Sparkles size={13} /> Mark Sanitized
                            </button>
                          )}

                          {isMaintenance && (
                            <button 
                              className={styles.btnAction + ' ' + styles.btnClean}
                              onClick={() => handleMarkCleaned(bed.id)}
                            >
                              <CheckCircle2 size={13} /> Complete Repair
                            </button>
                          )}

                          <button 
                            className={styles.btnHistoryIcon}
                            onClick={() => handleOpenHistory(bed)}
                            title="Bed Stay Timeline & Audit Log"
                          >
                            <History size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ================= TAB 2: ADMIT PATIENT FORM ================= */}
      {activeTab === 'admit' && (
        <div className={styles.tableCard} style={{ maxWidth: '680px', margin: '0 auto', padding: '28px' }}>
          <h3 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus color="#2563eb" /> Inpatient Admission & Bed Allocation
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>
            Assign an available inpatient bed to a registered patient for acute or routine care.
          </p>
          <form onSubmit={handleConfirmAdmit}>
            <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Select Target Available Bed *</label>
              <select 
                className={styles.formSelect}
                value={admitModal.bed?.id || ''}
                onChange={(e) => {
                  const b = allBeds.find(x => String(x.id) === e.target.value);
                  setAdmitModal({ open: true, bed: b });
                }}
                required
              >
                <option value="">-- Choose an Available Bed ({availableBedsForTransfer.length} Available) --</option>
                {availableBedsForTransfer.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.bedNumber} ({b.wardName} - Room {b.roomNumber} • {b.roomTypeName})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Select Registered Patient *</label>
              <select 
                className={styles.formSelect}
                value={admitForm.patientId}
                onChange={(e) => setAdmitForm({ ...admitForm, patientId: e.target.value })}
                required
              >
                <option value="">-- Select Registered Patient ({eligiblePatients.length} Active & Available) --</option>
                {eligiblePatients.map(p => {
                  const id = p.patientId || p.patient_id || p.id;
                  const name = p.patientName || p.patient_name || p.name;
                  const uhid = p.uhid || `PAT-${id}`;
                  const dis = p.disease ? (typeof p.disease === 'string' && p.disease.length > 25 ? p.disease.substring(0, 25) + '...' : p.disease) : 'Inpatient Care';
                  return (
                    <option key={id} value={id}>
                      {name} (UHID: {uhid}) - {dis}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Admitting Doctor / Medical Staff</label>
              <input 
                type="text" 
                className={styles.formInput}
                value={admitForm.admittedBy}
                onChange={(e) => setAdmitForm({ ...admitForm, admittedBy: e.target.value })}
                placeholder="Dr. Subhash / Duty Medical Officer"
              />
            </div>

            <div className={styles.formGroup} style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Admission Diagnosis & Notes</label>
              <textarea 
                className={styles.formTextarea}
                rows={3}
                value={admitForm.notes}
                onChange={(e) => setAdmitForm({ ...admitForm, notes: e.target.value })}
                placeholder="Observation after acute surgery, IV drip required, monitoring oxygen levels..."
              />
            </div>

            <button type="submit" className={styles.btnSubmit} style={{ width: '100%', padding: '12px', justifyContent: 'center' }}>
              Confirm Admission & Allocate Bed
            </button>
          </form>
        </div>
      )}

      {/* ================= TAB 3: BED TRANSFERS ================= */}
      {activeTab === 'transfer' && (
        <div className={styles.tableCard}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Active Inpatient Admissions</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Transfer admitted patients across wards (e.g. ICU Step-down, room upgrade)</p>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2563eb' }}>
              {allBeds.filter(b => b.statusCode === 'OCCUPIED').length} Admitted Patients
            </span>
          </div>
          <table className={styles.customTable}>
            <thead>
              <tr>
                <th>Current Bed</th>
                <th>Ward & Room</th>
                <th>Patient Name</th>
                <th>Patient ID</th>
                <th>Admission Date</th>
                <th>Bed Type</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {allBeds.filter(b => b.statusCode === 'OCCUPIED').length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No patients are currently admitted to any bed in this campus.</td></tr>
              ) : (
                allBeds.filter(b => b.statusCode === 'OCCUPIED').map(b => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 700 }}>{b.bedNumber}</td>
                    <td>{b.wardName} (Room {b.roomNumber})</td>
                    <td style={{ fontWeight: 600, color: '#1e293b' }}>{b.currentPatientName || 'Admitted Patient'}</td>
                    <td>#{b.currentPatientId}</td>
                    <td>{b.allocatedAt ? new Date(b.allocatedAt).toLocaleString() : 'Active'}</td>
                    <td>{b.bedTypeName}</td>
                    <td>
                      <button 
                        className={styles.btnAction + ' ' + styles.btnTransfer} 
                        style={{ display: 'inline-flex', width: 'auto', padding: '6px 14px' }}
                        onClick={() => handleOpenTransfer(b)}
                      >
                        <ArrowRightLeft size={13} /> Transfer Bed
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= TAB 4: HOUSEKEEPING & SANITIZATION ================= */}
      {activeTab === 'housekeeping' && (
        <div className={styles.tableCard}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Housekeeping & Sanitization Queue</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Beds vacated by discharged patients undergoing linen replacement and terminal sterilization</p>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#d97706' }}>
              {allBeds.filter(b => b.statusCode === 'CLEANING' || b.statusCode === 'MAINTENANCE').length} Beds Pending
            </span>
          </div>
          <table className={styles.customTable}>
            <thead>
              <tr>
                <th>Bed</th>
                <th>Ward</th>
                <th>Room & Tariff</th>
                <th>Bed Type</th>
                <th>Current Status</th>
                <th>Housekeeping Verification</th>
              </tr>
            </thead>
            <tbody>
              {allBeds.filter(b => b.statusCode === 'CLEANING' || b.statusCode === 'MAINTENANCE').length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '35px', color: '#059669', fontWeight: 600 }}>All beds are sterilized, sanitized, and ready for patient admission! 🎉</td></tr>
              ) : (
                allBeds.filter(b => b.statusCode === 'CLEANING' || b.statusCode === 'MAINTENANCE').map(b => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 700 }}>{b.bedNumber}</td>
                    <td>{b.wardName}</td>
                    <td>Room {b.roomNumber} ({b.roomTypeName})</td>
                    <td>{b.bedTypeName}</td>
                    <td>
                      <span className={styles.statusBadge} style={{ background: (b.colorCode || '#f59e0b') + '22', color: b.colorCode || '#d97706' }}>
                        {b.statusName || b.statusCode}
                      </span>
                    </td>
                    <td>
                      <button className={styles.btnAction + ' ' + styles.btnClean} style={{ display: 'inline-flex', width: 'auto', padding: '6px 14px' }} onClick={() => handleMarkCleaned(b.id)}>
                        <Sparkles size={14} /> Mark Sanitized & Available
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= TAB 5: AUDIT HISTORY ================= */}
      {activeTab === 'history' && (
        <div className={styles.tableCard} style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 8px 0' }}>Bed Stay Audit History</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>Select any bed to view its chronological admission, transfer, and discharge timeline.</p>
          <div className={styles.filterGroup} style={{ marginBottom: '24px', maxWidth: '400px' }}>
            <label style={{ fontWeight: 600 }}>Select Bed:</label>
            <select 
              className={styles.selectInput}
              onChange={(e) => {
                const b = allBeds.find(x => String(x.id) === e.target.value);
                if (b) handleOpenHistory(b);
              }}
            >
              <option value="">-- Choose Bed to Inspect Audit Log --</option>
              {allBeds.map(b => (
                <option key={b.id} value={b.id}>{b.bedNumber} ({b.wardName} - Room {b.roomNumber})</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADMIT PATIENT ================= */}
      {admitModal.open && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h3>Admit Patient to {admitModal.bed?.bedNumber}</h3>
              <button className={styles.modalCloseBtn} onClick={() => setAdmitModal({ open: false, bed: null })}>✕</button>
            </div>
            <form onSubmit={handleConfirmAdmit}>
              <div className={styles.modalBody}>
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                  <strong>Ward:</strong> {admitModal.bed?.wardName} • <strong>Room:</strong> {admitModal.bed?.roomNumber} ({admitModal.bed?.roomTypeName})
                </div>

                <div className={styles.formGroup}>
                  <label>Select Registered Patient *</label>
                  <select 
                    className={styles.formSelect}
                    value={admitForm.patientId}
                    onChange={(e) => setAdmitForm({ ...admitForm, patientId: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Patient --</option>
                    {eligiblePatients.map(p => {
                      const id = p.patientId || p.patient_id || p.id;
                      const name = p.patientName || p.patient_name || p.name;
                      const uhid = p.uhid || `PAT-${id}`;
                      const dis = p.disease ? (typeof p.disease === 'string' && p.disease.length > 25 ? p.disease.substring(0, 25) + '...' : p.disease) : 'Inpatient Care';
                      return (
                        <option key={id} value={id}>
                          {name} (UHID: {uhid}) - {dis}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Admitting Doctor / Staff Name</label>
                  <input 
                    type="text" 
                    className={styles.formInput}
                    value={admitForm.admittedBy}
                    onChange={(e) => setAdmitForm({ ...admitForm, admittedBy: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Admission Notes / Clinical Reason</label>
                  <textarea 
                    className={styles.formTextarea}
                    rows={3}
                    value={admitForm.notes}
                    onChange={(e) => setAdmitForm({ ...admitForm, notes: e.target.value })}
                    placeholder="Diagnosis, reason for admission, observation guidelines..."
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnCancel} onClick={() => setAdmitModal({ open: false, bed: null })}>Cancel</button>
                <button type="submit" className={styles.btnSubmit}>Confirm Admission</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: TRANSFER PATIENT ================= */}
      {transferModal.open && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h3>Transfer Patient from {transferModal.fromBed?.bedNumber}</h3>
              <button className={styles.modalCloseBtn} onClick={() => setTransferModal({ open: false, fromBed: null })}>✕</button>
            </div>
            <form onSubmit={handleConfirmTransfer}>
              <div className={styles.modalBody}>
                <div style={{ background: '#fef2f2', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                  <strong>Current Patient:</strong> {transferModal.fromBed?.currentPatientName} (ID: #{transferModal.fromBed?.currentPatientId})
                </div>

                <div className={styles.formGroup}>
                  <label>Select Destination Bed (Available Only) *</label>
                  <select 
                    className={styles.formSelect}
                    value={transferForm.toBedId}
                    onChange={(e) => setTransferForm({ ...transferForm, toBedId: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Empty Destination Bed --</option>
                    {availableBedsForTransfer.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.bedNumber} ({b.wardName} - Room {b.roomNumber} • {b.roomTypeName})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Reason for Transfer *</label>
                  <textarea 
                    className={styles.formTextarea}
                    rows={2}
                    value={transferForm.reason}
                    onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                    placeholder="e.g. Stepped down from ICU to General Ward, patient upgraded to Deluxe Suite..."
                    required
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnCancel} onClick={() => setTransferModal({ open: false, fromBed: null })}>Cancel</button>
                <button type="submit" className={styles.btnSubmit}>Execute Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: DISCHARGE PATIENT ================= */}
      {dischargeModal.open && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h3>Discharge Patient from {dischargeModal.bed?.bedNumber}</h3>
              <button className={styles.modalCloseBtn} onClick={() => setDischargeModal({ open: false, bed: null })}>✕</button>
            </div>
            <form onSubmit={handleConfirmDischarge}>
              <div className={styles.modalBody}>
                <div style={{ background: '#fffbeb', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                  Patient <strong>{dischargeModal.bed?.currentPatientName}</strong> will be discharged. The bed will automatically transition to <strong>Under Cleaning</strong> for housekeeping sanitization.
                </div>

                <div className={styles.formGroup}>
                  <label>Authorized Medical Officer</label>
                  <input 
                    type="text" 
                    className={styles.formInput}
                    value={dischargeForm.releasedBy}
                    onChange={(e) => setDischargeForm({ ...dischargeForm, releasedBy: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Discharge Summary Notes</label>
                  <textarea 
                    className={styles.formTextarea}
                    rows={3}
                    value={dischargeForm.notes}
                    onChange={(e) => setDischargeForm({ ...dischargeForm, notes: e.target.value })}
                    placeholder="Patient recovered, discharge medications prescribed, follow-up in 10 days..."
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnCancel} onClick={() => setDischargeModal({ open: false, bed: null })}>Cancel</button>
                <button type="submit" className={styles.btnSubmit} style={{ background: '#dc2626' }}>Confirm Discharge</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: BED HISTORY TIMELINE ================= */}
      {historyModal.open && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox} style={{ maxWidth: '650px' }}>
            <div className={styles.modalHeader}>
              <h3>Audit Timeline: Bed {historyModal.bed?.bedNumber}</h3>
              <button className={styles.modalCloseBtn} onClick={() => setHistoryModal({ open: false, bed: null, logs: [] })}>✕</button>
            </div>
            <div className={styles.modalBody}>
              {historyModal.logs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No clinical admissions logged for this bed yet.</div>
              ) : (
                <div className={styles.timelineList}>
                  {historyModal.logs.map((log) => (
                    <div key={log.id} className={styles.timelineItem}>
                      <div className={styles.timelineDot} />
                      <div className={styles.timelineContent}>
                        <div className={styles.timelineMeta}>
                          <strong>{log.action}</strong>
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <p style={{ margin: '4px 0', fontSize: '0.85rem' }}>
                          Patient: <strong>{log.patientName || `#${log.patientId}`}</strong>
                          {log.performedBy && ` • By: ${log.performedBy}`}
                        </p>
                        {log.notes && (
                          <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', background: '#f8fafc', padding: '6px 10px', borderRadius: '4px' }}>
                            "{log.notes}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnCancel} onClick={() => setHistoryModal({ open: false, bed: null, logs: [] })}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BedManagementPage;
