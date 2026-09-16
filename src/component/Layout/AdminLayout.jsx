import React from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from '../../components/Header';
import styles from './AdminLayout.module.css';

const AdminLayout = ({ children }) => {
  const location = useLocation();

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
      <Sidebar />
      <div className={styles.mainContent}>
        <Header title={getPageTitle()} breadcrumbs={getBreadcrumbs()} />
        <main className={styles.pageContent}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
