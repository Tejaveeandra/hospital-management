import React, { useState, useEffect } from "react";
import styles from "./AddUserForm.module.css";
import { Shield, Phone, Heart, UserPlus, CheckCircle2, Stethoscope, Crown, Activity, User } from 'lucide-react';
import api from "../api/api";

const roleMeta = {
  SUPER_ADMIN: {
    name: "SUPER_ADMIN",
    icon: <Crown size={20} />,
    smallIcon: <Crown size={14} />,
    desc: "Complete system control",
    color: "#8b5cf6", // Purple
    bg: "rgba(139, 92, 246, 0.1)",
    permissions: ["Global settings", "Database access", "Advanced auditing", "Full control"]
  },
  ADMIN: { 
    name: "ADMIN",
    icon: <Shield size={20} />, 
    smallIcon: <Shield size={14} />,
    desc: "Full system access", 
    color: "#6366f1", // Indigo
    bg: "rgba(99, 102, 241, 0.1)",
    permissions: ["All modules", "User management", "Audit logs", "System settings"]
  },
  DOCTOR: { 
    name: "DOCTOR",
    icon: <Stethoscope size={20} />, 
    smallIcon: <Stethoscope size={14} />,
    desc: "Clinical operations", 
    color: "#10b981", // Emerald
    bg: "rgba(16, 185, 129, 0.1)",
    permissions: ["Patients", "Appointments", "Prescriptions", "Medical records"]
  },
  NURSE: {
    name: "NURSE",
    icon: <Activity size={20} />,
    smallIcon: <Activity size={14} />,
    desc: "Patient care operations",
    color: "#06b6d4", // Cyan
    bg: "rgba(6, 182, 212, 0.1)",
    permissions: ["Patient vitals", "Administer medication", "Care plans", "Doctor orders"]
  },
  RECEPTIONIST: { 
    name: "RECEPTIONIST",
    icon: <Phone size={20} />, 
    smallIcon: <Phone size={14} />,
    desc: "Front desk operations", 
    color: "#f59e0b", // Amber
    bg: "rgba(245, 158, 11, 0.1)",
    permissions: ["Appointments", "Check-ins", "Billing", "Messaging"]
  },
  PATIENT: { 
    name: "PATIENT",
    icon: <Heart size={20} />, 
    smallIcon: <Heart size={14} />,
    desc: "Self-service patient portal", 
    color: "#ef4444", // Red
    bg: "rgba(239, 68, 68, 0.1)",
    permissions: ["Own records", "Book appointments", "Billing", "Prescriptions"]
  },
  USER: {
    name: "USER",
    icon: <User size={20} />,
    smallIcon: <User size={14} />,
    desc: "Basic system access",
    color: "#64748b", // Slate
    bg: "rgba(100, 116, 139, 0.1)",
    permissions: ["Basic access", "View profile", "Help center"]
  }
};

const AddUserForm = ({ onClose, onUserAdded }) => {
  const [formData, setFormData] = useState({
    selectedProfileId: "",
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    role: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [roles, setRoles] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  useEffect(() => {
    const fetchRolesAndProfiles = async () => {
      try {
        const response = await api.get("/users/roles");
        if (response.status === 200 && Array.isArray(response.data)) {
          setRoles(response.data.filter(r => r.name && r.name.toUpperCase() !== "PATIENT"));
        } else {
          setRoles([{ name: "ADMIN" }, { name: "DOCTOR" }, { name: "RECEPTIONIST" }, { name: "NURSE" }]);
        }
      } catch (err) {
        setRoles([{ name: "ADMIN" }, { name: "DOCTOR" }, { name: "RECEPTIONIST" }, { name: "NURSE" }]);
      }

      setLoadingProfiles(true);
      try {
        const [docRes, staffRes] = await Promise.allSettled([
          api.get("/doctors"),
          api.get("/api/hr/staff")
        ]);
        if (docRes.status === "fulfilled" && docRes.value?.data) {
          const docs = docRes.value.data.content || docRes.value.data;
          setDoctorsList(Array.isArray(docs) ? docs : []);
        }
        if (staffRes.status === "fulfilled" && staffRes.value?.data) {
          const staff = staffRes.value.data.content || staffRes.value.data;
          setStaffList(Array.isArray(staff) ? staff : []);
        }
      } catch (e) {
        console.error("Failed to load doctor/staff records", e);
      } finally {
        setLoadingProfiles(false);
      }
    };
    fetchRolesAndProfiles();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleSelect = (roleName) => {
    setFormData({
      ...formData,
      role: roleName,
      selectedProfileId: "",
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      username: ""
    });
    setError(null);
  };

  const splitFullName = (fullNameStr = "") => {
    const cleaned = fullNameStr.replace(/^Dr\.?\s+/i, "").trim();
    const parts = cleaned.split(/\s+/);
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ") || "";
    return { firstName, lastName };
  };

  const handleProfileSelect = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setFormData({
        ...formData,
        selectedProfileId: "",
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        username: ""
      });
      return;
    }

    if (formData.role === "DOCTOR") {
      const doc = doctorsList.find(d => String(d.doctorId) === String(selectedId));
      if (doc) {
        const { firstName, lastName } = splitFullName(doc.doctorName || "");
        const suggestedUsername = doc.username ||
          `dr.${firstName.toLowerCase()}${lastName ? "." + lastName.toLowerCase().replace(/\s+/g, "") : ""}`;
        setFormData({
          ...formData,
          selectedProfileId: String(doc.doctorId),
          firstName,
          lastName,
          phone: doc.contact || "",
          email: doc.email || formData.email,
          username: suggestedUsername
        });
      }
    } else {
      const staff = staffList.find(s => String(s.id) === String(selectedId));
      if (staff) {
        const { firstName, lastName } = splitFullName(staff.fullName || "");
        const suggestedUsername = staff.username ||
          `${firstName.toLowerCase()}${lastName ? "." + lastName.toLowerCase().replace(/\s+/g, "") : ""}`;
        setFormData({
          ...formData,
          selectedProfileId: String(staff.id),
          firstName,
          lastName,
          phone: staff.contactNumber || "",
          email: staff.email || formData.email,
          username: suggestedUsername
        });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.role) {
      setError("Step 1: Please select a staff/doctor role first.");
      return;
    }
    if (!formData.selectedProfileId) {
      setError(
        formData.role === "DOCTOR"
          ? "Please select an onboarded Doctor from the dropdown first."
          : "Please select an onboarded Staff member from the dropdown first."
      );
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        role: formData.role,
        phone: formData.phone
      };
      
      let createdUserId = null;
      try {
        const response = await api.post("/users/admin/register", payload);
        if (response.status === 200 || response.status === 201) {
          const createdUser = response.data;
          createdUserId = createdUser?.userId || createdUser?.id || null;
        }
      } catch (regErr) {
        const errMsg = regErr.response?.data?.message || regErr.response?.data || "";
        // If user already exists from a previous partial attempt, fetch existing user to complete profile linking
        if (typeof errMsg === "string" && errMsg.toLowerCase().includes("already exists")) {
          const existingRes = await api.get(`/users/username/${encodeURIComponent(formData.username.trim())}`);
          createdUserId = existingRes.data?.userId || existingRes.data?.id || null;
        } else {
          throw regErr;
        }
      }

      // Sync username & userId to Doctor or Staff table
      if (formData.role === "DOCTOR") {
        await api.put(`/doctors/${formData.selectedProfileId}/assign-user`, {
          username: formData.username.trim(),
          userId: createdUserId,
          email: formData.email.trim()
        });
      } else {
        await api.put(`/api/hr/staff/${formData.selectedProfileId}/assign-user`, {
          username: formData.username.trim(),
          userId: createdUserId,
          email: formData.email.trim(),
          role: formData.role
        });
      }

      setSuccessMsg(`User account '${formData.username}' created and linked to ${formData.role} profile!`);
      if (onUserAdded) onUserAdded();
      if (onClose) onClose();
    } catch (err) {
      const msg = typeof err.response?.data === "string"
        ? err.response.data
        : (err.response?.data?.message || "Failed to create user.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const initials = `${formData.firstName ? formData.firstName[0].toUpperCase() : '?'}${formData.lastName ? formData.lastName[0].toUpperCase() : ''}`;
  const fullName = formData.firstName || formData.lastName ? `${formData.firstName} ${formData.lastName}` : "First Last";
  const displayEmail = formData.email || "email@medcenter.com";

  const selectedMeta = roleMeta[formData.role];

  return (
    <div className={styles.formContainerWrapper}>
      <div className={styles.formCard}>
        
        {/* Left Sidebar - Preview */}
        <div className={styles.previewSidebar}>
          <div className={styles.previewHeader}>PREVIEW</div>
          
          <div className={styles.previewProfile}>
            <div className={styles.avatarWrapper}>
              <div 
                className={styles.avatar} 
                style={selectedMeta ? { background: `linear-gradient(135deg, ${selectedMeta.color}, ${selectedMeta.color}dd)`, boxShadow: `0 10px 20px -5px ${selectedMeta.color}88` } : {}}
              >
                {initials}
              </div>
              {selectedMeta && (
                <div className={styles.avatarBadge} style={{ backgroundColor: selectedMeta.color }}>
                  {selectedMeta.smallIcon}
                </div>
              )}
            </div>
            <div className={styles.previewName}>{fullName}</div>
            <div className={styles.previewEmail}>{displayEmail}</div>
          </div>

          <div className={styles.previewPermissions}>
            {selectedMeta ? (
              <>
                <div className={styles.permissionsTitle} style={{ color: selectedMeta.color }}>
                  {selectedMeta.name} PERMISSIONS
                </div>
                <ul className={styles.permissionsList}>
                  {selectedMeta.permissions.map((perm, idx) => (
                    <li key={idx}>
                      <CheckCircle2 size={14} color={selectedMeta.color} className={styles.permIcon} />
                      {perm}
                    </li>
                  ))}
                </ul>
                <div className={styles.permissionCapsule} style={{ borderColor: `${selectedMeta.color}40`, backgroundColor: `${selectedMeta.color}15` }}>
                  {selectedMeta.desc}
                </div>
              </>
            ) : (
              <div className={styles.previewFooter}>Select a role to see permissions</div>
            )}
          </div>
        </div>

        {/* Right Content - Form */}
        <div className={styles.formSection}>
          <div className={styles.formHeader}>
            <div>
              <h2 className={styles.formTitle}>Register System User</h2>
              <div className={styles.formSubtitle}>MedCenter / Admin / Users</div>
            </div>
          </div>

          <form id="addUserForm" className={styles.formBody} onSubmit={handleSubmit}>
            {error && <div className={styles.errorMessage}>{error}</div>}
            {successMsg && <div className={styles.successMessage}>{successMsg}</div>}

            <div className={styles.helperBanner}>
              <strong>Hospital Staff & Doctor Account Provisioning:</strong> Select a role below, then pick an onboarded Doctor or HR Staff member to link their login username automatically. (Patients register via Receptionist Patient Onboarding or Self-Registration.)
            </div>

            <div className={styles.inputGroup}>
              <label>1. Select Role *</label>
              <div className={styles.roleGrid}>
                {roles
                  .filter(r => r.name && r.name.toUpperCase() !== "PATIENT")
                  .map(r => {
                    const meta = roleMeta[r.name] || roleMeta.ADMIN;
                    const isSelected = formData.role === r.name;
                    return (
                      <div 
                        key={r.name}
                        className={`${styles.roleCard} ${isSelected ? styles.selectedRole : ''}`}
                        onClick={() => handleRoleSelect(r.name)}
                        style={isSelected ? { borderColor: `${meta.color}60`, backgroundColor: `${meta.color}08` } : {}}
                      >
                        <div className={styles.roleIcon} style={{ color: meta.color, backgroundColor: `${meta.color}15` }}>
                          {meta.icon}
                        </div>
                        <div className={styles.roleInfo}>
                          <div className={styles.roleName}>{r.name}</div>
                          <div className={styles.roleDesc}>{meta.desc}</div>
                        </div>
                        {isSelected && (
                          <div className={styles.roleCheckmark} style={{ color: meta.color }}>
                            <CheckCircle2 size={16} />
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>
                {formData.role === "DOCTOR"
                  ? "2. Select Onboarded Doctor (from Doctors Table) *"
                  : "2. Select Onboarded Staff Member (from HR Staff Table) *"}
              </label>
              <select
                className={styles.profileSelect}
                value={formData.selectedProfileId}
                onChange={handleProfileSelect}
                disabled={!formData.role || loadingProfiles}
                required
              >
                <option value="">
                  {!formData.role
                    ? "-- Select a Role above first --"
                    : loadingProfiles
                    ? "Loading directory records..."
                    : formData.role === "DOCTOR"
                    ? `-- Choose Doctor (${doctorsList.length} available) --`
                    : `-- Choose HR Staff Member (${staffList.length} available) --`}
                </option>
                {formData.role === "DOCTOR"
                  ? doctorsList.map(doc => (
                      <option key={doc.doctorId} value={doc.doctorId}>
                        {doc.doctorName} ({doc.doctorCode || `ID #${doc.doctorId}`} - {doc.specialization || "General"})
                        {doc.username ? ` [Current Username: ${doc.username}]` : " [No Login Yet]"}
                      </option>
                    ))
                  : staffList.map(st => (
                      <option key={st.id} value={st.id}>
                        {st.fullName} ({st.staffCode || `ID #${st.id}`}{st.role ? ` - ${st.role}` : ""})
                        {st.username ? ` [Current Username: ${st.username}]` : " [No Login Yet]"}
                      </option>
                    ))}
              </select>
            </div>
            
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label>First Name (Auto-filled)</label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="Select profile above"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={styles.readOnlyInput}
                  readOnly
                  required
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Last Name (Auto-filled)</label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Select profile above"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={styles.readOnlyInput}
                  readOnly
                />
              </div>
            </div>
            
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label>Login Username * (Synced to {formData.role === "DOCTOR" ? "Doctors" : "Staff"} Table)</label>
                <input
                  type="text"
                  name="username"
                  placeholder="e.g. dr.john.smith"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  minLength={3}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  placeholder="user@medcenter.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                placeholder="9876543210"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>
          </form>

          <div className={styles.formFooter}>
            <div className={styles.footerText}>A welcome email with credentials will be sent automatically.</div>
            <div className={styles.footerActions}>
              <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
              <button type="submit" form="addUserForm" className={styles.submitBtn} disabled={loading}>
                <UserPlus size={16} /> Create User
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddUserForm;

