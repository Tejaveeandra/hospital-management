import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from '../../components/Header';
import styles from './AdminLayout.module.css';

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    return ['MedCenter', ...paths.map(p => p.charAt(0).toUpperCase() + p.slice(1))];
  };

  const getPageTitle = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    const last = paths[paths.length - 1] || 'Dashboard';
    return last.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className={styles.layoutContainer}>
      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      {mobileMenuOpen && (
        <div className={styles.mobileBackdrop} onClick={() => setMobileMenuOpen(false)} />
      )}
      <div className={styles.mainContent}>
        <button
          type="button"
          className={styles.mobileMenuBtn}
          onClick={() => setMobileMenuOpen(prev => !prev)}
          aria-label="Toggle navigation menu"
        >
          ☰ Menu
        </button>
        <Header title={getPageTitle()} breadcrumbs={getBreadcrumbs()} />
        <main className={styles.pageContent}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
