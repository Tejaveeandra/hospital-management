import React, { useState } from 'react';
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
  ShieldPlus,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import styles from './Sidebar.module.css';

const Sidebar = ({ activeSection, setActiveSection, userRole, handleLogout, setSpecificOperation }) => {
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleMenu = (menu) => {
    setExpandedMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  const handleNavClick = (section, operation = null) => {
    setActiveSection(section);
    if (setSpecificOperation) {
      setSpecificOperation(operation);
    }
  };

  const NavItem = ({ section, icon: Icon, label, subItems }) => {
    const isExpanded = expandedMenus[section];
    const isActive = activeSection === section;

    if (!subItems) {
      return (
        <button 
          className={`${styles.navItem} ${isActive ? styles.active : ''}`}
          onClick={() => handleNavClick(section)}
        >
          <Icon size={20} />
          <span>{label}</span>
        </button>
      );
    }

    return (
      <div className={styles.navItemContainer}>
        <button 
          className={`${styles.navItem} ${isActive && !isExpanded ? styles.active : ''}`}
          onClick={() => {
            toggleMenu(section);
            if (!isExpanded) handleNavClick(section, subItems[0].operation);
          }}
        >
          <div className={styles.navItemMain}>
            <Icon size={20} />
            <span>{label}</span>
          </div>
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        
        {isExpanded && (
          <div className={styles.subMenu}>
            {subItems.map((item, idx) => (
              <button
                key={idx}
                className={styles.subMenuItem}
                onClick={() => handleNavClick(section, item.operation)}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

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
          <NavItem section="dashboard" icon={LayoutDashboard} label="Dashboard" />
        </div>

        <div className={styles.navGroup}>
          <span className={styles.groupLabel}>SYSTEM</span>
          <NavItem section="audit" icon={Activity} label="Audit Logs" />
          <NavItem section="settings" icon={Users} label="System Settings" />
        </div>

        <div className={styles.navGroup}>
          <span className={styles.groupLabel}>OPERATIONS</span>
          <NavItem section="users" icon={Users} label="User Management" />
          <NavItem section="patients" icon={Activity} label="Patients" />
          
          <NavItem 
            section="doctors" 
            icon={Stethoscope} 
            label="Doctor Operations" 
            subItems={[
              { label: 'Create Doctor', operation: 'create' },
              { label: 'View All Doctors', operation: 'viewAll' },
              { label: 'Delete Doctor', operation: 'delete' }
            ]}
          />
          
          <NavItem 
            section="appointments" 
            icon={Calendar} 
            label="Appointments" 
            subItems={[
              { label: 'Create Appointment', operation: 'Create Appointment' },
              { label: 'View All', operation: 'View All Appointments' },
              { label: 'Update', operation: 'Update Appointment' },
              { label: 'Cancel', operation: 'Cancel Appointment' }
            ]}
          />
          
          <NavItem 
            section="departments" 
            icon={LayoutDashboard} 
            label="Departments" 
            subItems={[
              { label: 'View All', operation: 'List Departments' },
              { label: 'Add Department', operation: 'Add Department' },
              { label: 'Update', operation: 'Update Department' },
              { label: 'Doctors by Dept', operation: 'Doctors by Department' }
            ]}
          />
          
          <NavItem 
            section="leaves" 
            icon={Calendar} 
            label="Leave Operations" 
            subItems={[
              { label: 'View All', operation: 'View All Leaves' },
              { label: 'View Pending', operation: 'View Pending Leaves' },
              { label: 'Update Status', operation: 'Update Leave Status' }
            ]}
          />
          
          <NavItem 
            section="medicineStore" 
            icon={Pill} 
            label="Pharmacy" 
            subItems={[
              { label: 'View Store', operation: 'List Medicine Store' },
              { label: 'Add to Store', operation: 'Add to Store' },
              { label: 'Remove', operation: 'Delete from Store' }
            ]}
          />
        </div>

        <div className={styles.navGroup}>
          <span className={styles.groupLabel}>FINANCE</span>
          <NavItem 
            section="hospitalCharges" 
            icon={Receipt} 
            label="Billing" 
            subItems={[
              { label: 'View Charges', operation: 'List Charges' },
              { label: 'Update Charge', operation: 'Update Charge' }
            ]}
          />
          
          <NavItem 
            section="prescriptions" 
            icon={FileText} 
            label="Prescriptions" 
            subItems={[
              { label: 'View All', operation: 'List Prescriptions' },
              { label: 'Create', operation: 'Create Prescription' },
              { label: 'Update', operation: 'Update Prescription' }
            ]}
          />
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
