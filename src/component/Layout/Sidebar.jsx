import { logoutUser } from '../../api/api';
import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  hasPermission,
  canRead,
  canCreate,
  canUpdate,
  canDelete,
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
  ChevronDown,
  ChevronRight,
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
  const location = useLocation();
  const role = (localStorage.getItem('role') || 'PATIENT').toUpperCase().replace('-', '_');
  const isSuperAdmin = isSuperAdminUser();
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(role);
  const isDoctor = role === 'DOCTOR';
  const isPatient = role === 'PATIENT';
  const isReceptionist = role === 'RECEPTIONIST';
  
  // All hospital staff who operate within the enterprise portal
  const isStaff = !isDoctor && !isPatient && !isReceptionist;

  const [expandedMenus, setExpandedMenus] = useState({
    users: location.pathname.includes('/users'),
    patients: location.pathname.includes('/patients') || location.pathname.includes('/patient-search'),
    doctors: location.pathname.includes('/doctors'),
    appointments: location.pathname.includes('/appointments'),
    departments: location.pathname.includes('/departments'),
    prescriptions: location.pathname.includes('/prescriptions'),
    medicineStore: location.pathname.includes('/medicine-store'),
    hospitalCharges: location.pathname.includes('/hospital-charges') || location.pathname.includes('/insurance-claims'),
    beds: location.pathname.includes('/beds'),
    facilities: location.pathname.includes('/facilities'),
    hr: location.pathname.includes('/staff') || location.pathname.includes('/hr'),
    diagnostics: location.pathname.includes('/diagnostics'),
    surgeries: location.pathname.includes('/surgeries'),
    leaves: location.pathname.includes('/leaves'),
  });

  const toggleMenu = (menuKey) => {
    setExpandedMenus(prev => ({ ...prev, [menuKey]: !prev[menuKey] }));
  };

  const handleLogout = async () => {
    await logoutUser();
    navigate('/');
  };

  const isPathActive = (basePath) => location.pathname.startsWith(basePath);

  const AccordionMenuItem = ({ menuKey, basePath, icon: Icon, label, subItems, visible = true }) => {
    if (!visible && !isSuperAdmin) return null;

    // Filter subItems based on dynamic permissions
    const allowedSubItems = subItems.filter(sub => {
      if (isSuperAdmin) return true;
      if (sub.show !== undefined) return sub.show;
      return true;
    });

    if (allowedSubItems.length === 0 && !isSuperAdmin) return null;

    const isExpanded = expandedMenus[menuKey];
    const isActive = isPathActive(basePath);

    return (
      <div className={styles.navGroup}>
        <button 
          type="button"
          className={`${styles.navItem} ${isActive ? styles.activeGroup : ''}`}
          onClick={() => toggleMenu(menuKey)}
        >
          <div className={styles.navItemMain}>
            <Icon size={18} />
            <span>{label}</span>
          </div>
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {isExpanded && (
          <div className={styles.subMenu}>
            {allowedSubItems.map((sub, idx) => {
              const linkTo = sub.to || (sub.op ? `${basePath}?op=${encodeURIComponent(sub.op)}` : basePath);
              const isSubActive = sub.to 
                ? location.pathname === sub.to 
                : sub.op 
                  ? location.search.includes(encodeURIComponent(sub.op)) 
                  : location.pathname === basePath;

              return (
                <NavLink
                  key={idx}
                  to={linkTo}
                  className={`${styles.subMenuItem} ${isSubActive ? styles.activeSub : ''}`}
                >
                  <span className={styles.bulletDot} />
                  <span>{sub.label}</span>
                </NavLink>
              );
            })}
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
            <p>Hospital Enterprise</p>
          </div>
        </div>
        
        <div className={styles.roleCard}>
          <div className={styles.roleInfo}>
            <span className={styles.roleName}>{role}</span>
            <span className={styles.roleDesc}>Dynamic RBAC Portal</span>
          </div>
        </div>
      </div>

      <nav className={styles.navMenu}>
        {/* HOSPITAL STAFF & ENTERPRISE PORTAL NAV */}
        {isStaff && (
          <>
            <div className={styles.menuSectionTitle}>OPERATIONS</div>
            
            <NavLink to="/admin/dashboard" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <LayoutDashboard size={18} /> <span>Main Dashboard</span>
            </NavLink>

            {/* User & Role Management */}
            <AccordionMenuItem
              menuKey="users"
              basePath="/admin/users"
              icon={Users}
              label="User & Role Management"
              visible={canRead('USER') || hasPermission('ROLE_MANAGE') || isSuperAdmin}
              subItems={[
                { label: 'View All Users', op: 'viewAll', show: canRead('USER') },
                { label: 'Register Staff / Admin', op: 'createAdmin', show: canCreate('USER') },
                { label: 'Create / Manage Roles', op: 'createRole', show: hasPermission('ROLE_MANAGE') },
              ]}
            />

            {/* Patient Records */}
            <AccordionMenuItem
              menuKey="patients"
              basePath="/admin/patients"
              icon={UserCheck}
              label="Patient Records"
              visible={canRead('PATIENT')}
              subItems={[
                { label: 'Register New Patient', op: 'create', show: canCreate('PATIENT') },
                { label: 'List All Patients', op: 'viewAll', show: canRead('PATIENT') },
                { label: 'Search Patient Record', op: 'view', show: canRead('PATIENT') },
                { label: 'Update Patient Details', op: 'update', show: canUpdate('PATIENT') },
                { label: 'Advanced Search', to: '/admin/patient-search', show: canRead('PATIENT') },
              ]}
            />

            {/* Doctor Roster */}
            <AccordionMenuItem
              menuKey="doctors"
              basePath="/admin/doctors"
              icon={Stethoscope}
              label="Doctor Roster"
              visible={canRead('DOCTOR')}
              subItems={[
                { label: 'View All Doctors', op: 'viewAll', show: canRead('DOCTOR') },
                { label: 'Onboard New Doctor', op: 'create', show: canCreate('DOCTOR') },
                { label: 'Search Doctor ID', op: 'getById', show: canRead('DOCTOR') },
              ]}
            />

            {/* Master Appointments */}
            <AccordionMenuItem
              menuKey="appointments"
              basePath="/admin/appointments"
              icon={Calendar}
              label="Master Appointments"
              visible={canRead('APPOINTMENT')}
              subItems={[
                { label: 'View All Appointments', op: 'View All Appointments', show: canRead('APPOINTMENT') },
                { label: 'Book Appointment', op: 'Create Appointment', show: canCreate('APPOINTMENT') },
                { label: 'Update / Reschedule', op: 'Update Appointment', show: canUpdate('APPOINTMENT') },
                { label: 'Cancel Appointment', op: 'Cancel Appointment', show: canDelete('APPOINTMENT') },
              ]}
            />

            {/* Departments & Branches */}
            <AccordionMenuItem
              menuKey="departments"
              basePath="/admin/departments"
              icon={Building}
              label="Departments & Branches"
              visible={canRead('DEPARTMENT') || canRead('BRANCH')}
              subItems={[
                { label: 'List Departments', op: 'List Departments', show: canRead('DEPARTMENT') },
                { label: 'Add Department', op: 'Add Department', show: canCreate('DEPARTMENT') },
                { label: 'View / Manage Branches', op: 'List Branches', show: canRead('BRANCH') },
                { label: 'Create New Branch', op: 'Add Branch', show: canCreate('BRANCH') },
                { label: 'Doctors by Department', op: 'Doctors by Department', show: canRead('DOCTOR') },
              ]}
            />

            {/* Prescriptions Log */}
            <AccordionMenuItem
              menuKey="prescriptions"
              basePath="/admin/prescriptions"
              icon={Pill}
              label="Prescriptions Log"
              visible={canRead('PRESCRIPTION')}
              subItems={[
                { label: 'List All Prescriptions', op: 'List Prescriptions', show: canRead('PRESCRIPTION') },
                { label: 'Create Prescription', op: 'Create Prescription', show: canCreate('PRESCRIPTION') },
              ]}
            />

            {/* Pharmacy Store */}
            <AccordionMenuItem
              menuKey="medicineStore"
              basePath="/admin/medicine-store"
              icon={Store}
              label="Pharmacy Store"
              visible={canRead('PHARMACY')}
              subItems={[
                { label: 'List Store Inventory', op: 'List Medicine Store', show: canRead('PHARMACY') },
                { label: 'Add Medicine Stock', op: 'Add to Store', show: canCreate('PHARMACY') },
                { label: 'Update Store Item', op: 'Update Store Item', show: canUpdate('PHARMACY') },
                { label: 'Remove Medicine', op: 'Delete from Store', show: canDelete('PHARMACY') },
              ]}
            />

            {/* Hospital Charges & Billing */}
            <AccordionMenuItem
              menuKey="hospitalCharges"
              basePath="/admin/hospital-charges"
              icon={Receipt}
              label="Hospital Charges & Billing"
              visible={canRead('CHARGES') || canRead('BILLING') || hasPermission('PAYMENT_MANAGE')}
              subItems={[
                { label: 'List Fee Schedules', op: 'List Charges', show: canRead('CHARGES') || canRead('BILLING') },
                { label: 'Add Fee Schedule', op: 'Add Charge', show: canCreate('CHARGES') || canCreate('BILLING') },
                { label: 'Update Fee Schedule', op: 'Update Charge', show: canUpdate('CHARGES') || canUpdate('BILLING') },
                { label: 'Delete Fee Schedule', op: 'Delete Charge', show: canDelete('CHARGES') || canDelete('BILLING') },
                { label: 'Process Insurance Claim', to: '/admin/insurance-claims', show: hasPermission('INSURANCE_MANAGE') || hasPermission('BILLING_MANAGE') || isSuperAdmin },
              ]}
            />

            {/* Clinical & Diagnostics */}
            <AccordionMenuItem 
              menuKey="diagnostics" 
              basePath="/admin/diagnostics" 
              icon={Stethoscope} 
              label="Clinical & Diagnostics" 
              visible={canRead('DIAGNOSTICS') || hasPermission('LAB_READ') || hasPermission('RADIOLOGY_READ')}
              subItems={[ 
                { label: 'List Lab Tests', op: 'viewAll', show: canRead('DIAGNOSTICS') || hasPermission('LAB_READ') }, 
                { label: 'Add New Lab Test', op: 'create', show: canCreate('DIAGNOSTICS') }, 
                { label: 'Order Lab Test', op: 'order', show: canUpdate('DIAGNOSTICS') || canCreate('DIAGNOSTICS') } 
              ]} 
            />

            {/* Surgery Management */}
            <AccordionMenuItem 
              menuKey="surgeries" 
              basePath="/admin/surgeries" 
              icon={Syringe} 
              label="Surgery Management" 
              visible={canRead('SURGERY') || hasPermission('SURGERY_MANAGE')}
              subItems={[ 
                { label: 'List Surgery Catalog', op: 'viewAll', show: canRead('SURGERY') }, 
                { label: 'Add New Procedure', op: 'create', show: canCreate('SURGERY') }, 
                { label: 'Update Procedure', op: 'update', show: canUpdate('SURGERY') }, 
                { label: 'Schedule a Surgery', op: 'schedule', show: hasPermission('SURGERY_MANAGE') } 
              ]} 
            />

            <div className={styles.menuSectionTitle}>INPATIENT & FACILITIES</div>

            {/* Inpatient & Bed Management */}
            <AccordionMenuItem
              menuKey="beds"
              basePath="/admin/beds"
              icon={Bed}
              label="Inpatient & Bed Management"
              visible={canRead('BED') || hasPermission('BED_CLEAN') || hasPermission('BED_TRANSFER') || hasPermission('HOUSEKEEPING_READ')}
              subItems={[
                { label: 'Live Bed Matrix', op: 'matrix', show: canRead('BED') },
                { label: 'Admit / Allocate Patient', op: 'allocate', show: hasPermission('BED_ALLOCATE') || canCreate('BED') },
                { label: 'Bed Transfers', op: 'transfer', show: hasPermission('BED_TRANSFER') || canUpdate('BED') },
                { label: 'Housekeeping & Sanitization', op: 'housekeeping', show: hasPermission('BED_CLEAN') || hasPermission('HOUSEKEEPING_UPDATE') || canUpdate('BED') },
                { label: 'Bed Stay Audit Logs', op: 'logs', show: canRead('BED') || hasPermission('AUDIT_VIEW') },
              ]}
            />

            {/* Hospital Infrastructure */}
            {(hasPermission('FACILITY_MANAGE') || isSuperAdmin) && (
              <AccordionMenuItem
                menuKey="facilities"
                basePath="/admin/facilities"
                icon={Building2}
                label="Hospital Infrastructure"
                subItems={[
                  { label: 'Buildings & Wings', op: 'buildings' },
                  { label: 'Wards Management', op: 'wards' },
                  { label: 'Rooms & Daily Tariffs', op: 'rooms' },
                  { label: 'Bed Inventory & Bulk Gen', op: 'beds' },
                  { label: 'Facility Master Categories', op: 'categories' },
                ]}
              />
            )}

            {/* HR & Telemetry */}
            {(canRead('STAFF') || hasPermission('HR_MANAGE') || isSuperAdmin) && (
              <>
                <div className={styles.menuSectionTitle}>HR & TELEMETRY</div>
                
                <AccordionMenuItem
                  menuKey="hr"
                  basePath="/admin/staff"
                  icon={UserCog}
                  label="HR Staff Management"
                  subItems={[
                    { label: 'Staff Roster', op: 'roster', show: canRead('STAFF') },
                    { label: 'Onboard Staff Member', op: 'create', show: canCreate('STAFF') },
                    { label: 'Walk-in Interview Candidates', to: '/admin/candidates', show: hasPermission('HR_MANAGE') || hasPermission('RECRUITMENT_READ') || isSuperAdmin },
                  ]}
                />

                <NavLink to="/admin/employment-types" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                  <Briefcase size={18} /> <span>Employment Types</span>
                </NavLink>

                <NavLink to="/admin/shifts" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                  <Clock size={18} /> <span>Shift Schedules</span>
                </NavLink>

                <NavLink to="/admin/attendance" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                  <Activity size={18} /> <span>Attendance Pulse</span>
                </NavLink>
              </>
            )}

            {/* Super Admin Security & Audits */}
            {(isSuperAdmin || hasPermission('ROLE_MANAGE') || hasPermission('AUDIT_VIEW')) && (
              <>
                <div className={styles.menuSectionTitle}>SECURITY & ACCESS</div>
                {isSuperAdmin && (
                  <NavLink to="/admin/master-console" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                    <ShieldAlert size={18} color="#0284c7" /> <span style={{ color: "#0284c7", fontWeight: 600 }}>Master API Console</span>
                  </NavLink>
                )}
                {(hasPermission('ROLE_MANAGE') || isSuperAdmin) && (
                  <NavLink to="/admin/roles" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                    <KeyRound size={18} /> <span>System Roles & Permissions</span>
                  </NavLink>
                )}
                {(hasPermission('AUDIT_VIEW') || isSuperAdmin) && (
                  <NavLink to="/admin/audit-logs" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                    <ShieldAlert size={18} color="#f43f5e" /> <span style={{ color: '#f43f5e', fontWeight: 600 }}>Security Audit Logs</span>
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
              <LayoutDashboard size={18} /> <span>Doctor Dashboard</span>
            </NavLink>
            <NavLink to="/doctor/appointments" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <Calendar size={18} /> <span>My Consultation Queue</span>
            </NavLink>
            <NavLink to="/doctor/prescriptions" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <FileText size={18} /> <span>Write Prescriptions</span>
            </NavLink>
            <NavLink to="/doctor/leaves" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <Clock size={18} /> <span>My Leave Applications</span>
            </NavLink>
          </>
        )}

        {/* PATIENT PORTAL */}
        {isPatient && (
          <>
            <div className={styles.menuSectionTitle}>PATIENT PORTAL</div>
            <NavLink to="/patient/dashboard" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <LayoutDashboard size={18} /> <span>Health Overview</span>
            </NavLink>
            <NavLink to="/patient/book-appointment" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <CalendarPlus size={18} /> <span>Book Consultation</span>
            </NavLink>
            <NavLink to="/patient/my-prescriptions" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <Pill size={18} /> <span>My Prescriptions</span>
            </NavLink>
            <NavLink to="/patient/my-bills" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <Receipt size={18} /> <span>My Hospital Bills</span>
            </NavLink>
          </>
        )}

        {/* RECEPTION DESK */}
        {isReceptionist && (
          <>
            <div className={styles.menuSectionTitle}>RECEPTION DESK</div>
            <NavLink to="/receptionist/dashboard" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <LayoutDashboard size={18} /> <span>Desk Overview</span>
            </NavLink>
            <NavLink to="/receptionist/patient-registration" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <ClipboardList size={18} /> <span>Patient Onboarding</span>
            </NavLink>
            <NavLink to="/receptionist/beds" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <Bed size={18} /> <span>Live Bed Matrix</span>
            </NavLink>
            <NavLink to="/receptionist/walk-in-appointments" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <CalendarPlus size={18} /> <span>Walk-in Appointments</span>
            </NavLink>
          </>
        )}
      </nav>

      <div className={styles.sidebarFooter}>
        <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;