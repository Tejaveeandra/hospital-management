import React from 'react';
import styles from './Widgets.module.css';

const StatWidget = ({ title, value, icon: Icon, trend, color = 'blue' }) => {
  return (
    <div className={`${styles.statCard} ${styles[color]}`}>
      <div className={styles.statHeader}>
        <span className={styles.statTitle}>{title}</span>
        {Icon && (
          <div className={styles.iconWrapper}>
            <Icon size={20} />
          </div>
        )}
      </div>
      <div className={styles.statBody}>
        <span className={styles.statValue}>{value}</span>
        {trend && (
          <span className={`${styles.statTrend} ${trend.startsWith('+') ? styles.positive : styles.neutral}`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatWidget;
