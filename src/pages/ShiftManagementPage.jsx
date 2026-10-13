import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/api';
import SelectDropdown from '../components/Form/SelectDropdown';
import DatePicker from '../components/Form/DatePicker';
import { 
  Clock, Calendar, CheckCircle, AlertCircle, Trash2, 
  Stethoscope, Users, Building, Search, RefreshCw, UserCheck, MapPin, Filter
} from 'lucide-react';
import styles from './ModulePages.module.css';

const ShiftManagementPage = () => {
  // Main data collections
  const [shifts, setShifts] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [message, setMessage] = useState(null);

  // Flexible Filter criteria for personnel assignment
  const [selectedPersonnelType, setSelectedPersonnelType] = useState('ALL'); // 'ALL' | 'DOCTOR' | 'STAFF'
  const [selectedDeptId, setSelectedDeptId] = useState('ALL'); // 'ALL' or department identifier

  // Form input data
  const [formData, setFormData] = useState({
    staffName: '',
    role: 'STAFF',
    department: '',
    shiftType: 'MORNING (08:00 - 16:00)',
    shiftDate: new Date().toISOString().split('T')[0],
    assignedWard: 'OPD-01',
  });

  // Table search & filter state
  const [tableSearch, setTableSearch] = useState('');
  const [tableRoleFilter, setTableRoleFilter] = useState('ALL'); // 'ALL' | 'DOCTOR' | 'STAFF'

  useEffect(() => {
    fetchAllocations();
    loadAllMasterData();
  }, []);

  const fetchAllocations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/hr/shifts/allocations');
      setShifts(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Error loading shift allocations", e);
      setShifts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAllMasterData = async () => {
    setFetchingData(true);
    
    // 1. Fetch Doctors (with fallback)
    try {
      let docRes = null;
      try {
        docRes = await api.get('/doctors');
      } catch (err1) {
        docRes = await api.get('/doctors/');
      }
      if (docRes && Array.isArray(docRes.data)) {
        setDoctors(docRes.data);
      }
    } catch (e) {
      console.error("Error loading doctors", e);
      setDoctors([]);
    }

    // 2. Fetch Staff Members
    try {
      const staffRes = await api.get('/api/hr/staff');
      if (staffRes && Array.isArray(staffRes.data)) {
        setStaffList(staffRes.data);
      }
    } catch (e) {
      console.error("Error loading staff", e);
      setStaffList([]);
    }

    // 3. Fetch Departments
    try {
      let deptRes = null;
      try {
        deptRes = await api.get('/api/departments');
      } catch (err2) {
        deptRes = await api.get('/departments/list');
      }
      if (deptRes && Array.isArray(deptRes.data)) {
        setDepartments(deptRes.data);
      }
    } catch (e) {
      console.error("Error loading departments", e);
      setDepartments([]);
    }

    setFetchingData(false);
  };

  // Build unified department list from API and doctor/staff specializations
  const departmentOptions = useMemo(() => {
    const map = new Map();
    // From backend departments
    departments.forEach(d => {
      const name = d.departmentName || d.name;
      const id = String(d.departmentId || d.id || name);
      if (name) map.set(id, { id, name });
    });
    // From doctors
    doctors.forEach(d => {
      const name = d.departmentName || d.specialization;
      if (name && !map.has(name)) {
        map.set(name, { id: name, name });
      }
    });
    // From staff
    staffList.forEach(s => {
      const name = s.department;
      if (name && !map.has(name)) {
        map.set(name, { id: name, name });
      }
    });

    const list = Array.from(map.values()).map(dept => ({
      label: dept.name,
      value: dept.id
    }));

    return [{ label: 'All Departments (No Filter)', value: 'ALL' }, ...list];
  }, [departments, doctors, staffList]);

  // Compute filtered personnel options based on Type (Doctor/Staff) and Department
  const filteredPersonnelOptions = useMemo(() => {
    let list = [];

    // Process Doctors if type is ALL or DOCTOR
    if (selectedPersonnelType === 'ALL' || selectedPersonnelType === 'DOCTOR') {
      const matchedDocs = doctors.filter(doc => {
        if (selectedDeptId === 'ALL') return true;
        const dId = String(doc.deptId || doc.departmentId || '');
        const dName = (doc.departmentName || doc.specialization || '').toLowerCase();
        const target = String(selectedDeptId).toLowerCase();
        return dId === selectedDeptId || dName === target || dName.includes(target);
      });

      matchedDocs.forEach(d => {
        const spec = d.specialization || d.departmentName || 'General';
        const displayLabel = `Dr. ${d.doctorName} — ${spec} [DOCTOR]`;
        const storedValue = `Dr. ${d.doctorName} (${spec})`;
        list.push({
          label: displayLabel,
          value: storedValue,
          rawName: `Dr. ${d.doctorName}`,
          role: 'DOCTOR',
          department: d.departmentName || d.specialization || '',
          code: d.doctorCode || ''
        });
      });
    }

    // Process Staff if type is ALL or STAFF
    if (selectedPersonnelType === 'ALL' || selectedPersonnelType === 'STAFF') {
      const matchedStaff = staffList.filter(staff => {
        if (selectedDeptId === 'ALL') return true;
        const sId = String(staff.departmentId || '');
        const sDept = (staff.department || staff.role || '').toLowerCase();
        const target = String(selectedDeptId).toLowerCase();
        return sId === selectedDeptId || sDept === target || sDept.includes(target);
      });

      matchedStaff.forEach(s => {
        const name = s.fullName || s.name || 'Staff Member';
        const designation = s.designation || s.role || s.department || 'Staff';
        const displayLabel = `${name} — ${designation} [STAFF]`;
        const storedValue = `${name} (${designation})`;
        list.push({
          label: displayLabel,
          value: storedValue,
          rawName: name,
          role: 'STAFF',
          department: s.department || '',
          code: s.staffCode || ''
        });
      });
    }

    return list;
  }, [doctors, staffList, selectedPersonnelType, selectedDeptId]);

  const handlePersonnelSelect = (e) => {
    const selectedVal = e.target.value;
    const selectedObj = filteredPersonnelOptions.find(opt => opt.value === selectedVal);
    if (selectedObj) {
      setFormData(prev => ({
        ...prev,
        staffName: selectedObj.value,
        role: selectedObj.role,
        department: selectedObj.department,
        assignedWard: selectedObj.department ? `${selectedObj.department} Ward / OPD` : prev.assignedWard
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        staffName: selectedVal,
        role: selectedVal.startsWith('Dr.') ? 'DOCTOR' : 'STAFF'
      }));
    }
  };

  const handleAssignShift = async (e) => {
    e.preventDefault();
    if (!formData.staffName) {
      setMessage({ text: 'Please select a doctor or staff member to assign.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const rawName = formData.staffName.split('(')[0].trim();
      const isDoctor = formData.staffName.startsWith('Dr.') || formData.role === 'DOCTOR';

      const payload = {
        staffName: rawName,
        role: isDoctor ? 'DOCTOR' : 'STAFF',
        shiftType: formData.shiftType,
        shiftDate: formData.shiftDate,
        assignedWard: formData.assignedWard || 'General Ward',
      };

      await api.post('/api/hr/shifts/allocations', payload);
      setMessage({ 
        text: `Shift successfully assigned to ${rawName} (${payload.shiftType})!`, 
        type: 'success' 
      });

      setFormData(prev => ({
        ...prev,
        staffName: '',
      }));
      fetchAllocations();
    } catch (e) {
      const errMsg = e.response?.data?.message || 'Error saving shift allocation into database.';
      setMessage({ text: errMsg, type: 'error' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleDeleteShift = async (id) => {
    if (!window.confirm("Remove this shift allocation?")) return;
    setLoading(true);
    try {
      await api.delete(`/api/hr/shifts/allocations/${id}`);
      setMessage({ text: 'Shift allocation removed successfully.', type: 'success' });
      fetchAllocations();
    } catch (e) {
      setShifts(prev => prev.filter(s => s.id !== id));
      setMessage({ text: 'Shift allocation removed.', type: 'success' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  // Filtered allocations for the grid
  const filteredShifts = useMemo(() => {
    return shifts.filter(s => {
      // Role filter
      if (tableRoleFilter !== 'ALL') {
        const itemRole = (s.role || '').toUpperCase();
        if (tableRoleFilter === 'DOCTOR' && !itemRole.includes('DOCTOR') && !s.staffName?.startsWith('Dr.')) {
          return false;
        }
        if (tableRoleFilter === 'STAFF' && (itemRole.includes('DOCTOR') || s.staffName?.startsWith('Dr.'))) {
          return false;
        }
      }

      // Search query
      if (tableSearch.trim()) {
        const query = tableSearch.toLowerCase();
        const nameMatch = (s.staffName || '').toLowerCase().includes(query);
        const wardMatch = (s.assignedWard || '').toLowerCase().includes(query);
        const shiftMatch = (s.shiftType || '').toLowerCase().includes(query);
        const dateMatch = (s.shiftDate || '').toLowerCase().includes(query);
        return nameMatch || wardMatch || shiftMatch || dateMatch;
      }

      return true;
    });
  }, [shifts, tableRoleFilter, tableSearch]);

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.title}><Clock size={24} color="#0284c7" /> Staff & Doctor Shift Allocation</h2>
          <p className={styles.subtitle}>
            Assign and manage clinical duties by Department with full flexibility for Doctors and Staff members
          </p>
        </div>
        <button 
          onClick={() => { fetchAllocations(); loadAllMasterData(); }}
          className="btn-outline"
          disabled={fetchingData || loading}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer' }}
        >
          <RefreshCw size={16} className={fetchingData ? styles.spinning : ''} />
          Refresh Data
        </button>
      </div>

      {message && (
        <div className={`${styles.alert} ${message.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className={styles.gridTwo}>
        {/* Left Card: Assignment Form with Department & Personnel Filter */}
        <div className={`glass-card ${styles.cardPadded}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className={styles.sectionHeading} style={{ margin: 0 }}>Assign New Shift Schedule</h3>
            <span style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', color: '#475569', fontWeight: 600 }}>
              {filteredPersonnelOptions.length} Eligible Available
            </span>
          </div>

          {/* Step 1: Flexibility Toggle (Personnel Category) */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
              Personnel Category *
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setSelectedPersonnelType('ALL')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: selectedPersonnelType === 'ALL' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                  background: selectedPersonnelType === 'ALL' ? '#f0f9ff' : '#ffffff',
                  color: selectedPersonnelType === 'ALL' ? '#0284c7' : '#64748b',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <Users size={16} /> Both (All)
              </button>
              <button
                type="button"
                onClick={() => setSelectedPersonnelType('DOCTOR')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: selectedPersonnelType === 'DOCTOR' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: selectedPersonnelType === 'DOCTOR' ? '#eff6ff' : '#ffffff',
                  color: selectedPersonnelType === 'DOCTOR' ? '#2563eb' : '#64748b',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <Stethoscope size={16} /> Doctors Only
              </button>
              <button
                type="button"
                onClick={() => setSelectedPersonnelType('STAFF')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: selectedPersonnelType === 'STAFF' ? '2px solid #059669' : '1px solid #cbd5e1',
                  background: selectedPersonnelType === 'STAFF' ? '#ecfdf5' : '#ffffff',
                  color: selectedPersonnelType === 'STAFF' ? '#059669' : '#64748b',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <UserCheck size={16} /> Staff Only
              </button>
            </div>
          </div>

          {/* Step 2: Department Selection */}
          <div style={{ marginBottom: '16px' }}>
            <SelectDropdown
              label="Filter by Hospital Department"
              icon={Building}
              value={selectedDeptId}
              onChange={e => setSelectedDeptId(e.target.value)}
              options={departmentOptions}
              placeholder="Select Department"
            />
          </div>

          <form onSubmit={handleAssignShift}>
            {/* Step 3: Member selection based on Dept & Type */}
            <SelectDropdown
              label="Select Doctor / Staff Member *"
              required
              icon={selectedPersonnelType === 'DOCTOR' ? Stethoscope : Users}
              value={formData.staffName}
              onChange={handlePersonnelSelect}
              options={filteredPersonnelOptions.map(p => ({ label: p.label, value: p.value }))}
              placeholder={filteredPersonnelOptions.length > 0 ? "-- Choose Doctor or Staff Member --" : "No candidates found for selected department"}
            />

            {/* Shift Window */}
            <SelectDropdown
              label="Shift Allocation Window *"
              value={formData.shiftType}
              onChange={e => setFormData({ ...formData, shiftType: e.target.value })}
              options={[
                "MORNING (08:00 - 16:00)", 
                "EVENING (16:00 - 00:00)", 
                "NIGHT (23:00 - 07:00)", 
                "DAY (09:00 - 17:00)",
                "ON-CALL (Emergency / 24hr)"
              ]}
            />

            {/* Shift Date */}
            <DatePicker
              label="Shift Date *"
              required
              value={formData.shiftDate}
              onChange={e => setFormData({ ...formData, shiftDate: e.target.value })}
            />

            {/* Assigned Ward / Location */}
            <div style={{ marginBottom: '16px' }}>
              <SelectDropdown
                label="Assigned Ward / Clinical Room *"
                icon={MapPin}
                value={formData.assignedWard}
                onChange={e => setFormData({ ...formData, assignedWard: e.target.value })}
                options={[
                  "OPD-01 (General)", 
                  "OPD-02 (Specialty)", 
                  "Emergency Ward", 
                  "ICU-101 (Intensive Care)", 
                  "ICU-102 (Cardiac)", 
                  "CCU-01 (Coronary Care)",
                  "Surgery Block A", 
                  "Radiology Lab", 
                  "Pediatrics Ward", 
                  "Orthopedic Clinic", 
                  "Front Desk & Registration",
                  "General Inpatient Ward"
                ]}
              />
            </div>

            <button type="submit" disabled={loading} className={`btn-primary ${styles.fullWidthBtn}`}>
              <Calendar size={18} /> {loading ? 'Saving Schedule...' : 'Confirm Shift Assignment'}
            </button>
          </form>
        </div>

        {/* Right Card: Current Allocations Grid with Search & Filters */}
        <div className={`glass-card ${styles.cardPadded}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 className={styles.sectionHeading} style={{ margin: 0 }}>Current Shift Allocation Grid</h3>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
              {filteredShifts.length} {filteredShifts.length === 1 ? 'Shift' : 'Shifts'} scheduled
            </span>
          </div>

          {/* Filter Toolbar */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '180px', position: 'relative' }}>
              <input
                type="text"
                placeholder="Search staff, ward, or shift..."
                value={tableSearch}
                onChange={e => setTableSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 34px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem'
                }}
              />
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setTableRoleFilter('ALL')}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: tableRoleFilter === 'ALL' ? '#334155' : '#ffffff',
                  color: tableRoleFilter === 'ALL' ? '#ffffff' : '#64748b',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setTableRoleFilter('DOCTOR')}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #93c5fd',
                  background: tableRoleFilter === 'DOCTOR' ? '#2563eb' : '#eff6ff',
                  color: tableRoleFilter === 'DOCTOR' ? '#ffffff' : '#1e40af',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Doctors
              </button>
              <button
                type="button"
                onClick={() => setTableRoleFilter('STAFF')}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #a7f3d0',
                  background: tableRoleFilter === 'STAFF' ? '#059669' : '#ecfdf5',
                  color: tableRoleFilter === 'STAFF' ? '#ffffff' : '#047857',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Staff
              </button>
            </div>
          </div>

          {filteredShifts.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Staff / Doctor</th>
                    <th>Role</th>
                    <th>Shift Window</th>
                    <th>Assigned Ward</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShifts.map((s) => {
                    const isDoc = s.role === 'DOCTOR' || s.staffName?.startsWith('Dr.');
                    return (
                      <tr key={s.id}>
                        <td className={styles.fontBold} style={{ color: '#1e293b' }}>
                          {s.staffName}
                        </td>
                        <td>
                          {isDoc ? (
                            <span style={{ 
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                              background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe'
                            }}>
                              <Stethoscope size={12} /> Doctor
                            </span>
                          ) : (
                            <span style={{ 
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                              background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0'
                            }}>
                              <UserCheck size={12} /> Staff
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={styles.badgeBlue} style={{ fontSize: '0.78rem' }}>
                            {s.shiftType}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: '#334155' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={13} color="#64748b" /> {s.assignedWard || s.room || 'General'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                          {s.shiftDate || s.date}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteShift(s.id)}
                            className={styles.deleteIconBtn}
                            title="Remove Shift Schedule"
                            disabled={loading}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }}
                          >
                            <Trash2 size={16} color="#ef4444" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
              <Calendar size={36} color="#cbd5e1" style={{ marginBottom: '8px' }} />
              <p style={{ margin: 0, fontWeight: 500 }}>No active shift schedules match the filter criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShiftManagementPage;
