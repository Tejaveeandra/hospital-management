import React, { useState, useEffect } from "react";
import api from "../api/api";
import styles from "./DepartmentsPage.module.css";

const DepartmentsPage = ({ allowedOperations = [], initialOperation, isEmbedded = false }) => {
  const [operationMode, setOperationMode] = useState(initialOperation || "");
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [departmentId, setDepartmentId] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [doctorsInDept, setDoctorsInDept] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialOperation) setOperationMode(initialOperation);
    if (allowedOperations?.length > 0 && !initialOperation) setOperationMode(allowedOperations[0]);
  }, [initialOperation, allowedOperations]);

  useEffect(() => {
    setMessage("");
  }, [operationMode]);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/departments");
      setDepartments(Array.isArray(res.data) ? res.data : []);
      setMessage("Departments loaded.");
    } catch (e) {
      setMessage("Error loading departments.");
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentById = async () => {
    if (!departmentId?.trim()) {
      setMessage("Enter a department ID.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/api/departments/${departmentId.trim()}`);
      setSelectedDept(res.data);
      setDepartmentName(res.data?.departmentName || "");
      setMessage("Department loaded.");
    } catch (e) {
      setMessage("Department not found.");
      setSelectedDept(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorsByDepartment = async () => {
    const id = departmentId?.trim();
    if (!id) {
      setMessage("Enter a department ID.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/api/departments/${id}/doctors`);
      setDoctorsInDept(Array.isArray(res.data) ? res.data : []);
      setMessage(`Doctors in department: ${res.data?.length ?? 0}`);
    } catch (e) {
      setMessage("Error loading doctors.");
      setDoctorsInDept([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!departmentName?.trim()) {
      setMessage("Enter department name.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/departments", { departmentName: departmentName.trim() });
      setMessage("Department created.");
      setDepartmentName("");
      fetchDepartments();
    } catch (e) {
      setMessage("Error creating department.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const id = selectedDept?.departmentId || departmentId?.trim();
    if (!id || !departmentName?.trim()) {
      setMessage("Select a department and enter a name.");
      return;
    }
    setLoading(true);
    try {
      await api.put(`/api/departments/${id}`, { departmentName: departmentName.trim() });
      setMessage("Department updated.");
      setSelectedDept(null);
      setDepartmentId("");
      setDepartmentName("");
      fetchDepartments();
    } catch (e) {
      setMessage("Error updating department.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const id = selectedDept?.departmentId || departmentId?.trim();
    if (!id) {
      setMessage("Enter or select a department ID.");
      return;
    }
    setLoading(true);
    try {
      await api.delete(`/api/departments/${id}`);
      setMessage("Department deleted.");
      setSelectedDept(null);
      setDepartmentId("");
      fetchDepartments();
    } catch (e) {
      setMessage("Error deleting department.");
    } finally {
      setLoading(false);
    }
  };

  const showList = operationMode === "List Departments" || operationMode === "View All Departments";
  const showAdd = operationMode === "Add Department" || operationMode === "Create Department";
  const showGetOne = operationMode === "Get Department" || operationMode === "View Department";
  const showUpdate = operationMode === "Update Department";
  const showDelete = operationMode === "Delete Department";
  const showDoctorsByDept = operationMode === "Doctors by Department";

  useEffect(() => {
    if (showList) fetchDepartments();
  }, [operationMode]);

  return (
    <div className={styles.container}>
      {!isEmbedded && (
        <h2 className={styles.title}>Departments</h2>
      )}
      {loading && <p className={styles.loading}>Loading...</p>}

      {showList && (
        <div className={styles.section}>
          <h3>All Departments</h3>
          {departments.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((d) => (
                  <tr key={d.departmentId}>
                    <td>{d.departmentId}</td>
                    <td>{d.departmentName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No departments.</p>
          )}
        </div>
      )}

      {showAdd && (
        <div className={styles.section}>
          <h3>Add Department</h3>
          <form onSubmit={handleCreate}>
            <label>Department Name</label>
            <input
              type="text"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              placeholder="e.g. Cardiology"
              disabled={loading}
            />
            <button type="submit" disabled={loading}>Create</button>
          </form>
        </div>
      )}

      {(showGetOne || showUpdate || showDelete) && (
        <div className={styles.section}>
          <h3>{showGetOne ? "View Department" : showUpdate ? "Update Department" : "Delete Department"}</h3>
          <label>Department ID</label>
          <input
            type="text"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            placeholder="ID"
            disabled={loading}
          />
          {showGetOne && (
            <button type="button" onClick={fetchDepartmentById} disabled={loading}>Fetch</button>
          )}
          {selectedDept && showGetOne && (
            <div className={styles.detail}>
              <p><strong>ID:</strong> {selectedDept.departmentId}</p>
              <p><strong>Name:</strong> {selectedDept.departmentName}</p>
            </div>
          )}
          {showUpdate && (
            <form onSubmit={handleUpdate}>
              <label>New Name</label>
              <input
                type="text"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                placeholder="Department name"
                disabled={loading}
              />
              <button type="button" onClick={fetchDepartmentById} disabled={loading}>Fetch</button>
              <button type="submit" disabled={loading}>Update</button>
            </form>
          )}
          {showDelete && (
            <>
              <button type="button" onClick={fetchDepartmentById} disabled={loading}>Load</button>
              <button type="button" onClick={handleDelete} disabled={loading} className={styles.danger}>Delete</button>
            </>
          )}
        </div>
      )}

      {showDoctorsByDept && (
        <div className={styles.section}>
          <h3>Doctors by Department</h3>
          <label>Department ID</label>
          <input
            type="text"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            placeholder="Department ID"
            disabled={loading}
          />
          <button type="button" onClick={fetchDoctorsByDepartment} disabled={loading}>Get Doctors</button>
          {doctorsInDept.length > 0 && (
            <ul className={styles.list}>
              {doctorsInDept.map((name, i) => (
                <li key={i}>{name}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
};

export default DepartmentsPage;
