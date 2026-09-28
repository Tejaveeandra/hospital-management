import React, { useState, useEffect } from "react";
import api from "../api/api";
import styles from "./DepartmentsPage.module.css";
import { Building2, MapPin, Phone, Mail, CheckCircle, PlusCircle, ListFilter } from "lucide-react";

const DepartmentsPage = ({ allowedOperations = [], initialOperation, isEmbedded = false }) => {
  const [operationMode, setOperationMode] = useState(initialOperation || "List Departments");
  const [departments, setDepartments] = useState([]);
  const [subDepartments, setSubDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  
  const [selectedDept, setSelectedDept] = useState(null);
  const [departmentId, setDepartmentId] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  
  // Sub-Department state
  const [subDeptName, setSubDeptName] = useState("");
  const [selectedDeptForSub, setSelectedDeptForSub] = useState("");

  // Branch state
  const [branchForm, setBranchForm] = useState({
    branchCode: "",
    branchName: "",
    city: "",
    area: "",
    address: "",
    pincode: "",
    contactNumber: "",
    email: "",
    isMainBranch: false,
  });

  const [doctorsInDept, setDoctorsInDept] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialOperation) setOperationMode(initialOperation);
    else if (allowedOperations?.length > 0) setOperationMode(allowedOperations[0]);
  }, [initialOperation, allowedOperations]);

  useEffect(() => {
    setMessage("");
  }, [operationMode]);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/departments");
      setDepartments(Array.isArray(res.data) ? res.data : []);
      setMessage("Departments loaded successfully.");
    } catch (e) {
      setMessage("Error loading departments.");
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/branches");
      setBranches(Array.isArray(res.data) ? res.data : []);
      setMessage("Hospital branches loaded successfully.");
    } catch (e) {
      setMessage("Error loading hospital branches.");
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubDepartments = async (deptId) => {
    setLoading(true);
    try {
      const url = deptId ? `/admin/sub-departments/by-department/${deptId}` : "/admin/sub-departments/list";
      const res = await api.get(url);
      setSubDepartments(Array.isArray(res.data) ? res.data : []);
      setMessage(deptId ? `Sub-departments loaded for Department #${deptId}` : "All sub-departments loaded.");
    } catch (e) {
      setMessage("Error loading sub-departments.");
      setSubDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    if (!branchForm.branchCode?.trim() || !branchForm.branchName?.trim() || !branchForm.city?.trim()) {
      setMessage("Branch Code, Branch Name, and City are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/api/branches", branchForm);
      setMessage(`Branch '${res.data?.branchName || branchForm.branchName}' created successfully!`);
      setBranchForm({
        branchCode: "",
        branchName: "",
        city: "",
        area: "",
        address: "",
        pincode: "",
        contactNumber: "",
        email: "",
        isMainBranch: false,
      });
      fetchBranches();
    } catch (e) {
      setMessage(e.response?.data?.message || "Error creating hospital branch.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDept = async (e) => {
    e.preventDefault();
    if (!departmentName?.trim()) {
      setMessage("Enter department name.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/departments", { departmentName: departmentName.trim() });
      setMessage("Department created successfully.");
      setDepartmentName("");
      fetchDepartments();
    } catch (e) {
      setMessage("Error creating department.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubDept = async (e) => {
    e.preventDefault();
    if (!selectedDeptForSub) {
      setMessage("Select a parent department.");
      return;
    }
    if (!subDeptName?.trim()) {
      setMessage("Enter sub-department name.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/admin/sub-departments/add", {
        subDeptName: subDeptName.trim(),
        deptId: Number(selectedDeptForSub)
      });
      setMessage(`Sub-department '${subDeptName}' created successfully.`);
      setSubDeptName("");
      fetchSubDepartments(selectedDeptForSub);
    } catch (e) {
      setMessage("Error creating sub-department.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubDept = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      await api.delete(`/admin/sub-departments/delete/${id}`);
      setMessage(`Sub-department #${id} deleted.`);
      fetchSubDepartments(selectedDeptForSub);
    } catch (e) {
      setMessage("Error deleting sub-department.");
    } finally {
      setLoading(false);
    }
  };

  const showListDepts = operationMode === "List Departments" || operationMode === "View All Departments";
  const showAddDept = operationMode === "Add Department" || operationMode === "Create Department";
  const showListBranches = operationMode === "List Branches" || operationMode === "View / Manage Branches";
  const showAddBranch = operationMode === "Add Branch" || operationMode === "Create Branch" || operationMode === "Create New Branch";
  const showSubDepts = operationMode === "Sub-Departments" || operationMode === "Manage Sub-Departments";

  useEffect(() => {
    if (showListDepts || showSubDepts) fetchDepartments();
    if (showListBranches) fetchBranches();
    if (showSubDepts) fetchSubDepartments();
  }, [operationMode]);

  return (
    <div className={`${styles.container} ${isEmbedded ? styles.embedded : ''}`}>
      {loading && <div className={styles.loadingBanner}>Loading...</div>}
      {message && <div className={styles.messageBanner}>{message}</div>}

      {showListDepts && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Building2 className={styles.headerIcon} />
            <h3>All Hospital Departments</h3>
          </div>
          {departments.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Dept ID</th>
                  <th>Department Name</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((d) => (
                  <tr key={d.departmentId}>
                    <td>#{d.departmentId}</td>
                    <td><strong>{d.departmentName}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className={styles.emptyText}>No departments found in system.</p>
          )}
        </div>
      )}

      {showAddDept && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <PlusCircle className={styles.headerIcon} />
            <h3>Create New Department</h3>
          </div>
          <form onSubmit={handleCreateDept} className={styles.alignedForm}>
            <div className={styles.formGroup}>
              <label>Department Name</label>
              <input
                type="text"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                placeholder="e.g. Cardiology, Neurology, Pediatrics"
                disabled={loading}
                required
              />
            </div>
            <div className={styles.formActions}>
              <button type="submit" disabled={loading} className={styles.submitBtn}>
                Create Department
              </button>
            </div>
          </form>
        </div>
      )}

      {showListBranches && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <MapPin className={styles.headerIcon} />
            <h3>Hospital Branches Directory</h3>
          </div>
          {branches.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Branch Name</th>
                  <th>City</th>
                  <th>Area</th>
                  <th>Contact</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((b) => (
                  <tr key={b.branchId}>
                    <td><code>{b.branchCode}</code></td>
                    <td><strong>{b.branchName}</strong></td>
                    <td>{b.city}</td>
                    <td>{b.area || "-"}</td>
                    <td>{b.contactNumber || b.email || "-"}</td>
                    <td>{b.isMainBranch ? <span className={styles.badgePrimary}>MAIN BRANCH</span> : <span className={styles.badgeSecondary}>BRANCH</span>}</td>
                    <td><span className={styles.badgeSuccess}>{b.status || "ACTIVE"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className={styles.emptyText}>No hospital branches found.</p>
          )}
        </div>
      )}

      {showAddBranch && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <PlusCircle className={styles.headerIcon} />
            <h3>Create New Hospital Branch</h3>
          </div>
          <form onSubmit={handleCreateBranch} className={styles.gridForm}>
            <div className={styles.formGroup}>
              <label>Branch Code *</label>
              <input
                type="text"
                value={branchForm.branchCode}
                onChange={(e) => setBranchForm({ ...branchForm, branchCode: e.target.value })}
                placeholder="e.g. BR-HYD-01"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Branch Name *</label>
              <input
                type="text"
                value={branchForm.branchName}
                onChange={(e) => setBranchForm({ ...branchForm, branchName: e.target.value })}
                placeholder="e.g. MedCenter City Campus"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>City *</label>
              <input
                type="text"
                value={branchForm.city}
                onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                placeholder="e.g. Hyderabad"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Area / Locality *</label>
              <input
                type="text"
                value={branchForm.area}
                onChange={(e) => setBranchForm({ ...branchForm, area: e.target.value })}
                placeholder="e.g. Jubilee Hills"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Contact Phone</label>
              <input
                type="text"
                value={branchForm.contactNumber}
                onChange={(e) => setBranchForm({ ...branchForm, contactNumber: e.target.value })}
                placeholder="e.g. +91 9876543210"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Email Address</label>
              <input
                type="email"
                value={branchForm.email}
                onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })}
                placeholder="e.g. branch.hyd@medcenter.com"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Pincode</label>
              <input
                type="text"
                value={branchForm.pincode}
                onChange={(e) => setBranchForm({ ...branchForm, pincode: e.target.value })}
                placeholder="e.g. 500033"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Is Main Headquarters?</label>
              <select
                value={branchForm.isMainBranch ? "true" : "false"}
                onChange={(e) => setBranchForm({ ...branchForm, isMainBranch: e.target.value === "true" })}
              >
                <option value="false">No (Standard Regional Branch)</option>
                <option value="true">Yes (Main Headquarters Branch)</option>
              </select>
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label>Full Address</label>
              <textarea
                rows={2}
                value={branchForm.address}
                onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                placeholder="Plot No. 12, Road No. 36, Jubilee Hills, Hyderabad..."
                className={styles.textarea}
              />
            </div>

            <div className={styles.formActions}>
              <button type="submit" disabled={loading} className={styles.submitBtn}>
                Register Branch
              </button>
            </div>
          </form>
        </div>
      )}

      {showSubDepts && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <ListFilter className={styles.headerIcon} />
            <h3>Specialty Sub-Divisions</h3>
          </div>
          
          <div className={styles.subDeptFormCard}>
            <h4>Add New Sub-Division</h4>
            <form onSubmit={handleCreateSubDept} className={styles.gridForm}>
              <div className={styles.formGroup}>
                <label>Parent Department *</label>
                <select
                  value={selectedDeptForSub}
                  onChange={(e) => {
                    setSelectedDeptForSub(e.target.value);
                    fetchSubDepartments(e.target.value);
                  }}
                  disabled={loading}
                  required
                >
                  <option value="">-- Choose Department --</option>
                  {departments.map((d) => (
                    <option key={d.departmentId} value={d.departmentId}>
                      {d.departmentName} (ID: #{d.departmentId})
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Sub-Department / Specialty Name *</label>
                <input
                  type="text"
                  value={subDeptName}
                  onChange={(e) => setSubDeptName(e.target.value)}
                  placeholder="e.g. Interventional Cardiology, Electrophysiology"
                  disabled={loading}
                  required
                />
              </div>

              <div className={styles.formActions}>
                <button type="submit" disabled={loading} className={styles.submitBtn}>
                  Add Sub-Division
                </button>
              </div>
            </form>
          </div>

          <h4 className={styles.sectionSubtitle}>Existing Sub-Divisions</h4>
          {subDepartments.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Sub-Dept ID</th>
                  <th>Sub-Department Name</th>
                  <th>Parent Dept ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subDepartments.map((sd) => (
                  <tr key={sd.subDeptId}>
                    <td>#{sd.subDeptId}</td>
                    <td><strong>{sd.subDeptName}</strong></td>
                    <td>Dept #{sd.deptId}</td>
                    <td>
                      <button 
                        onClick={() => handleDeleteSubDept(sd.subDeptId)} 
                        className={styles.dangerBtn}
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className={styles.emptyText}>No sub-departments found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default DepartmentsPage;
