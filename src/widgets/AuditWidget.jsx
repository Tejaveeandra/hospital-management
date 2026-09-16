import React from 'react';
import { ShieldCheck, Activity } from 'lucide-react';
import styles from './Widgets.module.css';

const AuditWidget = ({ totalLogs = 0, kafkaStatus = 'ACTIVE' }) => {
  return (
    <div className={`${styles.statCard} ${styles.purple}`}>
      <div className={styles.statHeader}>
        <span className={styles.statTitle}>Security & Kafka Telemetry</span>
        <div className={styles.iconWrapper}>
          <ShieldCheck size={20} />
        </div>
      </div>
      <div className={styles.statBody}>
        <span className={styles.statValue}>{totalLogs} Events</span>
        <div className={styles.kafkaBadge}>
          <Activity size={14} className="pulse-indicator" />
          <span>Broker: {kafkaStatus}</span>
        </div>
      </div>
    </div>
  );
};

export default AuditWidget;
