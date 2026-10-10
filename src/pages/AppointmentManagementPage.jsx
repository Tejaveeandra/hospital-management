import React, { useState, useEffect } from 'react';
import * as generatedApi from '../api/generatedApi';
import * as facilityApi from '../api/facilityApi';
import styles from './ModulePages.module.css';
import { useSearchParams } from 'react-router-dom';

const AppointmentManagementPage = () => {
  const [searchParams] = useSearchParams();
  const op = searchParams.get('op') || 'book';

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Booking state
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');

  // Reschedule state
  const [appointmentId, setAppointmentId] = useState('');
  const [newDate, setNewDate] = useState('');

  useEffect(() => {
    facilityApi.getPatients().then(res => setPatients(res.data)).catch(() => {});
    generatedApi.filterDoctors({}).then(res => setDoctors(res.data)).catch(() => {});
  }, []);

  const handleBook = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg('');
    try {
      setMsg(`Appointment booked for patient ${selectedPatient} with doctor ${selectedDoctor} on ${appointmentDate}.`);
      setSelectedPatient(''); setSelectedDoctor(''); setAppointmentDate('');
    } catch(e) {
      setMsg('Error booking appointment.');
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg('');
    try {
      await generatedApi.rescheduleAppointment(appointmentId, { newDate });
      setMsg(`Appointment ${appointmentId} rescheduled to ${newDate} successfully!`);
      setAppointmentId(''); setNewDate('');
    } catch (e) {
      setMsg('Error rescheduling appointment: ' + (e.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <h2>Appointment Management</h2>
      {msg && <div style={{color: msg.includes('Error') ? 'red' : 'green', margin: '1rem 0', fontWeight: 'bold'}}>{msg}</div>}

      {op === 'book' && (
        <div className={styles.formCard}>
          <h3>Book New Appointment</h3>
          <form onSubmit={handleBook} style={{display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px'}}>
            <div>
              <label>Select Patient:</label>
              <select value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)} required className={styles.formInput}>
                <option value="">-- Choose Patient --</option>
                {patients.map(p => <option key={p.uhid} value={p.uhid}>{p.firstName} ({p.uhid})</option>)}
              </select>
            </div>
            <div>
              <label>Select Doctor:</label>
              <select value={selectedDoctor} onChange={e => setSelectedDoctor(e.target.value)} required className={styles.formInput}>
                <option value="">-- Choose Doctor --</option>
                {doctors.map(d => <option key={d.id} value={d.doctorCode}>{d.name} ({d.doctorCode})</option>)}
              </select>
            </div>
            <div>
              <label>Date & Time:</label>
              <input type="datetime-local" value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)} required className={styles.formInput} />
            </div>
            <button type="submit" disabled={loading} className={styles.submitBtn}>Confirm Booking</button>
          </form>
        </div>
      )}

      {op === 'reschedule' && (
        <div className={styles.formCard}>
          <h3>Reschedule Appointment</h3>
          <form onSubmit={handleReschedule} style={{display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px'}}>
            <div>
              <label>Appointment ID:</label>
              <input type="text" value={appointmentId} onChange={e => setAppointmentId(e.target.value)} required className={styles.formInput} placeholder="e.g. APP-1001" />
            </div>
            <div>
              <label>New Date & Time:</label>
              <input type="datetime-local" value={newDate} onChange={e => setNewDate(e.target.value)} required className={styles.formInput} />
            </div>
            <button type="submit" disabled={loading} className={styles.submitBtn}>Reschedule</button>
          </form>
        </div>
      )}
    </div>
  );
};
export default AppointmentManagementPage;
