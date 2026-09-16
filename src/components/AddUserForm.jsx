import React, { useState, useEffect } from "react";
import styles from "./AddUserForm.module.css";
import { X, Shield, Phone, Heart, Eye, EyeOff, UserPlus, CheckCircle2, Stethoscope, Crown, Activity, User } from 'lucide-react';
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
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    role: "", 
    department: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await api.get("/users/roles");
        if (response.status === 200) {
          setRoles(response.data);
        } else {
          setRoles([{ name: "ADMIN" }, { name: "DOCTOR" }, { name: "RECEPTIONIST" }, { name: "PATIENT" }]);
        }
      } catch (err) {
        setRoles([{ name: "ADMIN" }, { name: "DOCTOR" }, { name: "RECEPTIONIST" }, { name: "PATIENT" }]);
      }
    };
    fetchRoles();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleSelect = (roleName) => {
    setFormData({ ...formData, role: roleName });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.role) {
      setError("Please select a role.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone
      };
      
      const response = await api.post("/users/admin/register", payload);
      if (response.status === 200 || response.status === 201) {
        if (onUserAdded) onUserAdded();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || "Failed to create user.");
    } finally {
      setLoading(false);
    }
  };

  const initials = `${formData.firstName ? formData.firstName[0].toUpperCase() : '?'}${formData.lastName ? formData.lastName[0].toUpperCase() : ''}`;
  const fullName = formData.firstName || formData.lastName ? `${formData.firstName} ${formData.lastName}` : "First Last";
  const displayEmail = formData.email || "email@medcenter.com";

  const selectedMeta = roleMeta[formData.role];

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContainer}>
        
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
            <button type="button" className={styles.closeButton} onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <form className={styles.formBody} onSubmit={handleSubmit}>
            {error && <div className={styles.errorMessage}>{error}</div>}
            
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label>First Name</label>
                <input type="text" name="firstName" placeholder="Alex" value={formData.firstName} onChange={handleInputChange} required />
              </div>
              <div className={styles.inputGroup}>
                <label>Last Name</label>
                <input type="text" name="lastName" placeholder="Morgan" value={formData.lastName} onChange={handleInputChange} required />
              </div>
            </div>
            
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label>Username</label>
                <input type="text" name="username" placeholder="alex.morgan" value={formData.username} onChange={handleInputChange} required minLength={3} />
              </div>
              <div className={styles.inputGroup}>
                <label>Email Address</label>
                <input type="email" name="email" placeholder="user@medcenter.com" value={formData.email} onChange={handleInputChange} required />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Phone Number</label>
              <input type="tel" name="phone" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={handleInputChange} />
            </div>

            <div className={styles.inputGroup}>
              <label>Role</label>
              <div className={styles.roleGrid}>
                {roles.map(r => {
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

            {/* Department Dropdown for DOCTOR and RECEPTIONIST */}
            {(formData.role === 'DOCTOR' || formData.role === 'RECEPTIONIST') && (
              <div className={styles.inputGroup}>
                <label>Department</label>
                <select 
                  name="department" 
                  value={formData.department} 
                  onChange={handleInputChange} 
                  className={styles.dropdown}
                  required
                >
                  <option value="">Select department...</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="General">General</option>
                </select>
              </div>
            )}
            
            <div className={styles.formFooter}>
              <div className={styles.footerText}>A welcome email with credentials will be sent automatically.</div>
              <div className={styles.footerActions}>
                <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  <UserPlus size={16} /> Create User
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddUserForm;
