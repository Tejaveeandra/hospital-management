import { logoutUser } from '../../api/api';
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  hasPermission,
  canRead,
  isSuperAdminUser
} from '../../utils/permissionUtils';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck,
  Stethoscope, 
  Calendar, 
  Pill, 
  Store,
  Receipt, 
  Building, 
  UserCog,
  Clock,
  Activity,
  ShieldAlert,
  LogOut,
  ShieldPlus,
  FileText,
  CalendarPlus,
  ClipboardList,
  Bed,
  Building2,
  Syringe, 
  Briefcase, 
  KeyRound
} from 'lucide-react';
import styles from './Sidebar.module.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const rawRole = localStorage.getItem('role') || 'SUPER_ADMIN';
  const role = rawRole.toUpperCase().replace('-', '_');
  const isSuperAdmin = isSuperAdminUser();
  const isDoctor = role === 'DOCTOR';
  const isPatient = role === 'PATIENT';
  const isReceptionist = role === 'RECEPTIONIST';
  
  // All hospital staff who operate within the enterprise portal
  const isStaff = !isDoctor && !isPatient && !isReceptionist;

  const handleLogout = async () => {
    await logoutUser();
    navigate('/');
  };

  return (
    <aside className={styles.sidebar}>
      {/* Brand Header */}
      <div className={styles.sidebarHeader}>
        <div className={styles.logoContainer}>
          <div className={styles.logoIcon}>
            <ShieldPlus size={22} color="#ffffff" strokeWidth={2.4} />
          </div>
          <div className={styles.logoText}>
            <h2>MedCenter</h2>
            <div className={styles.statusBadge}>
              <span className={styles.statusDot} />
              <p>Hospital Enterprise</p>
            </div>
          </div>
        </div>
      </div>

      {/* Nav Menu Body with Comfortable Spacing */}
      <nav className={styles.navMenu}>
        {/* HOSPITAL STAFF & ENTERPRISE PORTAL NAV */}
        {isStaff && (
          <>
            <div className={styles.menuSectionTitle}>OPERATIONS</div>
            
            <NavLink to="/admin/dashboard" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <LayoutDashboard size={19} className={styles.itemIcon} />
              <span>Main Dashboard</span>
            </NavLink>

            {(canRead('USER') || hasPermission('ROLE_MANAGE') || isSuperAdmin) && (
              <NavLink to="/admin/users" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                <Users size={19} className={styles.itemIcon} />
                <span>User & Role Management</span>
              </NavLink>
            )}

            {(canRead('PATIENT') || isSuperAdmin) && (
              <NavLink to="/admin/patients" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                <UserCheck size={19} className={styles.itemIcon} />
                <span>Patient Records</span>
              </NavLink>
            )}

            {(canRead('DOCTOR') || isSuperAdmin) && (
              <NavLink to="/admin/doctors" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                <Stethoscope size={19} className={styles.itemIcon} />
                <span>Doctor Roster</span>
              </NavLink>
            )}

            {(canRead('APPOINTMENT') || isSuperAdmin) && (
              <NavLink to="/admin/appointments" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                <Calendar size={19} className={styles.itemIcon} />
                <span>Master Appointments</span>
              </NavLink>
            )}

            {(canRead('DEPARTMENT') || canRead('BRANCH') || isSuperAdmin) && (
              <NavLink to="/admin/departments" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                <Building size={19} className={styles.itemIcon} />
                <span>Departments & Branches</span>
              </NavLink>
            )}

            {(canRead('PRESCRIPTION') || isSuperAdmin) && (
              <NavLink to="/admin/prescriptions" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                <Pill size={19} className={styles.itemIcon} />
                <span>Prescriptions Log</span>
              </NavLink>
            )}

            {(canRead('PHARMACY') || isSuperAdmin) && (
              <NavLink to="/admin/medicine-store" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                <Store size={19} className={styles.itemIcon} />
                <span>Pharmacy Store</span>
              </NavLink>
            )}

            {(canRead('CHARGES') || canRead('BILLING') || hasPermission('PAYMENT_MANAGE') || isSuperAdmin) && (
              <NavLink to="/admin/hospital-charges" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                <Receipt size={19} className={styles.itemIcon} />
                <span>Hospital Charges & Billing</span>
              </NavLink>
            )}

            {(canRead('DIAGNOSTICS') || hasPermission('LAB_READ') || hasPermission('RADIOLOGY_READ') || isSuperAdmin) && (
              <NavLink to="/admin/diagnostics" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                <Activity size={19} className={styles.itemIcon} />
                <span>Clinical & Diagnostics</span>
              </NavLink>
            )}

            {(canRead('SURGERY') || hasPermission('SURGERY_MANAGE') || isSuperAdmin) && (
              <NavLink to="/admin/surgeries" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                <Syringe size={19} className={styles.itemIcon} />
                <span>Surgery Management</span>
              </NavLink>
            )}

            <div className={styles.menuSectionTitle}>INPATIENT & FACILITIES</div>

            {(canRead('BED') || hasPermission('BED_CLEAN') || hasPermission('BED_TRANSFER') || hasPermission('HOUSEKEEPING_READ') || isSuperAdmin) && (
              <NavLink to="/admin/beds" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                <Bed size={19} className={styles.itemIcon} />
                <span>Inpatient & Bed Management</span>
              </NavLink>
            )}

            {(hasPermission('FACILITY_MANAGE') || isSuperAdmin) && (
              <NavLink to="/admin/facilities" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                <Building2 size={19} className={styles.itemIcon} />
                <span>Hospital Infrastructure</span>
              </NavLink>
            )}

            {/* HR & Telemetry */}
            {(canRead('STAFF') || hasPermission('HR_MANAGE') || isSuperAdmin) && (
              <>
                <div className={styles.menuSectionTitle}>HR & TELEMETRY</div>
                
                <NavLink to="/admin/staff" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                  <UserCog size={19} className={styles.itemIcon} />
                  <span>HR Staff Management</span>
                </NavLink>

                <NavLink to="/admin/employment-types" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                  <Briefcase size={19} className={styles.itemIcon} />
                  <span>Employment Types</span>
                </NavLink>

                <NavLink to="/admin/shifts" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                  <Clock size={19} className={styles.itemIcon} />
                  <span>Shift Schedules</span>
                </NavLink>

                <NavLink to="/admin/attendance" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                  <Activity size={19} className={styles.itemIcon} />
                  <span>Attendance Pulse</span>
                </NavLink>
              </>
            )}

            {/* Super Admin Security & Audits */}
            {(isSuperAdmin || hasPermission('ROLE_MANAGE') || hasPermission('AUDIT_VIEW')) && (
              <>
                <div className={styles.menuSectionTitle}>SECURITY & ACCESS</div>
                {(hasPermission('ROLE_MANAGE') || isSuperAdmin) && (
                  <NavLink to="/admin/roles" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                    <KeyRound size={19} className={styles.itemIcon} />
                    <span>System Roles & Permissions</span>
                  </NavLink>
                )}
                {(hasPermission('AUDIT_VIEW') || isSuperAdmin) && (
                  <NavLink to="/admin/audit-logs" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                    <ShieldAlert size={19} color="#e11d48" className={styles.itemIcon} />
                    <span style={{ color: '#e11d48', fontWeight: 600 }}>Security Audit Logs</span>
                  </NavLink>
                )}
              </>
            )}
          </>
        )}

        {/* DOCTOR WORKSPACE */}
        {isDoctor && (
          <>
            <div className={styles.menuSectionTitle}>DOCTOR WORKSPACE</div>
            <NavLink to="/doctor/dashboard" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <LayoutDashboard size={19} className={styles.itemIcon} /> <span>Doctor Dashboard</span>
            </NavLink>
            <NavLink to="/doctor/appointments" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <Calendar size={19} className={styles.itemIcon} /> <span>My Consultation Queue</span>
            </NavLink>
            <NavLink to="/doctor/prescriptions" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <FileText size={19} className={styles.itemIcon} /> <span>Write Prescriptions</span>
            </NavLink>
            <NavLink to="/doctor/leaves" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <Clock size={19} className={styles.itemIcon} /> <span>My Leave Applications</span>
            </NavLink>
          </>
        )}

        {/* PATIENT PORTAL */}
        {isPatient && (
          <>
            <div className={styles.menuSectionTitle}>PATIENT PORTAL</div>
            <NavLink to="/patient/dashboard" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <LayoutDashboard size={19} className={styles.itemIcon} /> <span>Health Overview</span>
            </NavLink>
            <NavLink to="/patient/book-appointment" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <CalendarPlus size={19} className={styles.itemIcon} /> <span>Book Consultation</span>
            </NavLink>
            <NavLink to="/patient/my-prescriptions" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <Pill size={19} className={styles.itemIcon} /> <span>My Prescriptions</span>
            </NavLink>
            <NavLink to="/patient/my-bills" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <Receipt size={19} className={styles.itemIcon} /> <span>My Hospital Bills</span>
            </NavLink>
          </>
        )}

        {/* RECEPTION DESK */}
        {isReceptionist && (
          <>
            <div className={styles.menuSectionTitle}>RECEPTION DESK</div>
            <NavLink to="/receptionist/dashboard" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <LayoutDashboard size={19} className={styles.itemIcon} /> <span>Desk Overview</span>
            </NavLink>
            <NavLink to="/receptionist/patient-registration" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <ClipboardList size={19} className={styles.itemIcon} /> <span>Patient Onboarding</span>
            </NavLink>
            <NavLink to="/receptionist/beds" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <Bed size={19} className={styles.itemIcon} /> <span>Live Bed Matrix</span>
            </NavLink>
            <NavLink to="/receptionist/walk-in-appointments" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <CalendarPlus size={19} className={styles.itemIcon} /> <span>Walk-in Appointments</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* Modern, Comfortable Sign Out Button (Always 100% visible, never cut off) */}
      <div className={styles.sidebarFooter}>
        <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={17} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
