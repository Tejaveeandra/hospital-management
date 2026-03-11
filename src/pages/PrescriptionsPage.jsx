import React, { useState, useEffect } from "react";
import api from "../api/api";
import styles from "./PrescriptionsPage.module.css";

const defaultMedicine = () => ({
  medicineName: "",
  dosage: "",
  duration: "",
  isMorning: true,
  isAfternoon: false,
  isEvening: false,
  price: "",
});

const PrescriptionsPage = ({ allowedOperations = [], initialOperation, isEmbedded = false }) => {
  const [operationMode, setOperationMode] = useState(initialOperation || "");
  const [prescriptions, setPrescriptions] = useState([]);
  const [prescriptionId, setPrescriptionId] = useState("");
  const [patientId, setPatientId] = useState("");
  const [formData, setFormData] = useState({
    appointmentId: "",
    prescriptionDate: new Date().toISOString().split("T")[0],
    medicines: [defaultMedicine()],
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialOperation) setOperationMode(initialOperation);
    if (allowedOperations?.length > 0 && !initialOperation) setOperationMode(allowedOperations[0]);
  }, [initialOperation, allowedOperations]);

  useEffect(() => {
    setMessage("");
  }, [operationMode]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/prescriptions");
      setPrescriptions(Array.isArray(res.data) ? res.data : []);
      setMessage("Prescriptions loaded.");
    } catch (e) {
      setMessage("Error loading prescriptions.");
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchByPatient = async () => {
    if (!patientId?.trim()) {
      setMessage("Enter Patient ID.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/api/prescriptions/getPrescriptionByPatientId/${patientId.trim()}`);
      setPrescriptions(Array.isArray(res.data) ? res.data : []);
      setMessage(`Found ${res.data?.length ?? 0} prescription(s).`);
    } catch (e) {
      setMessage("Error loading prescriptions for patient.");
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOne = async () => {
    if (!prescriptionId?.trim()) {
      setMessage("Enter Prescription ID.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/api/prescriptions/${prescriptionId.trim()}`);
      setFormData({
        appointmentId: res.data?.appointmentId ?? "",
        prescriptionDate: res.data?.prescriptionDate ?? new Date().toISOString().split("T")[0],
        medicines: (res.data?.medicines && res.data.medicines.length > 0)
          ? res.data.medicines.map((m) => ({
              medicineName: m.medicineName ?? "",
              dosage: m.dosage ?? "",
              duration: m.duration ?? "",
              isMorning: m.isMorning ?? true,
              isAfternoon: m.isAfternoon ?? false,
              isEvening: m.isEvening ?? false,
              price: m.price ?? "",
            }))
          : [defaultMedicine()],
      });
      setMessage("Prescription loaded.");
    } catch (e) {
      setMessage("Prescription not found.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const appointmentId = Number(formData.appointmentId);
    if (!appointmentId || isNaN(appointmentId)) {
      setMessage("Enter a valid Appointment ID.");
      return;
    }
    const medicines = formData.medicines
      .filter((m) => m.medicineName?.trim())
      .map((m) => ({
        medicineName: m.medicineName.trim(),
        dosage: m.dosage?.trim() || "",
        duration: m.duration?.trim() || "",
        isMorning: !!m.isMorning,
        isAfternoon: !!m.isAfternoon,
        isEvening: !!m.isEvening,
        price: Number(m.price) || 0,
      }));
    if (medicines.length === 0) {
      setMessage("Add at least one medicine.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/prescriptions", {
        appointmentId,
        prescriptionDate: formData.prescriptionDate,
        medicines,
      });
      setMessage("Prescription created.");
      setFormData({
        appointmentId: "",
        prescriptionDate: new Date().toISOString().split("T")[0],
        medicines: [defaultMedicine()],
      });
    } catch (err) {
      setMessage("Error creating prescription.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const id = prescriptionId?.trim();
    if (!id) {
      setMessage("Enter Prescription ID (fetch first to edit).");
      return;
    }
    const medicines = formData.medicines
      .filter((m) => m.medicineName?.trim())
      .map((m) => ({
        medicineName: m.medicineName.trim(),
        dosage: m.dosage?.trim() || "",
        duration: m.duration?.trim() || "",
        isMorning: !!m.isMorning,
        isAfternoon: !!m.isAfternoon,
        isEvening: !!m.isEvening,
        price: Number(m.price) || 0,
      }));
    if (medicines.length === 0) {
      setMessage("Add at least one medicine.");
      return;
    }
    setLoading(true);
    try {
      await api.put(`/api/prescriptions/${id}`, {
        appointmentId: Number(formData.appointmentId) || 0,
        prescriptionDate: formData.prescriptionDate,
        medicines,
      });
      setMessage("Prescription updated.");
    } catch (err) {
      setMessage("Error updating prescription.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!prescriptionId?.trim()) {
      setMessage("Enter Prescription ID.");
      return;
    }
    setLoading(true);
    try {
      await api.delete(`/api/prescriptions/${prescriptionId.trim()}`);
      setMessage("Prescription deleted.");
      setPrescriptionId("");
    } catch (e) {
      setMessage("Error deleting prescription.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("Delete all prescriptions?")) return;
    setLoading(true);
    try {
      await api.delete("/api/prescriptions/delete All");
      setMessage("All prescriptions deleted.");
      setPrescriptions([]);
    } catch (e) {
      setMessage("Error deleting all prescriptions.");
    } finally {
      setLoading(false);
    }
  };

  const setMedicine = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      medicines: prev.medicines.map((m, i) =>
        i === index ? { ...m, [field]: value } : m
      ),
    }));
  };

  const addMedicine = () => {
    setFormData((prev) => ({ ...prev, medicines: [...prev.medicines, defaultMedicine()] }));
  };

  const removeMedicine = (index) => {
    setFormData((prev) => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index),
    }));
  };

  const showList = operationMode === "List Prescriptions" || operationMode === "View All Prescriptions";
  const showByPatient = operationMode === "Prescriptions by Patient";
  const showOne = operationMode === "View Prescription" || operationMode === "Get Prescription";
  const showCreate = operationMode === "Create Prescription" || operationMode === "Add Prescription";
  const showUpdate = operationMode === "Update Prescription";
  const showDelete = operationMode === "Delete Prescription";
  const showDeleteAll = operationMode === "Delete All Prescriptions";

  useEffect(() => {
    if (showList) fetchAll();
  }, [operationMode]);

  return (
    <div className={styles.container}>
      {!isEmbedded && <h2 className={styles.title}>Prescriptions</h2>}
      {loading && <p className={styles.loading}>Loading...</p>}

      {showList && (
        <div className={styles.section}>
          <h3>All Prescriptions</h3>
          {prescriptions.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map((p) => (
                  <tr key={p.prescriptionId}>
                    <td>{p.prescriptionId}</td>
                    <td>{p.patientName ?? "—"}</td>
                    <td>{p.doctorName ?? "—"}</td>
                    <td>{p.prescriptionDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No prescriptions.</p>
          )}
        </div>
      )}

      {showByPatient && (
        <div className={styles.section}>
          <h3>Prescriptions by Patient</h3>
          <label>Patient ID</label>
          <input
            type="text"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            placeholder="Patient ID"
            disabled={loading}
          />
          <button type="button" onClick={fetchByPatient} disabled={loading}>Fetch</button>
          {prescriptions.length > 0 && (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map((p) => (
                  <tr key={p.prescriptionId}>
                    <td>{p.prescriptionId}</td>
                    <td>{p.patientName ?? "—"}</td>
                    <td>{p.doctorName ?? "—"}</td>
                    <td>{p.prescriptionDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {(showOne || showUpdate || showDelete) && (
        <div className={styles.section}>
          <h3>{showOne ? "View Prescription" : showUpdate ? "Update Prescription" : "Delete Prescription"}</h3>
          <label>Prescription ID</label>
          <input
            type="text"
            value={prescriptionId}
            onChange={(e) => setPrescriptionId(e.target.value)}
            placeholder="ID"
            disabled={loading}
          />
          {showOne && <button type="button" onClick={fetchOne} disabled={loading}>Fetch</button>}
          {showUpdate && <button type="button" onClick={fetchOne} disabled={loading}>Load to edit</button>}
          {showDelete && <button type="button" onClick={handleDelete} disabled={loading} className={styles.danger}>Delete</button>}
        </div>
      )}

      {(showCreate || showUpdate) && (
        <div className={styles.section}>
          <h3>{showCreate ? "Create Prescription" : "Edit Prescription"}</h3>
          <form onSubmit={showCreate ? handleCreate : handleUpdate}>
            <label>Appointment ID</label>
            <input
              type="number"
              value={formData.appointmentId}
              onChange={(e) => setFormData((p) => ({ ...p, appointmentId: e.target.value }))}
              disabled={loading}
            />
            <label>Prescription Date (yyyy-MM-dd)</label>
            <input
              type="date"
              value={formData.prescriptionDate}
              onChange={(e) => setFormData((p) => ({ ...p, prescriptionDate: e.target.value }))}
              disabled={loading}
            />
            <h4>Medicines</h4>
            {formData.medicines.map((m, index) => (
              <div key={index} className={styles.medicineRow}>
                <input placeholder="Medicine name" value={m.medicineName} onChange={(e) => setMedicine(index, "medicineName", e.target.value)} disabled={loading} />
                <input placeholder="Dosage" value={m.dosage} onChange={(e) => setMedicine(index, "dosage", e.target.value)} disabled={loading} />
                <input placeholder="Duration" value={m.duration} onChange={(e) => setMedicine(index, "duration", e.target.value)} disabled={loading} />
                <label><input type="checkbox" checked={m.isMorning} onChange={(e) => setMedicine(index, "isMorning", e.target.checked)} /> Morning</label>
                <label><input type="checkbox" checked={m.isAfternoon} onChange={(e) => setMedicine(index, "isAfternoon", e.target.checked)} /> Afternoon</label>
                <label><input type="checkbox" checked={m.isEvening} onChange={(e) => setMedicine(index, "isEvening", e.target.checked)} /> Evening</label>
                <input type="number" step="0.01" placeholder="Price" value={m.price} onChange={(e) => setMedicine(index, "price", e.target.value)} disabled={loading} />
                <button type="button" onClick={() => removeMedicine(index)} disabled={formData.medicines.length <= 1}>Remove</button>
              </div>
            ))}
            <button type="button" onClick={addMedicine} disabled={loading}>Add medicine</button>
            <button type="submit" disabled={loading}>{showCreate ? "Create" : "Update"}</button>
          </form>
        </div>
      )}

      {showDeleteAll && (
        <div className={styles.section}>
          <h3>Delete All Prescriptions</h3>
          <p>Super Admin only. This cannot be undone.</p>
          <button type="button" onClick={handleDeleteAll} disabled={loading} className={styles.danger}>Delete All</button>
        </div>
      )}

      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
};

export default PrescriptionsPage;
