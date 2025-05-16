import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import LeaveManagement, { LeaveOperation } from "./DoctorLeavePage";
import AppointmentManagement, { AppointmentOperation } from "./AppointmentPage";
import "./DoctorPage.css";

// Define interfaces
interface Doctor {
  doctorId: number;
  doctorName: string;
  specialization: string;
  contact: string;
  yoe: number;
  departmentName?: string;
}

interface FormData {
  doctorName: string;
  specialization: string;
  contact: string;
  yoe: string;
}

interface DoctorPageProps {
  allowedOperations?: string[];
  initialOperation?: string;
  showHeaders?: boolean; // Prop to control header display, defaults to true
}

interface DoctorContentProps {
  operationMode: string;
  doctorId: number | null;
  formData: FormData;
  createdDoctor: Doctor | null;
  doctorFetched: boolean;
  allDoctors: Doctor[];
  viewAllMode: boolean;
  currentPage: number;
  totalPages: number;
  loading: boolean;
  message: string;
  handleSubmit: (e: React.FormEvent) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  fetchDoctor: () => void;
  handleDeleteDoctor: () => void;
  handlePreviousPage: () => void;
  handleNextPage: () => void;
  setDoctorId: (id: number | null) => void;
}

// DoctorContent component with React.memo
const DoctorContent: React.FC<DoctorContentProps> = React.memo(({
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
  const leaveOperations: LeaveOperation[] = [];
  if (operationMode === "createLeave") {
    leaveOperations.push("Create Leave");
  } else if (operationMode === "viewLeaveByDoctorId") {
    leaveOperations.push("View Leave by Doctor ID");
  }

  // Map DoctorPage operationMode to AppointmentManagement operationMode
  const appointmentOperationMap: Record<string, AppointmentOperation> = {
    appointmentViewById: "View Appointment by ID",
    appointmentUpdate: "Update Appointment",
    appointmentReschedule: "Reschedule Appointment",
    appointmentCancel: "Cancel Appointment",
    appointmentViewByDoctorDate: "View Appointments by Doctor and Date",
    appointmentCountByDoctorDate: "Get Appointment Count by Doctor and Date",
  };

  const currentAppointmentOperation = appointmentOperationMap[operationMode] || "View Appointment by ID";

  return (
    <div className="right-panel">
      {loading && <p className="loading-message">Loading...</p>}

      {operationMode && operationMode !== "viewAll" && operationMode !== "createLeave" && operationMode !== "viewLeaveByDoctorId" && !Object.keys(appointmentOperationMap).includes(operationMode) && (
        <div className="operation-content">
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
                      <div className="doctor-id-display">
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
                    <div className="doctor-action-buttons">
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
        <div className="all-doctors-container">
          <h2>All Doctors</h2>
          {allDoctors.length > 0 ? (
            <>
              <table className="doctors-table">
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
                  {allDoctors.map((doctor: Doctor) => (
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
              <div className="pagination-controls">
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
        />
      )}

      {message && <p className="status-message">{message}</p>}
    </div>
  );
});

// DoctorPage component
const DoctorPage: React.FC<DoctorPageProps> = ({ allowedOperations = ["create", "getById", "update", "viewAll", "delete", "createLeave", "viewLeaveByDoctorId", "appointmentViewById", "appointmentUpdate", "appointmentReschedule", "appointmentCancel", "appointmentViewByDoctorDate", "appointmentCountByDoctorDate"], initialOperation, showHeaders = true }) => {
  const [operationMode, setOperationMode] = useState<string>(initialOperation || "");
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    doctorName: "",
    specialization: "",
    contact: "",
    yoe: "",
  });
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [createdDoctor, setCreatedDoctor] = useState<Doctor | null>(null);
  const [doctorFetched, setDoctorFetched] = useState<boolean>(false);
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [viewAllMode, setViewAllMode] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize] = useState<number>(15);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [sortBy] = useState<string>("doctorId");

  const userRole = localStorage.getItem("role") || "patient";

  const fetchAllDoctors = useCallback(async (page: number = currentPage) => {
    if (!["admin", "super-admin"].includes(userRole)) {
      setMessage("You do not have permission to view all doctors.");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:8081/doctors/", {
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

  const handleOperation = useCallback((mode: string) => {
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
      const response = await axios.get(`http://localhost:8081/doctors/${doctorId}`);
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

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (operationMode === "create" && !["admin", "super-admin"].includes(userRole)) {
      setMessage("You do not have permission to create a doctor.");
      setLoading(false);
      return;
    }
    try {
      let response;
      if (operationMode === "update" && doctorId) {
        response = await axios.put(`http://localhost:8081/doctors/updateDoctor/${doctorId}`, formData);
        setMessage("Doctor updated successfully");
        setCreatedDoctor(response.data);
        setDoctorFetched(false);
      } else if (operationMode === "create") {
        response = await axios.post("http://localhost:8081/doctors/addDoctor", formData);
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
    if (!["admin", "super-admin"].includes(userRole)) {
      setMessage("You do not have permission to delete a doctor.");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.delete(`http://localhost:8081/doctors/deleteDoctor/${doctorId}`);
      setMessage(response.data);
      resetForm();
    } catch (error) {
      setMessage("Error deleting doctor.");
    } finally {
      setLoading(false);
    }
  }, [doctorId, userRole, resetForm]);

  const setDoctorIdCallback = useCallback((id: number | null) => {
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
    <div className="doctor-container" style={{ flexGrow: 1 }}>
      {showHeaders && (
        <>
          <h1>WELCOME TO THE HOSPITAL MANAGEMENT SYSTEM</h1>
          <h2>DOCTOR DASHBOARD</h2>
        </>
      )}
      {!initialOperation ? (
        <div className="split-container" style={{ flex: 1, display: "flex" }}>
          <div className="left-panel">
            <div className="doctor-action-buttons">
              <h3>Doctor Operations</h3>
              {allowedOperations.includes("create") && ["admin", "super-admin"].includes(userRole) && (
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
              {allowedOperations.includes("viewAll") && ["admin", "super-admin"].includes(userRole) && (
                <button onClick={() => handleOperation("viewAll")} disabled={loading}>
                  View All Doctors
                </button>
              )}
              {allowedOperations.includes("delete") && ["admin", "super-admin"].includes(userRole) && (
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
        <div className="right-panel full-width-content" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
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