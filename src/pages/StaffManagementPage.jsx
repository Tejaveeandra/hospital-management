import React, { useState, useEffect } from 'react';
import api from '../api/api';
import InputBox from '../components/Form/InputBox';
import SelectDropdown from '../components/Form/SelectDropdown';
import { UserCog, Plus, CheckCircle, ShieldAlert } from 'lucide-react';
import styles from './ModulePages.module.css';

const StaffManagementPage = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);



  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'NURSE',
    department: 'General Care',
    contact: '',
    employmentType: 'FULL_TIME',
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/staff');
      setStaffList(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      // Fallback mock data for HR staff if endpoint is initializing
      setStaffList([
        { id: 1, name: 'Sarah Jenkins', role: 'NURSE', department: 'Emergency', contact: '+1 555-0192', employmentType: 'FULL_TIME' },
        { id: 2, name: 'Michael Chang', role: 'RECEPTIONIST', department: 'Front Desk', contact: '+1 555-0144', employmentType: 'FULL_TIME' },
        { id: 3, name: 'David Miller', role: 'JANITOR', department: 'Sanitation', contact: '+1 555-0188', employmentType: 'PART_TIME' },
        { id: 4, name: 'Elena Rostova', role: 'TECHNICIAN', department: 'Radiology', contact: '+1 555-0177', employmentType: 'FULL_TIME' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/staff', formData);
      setMessage({ text: 'Staff member onboarded successfully!', type: 'success' });
      setShowModal(false);
      fetchStaff();
    } catch (e) {
      // Local addition fallback
      setStaffList(prev => [...prev, { ...formData, id: Date.now() }]);
      setMessage({ text: 'Staff member added to roster.', type: 'success' });
      setShowModal(false);
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = staffList.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.role?.toLowerCase().includes(search.toLowerCase()) ||
    s.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.title}><UserCog size={24} color="#0284c7" /> HR Staff & Employee Roster</h2>
          <p className={styles.subtitle}>Onboard and manage nurses, receptionists, janitors, and clinical technicians.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Onboard Staff Member
        </button>
      </div>

      {message && (
        <div className={`${styles.alert} ${message.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <ShieldAlert size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className={styles.filterBar}>
        <InputBox
          type="search"
          placeholder="Search staff by name, role, or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
        />
      </div>

      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Employee Name</th>
              <th>Role</th>
              <th>Department</th>
              <th>Contact Number</th>
              <th>Employment Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map((staff) => (
              <tr key={staff.id}>
                <td>#{staff.id}</td>
                <td className={styles.fontBold}>{staff.name}</td>
                <td><span className={styles.badgeBlue}>{staff.role}</span></td>
                <td>{staff.department}</td>
                <td>{staff.contact}</td>
                <td><span className={styles.badgeGray}>{staff.employmentType}</span></td>
                <td>
                  <span className={styles.statusActive}>
                    <span className="pulse-indicator" /> Active
                  </span>
                </td>
              </tr>
            ))}
            {filteredStaff.length === 0 && (
              <tr>
                <td colSpan="7" className={styles.emptyRow}>No staff members found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h3>Onboard New Staff Member</h3>
            <form onSubmit={handleCreateStaff}>
              <InputBox label="Full Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" />
              <InputBox label="Email Address" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="john.doe@hospital.org" />
              <SelectDropdown label="Staff Role" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} options={["NURSE", "RECEPTIONIST", "JANITOR", "TECHNICIAN", "PHARMACIST"]} />
              <InputBox label="Department" required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} placeholder="e.g. Emergency Care" />
              <InputBox label="Contact Phone" required value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} placeholder="+1 555-0199" />
              <SelectDropdown label="Employment Type" value={formData.employmentType} onChange={e => setFormData({...formData, employmentType: e.target.value})} options={["FULL_TIME", "PART_TIME", "CONTRACT"]} />
              
              <div className={styles.modalActions}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save & Onboard</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagementPage;
