import React, { useState } from "react";
import api from "../api/api";
import { UserPlus, Search } from "lucide-react";
import styles from "./PatientPage.module.css";
import AppointmentManagement from "./AppointmentPage";

const PatientPage = ({ initialOperation, isEmbedded = false }) => {
  const [operationMode, setOperationMode] = useState(initialOperation || "");
  const [patientId, setPatientId] = useState(null);
  const [formData, setFormData] = useState({
    patientId: "",
    patientName: "",
    contact: "",
    age: "",
    gender: "",
    disease: "",
    date: new Date().toISOString().split("T")[0],
    prevMedication: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdPatient, setCreatedPatient] = useState(null);
  const [patientFetched, setPatientFetched] = useState(false);
  const [allPatients, setAllPatients] = useState([]);
  const [viewAllMode, setViewAllMode] = useState(false);

  // Pagination state variables
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(0);
  const sortBy = "patientId";
  const [patientPrescriptions, setPatientPrescriptions] = useState([]);

  // Placeholder user for patient (replace with actual auth logic)
  const [user] = useState({
    id: "123",
    role: "patient",
    token: "xyz",
  });

  const resetForm = () => {
    setFormData({
      patientId: "",
      patientName: "",
      contact: "",
      age: "",
      gender: "",
      disease: "",
      date: new Date().toISOString().split("T")[0],
      prevMedication: "",
    });
    setPatientId(null);
    setCreatedPatient(null);
    setMessage("");
    setPatientFetched(false);
    setAllPatients([]);
    setViewAllMode(false);
    setLoading(false);
    setCurrentPage(0);
    setPatientPrescriptions([]);
  };

  React.useEffect(() => {
    if (initialOperation) {
      setOperationMode(initialOperation);
      if (initialOperation === "viewAll") {
        fetchAllPatients(0);
      }
    }
  }, [initialOperation]);

  const handleOperation = (mode) => {
    setOperationMode(mode);
    resetForm();
    setViewAllMode(mode === "viewAll");
    if (mode === "viewAll") {
      fetchAllPatients(0);
    }
  };

  const fetchPatient = async () => {
    if (!patientId) {
      setMessage("Please enter a valid Patient ID");
      return;
    }
    setLoading(true);
    try {
      const response = await api.get(`/patients/${patientId}`);
      if (response.status === 200 && response.data) {
        setFormData(response.data);
        setPatientFetched(true);
        setMessage("Patient details fetched successfully");
        // Fetch prescriptions for this patient
        try {
          const presRes = await api.get(`/api/prescriptions/getPrescriptionByPatientId/${patientId}`);
          setPatientPrescriptions(Array.isArray(presRes.data) ? presRes.data : []);
        } catch {
          setPatientPrescriptions([]);
        }
      } else {
        setPatientFetched(false);
        setMessage("Patient not found");
        setPatientPrescriptions([]);
      }
    } catch (error) {
      setMessage("Error fetching patient details. Please check the ID.");
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
      let response;
      if (operationMode === "update" && patientId) {
        response = await api.put(`/patients/update/${patientId}`, formData);
        setMessage("Patient updated successfully");
        setCreatedPatient(response.data);
        setPatientFetched(false);
      } else if (operationMode === "create") {
        response = await api.post("/patients/addPatient", formData);
        setPatientId(response.data.patientId);
        setMessage(`Patient created successfully with ID: ${response.data.patientId}`);
        setCreatedPatient(response.data);
      }
    } catch (error) {
      setMessage("Error processing request.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateButtonClick = () => {
    setOperationMode("update");
    setPatientFetched(true);
    setFormData(createdPatient);
    setCreatedPatient(null);
    setLoading(false);
  };

  const handleFixAppointmentClick = () => {
    setLoading(true);
    // Instead of navigating, set operationMode to "Create Appointment"
    setOperationMode("Create Appointment");
    setLoading(false);
  };

  const fetchAllPatients = async (page = currentPage) => {
    setLoading(true);
    try {
      const response = await api.get("/patients/getAllPatients", {
        params: {
          page: page,
          size: pageSize,
          sortBy: sortBy,
        },
      });
      if (response.status === 200 && response.data) {
        // Handle both Page object (Spring Data) and raw List
        setAllPatients(response.data.content || response.data);
        setTotalPages(response.data.totalPages || 1);
        setCurrentPage(response.data.number || 0);
        setViewAllMode(true);
        setOperationMode("viewAll");
        setMessage("All patients fetched successfully");
      } else {
        setMessage("No patients found");
      }
    } catch (error) {
      setMessage("Error fetching all patients.");
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
        <>
          <h1>Patient Management</h1>
          <div className={styles['left-panel']}>
            <div className={styles['patient-action-buttons']}>
              <h3>Patient Operations</h3>
              <button onClick={() => handleOperation("create")} disabled={loading}>
                Create Patient
              </button>
              <button onClick={() => handleOperation("view")} disabled={loading}>
                View Details
              </button>
              <button onClick={() => handleOperation("viewAll")} disabled={loading}>
                View All Patients
              </button>
              <button onClick={() => handleOperation("update")} disabled={loading}>
                Update Details
              </button>
              <button onClick={() => handleOperation("delete")} disabled={loading}>
                Delete Patient
              </button>
              <button onClick={() => handleOperation("bookAppointment")} disabled={loading}>
                Book Appointment
              </button>
            </div>
          </div>
        </>
      )}

      <div className={styles['right-panel']}>
        {/* Render content based on operationMode */}

        {message && <div className={styles['message']}>{message}</div>}

        {operationMode === "create" && (
          <div className={styles['form-container']}>
            <div className={styles.headerRow}>
              <div>
                <h3 className={styles.headerTitle}>Register New Patient</h3>
                <div className={styles.headerSubtitle}>Enter patient personal details, medical condition, and visit date</div>
              </div>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={styles.inputRow}>
                <div className={styles.inputGroup}>
                  <label>Patient Full Name</label>
                  <input name="patientName" placeholder="e.g. John Doe" value={formData.patientName} onChange={handleInputChange} required />
                </div>
                <div className={styles.inputGroup}>
                  <label>Contact Number</label>
                  <input name="contact" placeholder="+1 (555) 000-0000" value={formData.contact} onChange={handleInputChange} required />
                </div>
              </div>

              <div className={styles.inputRow}>
                <div className={styles.inputGroup}>
                  <label>Age</label>
                  <input type="number" name="age" placeholder="e.g. 35" value={formData.age} onChange={handleInputChange} required />
                </div>
                <div className={styles.inputGroup}>
                  <label>Gender</label>
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
                  <label>Diagnosis / Disease</label>
                  <input name="disease" placeholder="e.g. General Checkup, Hypertension" value={formData.disease} onChange={handleInputChange} required />
                </div>
                <div className={styles.inputGroup}>
                  <label>Registration Date</label>
                  <input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Previous Medical History / Medication</label>
                <textarea name="prevMedication" placeholder="Enter any previous medications, allergies, or health conditions..." value={formData.prevMedication} onChange={handleInputChange} />
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                <UserPlus size={16} /> Create Patient Record
              </button>
            </form>
          </div>
        )}

        {operationMode === "view" && (
          <div className={styles['form-container']}>
            <div className={styles.headerRow}>
              <div>
                <h3 className={styles.headerTitle}>View Patient Details</h3>
                <div className={styles.headerSubtitle}>Look up patient profile and medical history by Patient UHID</div>
              </div>
            </div>
            <div className={`${styles.inputRow} ${styles.alignEnd}`}>
              <div className={styles.inputGroup}>
                <label>Patient UHID / ID</label>
                <input type="text" placeholder="Enter Patient UHID (e.g. UHID-2026-001)" value={patientId || ""} onChange={(e) => setPatientId(e.target.value)} />
              </div>
              <button type="button" className={`${styles.submitBtn} ${styles.btnNoMargin}`} onClick={fetchPatient} disabled={loading}>
                <Search size={16} /> Fetch Details
              </button>
            </div>

            {patientFetched && (
              <>
                <div className={styles['patient-details']}>
                  <p><strong>ID:</strong> {formData.patientId}</p>
                  <p><strong>Name:</strong> {formData.patientName}</p>
                  <p><strong>Contact:</strong> {formData.contact}</p>
                  <p><strong>Age:</strong> {formData.age}</p>
                  <p><strong>Gender:</strong> {formData.gender}</p>
                  <p><strong>Disease:</strong> {formData.disease}</p>
                  <p><strong>Date:</strong> {formData.date}</p>
                  <p><strong>Previous Medication:</strong> {formData.prevMedication}</p>
                </div>
                {patientPrescriptions.length > 0 && (
                  <div className={`${styles['patient-details']} ${styles.detailsMargin}`}>
                    <h4>Prescriptions for this patient</h4>
                    <table className={styles['patients-table']}>
                      <thead>
                        <tr>
                          <th>Prescription ID</th>
                          <th>Doctor</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patientPrescriptions.map((p) => (
                          <tr key={p.prescriptionId}>
                            <td>{p.prescriptionId}</td>
                            <td>{p.doctorName ?? "—"}</td>
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

        {operationMode === "viewAll" && (
          <div className={styles['all-patients-container']}>
            <div className={styles.headerRow}>
              <div>
                <h3 className={styles.headerTitle}>All Registered Patients</h3>
                <div className={styles.headerSubtitle}>Complete patient directory and medical records</div>
              </div>
            </div>
            {allPatients.length > 0 ? (
              <>
                <table className={styles['patients-table']}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Contact</th>
                      <th>Age</th>
                      <th>Gender</th>
                      <th>Disease</th>
                      <th>Date</th>
                      <th>Prev Medication</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allPatients.map((patient) => (
                      <tr key={patient.patientId}>
                        <td className={styles.idCell}>#{patient.patientId}</td>
                        <td className={styles.nameCell}>{patient.patientName}</td>
                        <td>{patient.contact}</td>
                        <td>{patient.age} yrs</td>
                        <td>
                          <span className={`${styles.genderBadge} ${patient.gender === 'Male' ? styles.genderMale : patient.gender === 'Female' ? styles.genderFemale : styles.genderOther}`}>
                            {patient.gender || 'N/A'}
                          </span>
                        </td>
                        <td>{patient.disease}</td>
                        <td>{patient.date}</td>
                        <td>{patient.prevMedication || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className={styles['pagination-controls']}>
                  <button onClick={handlePreviousPage} disabled={currentPage === 0 || loading}>
                    Previous
                  </button>
                  <span>
                    Page {currentPage + 1} of {totalPages}
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

        {operationMode === "update" && (
          <div className={styles['form-container']}>
            <div className={styles.headerRow}>
              <div>
                <h3 className={styles.headerTitle}>Update Patient Details</h3>
                <div className={styles.headerSubtitle}>Fetch patient record by ID and edit details</div>
              </div>
            </div>
            <div className={`${styles.inputRow} ${styles.alignEnd}`}>
              <div className={styles.inputGroup}>
                <label>Patient ID</label>
                <input placeholder="Enter Patient ID (e.g. 101)" value={patientId || ""} onChange={(e) => setPatientId(e.target.value)} />
              </div>
              <button type="button" className={`${styles.submitBtn} ${styles.btnNoMargin}`} onClick={fetchPatient} disabled={loading}>
                <Search size={16} /> Fetch Details
              </button>
            </div>
            {patientFetched && (
              <form onSubmit={handleSubmit}>
                <div className={styles.inputRow}>
                  <div className={styles.inputGroup}>
                    <label>Patient Full Name</label>
                    <input name="patientName" value={formData.patientName} onChange={handleInputChange} required />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Contact Number</label>
                    <input name="contact" value={formData.contact} onChange={handleInputChange} required />
                  </div>
                </div>

                <div className={styles.inputRow}>
                  <div className={styles.inputGroup}>
                    <label>Age</label>
                    <input type="number" name="age" value={formData.age} onChange={handleInputChange} required />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Gender</label>
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
                    <label>Diagnosis / Disease</label>
                    <input name="disease" value={formData.disease} onChange={handleInputChange} required />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Registration Date</label>
                    <input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Previous Medical History / Medication</label>
                  <textarea name="prevMedication" value={formData.prevMedication} onChange={handleInputChange} />
                </div>

                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  <UserPlus size={16} /> Update Patient Record
                </button>
              </form>
            )}
          </div>
        )}

        {/* Integration with AppointmentManagement */}
        {(operationMode === "Create Appointment" || operationMode === "bookAppointment") && (
          <AppointmentManagement
            user={user}
            allowedOperations={["Create Appointment", "View Appointment by ID", "Reschedule Appointment", "Cancel Appointment"]}
            operationMode="Create Appointment"
            isEmbedded={isEmbedded}
          />
        )}

        {createdPatient && (
          <div className={styles['success-message']}>
            <p>Patient Created Successfully!</p>
            <button onClick={handleUpdateButtonClick}>Update Details</button>
            <button onClick={handleFixAppointmentClick}>Fix Appointment</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientPage;