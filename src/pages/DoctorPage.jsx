import React, { useState, useEffect, useCallback } from "react";
import api from "../api/api";
import LeaveManagement, { LeaveOperation } from "./DoctorLeavePage";
import AppointmentManagement, { AppointmentOperation } from "./AppointmentPage";
import PrescriptionsPage from "./PrescriptionsPage";
import styles from "./DoctorPage.module.css";

// DoctorContent component with React.memo
const DoctorContent = React.memo(({
  operationMode,
  doctorId,
  formData,
  createdDoctor,
  doctorFetched,
  allDoctors,
  viewAllMode,
  currentPage,
  totalPages,
  loading,
  message,
  handleSubmit,
  handleInputChange,
  fetchDoctor,
  handleDeleteDoctor,
  handlePreviousPage,
  handleNextPage,
  setDoctorId,
}) => {
  const leaveOperations = [];
  if (operationMode === "createLeave") {
    leaveOperations.push("Create Leave");
  } else if (operationMode === "viewLeaveByDoctorId") {
    leaveOperations.push("View Leave by Doctor ID");
  }

  // Map DoctorPage operationMode to AppointmentManagement operationMode
  const appointmentOperationMap = {
    appointmentViewById: "View Appointment by ID",
    appointmentUpdate: "Update Appointment",
    appointmentReschedule: "Reschedule Appointment",
    appointmentCancel: "Cancel Appointment",
    appointmentViewByDoctorDate: "View Appointments by Doctor and Date",
    appointmentCountByDoctorDate: "Get Appointment Count by Doctor and Date",
  };

  const prescriptionOperationMap = {
    prescriptionCreate: "Create Prescription",
    prescriptionByPatient: "Prescriptions by Patient",
    prescriptionMy: "List Prescriptions",
  };

  const currentAppointmentOperation = appointmentOperationMap[operationMode] || "View Appointment by ID";
  const currentPrescriptionOperation = prescriptionOperationMap[operationMode];
  const userRole = localStorage.getItem("role") || "patient";

  return (
    <div className={styles['right-panel']}>
      {loading && <p className={styles['loading-message']}>Loading...</p>}

      {operationMode && operationMode !== "viewAll" && operationMode !== "createLeave" && operationMode !== "viewLeaveByDoctorId" && !Object.keys(appointmentOperationMap).includes(operationMode) && !Object.keys(prescriptionOperationMap).includes(operationMode) && (
        <div className={styles['operation-content']}>
          <h2>
            {operationMode === "create" && createdDoctor ? "Created Doctor Details" :
              operationMode === "create" ? "Create Doctor" :
                operationMode === "update" && createdDoctor ? "Updated Doctor Details" :
                  operationMode === "update" ? "Update Doctor" :
                    operationMode === "delete" ? "Delete Doctor" : "Doctor Details"}
          </h2>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {(operationMode === "getById" || operationMode === "delete") && (
              <>
                <label>Doctor ID:</label>
                <input type="number" value={doctorId || ""} onChange={(e) => setDoctorId(Number(e.target.value))} required disabled={loading} />
                <button type="button" onClick={operationMode === "getById" ? fetchDoctor : handleDeleteDoctor} disabled={loading}>
                  {loading ? (operationMode === "getById" ? "Fetching..." : "Deleting...") : (operationMode === "getById" ? "Fetch Doctor" : "Delete Doctor")}
                </button>
              </>
            )}

            {operationMode === "update" && !doctorFetched && !createdDoctor && (
              <>
                <label>Doctor ID:</label>
                <input type="number" value={doctorId || ""} onChange={(e) => setDoctorId(Number(e.target.value))} required disabled={loading} />
                <button type="button" onClick={fetchDoctor} disabled={loading}>Fetch Doctor for Update</button>
              </>
            )}

            {doctorFetched && operationMode === "getById" && (
              <>
                <label>Doctor ID:</label>
                <input type="text" value={doctorId || ""} disabled />
                <label>Name:</label>
                <input type="text" value={formData.doctorName} disabled />
                <label>Specialization:</label>
                <input type="text" value={formData.specialization} disabled />
                <label>Contact:</label>
                <input type="text" value={formData.contact} disabled />
                <label>Years of Experience:</label>
                <input type="number" value={formData.yoe} disabled />
              </>
            )}

            {(operationMode === "create" || operationMode === "update") && (
              <>
                {createdDoctor ? (
                  <>
                    <label>Doctor ID:</label>
                    <input type="text" value={createdDoctor.doctorId} disabled />
                    <label>Name:</label>
                    <input type="text" value={createdDoctor.doctorName} disabled />
                    <label>Specialization:</label>
                    <input type="text" value={createdDoctor.specialization} disabled />
                    <label>Contact:</label>
                    <input type="text" value={createdDoctor.contact} disabled />
                    <label>Years of Experience:</label>
                    <input type="number" value={createdDoctor.yoe} disabled />
                    <label>Department Name:</label>
                    <input type="text" value={createdDoctor.departmentName || "N/A"} disabled />
                  </>
                ) : (
                  <>
                    {operationMode === "update" && (
                      <div className={styles['doctor-id-display']}>
                        <label>Doctor ID:</label>
                        <input type="text" value={doctorId || ""} disabled />
                      </div>
                    )}
                    <label>Name:</label>
                    <input type="text" name="doctorName" placeholder="Doctor Name" value={formData.doctorName} onChange={handleInputChange} required disabled={loading} />
                    <label>Specialization:</label>
                    <input type="text" name="specialization" placeholder="Specialization" value={formData.specialization} onChange={handleInputChange} required disabled={loading} />
                    <label>Contact:</label>
                    <input type="text" name="contact" placeholder="Contact (10 digits)" value={formData.contact} onChange={handleInputChange} required pattern="\d{10}" disabled={loading} />
                    <label>Years of Experience:</label>
                    <input type="number" name="yoe" placeholder="Years of Experience" value={formData.yoe} onChange={handleInputChange} required min="0" disabled={loading} />
                    <div className={styles['doctor-action-buttons']}>
                      <button type="submit" disabled={loading}>
                        {loading ? (operationMode === "create" ? "Creating..." : "Updating...") : (operationMode === "create" ? "Create Doctor" : "Update Doctor")}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </form>
        </div>
      )}

      {(operationMode === "createLeave" || operationMode === "viewLeaveByDoctorId") && (
        <LeaveManagement
          allowedOperations={leaveOperations}
          doctorId={doctorId?.toString()}
        />
      )}

      {operationMode === "viewAll" && viewAllMode && (
        <div className={styles['all-doctors-container']}>
          <h2>All Doctors</h2>
          {allDoctors.length > 0 ? (
            <>
              <table className={styles['doctors-table']}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Specialization</th>
                    <th>Contact</th>
                    <th>Years of Experience</th>
                    <th>Department</th>
                  </tr>
                </thead>
                <tbody>
                  {allDoctors.map((doctor) => (
                    <tr key={doctor.doctorId}>
                      <td>{doctor.doctorId}</td>
                      <td>{doctor.doctorName}</td>
                      <td>{doctor.specialization}</td>
                      <td>{doctor.contact}</td>
                      <td>{doctor.yoe}</td>
                      <td>{doctor.departmentName || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className={styles['pagination-controls']}>
                <button onClick={handlePreviousPage} disabled={currentPage === 0 || loading}>Previous</button>
                <span>Page {currentPage + 1} of {totalPages}</span>
                <button onClick={handleNextPage} disabled={currentPage >= totalPages - 1 || loading}>Next</button>
              </div>
            </>
          ) : (
            <p>No doctors available.</p>
          )}
        </div>
      )}

      {[
        "appointmentViewById",
        "appointmentUpdate",
        "appointmentReschedule",
        "appointmentCancel",
        "appointmentViewByDoctorDate",
        "appointmentCountByDoctorDate",
      ].includes(operationMode) && (
          <AppointmentManagement
            allowedOperations={[
              "View Appointment by ID",
              "Update Appointment",
              "Reschedule Appointment",
              "Cancel Appointment",
              "View Appointments by Doctor and Date",
              "Get Appointment Count by Doctor and Date",
            ]}
            doctorId={doctorId?.toString() || ""}
            operationMode={currentAppointmentOperation}
            user={{ role: userRole, id: localStorage.getItem("id") }}
          />
        )}

      {currentPrescriptionOperation && (
        <PrescriptionsPage
          allowedOperations={[currentPrescriptionOperation]}
          initialOperation={currentPrescriptionOperation}
          isEmbedded={true}
        />
      )}

      {message && <p className={styles['status-message']}>{message}</p>}
    </div>
  );
});

// DoctorPage component
const DoctorPage = ({ allowedOperations = ["create", "getById", "update", "viewAll", "delete", "createLeave", "viewLeaveByDoctorId", "appointmentViewById", "appointmentUpdate", "appointmentReschedule", "appointmentCancel", "appointmentViewByDoctorDate", "appointmentCountByDoctorDate", "prescriptionCreate", "prescriptionByPatient", "prescriptionMy"], initialOperation, showHeaders = true }) => {
  const [operationMode, setOperationMode] = useState(initialOperation || "");
  const [doctorId, setDoctorId] = useState(null);
  const [formData, setFormData] = useState({
    doctorName: "",
    specialization: "",
    contact: "",
    yoe: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdDoctor, setCreatedDoctor] = useState(null);
  const [doctorFetched, setDoctorFetched] = useState(false);
  const [allDoctors, setAllDoctors] = useState([]);
  const [viewAllMode, setViewAllMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy] = useState("doctorId");

  const userRole = localStorage.getItem("role") || "patient";

  const isAdminRole = ["admin", "super-admin", "ADMIN", "SUPER_ADMIN"].includes(userRole);

  const fetchAllDoctors = useCallback(async (page = currentPage) => {
    if (!isAdminRole) {
      setMessage("You do not have permission to view all doctors.");
      return;
    }
    setLoading(true);
    try {
      const response = await api.get("/doctors/", {
        params: { page, size: pageSize, sortBy },
        timeout: 10000,
      });
      if (response.status === 200 && response.data) {
        setAllDoctors(response.data.content || response.data);
        setTotalPages(response.data.totalPages || Math.ceil(response.data.length / pageSize));
        setCurrentPage(page);
        setViewAllMode(true);
        setMessage("All doctors fetched successfully");
      } else {
        setMessage("No doctors found");
        setViewAllMode(false);
      }
    } catch (error) {
      setMessage("Error fetching all doctors. Please try again.");
      setViewAllMode(false);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, sortBy, userRole]);

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 0) fetchAllDoctors(currentPage - 1);
  }, [currentPage, fetchAllDoctors]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages - 1) fetchAllDoctors(currentPage + 1);
  }, [currentPage, totalPages, fetchAllDoctors]);

  const resetForm = useCallback(() => {
    setFormData({ doctorName: "", specialization: "", contact: "", yoe: "" });
    setDoctorId(null);
    setCreatedDoctor(null);
    setMessage(""); // Ensure message is cleared here too
    setDoctorFetched(false);
    if (operationMode !== "viewAll") {
      setAllDoctors([]);
      setViewAllMode(false);
      setCurrentPage(0);
    }
    setLoading(false);
  }, [operationMode]);

  const handleOperation = useCallback((mode) => {
    setMessage(""); // Clear message when switching operations
    setOperationMode(mode);
    resetForm();
    setViewAllMode(mode === "viewAll");
    if (mode === "viewAll") {
      fetchAllDoctors(0);
    }
  }, [resetForm, fetchAllDoctors]);

  const fetchDoctor = useCallback(async () => {
    if (!doctorId) {
      setMessage("Please enter a valid Doctor ID");
      return;
    }
    setLoading(true);
    try {
      const response = await api.get(`/doctors/${doctorId}`);
      if (response.status === 200 && response.data) {
        setFormData({
          doctorName: response.data.doctorName,
          specialization: response.data.specialization,
          contact: response.data.contact,
          yoe: response.data.yoe,
        });
        setDoctorFetched(true);
        setMessage("Doctor details fetched successfully");
      } else {
        setDoctorFetched(false);
        setMessage("Doctor not found");
      }
    } catch (error) {
      setMessage("Error fetching doctor details. Please check the ID.");
      setDoctorFetched(false);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  const handleInputChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    if (operationMode === "create" && !["admin", "super-admin", "ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      setMessage("You do not have permission to create a doctor.");
      setLoading(false);
      return;
    }
    try {
      let response;
      if (operationMode === "update" && doctorId) {
        response = await api.put(`/doctors/updateDoctor/${doctorId}`, formData);
        setMessage("Doctor updated successfully");
        setCreatedDoctor(response.data);
        setDoctorFetched(false);
      } else if (operationMode === "create") {
        response = await api.post("/doctors/addDoctor", formData);
        setDoctorId(response.data.doctorId);
        setMessage(`Doctor created successfully with ID: ${response.data.doctorId}`);
        setCreatedDoctor(response.data);
      }
    } catch (error) {
      setMessage("Error processing request.");
    } finally {
      setLoading(false);
    }
  }, [operationMode, doctorId, formData, userRole]);

  const handleDeleteDoctor = useCallback(async () => {
    if (!doctorId) {
      setMessage("Please enter a valid Doctor ID to delete");
      return;
    }
    if (!["admin", "super-admin", "ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      setMessage("You do not have permission to delete a doctor.");
      return;
    }
    setLoading(true);
    try {
      const response = await api.delete(`/doctors/deleteDoctor/${doctorId}`);
      setMessage(response.data);
      resetForm();
    } catch (error) {
      setMessage("Error deleting doctor.");
    } finally {
      setLoading(false);
    }
  }, [doctorId, userRole, resetForm]);

  const setDoctorIdCallback = useCallback((id) => {
    setDoctorId(id);
  }, []);

  // Ensure message clears when operationMode changes
  useEffect(() => {
    setMessage(""); // Clear message whenever operationMode changes
  }, [operationMode]);

  useEffect(() => {
    if (initialOperation) {
      setOperationMode(initialOperation);
      if (initialOperation === "viewAll") {
        fetchAllDoctors(0);
      } else {
        setViewAllMode(false);
      }
    }
  }, [initialOperation, fetchAllDoctors]);

  return (
    <div className={`${styles['doctor-container']} ${!showHeaders ? styles['admin-view'] : ''}`} style={{ flexGrow: 1 }}>
      {showHeaders && (
        <>
          <h1>WELCOME TO THE HOSPITAL MANAGEMENT SYSTEM</h1>
          <h2>DOCTOR DASHBOARD</h2>
        </>
      )}
      {!initialOperation ? (
        <div className={styles['split-container']}>
          <div className={styles['left-panel']}>
            <div className={styles['doctor-action-buttons']}>
              <h3>Doctor Operations</h3>
              {allowedOperations.includes("create") && ["admin", "super-admin", "ADMIN", "SUPER_ADMIN"].includes(userRole) && (
                <button onClick={() => handleOperation("create")} disabled={loading}>
                  Create New Doctor
                </button>
              )}
              {allowedOperations.includes("getById") && (
                <button onClick={() => handleOperation("getById")} disabled={loading}>
                  Get Doctor by ID
                </button>
              )}
              {allowedOperations.includes("update") && (
                <button onClick={() => handleOperation("update")} disabled={loading}>
                  Update Doctor
                </button>
              )}
              {allowedOperations.includes("viewAll") && ["admin", "super-admin", "ADMIN", "SUPER_ADMIN"].includes(userRole) && (
                <button onClick={() => handleOperation("viewAll")} disabled={loading}>
                  View All Doctors
                </button>
              )}
              {allowedOperations.includes("delete") && ["admin", "super-admin", "ADMIN", "SUPER_ADMIN"].includes(userRole) && (
                <button onClick={() => handleOperation("delete")} disabled={loading}>
                  Delete Doctor
                </button>
              )}
              <h3>Leave Operations</h3>
              {allowedOperations.includes("createLeave") && (
                <button onClick={() => handleOperation("createLeave")} disabled={loading}>
                  Create Leave
                </button>
              )}
              {allowedOperations.includes("viewLeaveByDoctorId") && (
                <button onClick={() => handleOperation("viewLeaveByDoctorId")} disabled={loading}>
                  View Leave by Doctor ID
                </button>
              )}
              <h3>Appointment Operations</h3>
              {allowedOperations.includes("appointmentViewById") && (
                <button onClick={() => handleOperation("appointmentViewById")} disabled={loading}>
                  View Appointment by ID
                </button>
              )}
              {allowedOperations.includes("appointmentUpdate") && (
                <button onClick={() => handleOperation("appointmentUpdate")} disabled={loading}>
                  Update Appointment
                </button>
              )}
              {allowedOperations.includes("appointmentReschedule") && (
                <button onClick={() => handleOperation("appointmentReschedule")} disabled={loading}>
                  Reschedule Appointment
                </button>
              )}
              {allowedOperations.includes("appointmentCancel") && (
                <button onClick={() => handleOperation("appointmentCancel")} disabled={loading}>
                  Cancel Appointment
                </button>
              )}
              {allowedOperations.includes("appointmentViewByDoctorDate") && (
                <button onClick={() => handleOperation("appointmentViewByDoctorDate")} disabled={loading}>
                  View Appointments by Doctor and Date
                </button>
              )}
              {allowedOperations.includes("appointmentCountByDoctorDate") && (
                <button onClick={() => handleOperation("appointmentCountByDoctorDate")} disabled={loading}>
                  Get Appointment Count by Doctor and Date
                </button>
              )}
              <h3>Prescription Operations</h3>
              {allowedOperations.includes("prescriptionCreate") && (
                <button onClick={() => handleOperation("prescriptionCreate")} disabled={loading}>
                  Create Prescription
                </button>
              )}
              {allowedOperations.includes("prescriptionByPatient") && (
                <button onClick={() => handleOperation("prescriptionByPatient")} disabled={loading}>
                  Prescriptions by Patient
                </button>
              )}
              {allowedOperations.includes("prescriptionMy") && (
                <button onClick={() => handleOperation("prescriptionMy")} disabled={loading}>
                  My Prescriptions
                </button>
              )}
            </div>
          </div>
          <DoctorContent
            operationMode={operationMode}
            doctorId={doctorId}
            formData={formData}
            createdDoctor={createdDoctor}
            doctorFetched={doctorFetched}
            allDoctors={allDoctors}
            viewAllMode={viewAllMode}
            currentPage={currentPage}
            totalPages={totalPages}
            loading={loading}
            message={message}
            handleSubmit={handleSubmit}
            handleInputChange={handleInputChange}
            fetchDoctor={fetchDoctor}
            handleDeleteDoctor={handleDeleteDoctor}
            handlePreviousPage={handlePreviousPage}
            handleNextPage={handleNextPage}
            setDoctorId={setDoctorIdCallback}
          />
        </div>
      ) : (
        <div className={`${styles['right-panel']} ${styles['full-width-content']}`} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <DoctorContent
            operationMode={operationMode}
            doctorId={doctorId}
            formData={formData}
            createdDoctor={createdDoctor}
            doctorFetched={doctorFetched}
            allDoctors={allDoctors}
            viewAllMode={viewAllMode}
            currentPage={currentPage}
            totalPages={totalPages}
            loading={loading}
            message={message}
            handleSubmit={handleSubmit}
            handleInputChange={handleInputChange}
            fetchDoctor={fetchDoctor}
            handleDeleteDoctor={handleDeleteDoctor}
            handlePreviousPage={handlePreviousPage}
            handleNextPage={handleNextPage}
            setDoctorId={setDoctorIdCallback}
          />
        </div>
      )}
    </div>
  );
};

export default DoctorPage;