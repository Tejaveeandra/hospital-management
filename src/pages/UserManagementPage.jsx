import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/api";
import styles from "./UserManagementPage.module.css";
import { CheckCircle, XCircle, Users, UserPlus, ShieldCheck, ArrowLeft } from 'lucide-react';
import AddUserForm from "../components/AddUserForm";
import AddRoleForm from "../components/AddRoleForm";

const UserManagementPage = ({ isEmbedded = false, initialOperation }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [operationMode, setOperationMode] = useState(initialOperation || searchParams.get("op") || null);
  const [statusTab, setStatusTab] = useState("ACTIVE"); // ACTIVE, INACTIVE, ALL
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const activeUsersCount = allUsers.filter(u => u.active).length;
  const inactiveUsersCount = allUsers.filter(u => !u.active).length;

  const filteredUsers = allUsers.filter(user => {
    if (statusTab === "ACTIVE") return user.active;
    if (statusTab === "INACTIVE") return !user.active;
    return true;
  });

  const handleSelectOperation = (mode) => {
    setOperationMode(mode);
    if (mode) {
      setSearchParams({ op: mode });
    } else {
      setSearchParams({});
    }
  };

  useEffect(() => {
    setOperationMode(initialOperation || null);
  }, [initialOperation]);

  useEffect(() => {
    fetchAllUsers();
  }, []);

  useEffect(() => {
    if (operationMode === "viewAll") {
      fetchAllUsers();
    }
  }, [operationMode]);

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get("/users");
      if (response.status === 200) {
        setAllUsers(response.data);
      }
    } catch (error) {
      console.error("Error fetching users", error);
      showMessage("Error fetching users.", "error");
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg, type) => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    setLoading(true);
    try {
      if (currentStatus) {
        await api.put(`/users/${userId}/deactivate`);
        showMessage("User deactivated successfully.", "success");
      } else {
        await api.put(`/users/${userId}/activate`);
        showMessage("User activated successfully.", "success");
      }
      fetchAllUsers();
    } catch (error) {
      console.error("Error toggling user status", error);
      showMessage("Failed to update user status.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${styles.userContainer} ${isEmbedded ? styles.embeddedView : ''}`}>
      <div className={styles.rightPanel}>
        {message && (
          <div className={`${styles.message} ${message.type === 'success' ? styles.messageSuccess : styles.messageError}`}>
            {message.text}
          </div>
        )}

        {/* HUB VIEW: Show Operation Cards ONLY when no operation is selected */}
        {!operationMode && (
          <div className={styles.hubWrapper}>
            <div className={styles.hubHeader}>
              <h2 className={styles.hubTitle}>User & Role Management</h2>
              <p className={styles.hubSubtitle}>
                Select an operation below to open its dedicated page
              </p>
            </div>

            <div className={styles.operationCardsGrid}>
              <div 
                className={styles.opCard}
                onClick={() => handleSelectOperation('viewAll')}
              >
                <div className={styles.opCardIcon}>
                  <Users size={22} />
                </div>
                <div className={styles.opCardInfo}>
                  <h4>System User Directory</h4>
                  <p>Browse and manage all registered staff accounts</p>
                </div>
                <span className={styles.opCardBadge}>{allUsers.length} Users</span>
              </div>

              <div 
                className={styles.opCard}
                onClick={() => handleSelectOperation('createAdmin')}
              >
                <div className={styles.opCardIcon}>
                  <UserPlus size={22} />
                </div>
                <div className={styles.opCardInfo}>
                  <h4>Register Staff / Admin</h4>
                  <p>Onboard new doctors, admins, receptionists, or staff</p>
                </div>
                <span className={`${styles.opCardBadge} ${styles.badgeGreen}`}>+ Add User</span>
              </div>

              <div 
                className={styles.opCard}
                onClick={() => handleSelectOperation('createRole')}
              >
                <div className={styles.opCardIcon}>
                  <ShieldCheck size={22} />
                </div>
                <div className={styles.opCardInfo}>
                  <h4>Create & Manage Roles</h4>
                  <p>Configure custom hospital roles and grant RBAC permissions</p>
                </div>
                <span className={`${styles.opCardBadge} ${styles.badgePurple}`}>RBAC</span>
              </div>
            </div>
          </div>
        )}

        {/* DEDICATED PAGE VIEW: Show Back button + Selected Operation */}
        {operationMode && (
          <div className={styles.dedicatedView}>
            <div className={styles.backBar}>
              <button
                type="button"
                onClick={() => handleSelectOperation(null)}
                className={styles.backButton}
              >
                <ArrowLeft size={16} className={styles.backIcon} />
                <span>Back to User & Role Management</span>
              </button>
            </div>

            {operationMode === "viewAll" && (
              <div className={styles.allUsersContainer}>
                <div className={styles.headerRow}>
                  <h3>System User Directory</h3>
                  <div className={styles.tabContainer}>
                    <button 
                      className={`${styles.tabButton} ${statusTab === 'ACTIVE' ? styles.activeTabActive : ''}`}
                      onClick={() => setStatusTab('ACTIVE')}
                    >
                      <CheckCircle size={15} />
                      <span>Active Users</span>
                      <span className={`${styles.badge} ${styles.badgeActive}`}>{activeUsersCount}</span>
                    </button>
                    <button 
                      className={`${styles.tabButton} ${statusTab === 'INACTIVE' ? styles.activeTabInactive : ''}`}
                      onClick={() => setStatusTab('INACTIVE')}
                    >
                      <XCircle size={15} />
                      <span>Inactive Users</span>
                      <span className={`${styles.badge} ${styles.badgeInactive}`}>{inactiveUsersCount}</span>
                    </button>
                    <button 
                      className={`${styles.tabButton} ${statusTab === 'ALL' ? styles.activeTabAll : ''}`}
                      onClick={() => setStatusTab('ALL')}
                    >
                      <span>All Users</span>
                      <span className={`${styles.badge} ${styles.badgeAll}`}>{allUsers.length}</span>
                    </button>
                  </div>
                </div>

                {loading ? (
                  <p>Loading users...</p>
                ) : filteredUsers.length > 0 ? (
                  <table className={styles.usersTable}>
                    <thead>
                      <tr>
                        <th>User ID</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.userId}>
                          <td>{user.userId}</td>
                          <td>{user.username}</td>
                          <td title={user.email}>
                            {user.email && user.email.length > 30 
                              ? `${user.email.substring(0, 30)}...` 
                              : user.email}
                          </td>
                          <td>{user.role}</td>
                          <td>
                            <span className={`${styles.statusBadge} ${user.active ? styles.statusActive : styles.statusInactive}`}>
                              {user.active ? <CheckCircle size={14} /> : <XCircle size={14} />}
                              {user.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            {user.active ? (
                              <button 
                                className={`${styles.actionButton} ${styles.btnDeactivate}`}
                                onClick={() => toggleUserStatus(user.userId, user.active)}
                                disabled={loading}
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button 
                                className={`${styles.actionButton} ${styles.btnActivate}`}
                                onClick={() => toggleUserStatus(user.userId, user.active)}
                                disabled={loading}
                              >
                                Activate
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className={styles.emptyState}>
                    <p>No {statusTab === 'ACTIVE' ? 'active' : statusTab === 'INACTIVE' ? 'inactive' : ''} users found.</p>
                  </div>
                )}
              </div>
            )}

            {operationMode === "createAdmin" && (
              <AddUserForm 
                onClose={() => handleSelectOperation(null)} 
                onUserAdded={() => fetchAllUsers()} 
              />
            )}

            {(operationMode === "createRole" || operationMode === "manageRoles") && (
              <AddRoleForm 
                onClose={() => handleSelectOperation(null)} 
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementPage;
