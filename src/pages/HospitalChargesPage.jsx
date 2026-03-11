import React, { useState, useEffect } from "react";
import api from "../api/api";
import styles from "./HospitalChargesPage.module.css";

const HospitalChargesPage = ({ allowedOperations = [], initialOperation, isEmbedded = false }) => {
  const [operationMode, setOperationMode] = useState(initialOperation || "");
  const [charges, setCharges] = useState([]);
  const [chargeName, setChargeName] = useState("");
  const [amount, setAmount] = useState("");
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
      setMessage("Charge updated.");
      setChargeName("");
      setAmount("");
      fetchList();
    } catch (e) {
      setMessage("Error updating charge.");
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setLoading(true);
    try {
      await api.post("/api/hospital-charges/seed");
      setMessage("Default charges seeded.");
      fetchList();
    } catch (e) {
      setMessage("Error seeding charges.");
    } finally {
      setLoading(false);
    }
  };

  const showList = operationMode === "List Charges" || operationMode === "View Hospital Charges";
  const showUpdate = operationMode === "Update Charge" || operationMode === "Edit Charge";
  const showSeed = operationMode === "Seed Charges";

  useEffect(() => {
    if (showList) fetchList();
  }, [operationMode]);

  return (
    <div className={styles.container}>
      {!isEmbedded && <h2 className={styles.title}>Hospital Charges</h2>}
      {loading && <p className={styles.loading}>Loading...</p>}

      {showList && (
        <div className={styles.section}>
          <h3>All Charges</h3>
          {charges.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Charge Name</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {charges.map((c) => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td>{c.chargeName ?? c.name}</td>
                    <td>{c.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No charges configured.</p>
          )}
        </div>
      )}

      {showUpdate && (
        <div className={styles.section}>
          <h3>Create or Update Charge</h3>
          <form onSubmit={handleUpdate}>
            <label>Charge Name (e.g. GENERAL_CONSULTATION)</label>
            <input
              type="text"
              value={chargeName}
              onChange={(e) => setChargeName(e.target.value)}
              placeholder="GENERAL_CONSULTATION"
              disabled={loading}
            />
            <label>Amount</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="500"
              disabled={loading}
            />
            <button type="submit" disabled={loading}>Save</button>
          </form>
        </div>
      )}

      {showSeed && (
        <div className={styles.section}>
          <h3>Seed Default Charges</h3>
          <p>Load default charge types (e.g. GENERAL_CONSULTATION, EMERGENCY_CONSULTATION).</p>
          <button type="button" onClick={handleSeed} disabled={loading}>Seed Charges</button>
        </div>
      )}

      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
};

export default HospitalChargesPage;
