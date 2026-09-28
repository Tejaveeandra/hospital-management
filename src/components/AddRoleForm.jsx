import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { Shield, Plus, CheckCircle, ShieldAlert, Trash2, Key, Users, Edit3, Lock } from 'lucide-react';
import styles from './AddRoleForm.module.css';

const AddRoleForm = ({ onRoleAdded, onClose }) => {
  const [roleName, setRoleName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [availablePermissionModules, setAvailablePermissionModules] = useState([]);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchRoles();
    fetchPermissionsCatalog();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await api.get('/users/roles');
      setRoles(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Error fetching roles', e);
    }
  };

  const fetchPermissionsCatalog = async () => {
    try {
      const res = await api.get('/users/roles/permissions');
      setAvailablePermissionModules(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Error fetching permissions catalog', e);
    }
  };

  const handlePermissionToggle = (code) => {
    if (selectedPermissions.includes(code)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== code));
    } else {
      setSelectedPermissions([...selectedPermissions, code]);
    }
  };

  const handleSelectModuleAll = (modulePermissions) => {
    const codes = modulePermissions.map(p => p.code);
    const allSelected = codes.every(c => selectedPermissions.includes(c));
    if (allSelected) {
      setSelectedPermissions(selectedPermissions.filter(c => !codes.includes(c)));
    } else {
      const updated = new Set([...selectedPermissions, ...codes]);
      setSelectedPermissions(Array.from(updated));
    }
  };

  const resetForm = () => {
    setRoleName('');
    setDescription('');
    setSelectedPermissions([]);
    setEditingRoleId(null);
  };

  const startEditRole = (role) => {
    setEditingRoleId(role.id);
    setRoleName(role.name);
    setDescription(role.description || '');
    const perms = Array.isArray(role.permissions) ? role.permissions : Array.from(role.permissions || []);
    setSelectedPermissions(perms);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formattedName = roleName.trim().toUpperCase().replace(/\s+/g, '_');
    if (!formattedName) {
      setMessage({ text: 'Please enter a valid role name.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      if (editingRoleId) {
        await api.put(`/users/roles/${editingRoleId}`, {
          name: formattedName,
          description: description.trim(),
          permissions: selectedPermissions,
        });
        setMessage({ text: `Role '${formattedName}' permissions updated in database successfully!`, type: 'success' });
      } else {
        await api.post('/users/roles', {
          name: formattedName,
          description: description.trim() || `${formattedName} Role`,
          permissions: selectedPermissions,
        });
        setMessage({ text: `Role '${formattedName}' created with ${selectedPermissions.length} permissions in database!`, type: 'success' });
      }
      resetForm();
      fetchRoles();
      if (onRoleAdded) onRoleAdded();
    } catch (e) {
      const errMsg = e.response?.data?.message || e.response?.data || 'Error saving role permissions.';
      setMessage({ text: typeof errMsg === 'string' ? errMsg : 'Failed to save role.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (roleId, name) => {
    if (!window.confirm(`Are you sure you want to delete custom role '${name}'?`)) return;
    setLoading(true);
    setMessage(null);
    try {
      await api.delete(`/users/roles/${roleId}`);
      setMessage({ text: `Role '${name}' deleted successfully.`, type: 'success' });
      fetchRoles();
      if (editingRoleId === roleId) resetForm();
    } catch (e) {
      const errMsg = e.response?.data?.message || e.response?.data || 'Error deleting role.';
      setMessage({ text: typeof errMsg === 'string' ? errMsg : 'Failed to delete role.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.roleFormWrapper}>
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <Shield size={24} color="#6366f1" />
        </div>
        <div>
          <h2 className={styles.title}>System Roles & Database Permissions</h2>
          <p className={styles.subtitle}>Configure dynamic roles and permission checkboxes stored directly in the `role_permissions` database tables</p>
        </div>
      </div>

      {message && (
        <div className={`${styles.message} ${message.type === 'success' ? styles.successMessage : styles.errorMessage}`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <ShieldAlert size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.mainForm}>
        <div className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Role Identifier / Name *</label>
            <input
              type="text"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="e.g. PHARMACIST, LAB_TECH"
              required
              disabled={loading || (editingRoleId && roles.find(r => r.id === editingRoleId)?.isSystemRole)}
              className={styles.inputField}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Description / Access Summary</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Pharmacy inventory and prescription fulfillment access"
              disabled={loading}
              className={styles.inputField}
            />
          </div>
        </div>

        {/* Database Permission Checkboxes Grouped by Module */}
        <div className={styles.permissionsContainer}>
          <div className={styles.permissionHeaderRow}>
            <div className={styles.permTitle}>
              <Key size={18} color="#4f46e5" />
              <h3>Database Module Permissions (`role_permissions` Table)</h3>
            </div>
            <span className={styles.selectedCounter}>
              {selectedPermissions.length} Permission(s) Selected
            </span>
          </div>

          <div className={styles.modulesGrid}>
            {availablePermissionModules.map((module) => {
              const modPerms = module.permissions || [];
              const allModSelected = modPerms.every(p => selectedPermissions.includes(p.code));

              return (
                <div key={module.moduleKey} className={styles.moduleCard}>
                  <div className={styles.moduleHeader}>
                    <h4>{module.moduleTitle}</h4>
                    <button
                      type="button"
                      onClick={() => handleSelectModuleAll(modPerms)}
                      className={styles.selectAllBtn}
                    >
                      {allModSelected ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className={styles.checkboxList}>
                    {modPerms.map((perm) => (
                      <label key={perm.code} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(perm.code)}
                          onChange={() => handlePermissionToggle(perm.code)}
                        />
                        <span>{perm.label}</span>
                        <code className={styles.permCode}>{perm.code}</code>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.buttonRow}>
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            <Plus size={16} />
            <span>{editingRoleId ? 'Update Database Permissions' : 'Register New Role & Save'}</span>
          </button>
          {editingRoleId && (
            <button type="button" onClick={resetForm} className={styles.cancelBtn}>
              Cancel Edit
            </button>
          )}
          {onClose && (
            <button type="button" onClick={onClose} className={styles.cancelBtn}>
              Close
            </button>
          )}
        </div>
      </form>

      {/* Active Database Roles Directory */}
      <div className={styles.rolesSection}>
        <h3 className={styles.sectionTitle}>Roles Stored in Database (`roles` Table)</h3>
        {roles.length > 0 ? (
          <div className={styles.rolesGrid}>
            {roles.map((r, idx) => {
              const permCount = Array.isArray(r.permissions) ? r.permissions.length : (r.permissions ? Object.keys(r.permissions).length : 0);
              return (
                <div key={r.id || idx} className={`${styles.roleCard} ${editingRoleId === r.id ? styles.roleCardActive : ''}`}>
                  <div className={styles.roleCardHeader}>
                    <div className={styles.roleNameGroup}>
                      <strong>{r.name}</strong>
                      {r.isSystemRole ? (
                        <span className={styles.systemBadge}><Lock size={12} /> System Role</span>
                      ) : (
                        <span className={styles.customBadge}>Custom Role</span>
                      )}
                    </div>
                    <div className={styles.roleCardActions}>
                      <button
                        title="Edit Permissions"
                        onClick={() => startEditRole(r)}
                        className={styles.iconActionBtn}
                      >
                        <Edit3 size={15} />
                      </button>
                      {!r.isSystemRole && (
                        <button
                          title="Delete Role"
                          onClick={() => handleDeleteRole(r.id, r.name)}
                          className={`${styles.iconActionBtn} ${styles.dangerActionBtn}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className={styles.roleDesc}>{r.description || 'Access control role'}</p>
                  <div className={styles.roleStatsRow}>
                    <span><Users size={13} /> {r.userCount ?? 0} User(s) Assigned</span>
                    <span><Key size={13} /> {permCount} Permission(s)</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className={styles.emptyText}>No roles found in database.</p>
        )}
      </div>
    </div>
  );
};

export default AddRoleForm;
