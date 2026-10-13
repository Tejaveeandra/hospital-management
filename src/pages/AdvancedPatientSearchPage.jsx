import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  UserCheck, 
  Phone, 
  Calendar, 
  Activity, 
  Grid, 
  List, 
  Copy, 
  Check, 
  Eye, 
  Edit3, 
  CalendarPlus, 
  X, 
  RefreshCw,
  Users
} from 'lucide-react';
import styles from './AdvancedPatientSearchPage.module.css';

const AdvancedPatientSearchPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [allPatients, setAllPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [copiedUhid, setCopiedUhid] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Load all patients on mount
  const loadPatients = async () => {
    setLoading(true);
    try {
      const res = await api.get('/patients/getAllPatients?page=0&size=100');
      const data = res.data?.content || res.data || [];
      setAllPatients(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load patients", e);
      setAllPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleCopyUhid = (uhid, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(uhid);
    setCopiedUhid(uhid);
    setTimeout(() => setCopiedUhid(null), 2000);
  };

  // Filtered patients based on search and filters
  const filteredPatients = useMemo(() => {
    return allPatients.filter(p => {
      const term = searchTerm.toLowerCase().trim();
      const matchSearch = !term || 
        (p.uhid && p.uhid.toLowerCase().includes(term)) ||
        (p.patientName && p.patientName.toLowerCase().includes(term)) ||
        (p.contact && p.contact.toLowerCase().includes(term)) ||
        (p.disease && p.disease.toLowerCase().includes(term)) ||
        (String(p.patientId).includes(term));

      const matchGender = genderFilter === 'ALL' || (p.gender && p.gender.toUpperCase() === genderFilter.toUpperCase());
      const matchStatus = statusFilter === 'ALL' || (p.status && p.status.toUpperCase() === statusFilter.toUpperCase());

      return matchSearch && matchGender && matchStatus;
    });
  }, [allPatients, searchTerm, genderFilter, statusFilter]);

  const activeCount = useMemo(() => allPatients.filter(p => !p.status || p.status === 'ACTIVE').length, [allPatients]);

  return (
    <div className={styles.container}>
      {/* Header Banner */}
      <div className={styles.headerCard}>
        <div className={styles.titleArea}>
          <h1><Users size={28} color="#38bdf8" /> Advanced Patient Search & Registry</h1>
          <p>Real-time decrypted search across Medical UHID, full names, phone contacts, and health conditions</p>
        </div>
        <div className={styles.statsArea}>
          <div className={styles.statPill}>
            <div className={styles.statNum}>{allPatients.length}</div>
            <div className={styles.statLabel}>Total Patients</div>
          </div>
          <div className={styles.statPill}>
            <div className={styles.statNum} style={{ color: '#4ade80' }}>{activeCount}</div>
            <div className={styles.statLabel}>Active Records</div>
          </div>
          <div className={styles.statPill}>
            <div className={styles.statNum} style={{ color: '#f43f5e' }}>{allPatients.length - activeCount}</div>
            <div className={styles.statLabel}>Closed Files</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className={styles.searchCard}>
        <div className={styles.searchBarRow}>
          <div className={styles.searchInputWrapper}>
            <Search className={styles.searchIcon} size={20} />
            <input
              type="text"
              placeholder="Search by UHID (e.g. UHID-2026-00001), Patient Name, Phone, or Diagnosis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <button
            type="button"
            className={styles.chipBtn}
            style={{ padding: '12px 18px', background: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={loadPatients}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className={styles.filterBar}>
          <div className={styles.chipsGroup}>
            <span className={styles.filterLabel}>Gender:</span>
            {['ALL', 'Male', 'Female', 'Other'].map(g => (
              <button
                key={g}
                type="button"
                className={`${styles.chipBtn} ${genderFilter.toUpperCase() === g.toUpperCase() ? styles.chipBtnActive : ''}`}
                onClick={() => setGenderFilter(g)}
              >
                {g}
              </button>
            ))}
          </div>

          <div className={styles.chipsGroup}>
            <span className={styles.filterLabel}>Status:</span>
            {['ALL', 'ACTIVE', 'FILE_CLOSED'].map(s => (
              <button
                key={s}
                type="button"
                className={`${styles.chipBtn} ${statusFilter === s ? styles.chipBtnActive : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s === 'ALL' ? 'All' : s === 'ACTIVE' ? 'Active' : 'Closed'}
              </button>
            ))}
          </div>

          <div className={styles.viewToggle}>
            <button
              type="button"
              className={`${styles.viewToggleBtn} ${viewMode === 'grid' ? styles.viewToggleActive : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid size={14} /> Cards
            </button>
            <button
              type="button"
              className={`${styles.viewToggleBtn} ${viewMode === 'table' ? styles.viewToggleActive : ''}`}
              onClick={() => setViewMode('table')}
            >
              <List size={14} /> Table
            </button>
          </div>
        </div>
      </div>

      {/* Search Results Summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#475569' }}>
          Showing <span style={{ color: '#0f172a', fontWeight: 700 }}>{filteredPatients.length}</span> patient results
          {searchTerm && <span> matching "<strong>{searchTerm}</strong>"</span>}
        </div>
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
          >
            Clear Search
          </button>
        )}
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className={styles.cardGrid}>
          {filteredPatients.map(patient => (
            <div key={patient.uhid || patient.patientId} className={styles.patientCard}>
              <div>
                <div className={styles.cardHeader}>
                  <span className={styles.uhidBadge} title="Click to copy UHID" onClick={(e) => handleCopyUhid(patient.uhid || `ID-${patient.patientId}`, e)}>
                    {patient.uhid || `ID #${patient.patientId}`}
                    {copiedUhid === (patient.uhid || `ID-${patient.patientId}`) ? (
                      <Check size={14} color="#166534" />
                    ) : (
                      <Copy size={13} style={{ cursor: 'pointer' }} />
                    )}
                  </span>
                  <span className={styles.statusActive}>
                    {patient.status || 'ACTIVE'}
                  </span>
                </div>

                <div className={styles.cardBody}>
                  <h3 className={styles.patientName}>{patient.patientName}</h3>
                  <div className={styles.metaRow}>
                    <div className={styles.metaItem}>
                      <Phone size={14} color="#64748b" />
                      <span>{patient.contact || 'No phone'}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <UserCheck size={14} color="#64748b" />
                      <span>{patient.age} yrs • {patient.gender}</span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <span className={styles.diseaseTag}>
                      <Activity size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                      {patient.disease || 'General Medical'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} /> Registered: {patient.date || 'Recent'}
                  </div>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <button
                  type="button"
                  className={styles.cardBtnPrimary}
                  onClick={() => setSelectedPatient(patient)}
                >
                  <Eye size={14} /> Quick View
                </button>
                <button
                  type="button"
                  className={styles.cardBtnSecondary}
                  title="Update this patient's details"
                  onClick={() => navigate(`/admin/patients?op=update`)}
                >
                  <Edit3 size={14} />
                </button>
                <button
                  type="button"
                  className={styles.cardBtnSecondary}
                  title="Book an appointment"
                  onClick={() => navigate(`/admin/appointments?op=Create Appointment`)}
                >
                  <CalendarPlus size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Medical UHID</th>
                <th>Patient Name</th>
                <th>Contact</th>
                <th>Age & Gender</th>
                <th>Diagnosis</th>
                <th>Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map(patient => (
                <tr key={patient.uhid || patient.patientId}>
                  <td>
                    <span
                      className={styles.uhidBadge}
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => handleCopyUhid(patient.uhid || `ID-${patient.patientId}`, e)}
                    >
                      {patient.uhid || `ID #${patient.patientId}`}
                      {copiedUhid === (patient.uhid || `ID-${patient.patientId}`) ? (
                        <Check size={13} color="#166534" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>{patient.patientName}</td>
                  <td>{patient.contact}</td>
                  <td>{patient.age} yrs • {patient.gender}</td>
                  <td>
                    <span className={styles.diseaseTag} style={{ fontSize: '0.8rem', padding: '2px 8px' }}>
                      {patient.disease}
                    </span>
                  </td>
                  <td style={{ color: '#64748b', fontSize: '0.85rem' }}>{patient.date}</td>
                  <td>
                    <span className={styles.statusActive} style={{ fontSize: '0.72rem' }}>
                      {patient.status || 'ACTIVE'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button
                        type="button"
                        className={styles.cardBtnSecondary}
                        style={{ padding: '6px 10px' }}
                        onClick={() => setSelectedPatient(patient)}
                      >
                        <Eye size={13} /> View
                      </button>
                      <button
                        type="button"
                        className={styles.cardBtnSecondary}
                        style={{ padding: '6px 10px' }}
                        onClick={() => navigate(`/admin/patients?op=update`)}
                      >
                        <Edit3 size={13} /> Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {filteredPatients.length === 0 && !loading && (
        <div className={styles.emptyState}>
          <Users size={48} className={styles.emptyStateIcon} />
          <h3>No patients matching your search criteria</h3>
          <p>Try searching for a different UHID, patient name, or clearing filters.</p>
          <button
            type="button"
            className={styles.chipBtn}
            style={{ marginTop: '12px', background: '#0f172a', color: 'white', padding: '8px 18px' }}
            onClick={() => { setSearchTerm(''); setGenderFilter('ALL'); setStatusFilter('ALL'); }}
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Patient Profile Detail Modal */}
      {selectedPatient && (
        <div className={styles.modalOverlay} onClick={() => setSelectedPatient(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.modalCloseBtn}
              onClick={() => setSelectedPatient(null)}
            >
              <X size={18} />
            </button>

            <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '20px' }}>
              <span className={styles.uhidBadge} style={{ fontSize: '0.9rem', marginBottom: '8px' }}>
                {selectedPatient.uhid || `ID #${selectedPatient.patientId}`}
              </span>
              <h2 style={{ margin: '8px 0 4px 0', fontSize: '1.4rem', color: '#0f172a' }}>
                {selectedPatient.patientName}
              </h2>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Unique Health Identification Record
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Contact Phone</span>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>
                  {selectedPatient.contact || 'N/A'}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Age & Gender</span>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>
                  {selectedPatient.age} yrs • {selectedPatient.gender}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', gridColumn: 'span 2' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Primary Condition / Diagnosis</span>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1d4ed8', marginTop: '4px' }}>
                  {selectedPatient.disease || 'General Medical Evaluation'}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', gridColumn: 'span 2' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Previous Medication & History</span>
                <div style={{ fontSize: '0.9rem', color: '#334155', marginTop: '4px' }}>
                  {selectedPatient.prevMedication || 'None on record.'}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Registered On</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>
                  {selectedPatient.date || 'N/A'}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Status</span>
                <div style={{ marginTop: '4px' }}>
                  <span className={styles.statusActive}>
                    {selectedPatient.status || 'ACTIVE'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                className={styles.cardBtnSecondary}
                onClick={() => setSelectedPatient(null)}
              >
                Close
              </button>
              <button
                type="button"
                className={styles.cardBtnPrimary}
                onClick={() => {
                  setSelectedPatient(null);
                  navigate(`/admin/patients?op=update`);
                }}
              >
                <Edit3 size={15} /> Edit Record
              </button>
              <button
                type="button"
                className={styles.cardBtnPrimary}
                style={{ background: '#2563eb' }}
                onClick={() => {
                  setSelectedPatient(null);
                  navigate(`/admin/appointments?op=Create Appointment`);
                }}
              >
                <CalendarPlus size={15} /> Book Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedPatientSearchPage;
