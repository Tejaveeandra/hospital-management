import { logoutUser } from '../../api/api';
import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
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
  const role = (localStorage.getItem('role') || 'PATIENT').toUpperCase();
  const isSuperAdmin = ['SUPER_ADMIN', 'SUPER-ADMIN'].includes(role);
  const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'SUPER-ADMIN'].includes(role);
  const isDoctor = role === 'DOCTOR';
  const isPatient = role === 'PATIENT';
  const isReceptionist = role === 'RECEPTIONIST';

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

  const AccordionMenuItem = ({ menuKey, basePath, icon: Icon, label, subItems }) => {
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
            {subItems.map((sub, idx) => {
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
            <span className={styles.roleDesc}>Authenticated Portal</span>
          </div>
        </div>
      </div>

      <nav className={styles.navMenu}>
        {/* ADMIN PORTAL NAV */}
        {isAdmin && (
          <>
            <div className={styles.menuSectionTitle}>ADMIN OPERATIONS</div>
            
            <NavLink to="/admin/dashboard" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <LayoutDashboard size={18} /> <span>Main Dashboard</span>
            </NavLink>

            <AccordionMenuItem
              menuKey="users"
              basePath="/admin/users"
              icon={Users}
              label="User & Role Management"
              subItems={[
                { label: 'View All Users', op: 'viewAll' },
                { label: 'Register Staff / Admin', op: 'createAdmin' },
                { label: 'Create / Manage Roles', op: 'createRole' },
              ]}
            />

            <AccordionMenuItem
              menuKey="patients"
              basePath="/admin/patients"
              icon={UserCheck}
              label="Patient Records"
              subItems={[
                { label: 'Register New Patient', op: 'create' },
                { label: 'List All Patients', op: 'viewAll' },
                { label: 'Search Patient Record', op: 'view' },
                { label: 'Update Patient Details', op: 'update' },
                { label: 'Advanced Search', to: '/admin/patient-search' },
              ]}
            />

            <AccordionMenuItem
              menuKey="doctors"
              basePath="/admin/doctors"
              icon={Stethoscope}
              label="Doctor Roster"
              subItems={[
                { label: 'View All Doctors', op: 'viewAll' },
                { label: 'Onboard New Doctor', op: 'create' },
                { label: 'Search Doctor ID', op: 'getById' },
              ]}
            />

            <AccordionMenuItem
              menuKey="appointments"
              basePath="/admin/appointments"
              icon={Calendar}
              label="Master Appointments"
              subItems={[
                { label: 'View All Appointments', op: 'View All Appointments' },
                { label: 'Book Appointment', op: 'Create Appointment' },
                { label: 'Update / Reschedule', op: 'Update Appointment' },
                { label: 'Cancel Appointment', op: 'Cancel Appointment' },
              ]}
            />

            <AccordionMenuItem
              menuKey="departments"
              basePath="/admin/departments"
              icon={Building}
              label="Departments & Branches"
              subItems={[
                { label: 'List Departments', op: 'List Departments' },
                { label: 'Add Department', op: 'Add Department' },
                { label: 'View / Manage Branches', op: 'List Branches' },
                { label: 'Create New Branch', op: 'Add Branch' },
                { label: 'Doctors by Department', op: 'Doctors by Department' },
              ]}
            />

            <AccordionMenuItem
              menuKey="prescriptions"
              basePath="/admin/prescriptions"
              icon={Pill}
              label="Prescriptions Log"
              subItems={[
                { label: 'List All Prescriptions', op: 'List Prescriptions' },
                { label: 'Create Prescription', op: 'Create Prescription' },
              ]}
            />

            <AccordionMenuItem
              menuKey="medicineStore"
              basePath="/admin/medicine-store"
              icon={Store}
              label="Pharmacy Store"
              subItems={[
                { label: 'List Store Inventory', op: 'List Medicine Store' },
                { label: 'Add Medicine Stock', op: 'Add to Store' },
                { label: 'Update Store Item', op: 'Update Store Item' },
                { label: 'Remove Medicine', op: 'Delete from Store' },
              ]}
            />

            <AccordionMenuItem
              menuKey="hospitalCharges"
              basePath="/admin/hospital-charges"
              icon={Receipt}
              label="Hospital Charges"
              subItems={[
                { label: 'List Fee Schedules', op: 'List Charges' },
                { label: 'Add Fee Schedule', op: 'Add Charge' },
                { label: 'Update Fee Schedule', op: 'Update Charge' },
                { label: 'Delete Fee Schedule', op: 'Delete Charge' },
                { label: 'Process Insurance Claim', to: '/admin/insurance-claims' },
              ]}
            />

            <AccordionMenuItem 
              menuKey="diagnostics" 
              basePath="/admin/diagnostics" 
              icon={Stethoscope} 
              label="Clinical & Diagnostics" 
              subItems={[ 
                { label: 'List Lab Tests', op: 'viewAll' }, 
                { label: 'Add New Lab Test', op: 'create' }, 
                { label: 'Order Lab Test', op: 'order' } 
              ]} 
            />

            <AccordionMenuItem 
              menuKey="surgeries" 
              basePath="/admin/surgeries" 
              icon={Syringe} 
              label="Surgery Management" 
              subItems={[ 
                { label: 'List Surgery Catalog', op: 'viewAll' }, 
                { label: 'Add New Procedure', op: 'create' }, 
                { label: 'Update Procedure', op: 'update' }, 
                { label: 'Schedule a Surgery', op: 'schedule' } 
              ]} 
            />

            <div className={styles.menuSectionTitle}>INPATIENT & FACILITIES</div>

            <AccordionMenuItem
              menuKey="beds"
              basePath="/admin/beds"
              icon={Bed}
              label="Inpatient & Bed Management"
              subItems={[
                { label: 'Live Bed Matrix', op: 'matrix' },
                { label: 'Admit / Allocate Patient', op: 'allocate' },
                { label: 'Bed Transfers', op: 'transfer' },
                { label: 'Housekeeping & Sanitization', op: 'housekeeping' },
                { label: 'Bed Stay Audit Logs', op: 'logs' },
              ]}
            />

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

            <div className={styles.menuSectionTitle}>HR & TELEMETRY</div>
            
            <AccordionMenuItem
              menuKey="hr"
              basePath="/admin/staff"
              icon={UserCog}
              label="HR Staff Management"
              subItems={[
                { label: 'Staff Roster', op: 'roster' },
                { label: 'Onboard Staff Member', op: 'create' },
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

            {isSuperAdmin && (
              <>
                <AccordionMenuItem 
                  menuKey="leaves" 
                  basePath="/admin/leaves" 
                  icon={ShieldAlert} 
                  label="Leave Approvals" 
                  subItems={[ 
                    { label: 'Review Pending Leaves', op: 'approve' } 
                  ]} 
                />
                <AccordionMenuItem 
                  menuKey="hr" 
                  basePath="/admin/hr" 
                  icon={ShieldAlert} 
                  label="HR & Credentials" 
                  subItems={[ 
                    { label: 'Check Credentials', op: 'credentials' }, 
                    { label: 'Hire Candidate', op: 'hire' } 
                  ]} 
                />
                <div className={styles.menuSectionTitle}>SUPER ADMIN SECURITY</div>
                <NavLink to="/admin/master-console" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                  <ShieldAlert size={18} color="#0284c7" /> <span style={{ color: "#0284c7", fontWeight: 600 }}>Master API Console</span>
                </NavLink>
                <NavLink to="/admin/roles" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                  <KeyRound size={18} /> <span>System Roles</span>
                </NavLink>
                <NavLink to="/admin/audit-logs" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                  <ShieldAlert size={18} color="#f43f5e" /> <span style={{ color: '#f43f5e', fontWeight: 600 }}>Kafka Security Audit Logs</span>
                </NavLink>
              </>
            )}
          </>
        )}

        {/* DOCTOR PORTAL NAV */}
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

        {/* PATIENT PORTAL NAV */}
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

        {/* RECEPTIONIST PORTAL NAV */}
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
        <button onClick={handleLogout} className={styles.logoutBtn}>
          <LogOut size={18} />
          <span>Secure Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
