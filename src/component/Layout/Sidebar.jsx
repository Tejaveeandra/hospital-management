import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Activity, 
  Stethoscope, 
  Calendar, 
  Pill, 
  Receipt, 
  FileText,
  LogOut,
  ShieldPlus
} from 'lucide-react';
import styles from './Sidebar.module.css';

const Sidebar = ({ activeSection, setActiveSection, userRole, handleLogout }) => {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <div className={styles.logoContainer}>
          <div className={styles.logoIcon}>
            <ShieldPlus size={24} color="#ffffff" />
          </div>
          <div className={styles.logoText}>
            <h2>MedCenter</h2>
            <p>Hospital System</p>
          </div>
        </div>
        
        <div className={styles.roleCard}>
          <div className={styles.roleIcon}>
            <ShieldPlus size={20} color="#7b5be4" />
          </div>
          <div className={styles.roleInfo}>
            <span className={styles.roleName}>{userRole.toUpperCase()}</span>
            <span className={styles.roleDesc}>Access level</span>
          </div>
        </div>
      </div>

      <nav className={styles.sidebarNav}>
        <div className={styles.navGroup}>
          <button 
            className={`${styles.navItem} ${activeSection === 'dashboard' ? styles.active : ''}`}
            onClick={() => setActiveSection('dashboard')}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </button>
        </div>

        <div className={styles.navGroup}>
          <span className={styles.groupLabel}>SYSTEM</span>
          <button 
            className={`${styles.navItem} ${activeSection === 'audit' ? styles.active : ''}`}
            onClick={() => setActiveSection('audit')}
          >
            <Activity size={20} />
            <span>Audit Logs</span>
          </button>
          <button 
            className={`${styles.navItem} ${activeSection === 'settings' ? styles.active : ''}`}
            onClick={() => setActiveSection('settings')}
          >
            <Users size={20} /> {/* Placeholder for settings icon */}
            <span>System Settings</span>
          </button>
        </div>

        <div className={styles.navGroup}>
          <span className={styles.groupLabel}>OPERATIONS</span>
          <button 
            className={`${styles.navItem} ${activeSection === 'users' ? styles.active : ''}`}
            onClick={() => setActiveSection('users')}
          >
            <Users size={20} />
            <span>User Management</span>
          </button>
          <button 
            className={`${styles.navItem} ${activeSection === 'patients' ? styles.active : ''}`}
            onClick={() => setActiveSection('patients')}
          >
            <Activity size={20} />
            <span>Patients</span>
          </button>
          <button 
            className={`${styles.navItem} ${activeSection === 'doctors' ? styles.active : ''}`}
            onClick={() => setActiveSection('doctors')}
          >
            <Stethoscope size={20} />
            <span>Doctors & HR</span>
          </button>
          <button 
            className={`${styles.navItem} ${activeSection === 'appointments' ? styles.active : ''}`}
            onClick={() => setActiveSection('appointments')}
          >
            <Calendar size={20} />
            <span>Appointments</span>
          </button>
          <button 
            className={`${styles.navItem} ${activeSection === 'departments' ? styles.active : ''}`}
            onClick={() => setActiveSection('departments')}
          >
             <LayoutDashboard size={20} />
            <span>Departments</span>
          </button>
          <button 
            className={`${styles.navItem} ${activeSection === 'leaves' ? styles.active : ''}`}
            onClick={() => setActiveSection('leaves')}
          >
             <Calendar size={20} />
            <span>Leaves</span>
          </button>
          <button 
            className={`${styles.navItem} ${activeSection === 'medicineStore' ? styles.active : ''}`}
            onClick={() => setActiveSection('medicineStore')}
          >
            <Pill size={20} />
            <span>Pharmacy</span>
          </button>
        </div>

        <div className={styles.navGroup}>
          <span className={styles.groupLabel}>FINANCE</span>
          <button 
            className={`${styles.navItem} ${activeSection === 'hospitalCharges' ? styles.active : ''}`}
            onClick={() => setActiveSection('hospitalCharges')}
          >
            <Receipt size={20} />
            <span>Billing</span>
          </button>
          <button 
            className={`${styles.navItem} ${activeSection === 'prescriptions' ? styles.active : ''}`}
            onClick={() => setActiveSection('prescriptions')}
          >
            <FileText size={20} />
            <span>Prescriptions</span>
          </button>
        </div>
      </nav>

      <div className={styles.sidebarFooter}>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
