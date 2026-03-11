import React, { useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import styles from "./PatientPage.module.css";
import AppointmentManagement, { AppointmentOperation } from "./AppointmentPage";

const PatientPage = ({ isEmbedded = false }) => {
  const [operationMode, setOperationMode] = useState("");
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
            <h3>Create Patient</h3>
            <form onSubmit={handleSubmit}>
              <label>Patient Name:</label>
              <input name="patientName" value={formData.patientName} onChange={handleInputChange} required />
              <label>Contact:</label>
              <input name="contact" value={formData.contact} onChange={handleInputChange} required />
              <label>Age:</label>
              <input name="age" value={formData.age} onChange={handleInputChange} required />
              <label>Gender:</label>
              <select name="gender" value={formData.gender} onChange={handleInputChange} required>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <label>Disease:</label>
              <input name="disease" value={formData.disease} onChange={handleInputChange} required />
              <label>Date:</label>
              <input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
              <label>Previous Medication:</label>
              <textarea name="prevMedication" value={formData.prevMedication} onChange={handleInputChange} />
              <button type="submit" disabled={loading}>Create</button>
            </form>
          </div>
        )}

        {operationMode === "view" && (
          <div className={styles['form-container']}>
            <h3>View Patient Details</h3>
            <label>Patient ID:</label>
            <input value={patientId || ""} onChange={(e) => setPatientId(e.target.value)} />
            <button onClick={fetchPatient} disabled={loading}>Fetch Details</button>

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
                  <div className={styles['patient-details']} style={{ marginTop: '16px' }}>
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
            <h3>All Patients</h3>
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
                        <td>{patient.patientId}</td>
                        <td>{patient.patientName}</td>
                        <td>{patient.contact}</td>
                        <td>{patient.age}</td>
                        <td>{patient.gender}</td>
                        <td>{patient.disease}</td>
                        <td>{patient.date}</td>
                        <td>{patient.prevMedication}</td>
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
              <p>No patients available.</p>
            )}
          </div>
        )}

        {operationMode === "update" && (
          <div className={styles['form-container']}>
            <h3>Update Patient Details</h3>
            <label>Patient ID:</label>
            <input value={patientId || ""} onChange={(e) => setPatientId(e.target.value)} />
            <button onClick={fetchPatient} disabled={loading}>Fetch Details</button>
            {patientFetched && (
              <form onSubmit={handleSubmit}>
                {/* Re-use inputs or similar structure to create form */}
                <label>Patient Name:</label>
                <input name="patientName" value={formData.patientName} onChange={handleInputChange} />
                <label>Contact:</label>
                <input name="contact" value={formData.contact} onChange={handleInputChange} />
                <label>Age:</label>
                <input name="age" value={formData.age} onChange={handleInputChange} />
                <label>Gender:</label>
                <select name="gender" value={formData.gender} onChange={handleInputChange}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <label>Disease:</label>
                <input name="disease" value={formData.disease} onChange={handleInputChange} />
                <label>Date:</label>
                <input type="date" name="date" value={formData.date} onChange={handleInputChange} />
                <label>Previous Medication:</label>
                <textarea name="prevMedication" value={formData.prevMedication} onChange={handleInputChange} />
                <button type="submit" disabled={loading}>Update</button>
              </form>
            )}
          </div>
        )}

        {/* Integration with AppointmentManagement */}
        {(operationMode === "Create Appointment" || operationMode === "bookAppointment") && (
          <AppointmentManagement
            user={user}
            allowedOperations={["Create Appointment", "View Appointment by ID", "Reschedule Appointment", "Cancel Appointment"]}
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