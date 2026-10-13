import React, { useState, useEffect } from "react";
import api from "../api/api";
import { UserPlus, Search, Edit3, Eye, FileText, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import styles from "./PatientPage.module.css";
import AppointmentManagement from "./AppointmentPage";

const PatientPage = ({ initialOperation, isEmbedded = false }) => {
  const [operationMode, setOperationMode] = useState(initialOperation || "viewAll");
  const [searchUhid, setSearchUhid] = useState("");
  const [formData, setFormData] = useState({
    patientId: "",
    uhid: "",
    patientName: "",
    username: "",
    contact: "",
    age: "",
    gender: "",
    disease: "",
    date: new Date().toISOString().split("T")[0],
    prevMedication: "",
  });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info"); // 'info' | 'success' | 'error'
  const [loading, setLoading] = useState(false);
  const [createdPatient, setCreatedPatient] = useState(null);
  const [patientFetched, setPatientFetched] = useState(false);
  const [allPatients, setAllPatients] = useState([]);

  // Pagination state variables
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(0);
  const [patientPrescriptions, setPatientPrescriptions] = useState([]);

  const [user] = useState(() => {
    const role = localStorage.getItem("role") || "admin";
    const id = localStorage.getItem("userId") || localStorage.getItem("id") || "1";
    return { id, role };
  });

  const showNotification = (msg, type = "info") => {
    setMessage(msg);
    setMessageType(type);
  };

  const resetForm = () => {
    setFormData({
      patientId: "",
      uhid: "",
      patientName: "",
      username: "",
      contact: "",
      age: "",
      gender: "",
      disease: "",
      date: new Date().toISOString().split("T")[0],
      prevMedication: "",
    });
    setSearchUhid("");
    setCreatedPatient(null);
    setMessage("");
    setPatientFetched(false);
    setAllPatients([]);
    setLoading(false);
    setCurrentPage(0);
    setPatientPrescriptions([]);
  };

  useEffect(() => {
    const op = initialOperation || "viewAll";
    setOperationMode(op);
    if (op === "viewAll") {
      fetchAllPatients(0);
    }
  }, [initialOperation]);

  const handleOperation = (mode) => {
    setOperationMode(mode);
    resetForm();
    if (mode === "viewAll") {
      fetchAllPatients(0);
    }
  };

  const fetchPatientByUhid = async (overrideTerm) => {
    const term = (overrideTerm !== undefined ? overrideTerm : searchUhid).trim();
    if (!term) {
      showNotification("Please enter a valid Patient UHID (e.g. UHID-2026-00001 or ID)", "error");
      return;
    }
    setLoading(true);
    try {
      const response = await api.get(`/patients/${encodeURIComponent(term)}`);
      if (response.status === 200 && response.data) {
        const p = response.data;
        setFormData({
          patientId: p.patientId || "",
          uhid: p.uhid || "",
          patientName: p.patientName || "",
          username: p.username || "",
          contact: p.contact || "",
          age: p.age !== undefined && p.age !== null ? p.age : "",
          gender: p.gender || "",
          disease: p.disease || "",
          date: p.date || new Date().toISOString().split("T")[0],
          prevMedication: p.prevMedication || "",
        });
        setPatientFetched(true);
        showNotification(`Patient ${p.uhid || p.patientName} record loaded successfully`, "success");
        
        // Fetch prescriptions for this patient
        const lookupId = p.patientId || term;
        try {
          const presRes = await api.get(`/api/prescriptions/getPrescriptionByPatientId/${lookupId}`);
          setPatientPrescriptions(Array.isArray(presRes.data) ? presRes.data : []);
        } catch {
          setPatientPrescriptions([]);
        }
      } else {
        setPatientFetched(false);
        showNotification(`No patient found matching UHID / ID: ${term}`, "error");
        setPatientPrescriptions([]);
      }
    } catch (error) {
      const errDetail = error.response?.data?.message || error.message || "Unknown error";
      showNotification(`Error fetching patient: ${errDetail}`, "error");
      setPatientFetched(false);
      setPatientPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (operationMode === "update") {
        const targetUhid = (formData.uhid || searchUhid || formData.patientId).toString().trim();
        if (!targetUhid) {
          showNotification("Missing UHID for updating patient record.", "error");
          setLoading(false);
          return;
        }

        const payload = {
          patientName: formData.patientName.trim(),
          username: formData.username || `user_${Date.now()}`,
          contact: formData.contact.trim(),
          gender: formData.gender,
          disease: formData.disease.trim(),
          age: Number(formData.age),
          date: formData.date,
          prevMedication: formData.prevMedication ? formData.prevMedication.trim() : "",
        };

        const response = await api.put(`/patients/update/${encodeURIComponent(targetUhid)}`, payload);
        showNotification(`Patient record for ${response.data.uhid || targetUhid} updated successfully!`, "success");
        setCreatedPatient(response.data);
        setFormData({
          ...formData,
          ...response.data,
        });
        setPatientFetched(true);
      } else if (operationMode === "create") {
        const autoUsername = formData.username && formData.username.trim()
          ? formData.username.trim()
          : (formData.patientName
              ? formData.patientName.toLowerCase().replace(/[^a-z0-9]/g, "") + Math.floor(1000 + Math.random() * 9000)
              : "patient_" + Date.now());

        const payload = {
          patientName: formData.patientName.trim(),
          username: autoUsername,
          contact: formData.contact.trim(),
          gender: formData.gender,
          disease: formData.disease.trim(),
          age: Number(formData.age),
          date: formData.date,
          prevMedication: formData.prevMedication ? formData.prevMedication.trim() : "",
        };

        const response = await api.post("/patients/addPatient", payload);
        const assignedUhid = response.data.uhid || `ID #${response.data.patientId}`;
        showNotification(`Patient created successfully with UHID: ${assignedUhid}`, "success");
        setCreatedPatient(response.data);
        setSearchUhid(response.data.uhid || response.data.patientId);
      }
    } catch (error) {
      const errDetail = error.response?.data?.message || (error.response?.data?.errors ? JSON.stringify(error.response.data.errors) : error.message);
      showNotification(`Failed to save patient: ${errDetail}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditFromTable = (patient) => {
    setOperationMode("update");
    const targetUhid = patient.uhid || String(patient.patientId);
    setSearchUhid(targetUhid);
    setFormData({
      patientId: patient.patientId || "",
      uhid: patient.uhid || "",
      patientName: patient.patientName || "",
      username: patient.username || "",
      contact: patient.contact || "",
      age: patient.age !== undefined ? patient.age : "",
      gender: patient.gender || "",
      disease: patient.disease || "",
      date: patient.date || new Date().toISOString().split("T")[0],
      prevMedication: patient.prevMedication || "",
    });
    setPatientFetched(true);
    showNotification(`Loaded patient ${patient.uhid || patient.patientName} for editing`, "info");
  };

  const handleViewFromTable = (patient) => {
    setOperationMode("view");
    const targetUhid = patient.uhid || String(patient.patientId);
    setSearchUhid(targetUhid);
    fetchPatientByUhid(targetUhid);
  };

  const fetchAllPatients = async (page = currentPage) => {
    setLoading(true);
    try {
      const response = await api.get("/patients/getAllPatients", {
        params: {
          page: page,
          size: pageSize,
          sortBy: "patientId",
        },
      });
      if (response.status === 200 && response.data) {
        const content = response.data.content || response.data;
        setAllPatients(Array.isArray(content) ? content : []);
        setTotalPages(response.data.totalPages || 1);
        setCurrentPage(response.data.number || page);
        setOperationMode("viewAll");
        showNotification("All patient records loaded", "info");
      } else {
        showNotification("No patient records found.", "info");
      }
    } catch (error) {
      showNotification("Error loading patient directory.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      fetchAllPatients(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      fetchAllPatients(currentPage + 1);
    }
  };

  return (
    <div className={`${styles['patient-container']} ${isEmbedded ? styles['embedded-view'] : ''}`}>
      {!isEmbedded && (
        <div className={styles['left-panel']}>
          <div className={styles['patient-action-buttons']}>
            <h3>Patient Records</h3>
            <button className={operationMode === "viewAll" ? styles.activeTab : ""} onClick={() => handleOperation("viewAll")} disabled={loading}>
              <FileText size={16} /> Directory
            </button>
            <button className={operationMode === "create" ? styles.activeTab : ""} onClick={() => handleOperation("create")} disabled={loading}>
              <UserPlus size={16} /> Register Patient
            </button>
            <button className={operationMode === "view" ? styles.activeTab : ""} onClick={() => handleOperation("view")} disabled={loading}>
              <Eye size={16} /> View by UHID
            </button>
            <button className={operationMode === "update" ? styles.activeTab : ""} onClick={() => handleOperation("update")} disabled={loading}>
              <Edit3 size={16} /> Update by UHID
            </button>
          </div>
        </div>
      )}

      <div className={styles['right-panel']}>
        {message && (
          <div
            className={styles['message']}
            style={{
              backgroundColor: messageType === "success" ? "#f0fdf4" : messageType === "error" ? "#fef2f2" : "#f1f5f9",
              borderColor: messageType === "success" ? "#bbf7d0" : messageType === "error" ? "#fecaca" : "#e2e8f0",
              color: messageType === "success" ? "#166534" : messageType === "error" ? "#991b1b" : "#334155",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {messageType === "success" && <CheckCircle2 size={18} />}
            {messageType === "error" && <AlertCircle size={18} />}
            {messageType === "info" && <RefreshCw size={18} />}
            <span>{message}</span>
          </div>
        )}

        {/* REGISTER NEW PATIENT */}
        {operationMode === "create" && (
          <div className={styles['form-container']}>
            <div className={styles.headerRow}>
              <div>
                <h3 className={styles.headerTitle}>Register New Patient</h3>
                <div className={styles.headerSubtitle}>Assigns unique medical UHID and creates verified medical file</div>
              </div>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={styles.inputRow}>
                <div className={styles.inputGroup}>
                  <label>Patient Full Name *</label>
                  <input name="patientName" placeholder="e.g. John Doe" value={formData.patientName} onChange={handleInputChange} required />
                </div>
                <div className={styles.inputGroup}>
                  <label>Contact Phone (10 Digits) *</label>
                  <input name="contact" placeholder="9876543210" value={formData.contact} onChange={handleInputChange} required />
                </div>
              </div>

              <div className={styles.inputRow}>
                <div className={styles.inputGroup}>
                  <label>Age *</label>
                  <input type="number" name="age" placeholder="e.g. 35" value={formData.age} onChange={handleInputChange} min="0" max="130" required />
                </div>
                <div className={styles.inputGroup}>
                  <label>Gender *</label>
                  <select name="gender" value={formData.gender} onChange={handleInputChange} required>
                    <option value="">Select Gender...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className={styles.inputRow}>
                <div className={styles.inputGroup}>
                  <label>Primary Diagnosis / Chief Complaint *</label>
                  <input name="disease" placeholder="e.g. Hypertension, Viral Fever, Orthopedic Pain" value={formData.disease} onChange={handleInputChange} required />
                </div>
                <div className={styles.inputGroup}>
                  <label>Registration Date *</label>
                  <input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Previous Medication & Known Allergies</label>
                <textarea name="prevMedication" placeholder="Enter previous medical history, existing prescriptions, allergy notes..." value={formData.prevMedication} onChange={handleInputChange} />
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                <UserPlus size={16} /> {loading ? "Creating Patient..." : "Create Patient Record"}
              </button>
            </form>

            {createdPatient && (
              <div className={styles['success-message']}>
                <div>
                  <p><strong>Patient Registered Successfully!</strong></p>
                  <div style={{ fontSize: "0.9rem", color: "#166534", marginTop: "4px" }}>
                    Assigned UHID: <strong>{createdPatient.uhid || `ID #${createdPatient.patientId}`}</strong> | Name: {createdPatient.patientName}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => handleEditFromTable(createdPatient)}>
                    Edit Record
                  </button>
                  <button onClick={() => setOperationMode("Create Appointment")}>
                    Book Appointment
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW PATIENT DETAILS BY UHID */}
        {operationMode === "view" && (
          <div className={styles['form-container']}>
            <div className={styles.headerRow}>
              <div>
                <h3 className={styles.headerTitle}>View Patient Record by UHID</h3>
                <div className={styles.headerSubtitle}>Look up full decrypted patient profile and active medical history</div>
              </div>
            </div>
            <div className={`${styles.inputRow} ${styles.alignEnd}`}>
              <div className={styles.inputGroup} style={{ flex: 2 }}>
                <label>Patient UHID / ID</label>
                <input
                  type="text"
                  placeholder="Enter UHID (e.g. UHID-2026-00001 or ID)"
                  value={searchUhid}
                  onChange={(e) => setSearchUhid(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); fetchPatientByUhid(); } }}
                />
              </div>
              <button type="button" className={`${styles.submitBtn} ${styles.btnNoMargin}`} onClick={() => fetchPatientByUhid()} disabled={loading}>
                <Search size={16} /> {loading ? "Fetching..." : "Fetch Details"}
              </button>
            </div>

            {patientFetched && (
              <>
                <div style={{
                  background: "#f8fafc",
                  borderRadius: "12px",
                  padding: "20px",
                  border: "1px solid #e2e8f0",
                  marginTop: "16px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "16px",
                }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>Medical UHID</span>
                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#3b82f6", marginTop: "4px" }}>
                      {formData.uhid || `#${formData.patientId}`}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>Patient Full Name</span>
                    <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", marginTop: "4px" }}>
                      {formData.patientName}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>Contact Phone</span>
                    <div style={{ fontSize: "1rem", fontWeight: 600, color: "#0f172a", marginTop: "4px" }}>
                      {formData.contact || "N/A"}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>Age & Gender</span>
                    <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#0f172a", marginTop: "4px" }}>
                      {formData.age} yrs • {formData.gender}
                    </div>
                  </div>

                  <div style={{ gridColumn: "span 2" }}>
                    <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>Diagnosis / Condition</span>
                    <div style={{
                      display: "inline-block",
                      marginLeft: "8px",
                      padding: "3px 10px",
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      borderRadius: "6px",
                      fontWeight: 600,
                      fontSize: "0.9rem"
                    }}>
                      {formData.disease || "None recorded"}
                    </div>
                  </div>

                  <div style={{ gridColumn: "span 2" }}>
                    <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>Previous Medication & History</span>
                    <div style={{ fontSize: "0.9rem", color: "#334155", marginTop: "4px", background: "#fff", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      {formData.prevMedication || "No prior medications listed."}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    className={styles.submitBtn}
                    onClick={() => {
                      setOperationMode("update");
                    }}
                  >
                    <Edit3 size={16} /> Edit This Patient's Record
                  </button>
                  <button
                    type="button"
                    style={{
                      padding: "11px 20px",
                      borderRadius: "10px",
                      background: "#f1f5f9",
                      border: "1px solid #cbd5e1",
                      cursor: "pointer",
                      fontWeight: 600,
                      color: "#334155"
                    }}
                    onClick={() => setOperationMode("Create Appointment")}
                  >
                    Book Appointment for this Patient
                  </button>
                </div>

                {patientPrescriptions.length > 0 && (
                  <div style={{ marginTop: "24px" }}>
                    <h4 style={{ margin: "0 0 12px 0", color: "#0f172a" }}>Medical Prescriptions History ({patientPrescriptions.length})</h4>
                    <table className={styles['patients-table']}>
                      <thead>
                        <tr>
                          <th>Prescription Code</th>
                          <th>Doctor</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patientPrescriptions.map((p) => (
                          <tr key={p.prescriptionId}>
                            <td>#{p.prescriptionId}</td>
                            <td>{p.doctorName || "Staff Physician"}</td>
                            <td>{p.prescriptionDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ALL PATIENTS DIRECTORY */}
        {operationMode === "viewAll" && (
          <div className={styles['all-patients-container']}>
            <div className={styles.headerRow}>
              <div>
                <h3 className={styles.headerTitle}>All Registered Patients</h3>
                <div className={styles.headerSubtitle}>Complete master directory with UHID identification</div>
              </div>
              <button
                type="button"
                className={styles.submitBtn}
                style={{ margin: 0, padding: "8px 16px" }}
                onClick={() => fetchAllPatients(currentPage)}
                disabled={loading}
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
            {allPatients.length > 0 ? (
              <>
                <table className={styles['patients-table']}>
                  <thead>
                    <tr>
                      <th>UHID</th>
                      <th>Patient Name</th>
                      <th>Contact</th>
                      <th>Age</th>
                      <th>Gender</th>
                      <th>Diagnosis</th>
                      <th>Reg. Date</th>
                      <th style={{ textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allPatients.map((patient) => (
                      <tr key={patient.patientId || patient.uhid}>
                        <td>
                          <span style={{
                            display: "inline-block",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            background: "#e0f2fe",
                            color: "#0369a1",
                            fontWeight: 700,
                            fontFamily: "monospace",
                            fontSize: "0.85rem"
                          }}>
                            {patient.uhid || `ID #${patient.patientId}`}
                          </span>
                        </td>
                        <td className={styles.nameCell} style={{ fontWeight: 600 }}>{patient.patientName}</td>
                        <td>{patient.contact}</td>
                        <td>{patient.age} yrs</td>
                        <td>
                          <span className={`${styles.genderBadge} ${patient.gender === 'Male' ? styles.genderMale : patient.gender === 'Female' ? styles.genderFemale : styles.genderOther}`}>
                            {patient.gender || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            padding: "2px 8px",
                            borderRadius: "4px",
                            background: "#f1f5f9",
                            fontSize: "0.85rem"
                          }}>
                            {patient.disease}
                          </span>
                        </td>
                        <td style={{ fontSize: "0.85rem", color: "#64748b" }}>{patient.date}</td>
                        <td style={{ textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                            <button
                              type="button"
                              onClick={() => handleViewFromTable(patient)}
                              title="View Patient Record"
                              style={{
                                padding: "6px 10px",
                                background: "#f8fafc",
                                border: "1px solid #cbd5e1",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                color: "#0284c7",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px"
                              }}
                            >
                              <Eye size={12} /> View
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditFromTable(patient)}
                              title="Edit Patient Details"
                              style={{
                                padding: "6px 10px",
                                background: "#0f172a",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                color: "#ffffff",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px"
                              }}
                            >
                              <Edit3 size={12} /> Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className={styles['pagination-controls']}>
                  <button onClick={handlePreviousPage} disabled={currentPage === 0 || loading}>
                    Previous
                  </button>
                  <span>
                    Page {currentPage + 1} of {Math.max(1, totalPages)}
                  </span>
                  <button onClick={handleNextPage} disabled={currentPage >= totalPages - 1 || loading}>
                    Next
                  </button>
                </div>
              </>
            ) : (
              <p className={styles.emptyMessage}>No patients available.</p>
            )}
          </div>
        )}

        {/* UPDATE PATIENT BY UHID */}
        {operationMode === "update" && (
          <div className={styles['form-container']}>
            <div className={styles.headerRow}>
              <div>
                <h3 className={styles.headerTitle}>Update Patient by UHID</h3>
                <div className={styles.headerSubtitle}>Look up patient by UHID (or ID) to update their personal and medical details</div>
              </div>
            </div>
            <div className={`${styles.inputRow} ${styles.alignEnd}`}>
              <div className={styles.inputGroup} style={{ flex: 2 }}>
                <label>Patient UHID / Record ID *</label>
                <input
                  placeholder="Enter Patient UHID (e.g. UHID-2026-00001 or ID)"
                  value={searchUhid}
                  onChange={(e) => setSearchUhid(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); fetchPatientByUhid(); } }}
                />
              </div>
              <button type="button" className={`${styles.submitBtn} ${styles.btnNoMargin}`} onClick={() => fetchPatientByUhid()} disabled={loading}>
                <Search size={16} /> {loading ? "Fetching..." : "Fetch Details"}
              </button>
            </div>

            {patientFetched && (
              <form onSubmit={handleSubmit} style={{ marginTop: "16px" }}>
                <div style={{
                  padding: "12px 16px",
                  background: "#eff6ff",
                  borderRadius: "10px",
                  border: "1px solid #bfdbfe",
                  marginBottom: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}>
                  <div>
                    <span style={{ fontSize: "0.8rem", color: "#1e40af", fontWeight: 700, textTransform: "uppercase" }}>Editing Record:</span>
                    <span style={{ marginLeft: "8px", fontWeight: 800, color: "#1e3a8a", fontFamily: "monospace" }}>
                      {formData.uhid || `ID #${formData.patientId}`}
                    </span>
                    <span style={{ marginLeft: "12px", color: "#3b82f6" }}>•</span>
                    <span style={{ marginLeft: "12px", fontWeight: 700, color: "#1e3a8a" }}>
                      {formData.patientName}
                    </span>
                  </div>
                  <span style={{ fontSize: "0.8rem", color: "#2563eb" }}>Unique Health Identifier</span>
                </div>

                <div className={styles.inputRow}>
                  <div className={styles.inputGroup}>
                    <label>Patient Full Name *</label>
                    <input name="patientName" value={formData.patientName} onChange={handleInputChange} required />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Contact Phone (10 Digits) *</label>
                    <input name="contact" value={formData.contact} onChange={handleInputChange} required />
                  </div>
                </div>

                <div className={styles.inputRow}>
                  <div className={styles.inputGroup}>
                    <label>Age *</label>
                    <input type="number" name="age" value={formData.age} onChange={handleInputChange} min="0" max="130" required />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Gender *</label>
                    <select name="gender" value={formData.gender} onChange={handleInputChange} required>
                      <option value="">Select Gender...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className={styles.inputRow}>
                  <div className={styles.inputGroup}>
                    <label>Diagnosis / Medical Condition *</label>
                    <input name="disease" value={formData.disease} onChange={handleInputChange} required />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Registration Date *</label>
                    <input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Previous Medical History / Medications</label>
                  <textarea name="prevMedication" value={formData.prevMedication} onChange={handleInputChange} />
                </div>

                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  <Edit3 size={16} /> {loading ? "Saving Changes..." : "Update Patient Record"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Integration with AppointmentManagement */}
        {(operationMode === "Create Appointment" || operationMode === "bookAppointment") && (
          <AppointmentManagement
            user={user}
            allowedOperations={["Create Appointment", "View Appointment by ID", "View All Appointments", "Reschedule Appointment", "Cancel Appointment"]}
            operationMode="Create Appointment"
            isEmbedded={isEmbedded}
          />
        )}
      </div>
    </div>
  );
};

export default PatientPage;
