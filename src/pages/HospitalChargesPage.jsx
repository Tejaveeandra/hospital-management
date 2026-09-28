import React, { useState, useEffect } from "react";
import api from "../api/api";
import styles from "./HospitalChargesPage.module.css";

const HospitalChargesPage = ({ allowedOperations = [], initialOperation, isEmbedded = false }) => {
  const [operationMode, setOperationMode] = useState(initialOperation || "");
  const [charges, setCharges] = useState([]);
  const [chargeName, setChargeName] = useState("");
  const [amount, setAmount] = useState("");
  const [deleteId, setDeleteId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialOperation) setOperationMode(initialOperation);
    if (allowedOperations?.length > 0 && !initialOperation) setOperationMode(allowedOperations[0]);
  }, [initialOperation, allowedOperations]);

  useEffect(() => {
    setMessage("");
  }, [operationMode]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/hospital-charges/list");
      setCharges(Array.isArray(res.data) ? res.data : []);
      setMessage("Charges loaded.");
    } catch (e) {
      setMessage("Error loading charges.");
      setCharges([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const name = chargeName?.trim();
    const amt = Number(amount);
    if (!name) {
      setMessage("Enter charge name (e.g. GENERAL_CONSULTATION).");
      return;
    }
    if (isNaN(amt) || amt < 0) {
      setMessage("Enter a valid amount.");
      return;
    }
    setLoading(true);
    try {
      await api.post(`/api/hospital-charges/add?name=${encodeURIComponent(name)}&amount=${amt}`);
      setMessage("Charge created successfully.");
      setChargeName("");
      setAmount("");
      fetchList();
    } catch (e) {
      setMessage("Error creating charge.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const name = chargeName?.trim();
    const amt = Number(amount);
    if (!name) {
      setMessage("Enter charge name (e.g. GENERAL_CONSULTATION).");
      return;
    }
    if (isNaN(amt) || amt < 0) {
      setMessage("Enter a valid amount.");
      return;
    }
    setLoading(true);
    try {
      await api.post(
        `/api/hospital-charges/update?name=${encodeURIComponent(name)}&amount=${amt}`
      );
      setMessage("Charge updated successfully.");
      setChargeName("");
      setAmount("");
      fetchList();
    } catch (e) {
      setMessage("Error updating charge.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId?.trim()) {
      setMessage("Enter Charge ID to delete.");
      return;
    }
    setLoading(true);
    try {
      await api.delete(`/api/hospital-charges/delete/${deleteId.trim()}`);
      setMessage("Hospital charge deleted.");
      setDeleteId("");
      fetchList();
    } catch (e) {
      setMessage("Error deleting charge.");
    } finally {
      setLoading(false);
    }
  };

  const showList = operationMode === "List Charges" || operationMode === "View Hospital Charges";
  const showAdd = operationMode === "Add Charge" || operationMode === "Create Charge";
  const showUpdate = operationMode === "Update Charge" || operationMode === "Edit Charge";
  const showDelete = operationMode === "Delete Charge" || operationMode === "Remove Charge";

  useEffect(() => {
    if (showList) fetchList();
  }, [operationMode]);

  return (
    <div className={styles.container}>
      {!isEmbedded && <h2 className={styles.title}>Hospital Charges</h2>}
      {loading && <p className={styles.loading}>Loading...</p>}

      {showList && (
        <div className={styles.section}>
          <h3>All Fee Schedules</h3>
          {charges.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Charge Name</th>
                  <th>Amount ($)</th>
                </tr>
              </thead>
              <tbody>
                {charges.map((c) => (
                  <tr key={c.id}>
                    <td>#{c.id}</td>
                    <td>{c.chargeName ?? c.name}</td>
                    <td>${Number(c.amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No charges configured.</p>
          )}
        </div>
      )}

      {showAdd && (
        <div className={styles.section}>
          <h3>Add New Charge Schedule</h3>
          <form onSubmit={handleAdd}>
            <label>Charge Name (e.g. ICU_PER_DAY)</label>
            <input
              type="text"
              value={chargeName}
              onChange={(e) => setChargeName(e.target.value)}
              placeholder="e.g. ICU_PER_DAY"
              disabled={loading}
              required
            />
            <label>Amount ($)</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 1500.00"
              disabled={loading}
              required
            />
            <button type="submit" disabled={loading}>Add Charge</button>
          </form>
        </div>
      )}

      {showUpdate && (
        <div className={styles.section}>
          <h3>Update Existing Charge Schedule</h3>
          <form onSubmit={handleUpdate}>
            <label>Charge Name (e.g. GENERAL_CONSULTATION)</label>
            <input
              type="text"
              value={chargeName}
              onChange={(e) => setChargeName(e.target.value)}
              placeholder="GENERAL_CONSULTATION"
              disabled={loading}
              required
            />
            <label>New Amount ($)</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="500"
              disabled={loading}
              required
            />
            <button type="submit" disabled={loading}>Update Charge</button>
          </form>
        </div>
      )}

      {showDelete && (
        <div className={styles.section}>
          <h3>Delete Fee Schedule</h3>
          <div>
            <label>Charge ID</label>
            <input
              type="text"
              value={deleteId}
              onChange={(e) => setDeleteId(e.target.value)}
              placeholder="Enter Charge ID (e.g. 1)"
              disabled={loading}
            />
            <button type="button" onClick={handleDelete} disabled={loading}>Delete Charge</button>
          </div>
        </div>
      )}

      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
};

export default HospitalChargesPage;
