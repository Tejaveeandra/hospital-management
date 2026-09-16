import React, { useState } from 'react';
import SelectDropdown from '../components/Form/SelectDropdown';
import DatePicker from '../components/Form/DatePicker';
import { Clock, Calendar, CheckCircle } from 'lucide-react';
import styles from './ModulePages.module.css';

const ShiftManagementPage = () => {
  const [shifts, setShifts] = useState([
    { id: 1, staffName: 'Dr. Robert Chen', role: 'DOCTOR', shiftType: 'MORNING (08:00 - 16:00)', date: '2026-09-12', room: 'ICU-102' },
    { id: 2, staffName: 'Sarah Jenkins', role: 'NURSE', shiftType: 'NIGHT (23:00 - 07:00)', date: '2026-09-12', room: 'Emergency Ward' },
    { id: 3, staffName: 'Michael Chang', role: 'RECEPTIONIST', shiftType: 'DAY (09:00 - 17:00)', date: '2026-09-12', room: 'Front Desk' },
    { id: 4, staffName: 'Dr. Emily Vance', role: 'DOCTOR', shiftType: 'EVENING (16:00 - 00:00)', date: '2026-09-12', room: 'OPD-04' },
  ]);

  const [formData, setFormData] = useState({
    staffName: '',
    shiftType: 'MORNING (08:00 - 16:00)',
    date: new Date().toISOString().split('T')[0],
    room: 'OPD-01',
  });

  const [message, setMessage] = useState(null);

  const handleAssignShift = (e) => {
    e.preventDefault();
    if (!formData.staffName) return;
    setShifts(prev => [...prev, { ...formData, id: Date.now(), role: 'STAFF/DOCTOR' }]);
    setMessage('Shift assigned successfully!');
    setFormData({ staffName: '', shiftType: 'MORNING (08:00 - 16:00)', date: new Date().toISOString().split('T')[0], room: 'OPD-01' });
    setTimeout(() => setMessage(null), 4000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.title}><Clock size={24} color="#0284c7" /> Staff & Doctor Shift Allocation</h2>
          <p className={styles.subtitle}>Schedule morning, evening, and night shifts across clinical departments.</p>
        </div>
      </div>

      {message && (
        <div className={`${styles.alert} ${styles.alertSuccess}`}>
          <CheckCircle size={18} />
          <span>{message}</span>
        </div>
      )}

      <div className={styles.gridTwo}>
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 className={styles.sectionHeading}>Assign New Shift Schedule</h3>
          <form onSubmit={handleAssignShift}>
            <SelectDropdown
              label="Select Doctor / Staff Member"
              required
              value={formData.staffName}
              onChange={e => setFormData({...formData, staffName: e.target.value})}
              options={["Dr. Robert Chen", "Dr. Emily Vance", "Sarah Jenkins", "Michael Chang", "Elena Rostova"]}
            />
            <SelectDropdown
              label="Shift Allocation"
              value={formData.shiftType}
              onChange={e => setFormData({...formData, shiftType: e.target.value})}
              options={["MORNING (08:00 - 16:00)", "EVENING (16:00 - 00:00)", "NIGHT (23:00 - 07:00)", "DAY (09:00 - 17:00)"]}
            />
            <DatePicker
              label="Shift Date"
              required
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
            />
            <SelectDropdown
              label="Assigned Ward / Room"
              value={formData.room}
              onChange={e => setFormData({...formData, room: e.target.value})}
              options={["OPD-01", "OPD-04", "ICU-102", "Emergency Ward", "Front Desk", "Radiology Lab"]}
            />

            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '12px' }}>
              <Calendar size={18} /> Confirm Shift Assignment
            </button>
          </form>
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 className={styles.sectionHeading}>Current Shift Allocation Grid</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Shift Window</th>
                <th>Assigned Ward</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((s) => (
                <tr key={s.id}>
                  <td className={styles.fontBold}>{s.staffName}</td>
                  <td><span className={styles.badgeBlue}>{s.shiftType}</span></td>
                  <td>{s.room}</td>
                  <td>{s.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ShiftManagementPage;
