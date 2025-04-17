import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./PatientPage.css";
import AppointmentManagement, { AppointmentOperation } from "./AppointmentPage";

// Define patient user type (same as AppointmentPage.tsx)
interface User {
  id: string;
  role: "patient" | "doctor" | "admin";
  token: string;
}

const PatientPage = () => {
  const [operationMode, setOperationMode] = useState<string | AppointmentOperation>("");
  const [patientId, setPatientId] = useState<number | null>(null);
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
  const [createdPatient, setCreatedPatient] = useState<any | null>(null);
  const [patientFetched, setPatientFetched] = useState(false);
  const navigate = useNavigate();
  const [allPatients, setAllPatients] = useState<any[]>([]);
  const [viewAllMode, setViewAllMode] = useState(false);

  // Pagination state variables
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(0);
  const sortBy = "patientId";

  // Placeholder user for patient (replace with actual auth logic)
  const [user] = useState<User>({
    id: "123",
    role: "patient",
    token: "xyz",
  });

  // Define patient-specific appointment operations
  const patientAppointmentOperations: AppointmentOperation[] = [
    "Create Appointment",
    "View Appointment by ID",
    "Reschedule Appointment",
    "Cancel Appointment",
  ];

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
  };

  const handleOperation = (mode: string | AppointmentOperation) => {
    setOperationMode(mode);
    resetForm();
    setViewAllMode(false);
  };

  const fetchPatient = async () => {
    if (!patientId) {
      setMessage("Please enter a valid Patient ID");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:8081/patients/${patientId}`);
      if (response.status === 200 && response.data) {
        setFormData(response.data);
        setPatientFetched(true);
        setMessage("Patient details fetched successfully");
      } else {
        setPatientFetched(false);
        setMessage("Patient not found");
      }
    } catch (error) {
      setMessage("Error fetching patient details. Please check the ID.");
      setPatientFetched(false);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let response;
      if (operationMode === "update" && patientId) {
        response = await axios.put(`http://localhost:8081/patients/update/${patientId}`, formData);
        setMessage("Patient updated successfully");
        setCreatedPatient(response.data);
        setPatientFetched(false);
      } else if (operationMode === "create") {
        response = await axios.post("http://localhost:8081/patients/addPatient", formData);
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

  const fetchAllPatients = async (page: number = currentPage) => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:8081/patients/getAllPatients", {
        params: {
          page: page,
          size: pageSize,
          sortBy: sortBy,
        },
      });
      if (response.status === 200 && response.data) {
        setAllPatients(response.data.content);
        setTotalPages(response.data.totalPages);
        setCurrentPage(response.data.number);
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
    <div className="patient-container">
      <h1>Patient Management</h1>
      <div className="split-container">
        {/* Left Panel: Action Buttons */}
        <div className="left-panel">
          <div className="patient-action-buttons">
            <h3>Patient Operations</h3>
            <button onClick={() => handleOperation("create")} disabled={loading}>
              Create New Patient
            </button>
            <button onClick={() => handleOperation("getById")} disabled={loading}>
              Get Patient by ID
            </button>
            <button onClick={() => handleOperation("update")} disabled={loading}>
              Update Patient
            </button>
            <button onClick={() => fetchAllPatients(0)} disabled={loading}>
              View All Patients
            </button>
            <h3>Appointment Operations</h3>
            <button
              onClick={() => handleOperation("Create Appointment")}
              disabled={loading}
            >
              Create Appointment
            </button>
            <button
              onClick={() => handleOperation("View Appointment by ID")}
              disabled={loading}
            >
              View Appointment by ID
            </button>
            <button
              onClick={() => handleOperation("Reschedule Appointment")}
              disabled={loading}
            >
              Reschedule Appointment
            </button>
            <button
              onClick={() => handleOperation("Cancel Appointment")}
              disabled={loading}
            >
              Cancel Appointment
            </button>
          </div>
        </div>

        {/* Right Panel: Forms and Data */}
        <div className="right-panel">
          {loading && <p className="loading-message">Loading...</p>}
          {message && <p className="status-message">{message}</p>}

          {/* Patient Operations */}
          {operationMode &&
            ![
              "Create Appointment",
              "View Appointment by ID",
              "Reschedule Appointment",
              "Cancel Appointment",
            ].includes(operationMode as string) && (
              <div>
                <h2>
                  {operationMode === "create" && createdPatient
                    ? "Created Patient Details"
                    : operationMode === "create"
                    ? "Create Patient"
                    : operationMode === "update"
                    ? createdPatient
                      ? "Updated Patient Details"
                      : "Update Patient"
                    : "Patient Details"}
                </h2>

                <form onSubmit={handleSubmit}>
                  {operationMode === "getById" && (
                    <>
                      <label>Patient ID:</label>
                      <input
                        type="number"
                        value={patientId || ""}
                        onChange={(e) => setPatientId(Number(e.target.value))}
                        required
                        disabled={loading}
                      />
                      <button type="button" onClick={fetchPatient} disabled={loading}>
                        {loading ? "Fetching..." : "Fetch Patient"}
                      </button>
                    </>
                  )}

                  {operationMode === "update" && !patientFetched && !createdPatient && (
                    <>
                      <label>Patient ID:</label>
                      <input
                        type="number"
                        value={patientId || ""}
                        onChange={(e) => setPatientId(Number(e.target.value))}
                        required
                        disabled={loading}
                      />
                      <button type="button" onClick={fetchPatient} disabled={loading}>
                        {loading ? "Fetching..." : "Fetch Patient for Update"}
                      </button>
                    </>
                  )}

                  {patientFetched && operationMode === "getById" && (
                    <>
                      <label>Patient ID:</label>
                      <input type="text" value={formData.patientId} disabled />
                      <label>Name:</label>
                      <input type="text" value={formData.patientName} disabled />
                      <label>Contact:</label>
                      <input type="text" value={formData.contact} disabled />
                      <label>Age:</label>
                      <input type="number" value={formData.age} disabled />
                      <label>Gender:</label>
                      <select value={formData.gender} disabled>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      <label>Disease:</label>
                      <input type="text" value={formData.disease} disabled />
                      <label>Date:</label>
                      <input type="date" value={formData.date} disabled />
                      <label>Previous Medication:</label>
                      <input type="text" value={formData.prevMedication} disabled />
                    </>
                  )}

                  {(operationMode === "create" || operationMode === "update") && (
                    <>
                      {createdPatient ? (
                        <>
                          <label>Patient ID:</label>
                          <input type="text" value={createdPatient.patientId} disabled />
                          <label>Name:</label>
                          <input type="text" value={createdPatient.patientName} disabled />
                          <label>Contact:</label>
                          <input type="text" value={createdPatient.contact} disabled />
                          <label>Age:</label>
                          <input type="number" value={createdPatient.age} disabled />
                          <label>Gender:</label>
                          <select value={createdPatient.gender} disabled>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                          <label>Disease:</label>
                          <input type="text" value={createdPatient.disease} disabled />
                          <label>Date:</label>
                          <input type="date" value={createdPatient.date} disabled />
                          <label>Previous Medication:</label>
                          <input type="text" value={createdPatient.prevMedication} disabled />
                          <div className="patient-action-buttons">
                            <button type="button" onClick={handleUpdateButtonClick} disabled={loading}>
                              Update Patient
                            </button>
                            <button type="button" onClick={handleFixAppointmentClick} disabled={loading}>
                              Fix Appointment
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          {operationMode === "update" && (
                            <div className="patient-id-display">
                              <label>Patient ID:</label>
                              <input type="text" value={patientId || ""} disabled />
                            </div>
                          )}
                          <label>Name:</label>
                          <input
                            type="text"
                            name="patientName"
                            placeholder="Patient Name"
                            value={formData.patientName}
                            onChange={handleInputChange}
                            required
                            disabled={loading}
                          />
                          <label>Contact:</label>
                          <input
                            type="text"
                            name="contact"
                            placeholder="Contact"
                            value={formData.contact}
                            onChange={handleInputChange}
                            required
                            disabled={loading}
                          />
                          <label>Age:</label>
                          <input
                            type="number"
                            name="age"
                            placeholder="Age"
                            value={formData.age}
                            onChange={handleInputChange}
                            required
                            disabled={loading}
                          />
                          <label>Gender:</label>
                          <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleInputChange}
                            required
                            disabled={loading}
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                          <label>Disease:</label>
                          <input
                            type="text"
                            name="disease"
                            placeholder="Disease"
                            value={formData.disease}
                            onChange={handleInputChange}
                            disabled={loading}
                          />
                          <label>Date:</label>
                          <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleInputChange}
                            max={new Date().toISOString().split("T")[0]}
                            required
                            disabled={loading}
                          />
                          <label>Previous Medication:</label>
                          <input
                            type="text"
                            name="prevMedication"
                            placeholder="Previous Medication"
                            value={formData.prevMedication}
                            onChange={handleInputChange}
                            disabled={loading}
                          />
                          <div className="patient-action-buttons">
                            <button type="submit" disabled={loading}>
                              {loading
                                ? operationMode === "create"
                                  ? "Creating..."
                                  : "Updating..."
                                : operationMode === "create"
                                ? "Create Patient"
                                : "Update Patient"}
                            </button>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </form>
              </div>
            )}

          {/* Appointment Operations */}
          {patientAppointmentOperations.includes(operationMode as AppointmentOperation) && (
            <AppointmentManagement
              allowedOperations={patientAppointmentOperations}
              operationMode={operationMode as AppointmentOperation}
              user={user}
            />
          )}

          {operationMode === "viewAll" && viewAllMode && (
            <div className="all-patients-container">
              <h2>All Patients</h2>
              {allPatients.length > 0 ? (
                <>
                  <table className="patients-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Contact</th>
                        <th>Age</th>
                        <th>Gender</th>
                        <th>Disease</th>
                        <th>Date</th>
                        <th>Previous Medication</th>
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
                  <div className="pagination-controls">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 0 || loading}
                    >
                      Previous
                    </button>
                    <span>
                      Page {currentPage + 1} of {totalPages}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage >= totalPages - 1 || loading}
                    >
                      Next
                    </button>
                  </div>
                </>
              ) : (
                <p>No patients available.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientPage;