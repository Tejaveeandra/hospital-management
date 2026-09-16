import React, { useState, useEffect } from "react";
import api from "../api/api";
import styles from "./UserManagementPage.module.css";
import { CheckCircle, XCircle } from 'lucide-react';
import AddUserForm from "../components/AddUserForm";

const UserManagementPage = ({ isEmbedded = false, initialOperation }) => {
  const [operationMode, setOperationMode] = useState(initialOperation || "viewAll");
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
  
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "ADMIN" // Default role
  });

  useEffect(() => {
    if (initialOperation) {
      setOperationMode(initialOperation);
    }
  }, [initialOperation]);

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

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // The backend uses /users/admin/register to register staff roles (ADMIN, RECEPTIONIST, etc.)
      const response = await api.post("/users/admin/register", formData);
      if (response.status === 200) {
        showMessage(`User ${formData.username} created successfully!`, "success");
        setFormData({ username: "", email: "", password: "", role: "ADMIN" });
      }
    } catch (error) {
      console.error("Error creating user", error);
      const errMsg = error.response?.data || "Failed to create user. Ensure password has uppercase, number, and special character.";
      showMessage(errMsg, "error");
    } finally {
      setLoading(false);
    }
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
      fetchAllUsers(); // Refresh the list
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
            onClose={() => setOperationMode("viewAll")} 
            onUserAdded={() => fetchAllUsers()} 
          />
        )}
      </div>
    </div>
  );
};

export default UserManagementPage;
