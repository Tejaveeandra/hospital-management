import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import styles from './AdminLayout.module.css';

const AdminLayout = ({ children, activeSection, setActiveSection, userRole, handleLogout }) => {
  // Determine breadcrumbs based on active section
  const getBreadcrumbs = () => {
    const base = 'MedCenter';
    const sectionName = activeSection.charAt(0).toUpperCase() + activeSection.slice(1);
    return [base, sectionName];
  };

  return (
    <div className={styles.layoutContainer}>
      <Sidebar 
        activeSection={activeSection} 
        setActiveSection={setActiveSection} 
        userRole={userRole}
        handleLogout={handleLogout}
      />
      <div className={styles.mainContent}>
        <Header breadcrumbs={getBreadcrumbs()} />
        <div className={styles.pageContent}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
