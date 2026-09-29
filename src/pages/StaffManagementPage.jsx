import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/api';
import InputBox from '../components/Form/InputBox';
import SelectDropdown from '../components/Form/SelectDropdown';
import { UserCog, Plus, CheckCircle, ShieldAlert, Building2 } from 'lucide-react';
import styles from './ModulePages.module.css';

const StaffManagementPage = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(searchParams.get('op') === 'create');

  useEffect(() => {
    if (searchParams.get('op') === 'create') {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [searchParams]);
  const [activeTab, setActiveTab] = useState('staff');

  // Dynamic Dropdown & Branch Summary States
  const [roles, setRoles] = useState([]);
  const [employmentTypes, setEmploymentTypes] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchSummary, setBranchSummary] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    contactNumber: '',
    govIdNumber: '',
    taxIdNumber: '',
    gender: 'FEMALE',
    bloodGroup: 'O+',
    dob: '',
    qualification: '',
    baseSalary: '',
    role: '',
    branchId: '',
    departmentId: '',
    department: '',
    employmentType: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  useEffect(() => {
    fetchStaff();
    fetchBranches();
    fetchRoles();
    fetchEmploymentTypes();
  }, []);

  const fetchEmploymentTypes = async () => {
    try {
      const res = await api.get('/api/hr/employment-types');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map(et => ({
          label: et.name || et.description || et.type || String(et),
          value: et.name || et.id || String(et)
        }));
        setEmploymentTypes(mapped);
      } else {
        setEmploymentTypes([]);
      }
    } catch (e) {
      console.error("Error loading dynamic employment types", e);
      setEmploymentTypes([]);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await api.get('/api/branches');
      if (Array.isArray(res.data)) {
        const mapped = res.data.map(b => ({
          label: `${b.branchName || b.name || 'Branch'} (${b.location || b.city || '#' + b.id})`,
          value: b.branchId || b.id,
          name: b.branchName || b.name
        }));
        setBranches(mapped);

        // Fetch department summary for each branch
        const summaryPromises = res.data.map(async (b) => {
          try {
            const deptRes = await api.get(`/api/departments/branch/${b.branchId || b.id}`);
            const depts = Array.isArray(deptRes.data) ? deptRes.data : [];
            return {
              id: b.branchId || b.id,
              name: b.branchName || b.name || `Branch #${b.id}`,
              code: b.branchCode || b.code || `BR-${b.branchId || b.id}`,
              location: b.location || b.city || 'Main Campus',
              departmentCount: depts.length,
              departmentNames: depts.map(d => d.departmentName || d.name).join(', ') || 'No departments linked',
              departments: depts,
              status: b.status || 'ACTIVE'
            };
          } catch (e) {
            return {
              id: b.id,
              name: b.branchName || b.name || `Branch #${b.id}`,
              code: b.code || `BR-${b.id}`,
              location: b.location || b.city || 'Main Campus',
              departmentCount: 0,
              departmentNames: 'N/A',
              departments: [],
              status: b.status || 'ACTIVE'
            };
          }
        });

        const summaries = await Promise.all(summaryPromises);
        setBranchSummary(summaries);
      }
    } catch (e) {
      console.error("Error loading branches", e);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get('/users/roles');
      if (Array.isArray(res.data)) {
        const mapped = res.data.map(r => typeof r === 'string' ? r : (r.name || r.roleName || r.role || r.id));
        setRoles(mapped);
      } else {
        setRoles([]);
      }
    } catch (e) {
      console.error("Error loading system roles from database", e);
      setRoles([]);
    }
  };

  const handleBranchChange = async (e) => {
    const selectedBranchId = e.target.value;
    setFormData(prev => ({
      ...prev,
      branchId: selectedBranchId,
      departmentId: '',
      department: ''
    }));

    if (!selectedBranchId) {
      setDepartments([]);
      return;
    }

    setLoadingDepts(true);
    try {
      const res = await api.get(`/api/departments/branch/${selectedBranchId}`);
      if (Array.isArray(res.data)) {
        console.log('Departments Response:', res.data); const mapped = res.data.map(d => ({
          label: d.departmentName || d.name || `Department #${d.departmentId || d.id}`,
          value: d.departmentId || d.id,
          deptName: d.departmentName || d.name
        }));
        setDepartments(mapped);
      } else {
        setDepartments([]);
      }
    } catch (e) {
      console.error("Error loading departments for selected branch", e);
      setDepartments([]);
    } finally {
      setLoadingDepts(false);
    }
  };

  const handleDepartmentChange = (e) => {
    const selectedDeptId = e.target.value;
    const foundDept = departments.find(d => String(d.value) === String(selectedDeptId));
    setFormData(prev => ({
      ...prev,
      departmentId: selectedDeptId,
      department: foundDept ? (foundDept.deptName || foundDept.label) : ''
    }));
  };

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/hr/staff');
      if (Array.isArray(res.data)) {
        const formatted = res.data.map(s => ({
          ...s,
          name: s.fullName || s.name || 'Staff Member',
          email: s.email || 'N/A',
          contact: s.contactNumber || s.contact || 'N/A',
          code: s.staffCode || `STF-${s.id}`,
          role: s.role || 'STAFF',
          department: s.department || 'General Care',
          branchId: s.branchId ? `Branch #${s.branchId}` : 'Main Branch',
          rawBranchId: s.branchId,
          employmentType: s.employmentType?.name || s.employmentType || 'FULL_TIME',
          govId: s.govIdNumber || 'N/A',
          taxId: s.taxIdNumber || 'N/A',
          salary: s.baseSalary ? `₹${Number(s.baseSalary).toLocaleString()}` : 'N/A',
          status: s.status || 'ACTIVE'
        }));
        setStaffList(formatted);
      } else {
        setStaffList([]);
      }
    } catch (e) {
      console.error("Error loading staff roster", e);
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        contactNumber: formData.contactNumber,
        govIdNumber: formData.govIdNumber,
        taxIdNumber: formData.taxIdNumber,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        dob: formData.dob,
        qualification: formData.qualification,
        baseSalary: formData.baseSalary ? parseFloat(formData.baseSalary) : null,
        role: formData.role,
        branchId: formData.branchId ? parseInt(formData.branchId) : null,
        departmentId: formData.departmentId ? parseInt(formData.departmentId) : null,
        department: formData.department,
        employmentType: formData.employmentType,
        address: formData.address,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
      };

      await api.post('/api/hr/staff', payload);
      setMessage({ text: 'Staff member onboarded successfully to database!', type: 'success' });
      setShowModal(false);
      setFormData({
        fullName: '',
        email: '',
        contactNumber: '',
        govIdNumber: '',
        taxIdNumber: '',
        gender: 'FEMALE',
        bloodGroup: 'O+',
        dob: '',
        qualification: '',
        baseSalary: '',
        role: 'NURSE',
        branchId: '',
        departmentId: '',
        department: '',
        employmentType: 'FULL_TIME_PERMANENT',
        address: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
      });
      setDepartments([]);
      fetchStaff();
      fetchBranches();
    } catch (e) {
      const errMsg = e.response?.data?.message || 'Error saving staff member to database.';
      setMessage({ text: errMsg, type: 'error' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const filteredStaff = staffList.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.role?.toLowerCase().includes(search.toLowerCase()) ||
    s.department?.toLowerCase().includes(search.toLowerCase()) ||
    s.govId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.title}><UserCog size={24} color="#0284c7" /> HR Staff & Employee Roster</h2>
          <p className={styles.subtitle}>Onboard and manage nurses, receptionists, janitors, and clinical technicians into database table public.staff.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Onboard Staff Member
        </button>
      </div>

      {message && (
        <div className={`${styles.alert} ${message.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <ShieldAlert size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Hospital Branches & Department Distribution Table */}
      <div className={`glass-card ${styles.tableCard}`} style={{ marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(226, 232, 240, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Building2 size={20} color="#0284c7" /> Hospital Branches & Department Breakdown
          </h3>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Total Branches: {branchSummary.length}</span>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Branch Code</th>
              <th>Hospital Branch Name</th>
              <th>Location</th>
              <th>Total Departments</th>
              <th>Mapped Departments</th>
              <th>Assigned Employees</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {branchSummary.map((b) => {
              const staffInBranch = staffList.filter(s => String(s.rawBranchId) === String(b.id)).length;
              return (
                <tr key={b.id}>
                  <td className={styles.fontCode}>{b.code}</td>
                  <td className={styles.fontBold}>{b.name}</td>
                  <td>{b.location}</td>
                  <td>
                    <span className={styles.badgeGray} style={{ fontWeight: 600, color: '#0284c7' }}>
                      {b.departmentCount} Departments
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: '#475569' }}>
                    {b.departmentNames}
                  </td>
                  <td className={styles.fontBold}>{staffInBranch} Staff Members</td>
                  <td>
                    <span className={styles.statusActive}>
                      <span className="pulse-indicator" /> {b.status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {branchSummary.length === 0 && (
              <tr>
                <td colSpan="7" className={styles.emptyRow}>No hospital branches found in database.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {activeTab === 'staff' && (
        <>
<div className={styles.filterBar}>
        <InputBox
          type="search"
          placeholder="Search staff by name, role, department, or Gov ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
        />
      </div>

      <div className={`glass-card ${styles.tableCard}`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Staff Code</th>
              <th>Employee Name & Email</th>
              <th>Role & Department</th>
              <th>Branch</th>
              <th>Gov ID / PAN</th>
              <th>Contact Phone</th>
              <th>Qualification & Details</th>
              <th>Base Salary</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map((staff) => (
              <tr key={staff.id}>
                <td className={styles.fontCode}>{staff.code}</td>
                <td className={styles.fontBold}>
                  {staff.name}
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>{staff.email}</span>
                </td>
                <td>
                  <span style={{ fontWeight: 600, color: '#0284c7' }}>{staff.role}</span>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>{staff.department}</span>
                </td>
                <td>
                  <span className={styles.badgeGray}>{staff.branchId}</span>
                </td>
                <td>
                  <span className={styles.badgeGray}>{staff.govId}</span>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>{staff.taxId}</span>
                </td>
                <td>{staff.contact}</td>
                <td>
                  {staff.qualification || 'N/A'}
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>{staff.gender} ({staff.employmentType})</span>
                </td>
                <td className={styles.fontBold}>{staff.salary}</td>
                <td>
                  <span className={styles.statusActive}>
                    <span className="pulse-indicator" /> {staff.status}
                  </span>
                </td>
              </tr>
            ))}
            {filteredStaff.length === 0 && (
              <tr>
                <td colSpan="9" className={styles.emptyRow}>No staff members found in database.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
        </>
      )}

            </>
      )}

      {showModal && (
        <div className={styles.inlineFormCard}>
          <div className={styles.formHeaderRow}>
            <h3>Onboard New Staff Member</h3>
            <p className={styles.fontMuted}>Enter official employee contact, employment type, and department role details</p>
          </div>
          <form onSubmit={handleCreateStaff}>
            <div className={styles.gridTwo}>
              <InputBox
                label="Full Name *"
                required
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g. Sarah Jenkins"
              />

              <InputBox
                label="Email Address *"
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="sarah.j@hospital.org"
              />

              <SelectDropdown
                label="Staff Role *"
                required
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
                options={roles}
                placeholder="Select Role"
              />

              <SelectDropdown
                label="Hospital Branch *"
                required
                value={formData.branchId}
                onChange={handleBranchChange}
                options={branches}
                placeholder="Select Hospital Branch"
              />

              <SelectDropdown
                label="Department *"
                required
                disabled={!formData.branchId || loadingDepts}
                value={formData.departmentId}
                onChange={handleDepartmentChange}
                options={departments}
                placeholder={!formData.branchId ? "Select Branch First" : (loadingDepts ? "Loading Departments..." : "Select Department")}
              />

              <SelectDropdown
                label="Employment Type *"
                required
                value={formData.employmentType}
                onChange={e => setFormData({ ...formData, employmentType: e.target.value })}
                options={employmentTypes}
                placeholder="Select Employment Type"
              />

              <InputBox
                label="Contact Phone *"
                required
                value={formData.contactNumber}
                onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
                placeholder="+91 9876543210"
              />

              <InputBox
                label="Government ID (Aadhar) *"
                required
                value={formData.govIdNumber}
                onChange={e => setFormData({ ...formData, govIdNumber: e.target.value })}
                placeholder="12-digit Aadhar or Gov ID"
              />

              <InputBox
                label="Tax ID Number (PAN) *"
                required
                value={formData.taxIdNumber}
                onChange={e => setFormData({ ...formData, taxIdNumber: e.target.value })}
                placeholder="10-digit PAN ID"
              />

              <SelectDropdown
                label="Gender *"
                required
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value })}
                options={["FEMALE", "MALE", "OTHER"]}
              />

              <SelectDropdown
                label="Blood Group *"
                required
                value={formData.bloodGroup}
                onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
                options={["A+", "B+", "O+", "AB+", "A-", "B-", "O-", "AB-"]}
              />

              <InputBox
                label="Date of Birth *"
                type="date"
                required
                value={formData.dob}
                onChange={e => setFormData({ ...formData, dob: e.target.value })}
              />

              <InputBox
                label="Qualification *"
                required
                value={formData.qualification}
                onChange={e => setFormData({ ...formData, qualification: e.target.value })}
                placeholder="e.g. B.Sc Nursing / Diploma"
              />

              <InputBox
                label="Base Monthly Salary (₹) *"
                type="number"
                required
                value={formData.baseSalary}
                onChange={e => setFormData({ ...formData, baseSalary: e.target.value })}
                placeholder="e.g. 45000"
              />

              <InputBox
                label="Primary Address"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="Residential address"
              />

              <InputBox
                label="Emergency Contact Name"
                value={formData.emergencyContactName}
                onChange={e => setFormData({ ...formData, emergencyContactName: e.target.value })}
                placeholder="Relative / Guardian Name"
              />

              <InputBox
                label="Emergency Contact Phone"
                value={formData.emergencyContactPhone}
                onChange={e => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                placeholder="+91 9876543210"
              />
            </div>

            <div className={styles.formActionsRow}>
              <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); setSearchParams({}); }}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Onboarding...' : 'Save & Onboard Member'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default StaffManagementPage;
