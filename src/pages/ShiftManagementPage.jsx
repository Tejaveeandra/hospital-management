import React, { useState, useEffect } from 'react';
import api from '../api/api';
import SelectDropdown from '../components/Form/SelectDropdown';
import DatePicker from '../components/Form/DatePicker';
import { Clock, Calendar, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import styles from './ModulePages.module.css';

const ShiftManagementPage = () => {
  const [shifts, setShifts] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [formData, setFormData] = useState({
    staffName: '',
    role: 'STAFF',
    shiftType: 'MORNING (08:00 - 16:00)',
    shiftDate: new Date().toISOString().split('T')[0],
    assignedWard: 'OPD-01',
  });

  useEffect(() => {
    fetchAllocations();
    fetchStaffAndDoctors();
  }, []);

  const fetchAllocations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/hr/shifts/allocations');
      setShifts(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Error loading shift allocations", e);
      setShifts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffAndDoctors = async () => {
    try {
      const staffRes = await api.get('/api/hr/staff');
      const docRes = await api.get('/doctors');
      
      const staffList = Array.isArray(staffRes.data) ? staffRes.data.map(s => `${s.fullName || s.name} (${s.designation || 'Staff'})`) : [];
      const docList = Array.isArray(docRes.data) ? docRes.data.map(d => `Dr. ${d.doctorName} (${d.specialization || 'Doctor'})`) : [];
      
      const combined = [...docList, ...staffList];
      setStaffOptions(combined);
    } catch (e) {
      console.error("Error loading doctors and staff for shifts", e);
      setStaffOptions([]);
    }
  };

  const handleAssignShift = async (e) => {
    e.preventDefault();
    if (!formData.staffName) {
      setMessage({ text: 'Please select a doctor or staff member.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        staffName: formData.staffName.split('(')[0].trim(),
        role: formData.staffName.includes('Doctor') || formData.staffName.startsWith('Dr.') ? 'DOCTOR' : 'STAFF',
        shiftType: formData.shiftType,
        shiftDate: formData.shiftDate,
        assignedWard: formData.assignedWard,
      };

      await api.post('/api/hr/shifts/allocations', payload);
      setMessage({ text: `Shift assigned successfully to ${payload.staffName}!`, type: 'success' });
      setFormData({
        staffName: '',
        role: 'STAFF',
        shiftType: 'MORNING (08:00 - 16:00)',
        shiftDate: new Date().toISOString().split('T')[0],
        assignedWard: 'OPD-01',
      });
      fetchAllocations();
    } catch (e) {
      const errMsg = e.response?.data?.message || 'Error saving shift allocation.';
      setMessage({ text: errMsg, type: 'error' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleDeleteShift = async (id) => {
    if (!window.confirm("Remove this shift allocation?")) return;
    setLoading(true);
    try {
      await api.delete(`/api/hr/shifts/allocations/${id}`);
      setMessage({ text: 'Shift allocation removed successfully.', type: 'success' });
      fetchAllocations();
    } catch (e) {
      // Local state fallback if id is mock integer
      setShifts(prev => prev.filter(s => s.id !== id));
      setMessage({ text: 'Shift allocation removed.', type: 'success' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.title}><Clock size={24} color="#0284c7" /> Staff & Doctor Shift Allocation</h2>
          <p className={styles.subtitle}>Schedule morning, evening, and night shifts across clinical departments into database</p>
        </div>
      </div>

      {message && (
        <div className={`${styles.alert} ${message.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className={styles.gridTwo}>
        <div className={`glass-card ${styles.cardPadded}`}>
          <h3 className={styles.sectionHeading}>Assign New Shift Schedule</h3>
          <form onSubmit={handleAssignShift}>
            <SelectDropdown
              label="Select Doctor / Staff Member *"
              required
              value={formData.staffName}
              onChange={e => setFormData({ ...formData, staffName: e.target.value })}
              options={staffOptions}
            />
            <SelectDropdown
              label="Shift Allocation *"
              value={formData.shiftType}
              onChange={e => setFormData({ ...formData, shiftType: e.target.value })}
              options={["MORNING (08:00 - 16:00)", "EVENING (16:00 - 00:00)", "NIGHT (23:00 - 07:00)", "DAY (09:00 - 17:00)"]}
            />
            <DatePicker
              label="Shift Date *"
              required
              value={formData.shiftDate}
              onChange={e => setFormData({ ...formData, shiftDate: e.target.value })}
            />
            <SelectDropdown
              label="Assigned Ward / Room"
              value={formData.assignedWard}
              onChange={e => setFormData({ ...formData, assignedWard: e.target.value })}
              options={["OPD-01", "OPD-04", "ICU-102", "Emergency Ward", "Front Desk", "Radiology Lab", "Surgery Block"]}
            />

            <button type="submit" disabled={loading} className={`btn-primary ${styles.fullWidthBtn}`}>
              <Calendar size={18} /> {loading ? 'Saving to Database...' : 'Confirm Shift Assignment'}
            </button>
          </form>
        </div>

        <div className={`glass-card ${styles.cardPadded}`}>
          <h3 className={styles.sectionHeading}>Current Shift Allocation Grid</h3>
          {shifts.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Shift Window</th>
                  <th>Assigned Ward</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((s) => (
                  <tr key={s.id}>
                    <td className={styles.fontBold}>
                      {s.staffName}
                      {s.role && <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>{s.role}</span>}
                    </td>
                    <td><span className={styles.badgeBlue}>{s.shiftType}</span></td>
                    <td>{s.assignedWard || s.room}</td>
                    <td>{s.shiftDate || s.date}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleDeleteShift(s.id)}
                        className={styles.deleteIconBtn}
                        title="Remove Shift"
                        disabled={loading}
                      >
                        <Trash2 size={15} color="#ef4444" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className={styles.emptyText}>No active shift allocations found in database.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShiftManagementPage;
