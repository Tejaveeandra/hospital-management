import React, { useState, useEffect } from 'react';
import api from '../api/api';
import InputBox from '../components/Form/InputBox';
import AuditWidget from '../widgets/AuditWidget';
import { ShieldAlert, Lock, CheckCircle, RefreshCw } from 'lucide-react';
import styles from './ModulePages.module.css';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');


  const role = (localStorage.getItem('role') || '').toUpperCase();
  const isSuperAdmin = ['SUPER_ADMIN', 'SUPER-ADMIN'].includes(role);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAuditLogs();
    }
  }, [isSuperAdmin]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/audit/all');
      if (Array.isArray(res.data)) {
        const formatted = res.data.map((item, idx) => ({
          ...item,
          id: item.id || idx + 1,
          timestamp: item.timestamp ? item.timestamp.replace('T', ' ').substring(0, 19) : ''
        }));
        setLogs(formatted);
      } else {
        setLogs([]);
      }
    } catch (e) {
      console.error("Error fetching live audit logs", e);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className={styles.restrictedContainer}>
        <ShieldAlert size={54} color="#f43f5e" />
        <h2>Access Restricted (Super Admin Only)</h2>
        <p>You do not have security clearance to view background audit telemetry logs.</p>
      </div>
    );
  }

  const filteredLogs = logs.filter(l =>
    l.userId?.toLowerCase().includes(search.toLowerCase()) ||
    l.serviceName?.toLowerCase().includes(search.toLowerCase()) ||
    l.endpoint?.toLowerCase().includes(search.toLowerCase()) ||
    l.action?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.title}><Lock size={24} color="#f43f5e" /> Security & Audit Logs (Kafka Event Telemetry)</h2>
          <p className={styles.subtitle}>Super Admin compliance log viewer tracking all gateway requests, authentication, and endpoint activity.</p>
        </div>
        <button className="btn-secondary" onClick={fetchAuditLogs} disabled={loading}>
          <RefreshCw size={16} className={loading ? styles.spinning : ''} /> Refresh Telemetry
        </button>
      </div>

      <div className={styles.widgetWrapper}>
        <AuditWidget totalLogs={logs.length} kafkaStatus="ACTIVE" />
      </div>

      <div className={styles.filterBar}>
        <InputBox
          type="search"
          placeholder="Filter logs by User ID, Service, HTTP Action, or Endpoint..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
        />
      </div>

      <div className={`glass-card ${styles.tableCard}`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User ID</th>
              <th>Role</th>
              <th>Method</th>
              <th>Service</th>
              <th>Endpoint</th>
              <th>IP Address</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id}>
                <td className={styles.fontMuted}>{log.timestamp}</td>
                <td className={styles.fontBold}>{log.userId}</td>
                <td><span className={styles.badgeGray}>{log.userRole}</span></td>
                <td><span className={log.action === 'GET' ? styles.badgeGreen : styles.badgeBlue}>{log.action}</span></td>
                <td><span className={styles.badgePurple}>{log.serviceName}</span></td>
                <td className={styles.fontCode}>{log.endpoint}</td>
                <td>{log.ipAddress}</td>
                <td>
                  <span className={log.status === 'SUCCESS' ? styles.statusSuccess : styles.statusFail}>
                    {log.status === 'SUCCESS' ? <CheckCircle size={14} /> : <ShieldAlert size={14} />} {log.status}
                  </span>
                </td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan="8" className={styles.emptyRow}>No audit event logs found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogsPage;
