import React, { useState, useEffect } from 'react';
import api from '../api/api';
import InputBox from '../components/Form/InputBox';
import SelectDropdown from '../components/Form/SelectDropdown';
import { Briefcase, Plus, CheckCircle, ShieldAlert, Users, Award, Calendar, Phone, Mail, MapPin } from 'lucide-react';
import styles from './ModulePages.module.css';

const CandidateRecruitmentPage = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [message, setMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dob: '',
    address: '',
    applyingForRole: 'Nurse',
    interviewDate: '',
    experience: '',
    feedback: '',
    status: 'PENDING'
  });

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/hr/recruitment/candidates');
      setCandidates(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Failed to fetch candidates', e);
      setMessage({ text: 'Error loading interview candidates from database.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterCandidate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await api.post('/api/hr/recruitment/candidates', {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        dob: formData.dob,
        address: formData.address,
        applyingForRole: formData.applyingForRole,
        interviewDate: formData.interviewDate ? formData.interviewDate : new Date().toISOString(),
        experience: formData.experience,
        feedback: formData.feedback,
        status: formData.status || 'PENDING'
      });
      setMessage({ text: 'Walk-in candidate interview data recorded successfully!', type: 'success' });
      setShowModal(false);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        dob: '',
        address: '',
        applyingForRole: 'Nurse',
        interviewDate: '',
        experience: '',
        feedback: '',
        status: 'PENDING'
      });
      fetchCandidates();
    } catch (e) {
      const errMsg = e.response?.data?.message || 'Error recording interview candidate data.';
      setMessage({ text: errMsg, type: 'error' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleHire = async (candidate) => {
    if (!window.confirm(`Are you sure you want to hire ${candidate.fullName} for the role ${candidate.applyingForRole}?`)) return;
    setLoading(true);
    try {
      await api.post(`/api/hr/recruitment/candidates/${candidate.id}/hire`, {
        role: candidate.applyingForRole || 'Staff',
        baseSalary: 35000
      });
      setMessage({ text: `Candidate ${candidate.fullName} successfully hired! Record converted to Staff.`, type: 'success' });
      fetchCandidates();
    } catch (e) {
      setMessage({ text: 'Error hiring candidate.', type: 'error' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const filteredCandidates = candidates.filter(c => {
    const matchesSearch =
      c.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.toLowerCase().includes(search.toLowerCase()) ||
      c.applyingForRole?.toLowerCase().includes(search.toLowerCase()) ||
      c.status?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'SELECTED': return { backgroundColor: '#dcfce7', color: '#15803d', fontWeight: 600, padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem' };
      case 'HIRED': return { backgroundColor: '#f3e8ff', color: '#7e22ce', fontWeight: 600, padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem' };
      case 'INTERVIEWED': return { backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 600, padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem' };
      case 'REJECTED': return { backgroundColor: '#fee2e2', color: '#b91c1c', fontWeight: 600, padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem' };
      default: return { backgroundColor: '#fef3c7', color: '#b45309', fontWeight: 600, padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem' };
    }
  };

  const totalCandidates = candidates.length;
  const pendingCount = candidates.filter(c => c.status === 'PENDING').length;
  const interviewedCount = candidates.filter(c => c.status === 'INTERVIEWED').length;
  const selectedCount = candidates.filter(c => c.status === 'SELECTED' || c.status === 'HIRED').length;

  return (
    <div className={styles.container}>
      {!showModal && (
        <>
          <div className={styles.pageHeader}>
            <div>
              <h2 className={styles.title}><Briefcase size={26} color="#0284c7" /> Walk-in Interview & Candidate Portal</h2>
              <p className={styles.subtitle}>Collect details of persons visiting for job interviews prior to staff onboarding (public.candidates).</p>
            </div>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={18} /> Register Walk-in Candidate
            </button>
          </div>

          {message && (
            <div className={`${styles.alert} ${message.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
              {message.type === 'success' ? <CheckCircle size={18} /> : <ShieldAlert size={18} />}
              <span>{message.text}</span>
            </div>
          )}

          {/* Quick Metrics Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Total Interviewees</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem' }}>{totalCandidates}</div>
            </div>
            <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.85rem', color: '#b45309', fontWeight: 500 }}>Pending Review</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#b45309', marginTop: '0.25rem' }}>{pendingCount}</div>
            </div>
            <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.85rem', color: '#0369a1', fontWeight: 500 }}>Interview Completed</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0369a1', marginTop: '0.25rem' }}>{interviewedCount}</div>
            </div>
            <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.85rem', color: '#15803d', fontWeight: 500 }}>Selected / Hired</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#15803d', marginTop: '0.25rem' }}>{selectedCount}</div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className={styles.filterBar} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <InputBox
                type="search"
                placeholder="Search candidates by name, role, email, phone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onClear={() => setSearch('')}
              />
            </div>
            <div style={{ width: '180px' }}>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', backgroundColor: '#fff' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="INTERVIEWED">Interviewed</option>
                <option value="SELECTED">Selected</option>
                <option value="REJECTED">Rejected</option>
                <option value="HIRED">Hired</option>
              </select>
            </div>
          </div>

          {/* Candidate Table */}
          <div className={`glass-card ${styles.tableCard}`}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Candidate ID</th>
                  <th>Applicant Name & Email</th>
                  <th>Applied Role</th>
                  <th>Phone & Location</th>
                  <th>Experience & Feedback</th>
                  <th>Interview Date</th>
                  <th>Evaluation Status</th>
                  <th>HR Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map(cand => (
                  <tr key={cand.id}>
                    <td className={styles.fontCode}>CAN-00{cand.id}</td>
                    <td className={styles.fontBold}>
                      {cand.fullName}
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>{cand.email}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#0284c7' }}>{cand.applyingForRole}</span>
                    </td>
                    <td>
                      <div>{cand.phone}</div>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>{cand.address || 'N/A'}</span>
                    </td>
                    <td>
                      <div>{cand.experience || 'Fresher / Walk-in'}</div>
                      {cand.feedback && (
                        <span style={{ display: 'block', fontSize: '0.75rem', color: '#475569', fontStyle: 'italic' }}>
                          "{cand.feedback}"
                        </span>
                      )}
                    </td>
                    <td>
                      {cand.interviewDate ? new Date(cand.interviewDate).toLocaleDateString() : 'Today'}
                    </td>
                    <td>
                      <span style={getStatusBadgeStyle(cand.status)}>
                        {cand.status}
                      </span>
                    </td>
                    <td>
                      {cand.status !== 'HIRED' && (
                        <button
                          onClick={() => handleHire(cand)}
                          style={{
                            padding: '6px 14px',
                            backgroundColor: '#0284c7',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 500,
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Award size={14} /> Hire to Staff
                        </button>
                      )}
                      {cand.status === 'HIRED' && (
                        <span style={{ color: '#15803d', fontWeight: 600, fontSize: '0.85rem' }}>✓ Staff Member</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredCandidates.length === 0 && (
                  <tr>
                    <td colSpan="8" className={styles.emptyRow}>
                      No candidates found. Click "Register Walk-in Candidate" to add candidates who arrived for an interview.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* MODAL: Register Walk-in Candidate Form */}
      {showModal && (
        <div className={styles.inlineFormCard}>
          <div className={styles.formHeaderRow}>
            <h3>Register Walk-in Candidate for Interview</h3>
            <p className={styles.fontMuted}>Record interviewee contact details, applied role, and interview schedule into database table public.candidates</p>
          </div>
          <form onSubmit={handleRegisterCandidate}>
            <div className={styles.gridTwo}>
              <InputBox
                label="Candidate Full Name *"
                required
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g. Ramesh Kumar"
              />

              <InputBox
                label="Email Address *"
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="ramesh.kumar@example.com"
              />

              <InputBox
                label="Phone Number *"
                required
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 9876543210"
              />

              <InputBox
                label="Date of Birth *"
                type="date"
                required
                value={formData.dob}
                onChange={e => setFormData({ ...formData, dob: e.target.value })}
              />

              <SelectDropdown
                label="Applying for Role *"
                required
                value={formData.applyingForRole}
                onChange={e => setFormData({ ...formData, applyingForRole: e.target.value })}
                options={[
                  'Doctor',
                  'Nurse',
                  'Receptionist',
                  'Lab Technician',
                  'Pharmacist',
                  'HR Executive',
                  'Accountant',
                  'Radiologist',
                  'Security Officer',
                  'Housekeeping',
                  'Ward Boy'
                ]}
              />

              <InputBox
                label="Work Experience / Prior Hospital"
                value={formData.experience}
                onChange={e => setFormData({ ...formData, experience: e.target.value })}
                placeholder="e.g. 3 years ICU experience"
              />

              <InputBox
                label="Interview Date & Time"
                type="datetime-local"
                value={formData.interviewDate}
                onChange={e => setFormData({ ...formData, interviewDate: e.target.value })}
              />

              <SelectDropdown
                label="Evaluation Status *"
                required
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                options={['PENDING', 'INTERVIEWED', 'SELECTED', 'REJECTED']}
              />

              <InputBox
                label="Current Residential Address"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="Residential address / City"
              />

              <InputBox
                label="Interviewer Feedback / Evaluation Notes"
                value={formData.feedback}
                onChange={e => setFormData({ ...formData, feedback: e.target.value })}
                placeholder="Technical knowledge, communication skills, remarks"
              />
            </div>

            <div className={styles.formActionsRow}>
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving Candidate...' : 'Save Walk-in Interviewee'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CandidateRecruitmentPage;
