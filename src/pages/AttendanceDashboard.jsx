import React from 'react';
import StatWidget from '../widgets/StatWidget';
import { Activity, Clock, UserCheck, ShieldCheck } from 'lucide-react';
import styles from './ModulePages.module.css';

const AttendanceDashboard = () => {
  const attendanceLogs = [
    { id: 101, name: 'Dr. Robert Chen', role: 'DOCTOR', clockIn: '07:54 AM', clockOut: '--', status: 'ON_DUTY', department: 'Cardiology' },
    { id: 102, name: 'Sarah Jenkins', role: 'NURSE', clockIn: '07:45 AM', clockOut: '--', status: 'ON_DUTY', department: 'Emergency' },
    { id: 103, name: 'Michael Chang', role: 'RECEPTIONIST', clockIn: '08:02 AM', clockOut: '--', status: 'ON_DUTY', department: 'Front Desk' },
    { id: 104, name: 'David Miller', role: 'JANITOR', clockIn: '06:00 AM', clockOut: '02:00 PM', status: 'CLOCKED_OUT', department: 'Sanitation' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.title}><Activity size={24} color="#0284c7" /> Staff Attendance & Telemetry</h2>
          <p className={styles.subtitle}>Real-time presence tracking, clock-in timestamps, and active working hours.</p>
        </div>
      </div>

      <div className={styles.gridFour}>
        <StatWidget title="Staff On Duty" value="18 Active" icon={UserCheck} color="green" trend="+3 today" />
        <StatWidget title="Clock-ins Today" value="24 Total" icon={Clock} color="blue" />
        <StatWidget title="On Time Rate" value="96.2%" icon={ShieldCheck} color="green" trend="+1.5%" />
        <StatWidget title="Absences" value="1 Pending" icon={Activity} color="amber" />
      </div>

      <div className="glass-card" style={{ padding: '0', overflow: 'hidden', marginTop: '20px' }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Role</th>
              <th>Department</th>
              <th>Clock-In Time</th>
              <th>Clock-Out Time</th>
              <th>Presence Pulse Status</th>
            </tr>
          </thead>
          <tbody>
            {attendanceLogs.map((log) => (
              <tr key={log.id}>
                <td className={styles.fontBold}>{log.name}</td>
                <td><span className={styles.badgeGray}>{log.role}</span></td>
                <td>{log.department}</td>
                <td><span className={styles.badgeBlue}>{log.clockIn}</span></td>
                <td>{log.clockOut}</td>
                <td>
                  {log.status === 'ON_DUTY' ? (
                    <span className={styles.statusActive}>
                      <span className="pulse-indicator" /> On Duty (Active)
                    </span>
                  ) : (
                    <span className={styles.statusOffline}>Clocked Out</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceDashboard;
