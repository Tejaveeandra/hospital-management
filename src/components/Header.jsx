import React from 'react';
import { User, Bell, ShieldCheck } from 'lucide-react';
import styles from './Header.module.css';

const Header = ({ title, breadcrumbs = [] }) => {
  const username = localStorage.getItem('username') || 'User';
  const role = (localStorage.getItem('role') || 'PATIENT').toUpperCase();

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        {breadcrumbs.length > 0 && (
          <nav className={styles.breadcrumbNav}>
            {breadcrumbs.map((crumb, idx) => (
              <span key={idx} className={styles.crumbItem}>
                {crumb}
                {idx < breadcrumbs.length - 1 && <span className={styles.crumbDivider}>/</span>}
              </span>
            ))}
          </nav>
        )}
        <h1 className={styles.pageTitle}>{title || 'Hospital System'}</h1>
      </div>

      <div className={styles.headerRight}>
        <button className={styles.iconBtn} title="Notifications">
          <Bell size={18} />
          <span className={styles.notificationDot} />
        </button>

        <div className={styles.userProfile}>
          <div className={styles.avatar}>
            <User size={18} />
          </div>
          <div className={styles.userInfo}>
            <span className={styles.username}>{username}</span>
            <span className={styles.roleBadge}>
              <ShieldCheck size={12} /> {role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
