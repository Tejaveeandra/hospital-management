import React, { useState, useEffect } from "react";
import axios from "axios";
import api from "../api/api";
import styles from "./AppointmentPage.module.css";
import PaymentModal from "../component/PaymentModal";
import AppointmentTable from "../component/appointments/AppointmentTable";
import { 
  Calendar, 
  CalendarPlus, 
  ListFilter, 
  Search, 
  Clock, 
  XCircle, 
  Building2, 
  Stethoscope, 
  User, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  RefreshCw,
  Edit3
} from "lucide-react";

const DEFAULT_OPERATIONS = [
  "Create Appointment",
  "View All Appointments",
  "View Appointment by ID",
  "Reschedule Appointment",
  "Cancel Appointment"
];

const AppointmentManagement = ({ 
  allowedOperations = DEFAULT_OPERATIONS, 
  doctorId, 
  operationMode, 
  user: propUser, 
  isEmbedded = false 
}) => {
  const ops = Array.isArray(allowedOperations) && allowedOperations.length > 0 ? allowedOperations : DEFAULT_OPERATIONS;

  const [formData, setFormData] = useState({
    patientId: propUser?.role === "patient" ? propUser.id : "",
    patientUhidInput: "",
    branchId: "1",
    departmentId: "",
    subDeptId: "",
    appointmentDate: new Date().toISOString().split("T")[0],
    timeSlot: "MORNING",
    preferredDoctorCode: "",
    isEmergency: false,
    emergencySeverity: "URGENT",
  });

  const [verifiedPatient, setVerifiedPatient] = useState(null);
  const [verifyingPatient, setVerifyingPatient] = useState(false);

  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subDepartments, setSubDepartments] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);

  const [viewAppointmentId, setViewAppointmentId] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [hospitalCharges, setHospitalCharges] = useState([]);
  const [createdAppointment, setCreatedAppointment] = useState(null);

  // Reschedule state
  const [rescheduleSearchId, setRescheduleSearchId] = useState("");
  const [rescheduleAppointmentData, setRescheduleAppointmentData] = useState(null);
  const [newAppointmentDate, setNewAppointmentDate] = useState(new Date().toISOString().split("T")[0]);
  const [newTimeSlot, setNewTimeSlot] = useState("MORNING");

  // Cancel state
  const [cancelSearchId, setCancelSearchId] = useState("");
  const [cancelAppointmentData, setCancelAppointmentData] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  const [user] = useState(() => {
    if (propUser) return propUser;
    const role = localStorage.getItem("role");
    const id = localStorage.getItem("userId") || localStorage.getItem("id");
    return role ? { role, id } : null;
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(0);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchStartDate, setSearchStartDate] = useState("");
  const [searchEndDate, setSearchEndDate] = useState("");
  const [searchPatientId, setSearchPatientId] = useState("");
  const [searchAppointmentId, setSearchAppointmentId] = useState("");
  const [prescribedAppointmentCodes] = useState(new Set());

  // Determine active tab
  const getInitialMode = () => {
    if (operationMode === "Update Appointment" || operationMode === "reschedule") return "Reschedule Appointment";
    if (operationMode === "cancel") return "Cancel Appointment";
    if (operationMode && ops.includes(operationMode)) return operationMode;
    return ops[0] || "Create Appointment";
  };

  const [internalOperationMode, setInternalOperationMode] = useState(getInitialMode());

  const showNotification = (msg, type = "info") => {
    setMessage(msg);
    setMessageType(type);
  };

  useEffect(() => {
    if (operationMode) {
      if (operationMode === "Update Appointment" || operationMode === "reschedule") {
        setInternalOperationMode("Reschedule Appointment");
      } else if (operationMode === "cancel") {
        setInternalOperationMode("Cancel Appointment");
      } else if (ops.includes(operationMode)) {
        setInternalOperationMode(operationMode);
      }
    }
  }, [operationMode, ops]);

  // Load branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        let res;
        try {
          res = await api.get("/api/branches");
        } catch {
          res = await api.get("/api/branches/list");
        }
        if (Array.isArray(res.data) && res.data.length > 0) {
          setBranches(res.data);
          if (!formData.branchId) {
            setFormData(prev => ({ ...prev, branchId: String(res.data[0].branchId) }));
          }
        } else {
          setBranches([{ branchId: 1, branchName: "Main Hospital Branch" }]);
        }
      } catch (e) {
        setBranches([{ branchId: 1, branchName: "Main Hospital Branch" }]);
      }
    };
    fetchBranches();
  }, []);

  // Fetch departments dynamically based on selected branch
  useEffect(() => {
    const fetchDeptForBranch = async () => {
      if (!formData.branchId) return;
      try {
        let deptList = [];
        try {
          const res = await api.get(`/api/departments/branch/${formData.branchId}`);
          deptList = Array.isArray(res.data) ? res.data : [];
        } catch {
          const resAll = await api.get("/api/departments");
          deptList = Array.isArray(resAll.data) ? resAll.data : [];
        }
        setDepartments(deptList);
        if (deptList.length > 0) {
          if (!deptList.some(d => String(d.departmentId) === String(formData.departmentId))) {
            setFormData(prev => ({ ...prev, departmentId: String(deptList[0].departmentId), subDeptId: "", preferredDoctorCode: "" }));
          }
        }
      } catch (e) {
        setDepartments([]);
      }
    };
    fetchDeptForBranch();
  }, [formData.branchId]);

  // Fetch sub-departments dynamically based on selected department
  useEffect(() => {
    const fetchSubDepts = async () => {
      if (!formData.departmentId) {
        setSubDepartments([]);
        setDoctorsList([]);
        return;
      }
      try {
        let subList = [];
        try {
          const res = await api.get(`/api/sub-departments/by-department/${formData.departmentId}`);
          subList = Array.isArray(res.data) ? res.data : [];
        } catch {
          const resAdmin = await api.get(`/admin/sub-departments/by-department/${formData.departmentId}`);
          subList = Array.isArray(resAdmin.data) ? resAdmin.data : [];
        }
        setSubDepartments(subList);
        if (subList.length > 0) {
          setFormData(prev => ({ ...prev, subDeptId: String(subList[0].subDeptId) }));
        } else {
          setFormData(prev => ({ ...prev, subDeptId: "" }));
        }
      } catch (e) {
        setSubDepartments([]);
      }
    };
    fetchSubDepts();
  }, [formData.departmentId]);

  // Fetch doctors dynamically
  useEffect(() => {
    const fetchDoctors = async () => {
      if (formData.subDeptId) {
        try {
          const res = await api.get(`/doctors/by-sub-department/${formData.subDeptId}`);
          setDoctorsList(Array.isArray(res.data) ? res.data : []);
        } catch {
          setDoctorsList([]);
        }
      } else if (formData.departmentId) {
        try {
          const res = await api.get(`/doctors/by-department/${formData.departmentId}`);
          setDoctorsList(Array.isArray(res.data) ? res.data : []);
        } catch {
          setDoctorsList([]);
        }
      } else {
        setDoctorsList([]);
      }
    };
    fetchDoctors();
  }, [formData.subDeptId, formData.departmentId]);

  useEffect(() => {
    if (internalOperationMode === "View All Appointments" && ops.includes("View All Appointments")) {
      fetchAllAppointments(0);
    }
  }, [internalOperationMode]);

  // Verify patient by UHID or ID
  const verifyPatientLookup = async (queryToVerify) => {
    const q = (queryToVerify !== undefined ? queryToVerify : formData.patientUhidInput || formData.patientId).toString().trim();
    if (!q) {
      showNotification("Please enter a Patient UHID (e.g. UHID-2026-00001) or ID to verify.", "error");
      return;
    }
    setVerifyingPatient(true);
    try {
      const res = await api.get(`/patients/${encodeURIComponent(q)}`);
      if (res.data) {
        const p = res.data;
        setVerifiedPatient(p);
        setFormData(prev => ({
          ...prev,
          patientId: String(p.patientId),
          patientUhidInput: p.uhid || String(p.patientId)
        }));
        showNotification(`Patient Verified: ${p.patientName} (${p.uhid || `ID #${p.patientId}`})`, "success");
      } else {
        setVerifiedPatient(null);
        showNotification(`No patient record found for ${q}`, "error");
      }
    } catch (e) {
      setVerifiedPatient(null);
      showNotification(`Patient verification failed for "${q}". Please check the UHID / ID.`, "error");
    } finally {
      setVerifyingPatient(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "isEmergency" ? value === "true" : value,
    }));
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (internalOperationMode !== "Create Appointment") return;

    const resolvedPatientId = verifiedPatient?.patientId || formData.patientId;
    if (!resolvedPatientId || isNaN(Number(resolvedPatientId)) || Number(resolvedPatientId) < 1) {
      showNotification("Please verify a valid Patient UHID or enter a valid numeric Patient ID.", "error");
      return;
    }
    if (!formData.branchId) {
      showNotification("Please select a Hospital Branch.", "error");
      return;
    }
    if (!formData.departmentId) {
      showNotification("Please select a Department.", "error");
      return;
    }
    if (!formData.appointmentDate) {
      showNotification("Please select an appointment date.", "error");
      return;
    }
    if (!formData.timeSlot) {
      showNotification("Please select a shift / time slot.", "error");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        patientId: Number(resolvedPatientId),
        patientUhid: verifiedPatient?.uhid || formData.patientUhidInput || null,
        branchId: Number(formData.branchId),
        departmentId: Number(formData.departmentId),
        subDeptId: formData.subDeptId ? Number(formData.subDeptId) : null,
        appointmentDate: formData.appointmentDate,
        shift: formData.timeSlot.toUpperCase(),
        preferredDoctorCode: formData.preferredDoctorCode ? formData.preferredDoctorCode : null,
        isPreferredDoctor: Boolean(formData.preferredDoctorCode),
        isEmergency: formData.isEmergency,
        emergencySeverity: formData.isEmergency ? (formData.emergencySeverity || "URGENT") : "URGENT",
      };

      const response = await api.post("/appointments/fixAppointment", payload);
      const newAppointment = response.data;
      showNotification(`Appointment Booked Successfully! Code: ${newAppointment.appointmentCode || newAppointment.appointmentId}`, "success");
      setCreatedAppointment(newAppointment);

      if (user?.role === "patient" || user?.role === "admin") {
        setSelectedAppointment({
          appointmentId: newAppointment.appointmentId,
          amount: 500
        });
        setShowPaymentModal(true);
      }
    } catch (error) {
      const errMsg = axios.isAxiosError(error) ? error.response?.data?.message || error.message : "Booking error";
      showNotification(`Booking Error: ${errMsg}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointmentById = async () => {
    if (!viewAppointmentId || !viewAppointmentId.trim()) {
      showNotification("Please enter a valid Appointment Code or ID.", "error");
      return;
    }
    setLoading(true);
    try {
      const q = viewAppointmentId.trim();
      let res;
      try {
        res = await api.get(`/appointments/code/${encodeURIComponent(q)}`);
      } catch {
        res = await api.get(`/appointments/${q}`);
      }
      if (res && res.data) {
        setAppointments([res.data]);
        showNotification(`Appointment ${q} retrieved successfully.`, "success");
      } else {
        setAppointments([]);
        showNotification(`No appointment found with code/ID: ${q}`, "error");
      }
    } catch (error) {
      showNotification("Error fetching appointment.", "error");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllAppointments = async (page = currentPage) => {
    setLoading(true);
    try {
      const params = {
        page: page,
        size: pageSize,
        sortBy: 'appointmentDate'
      };

      if (showAdvancedSearch) {
        if (searchStartDate) params.startDate = searchStartDate;
        if (searchEndDate) params.endDate = searchEndDate;
        if (searchPatientId) params.searchPatientId = searchPatientId;
      }

      const response = await api.get("/appointments/ViewAllAppointments", { params });
      if (response.data && response.data.content) {
        setAppointments(response.data.content);
        setTotalPages(response.data.totalPages || 1);
        setCurrentPage(page);
      } else if (Array.isArray(response.data)) {
        setAppointments(response.data);
        setTotalPages(1);
      }
      showNotification("Appointments loaded", "info");
    } catch (error) {
      showNotification("Error loading appointments.", "error");
    } finally {
      setLoading(false);
    }
  };

  // RESCHEDULE LOGIC
  const fetchAppointmentForReschedule = async () => {
    const q = rescheduleSearchId.trim();
    if (!q) {
      showNotification("Please enter an Appointment Code or ID to reschedule.", "error");
      return;
    }
    setLoading(true);
    try {
      let res;
      try {
        res = await api.get(`/appointments/code/${encodeURIComponent(q)}`);
      } catch {
        res = await api.get(`/appointments/${q}`);
      }
      if (res && res.data) {
        setRescheduleAppointmentData(res.data);
        setNewAppointmentDate(res.data.appointmentDate || new Date().toISOString().split("T")[0]);
        setNewTimeSlot(res.data.shift || res.data.timeSlot || "MORNING");
        showNotification(`Loaded Appointment ${res.data.appointmentCode || res.data.appointmentId} for Reschedule`, "success");
      } else {
        setRescheduleAppointmentData(null);
        showNotification(`Appointment not found: ${q}`, "error");
      }
    } catch (e) {
      setRescheduleAppointmentData(null);
      showNotification("Error finding appointment for rescheduling.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleAppointmentData) return;
    const targetId = rescheduleAppointmentData.appointmentId;
    if (!targetId) {
      showNotification("Missing Appointment ID.", "error");
      return;
    }

    setLoading(true);
    try {
      let res;
      try {
        res = await api.put(`/appointments/reschedule/${targetId}`, {}, {
          params: {
            newAppointmentDate: newAppointmentDate,
            newTimeSlot: newTimeSlot
          }
        });
      } catch {
        res = await api.put(`/appointments/appointments/reschedule/${targetId}`, {}, {
          params: {
            newAppointmentDate: newAppointmentDate,
            newTimeSlot: newTimeSlot
          }
        });
      }
      showNotification(`Appointment #${targetId} rescheduled to ${newAppointmentDate} (${newTimeSlot} Shift)!`, "success");
      setRescheduleAppointmentData(res.data || { ...rescheduleAppointmentData, appointmentDate: newAppointmentDate, shift: newTimeSlot });
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || "Failed to reschedule";
      showNotification(`Reschedule Failed: ${errMsg}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // CANCEL LOGIC
  const fetchAppointmentForCancel = async () => {
    const q = cancelSearchId.trim();
    if (!q) {
      showNotification("Please enter an Appointment Code or ID to cancel.", "error");
      return;
    }
    setLoading(true);
    try {
      let res;
      try {
        res = await api.get(`/appointments/code/${encodeURIComponent(q)}`);
      } catch {
        res = await api.get(`/appointments/${q}`);
      }
      if (res && res.data) {
        setCancelAppointmentData(res.data);
        showNotification(`Loaded Appointment ${res.data.appointmentCode || res.data.appointmentId}`, "info");
      } else {
        setCancelAppointmentData(null);
        showNotification(`Appointment not found: ${q}`, "error");
      }
    } catch (e) {
      setCancelAppointmentData(null);
      showNotification("Error finding appointment.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelAppointmentData) return;
    const targetId = cancelAppointmentData.appointmentId;

    if (!window.confirm(`Are you sure you want to cancel appointment #${targetId} for patient ${cancelAppointmentData.patientName}?`)) {
      return;
    }

    setLoading(true);
    try {
      await api.delete(`/appointments/cancel/${targetId}`);
      showNotification(`Appointment #${targetId} has been successfully CANCELLED.`, "success");
      setCancelAppointmentData(prev => ({ ...prev, status: "CANCELLED" }));
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || "Cancellation failed";
      showNotification(`Cancellation Failed: ${errMsg}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${styles['appointment-management']} ${isEmbedded ? styles['embedded-view'] : ''}`}>
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
            marginBottom: "20px"
          }}
        >
          {messageType === "success" && <CheckCircle2 size={18} />}
          {messageType === "error" && <AlertTriangle size={18} />}
          {messageType === "info" && <RefreshCw size={18} />}
          <span>{message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className={styles['operation-tabs']}>
        {ops.includes("Create Appointment") && (
          <button
            type="button"
            className={`${styles['tab-btn']} ${internalOperationMode === "Create Appointment" ? styles['active-tab'] : ''}`}
            onClick={() => { setInternalOperationMode("Create Appointment"); setMessage(""); }}
          >
            <CalendarPlus size={16} /> Book Appointment
          </button>
        )}
        {ops.includes("View All Appointments") && (
          <button
            type="button"
            className={`${styles['tab-btn']} ${internalOperationMode === "View All Appointments" ? styles['active-tab'] : ''}`}
            onClick={() => { setInternalOperationMode("View All Appointments"); setMessage(""); }}
          >
            <ListFilter size={16} /> All Appointments
          </button>
        )}
        {ops.includes("View Appointment by ID") && (
          <button
            type="button"
            className={`${styles['tab-btn']} ${internalOperationMode === "View Appointment by ID" ? styles['active-tab'] : ''}`}
            onClick={() => { setInternalOperationMode("View Appointment by ID"); setMessage(""); }}
          >
            <Search size={16} /> Search by ID
          </button>
        )}
        {ops.includes("Reschedule Appointment") && (
          <button
            type="button"
            className={`${styles['tab-btn']} ${internalOperationMode === "Reschedule Appointment" ? styles['active-tab'] : ''}`}
            onClick={() => { setInternalOperationMode("Reschedule Appointment"); setMessage(""); }}
          >
            <Clock size={16} /> Reschedule
          </button>
        )}
        {ops.includes("Cancel Appointment") && (
          <button
            type="button"
            className={`${styles['tab-btn']} ${internalOperationMode === "Cancel Appointment" ? styles['active-tab'] : ''}`}
            onClick={() => { setInternalOperationMode("Cancel Appointment"); setMessage(""); }}
          >
            <XCircle size={16} /> Cancel
          </button>
        )}
      </div>

      {/* TAB 1: CREATE APPOINTMENT */}
      {internalOperationMode === "Create Appointment" && (
        <div className={styles['form-container']}>
          <h3>Book Hospital Consultation</h3>
          {createdAppointment ? (
            <div className={styles['appointment-details-form']}>
              <div style={{ padding: "16px", background: "#f0fdf4", borderRadius: "10px", border: "1px solid #bbf7d0", marginBottom: "16px" }}>
                <h4 style={{ margin: "0 0 6px 0", color: "#166534" }}>✓ Appointment Confirmed</h4>
                <div style={{ color: "#15803d", fontSize: "0.95rem" }}>
                  Appointment Code: <strong>{createdAppointment.appointmentCode || `APP-${createdAppointment.appointmentId}`}</strong> | Token: <strong>#{createdAppointment.tokenNumber}</strong>
                </div>
              </div>

              <label>Patient Name:</label>
              <input type="text" value={createdAppointment.patientName || ""} disabled />

              <label>Consulting Doctor:</label>
              <input type="text" value={createdAppointment.doctorName || "Auto-Assigned Specialist"} disabled />

              <label>Appointment Date & Shift:</label>
              <input type="text" value={`${createdAppointment.appointmentDate} • ${createdAppointment.shift || createdAppointment.timeSlot || "MORNING"}`} disabled />

              <div className={styles['action-buttons']} style={{ marginTop: "16px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setCreatedAppointment(null);
                    setVerifiedPatient(null);
                  }}
                >
                  Book Another Appointment
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleBookSubmit}>
              {/* Branch Dropdown */}
              <div>
                <label>Hospital Branch *</label>
                <select
                  name="branchId"
                  value={formData.branchId}
                  onChange={handleInputChange}
                  required
                >
                  {branches.map(b => (
                    <option key={b.branchId} value={b.branchId}>
                      {b.branchName} (Branch #{b.branchId})
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Dropdown */}
              <div>
                <label>Medical Department *</label>
                <select
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">-- Choose Medical Department --</option>
                  {departments.map(d => (
                    <option key={d.departmentId} value={d.departmentId}>
                      {d.departmentName}
                    </option>
                  ))}
                </select>
                {departments.length === 0 && (
                  <span style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "4px", display: "block" }}>
                    Loading departments for this branch...
                  </span>
                )}
              </div>

              {/* Sub-Department Dropdown */}
              <div>
                <label>Sub-Specialty Division *</label>
                <select
                  name="subDeptId"
                  value={formData.subDeptId}
                  onChange={handleInputChange}
                >
                  <option value="">-- General Division / Sub-Department --</option>
                  {subDepartments.map(sd => (
                    <option key={sd.subDeptId} value={sd.subDeptId}>
                      {sd.subDeptName}
                    </option>
                  ))}
                </select>
                {formData.departmentId && subDepartments.length === 0 && (
                  <span style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "4px", display: "block" }}>
                    Standard consultation (no sub-divisions required for this department)
                  </span>
                )}
              </div>

              {/* Doctor Preference */}
              <div>
                <label>Doctor Preference (Optional)</label>
                <select
                  name="preferredDoctorCode"
                  value={formData.preferredDoctorCode}
                  onChange={handleInputChange}
                >
                  <option value="">Any Available Specialist (Smart Load Balancing)</option>
                  {doctorsList.map(doc => (
                    <option key={doc.doctorCode || doc.id} value={doc.doctorCode || doc.doctorName}>
                      Dr. {doc.doctorName || doc.name} ({doc.specialization || "Physician"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Patient UHID / ID */}
              <div>
                <label>Patient UHID or ID *</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    name="patientUhidInput"
                    placeholder="Enter Patient UHID (e.g. UHID-2026-00001) or ID"
                    value={formData.patientUhidInput}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, patientUhidInput: e.target.value, patientId: e.target.value }));
                      setVerifiedPatient(null);
                    }}
                    required
                  />
                  <button
                    type="button"
                    style={{
                      padding: "8px 14px",
                      background: "#0f172a",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      whiteSpace: "nowrap"
                    }}
                    onClick={() => verifyPatientLookup()}
                    disabled={verifyingPatient}
                  >
                    {verifyingPatient ? "Checking..." : "Verify Patient"}
                  </button>
                </div>
                {verifiedPatient && (
                  <div style={{ fontSize: "0.85rem", color: "#166534", marginTop: "6px", fontWeight: 600 }}>
                    ✓ Verified Patient: {verifiedPatient.patientName} (UHID: {verifiedPatient.uhid || verifiedPatient.patientId})
                  </div>
                )}
              </div>

              {/* Date & Shift */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label>Appointment Date *</label>
                  <input
                    type="date"
                    name="appointmentDate"
                    value={formData.appointmentDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>

                <div>
                  <label>Shift / Time Slot *</label>
                  <select
                    name="timeSlot"
                    value={formData.timeSlot}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="MORNING">Morning (09:00 AM - 01:00 PM)</option>
                    <option value="EVENING">Evening (04:00 PM - 08:00 PM)</option>
                  </select>
                </div>
              </div>

              {/* Emergency Priority */}
              <div>
                <label>Emergency Priority *</label>
                <select
                  name="isEmergency"
                  value={formData.isEmergency.toString()}
                  onChange={handleInputChange}
                >
                  <option value="false">No (Standard Outpatient Consultation)</option>
                  <option value="true">Yes (Emergency / Urgent Triage)</option>
                </select>
              </div>

              <button type="submit" disabled={loading} style={{ marginTop: "12px" }}>
                {loading ? "Processing Booking..." : "Book Appointment Now"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* TAB 2: RESCHEDULE APPOINTMENT */}
      {internalOperationMode === "Reschedule Appointment" && (
        <div className={styles['form-container']}>
          <h3>Reschedule Existing Appointment</h3>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#475569" }}>
              Lookup Appointment by Code or ID:
            </label>
            <div style={{ display: "flex", gap: "10px", maxWidth: "500px" }}>
              <input
                type="text"
                placeholder="e.g. APP-10023 or 101"
                value={rescheduleSearchId}
                onChange={(e) => setRescheduleSearchId(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); fetchAppointmentForReschedule(); } }}
              />
              <button
                type="button"
                onClick={fetchAppointmentForReschedule}
                disabled={loading}
                style={{ padding: "10px 18px", background: "#0f172a", color: "white", borderRadius: "8px", cursor: "pointer", border: "none" }}
              >
                Fetch
              </button>
            </div>
          </div>

          {rescheduleAppointmentData && (
            <div style={{ maxWidth: "600px" }}>
              <div style={{
                background: "#f8fafc",
                borderRadius: "12px",
                padding: "20px",
                border: "1px solid #e2e8f0",
                marginBottom: "20px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "14px"
              }}>
                <div>
                  <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>Appointment Code</span>
                  <div style={{ fontWeight: 800, color: "#2563eb", fontSize: "1.1rem" }}>
                    {rescheduleAppointmentData.appointmentCode || `#${rescheduleAppointmentData.appointmentId}`}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>Token Number</span>
                  <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "1.1rem" }}>
                    #{rescheduleAppointmentData.tokenNumber}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>Patient Name</span>
                  <div style={{ fontWeight: 700, color: "#0f172a" }}>
                    {rescheduleAppointmentData.patientName}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>Consulting Doctor</span>
                  <div style={{ fontWeight: 700, color: "#0f172a" }}>
                    {rescheduleAppointmentData.doctorName || "Assigned Specialist"}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>Currently Scheduled Date</span>
                  <div style={{ color: "#334155", fontWeight: 600 }}>
                    {rescheduleAppointmentData.appointmentDate}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>Current Shift</span>
                  <div style={{ color: "#334155", fontWeight: 600 }}>
                    {rescheduleAppointmentData.shift || rescheduleAppointmentData.timeSlot}
                  </div>
                </div>
              </div>

              <form onSubmit={handleConfirmReschedule}>
                <h4>Select New Date & Time Slot:</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label>New Appointment Date *</label>
                    <input
                      type="date"
                      value={newAppointmentDate}
                      onChange={(e) => setNewAppointmentDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>
                  <div>
                    <label>New Time Slot / Shift *</label>
                    <select
                      value={newTimeSlot}
                      onChange={(e) => setNewTimeSlot(e.target.value)}
                      required
                    >
                      <option value="MORNING">Morning (09:00 AM - 01:00 PM)</option>
                      <option value="EVENING">Evening (04:00 PM - 08:00 PM)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    marginTop: "16px",
                    background: "#2563eb",
                    color: "white",
                    padding: "12px 24px",
                    borderRadius: "10px",
                    border: "none",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  <Clock size={16} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
                  {loading ? "Rescheduling..." : "Confirm Reschedule"}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CANCEL APPOINTMENT */}
      {internalOperationMode === "Cancel Appointment" && (
        <div className={styles['form-container']}>
          <h3>Cancel Hospital Appointment</h3>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#475569" }}>
              Lookup Appointment to Cancel:
            </label>
            <div style={{ display: "flex", gap: "10px", maxWidth: "500px" }}>
              <input
                type="text"
                placeholder="e.g. APP-10023 or 101"
                value={cancelSearchId}
                onChange={(e) => setCancelSearchId(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); fetchAppointmentForCancel(); } }}
              />
              <button
                type="button"
                onClick={fetchAppointmentForCancel}
                disabled={loading}
                style={{ padding: "10px 18px", background: "#0f172a", color: "white", borderRadius: "8px", cursor: "pointer", border: "none" }}
              >
                Fetch Details
              </button>
            </div>
          </div>

          {cancelAppointmentData && (
            <div style={{ maxWidth: "600px" }}>
              <div style={{
                background: cancelAppointmentData.status === "CANCELLED" ? "#fef2f2" : "#f8fafc",
                borderRadius: "12px",
                padding: "20px",
                border: `1px solid ${cancelAppointmentData.status === "CANCELLED" ? "#fecaca" : "#e2e8f0"}`,
                marginBottom: "20px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "1.1rem" }}>
                    {cancelAppointmentData.appointmentCode || `#${cancelAppointmentData.appointmentId}`}
                  </div>
                  <span style={{
                    padding: "4px 10px",
                    borderRadius: "12px",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    background: cancelAppointmentData.status === "CANCELLED" ? "#fee2e2" : "#f0fdf4",
                    color: cancelAppointmentData.status === "CANCELLED" ? "#991b1b" : "#166534"
                  }}>
                    {cancelAppointmentData.status || "CONFIRMED"}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "0.9rem" }}>
                  <div><strong>Patient:</strong> {cancelAppointmentData.patientName}</div>
                  <div><strong>Doctor:</strong> {cancelAppointmentData.doctorName}</div>
                  <div><strong>Date:</strong> {cancelAppointmentData.appointmentDate}</div>
                  <div><strong>Shift:</strong> {cancelAppointmentData.shift || cancelAppointmentData.timeSlot}</div>
                </div>
              </div>

              {cancelAppointmentData.status !== "CANCELLED" ? (
                <div>
                  <div style={{ padding: "14px", background: "#fffbeb", borderRadius: "10px", border: "1px solid #fde68a", marginBottom: "16px", color: "#92400e", fontSize: "0.88rem" }}>
                    <AlertTriangle size={16} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
                    Cancelling will remove this token from the doctor's queue and send an SMS cancellation alert to the patient.
                  </div>

                  <label style={{ display: "block", marginBottom: "6px", fontWeight: 600 }}>Reason for Cancellation (Optional):</label>
                  <textarea
                    placeholder="Patient requested cancellation / rescheduling required / unavailable..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", minHeight: "60px", marginBottom: "16px" }}
                  />

                  <button
                    type="button"
                    onClick={handleConfirmCancel}
                    disabled={loading}
                    style={{
                      background: "#dc2626",
                      color: "white",
                      padding: "12px 24px",
                      borderRadius: "10px",
                      border: "none",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <XCircle size={16} />
                    {loading ? "Cancelling..." : "Confirm Cancellation"}
                  </button>
                </div>
              ) : (
                <div style={{ color: "#991b1b", fontWeight: 600 }}>
                  This appointment has already been marked as CANCELLED.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: VIEW APPOINTMENT BY ID */}
      {internalOperationMode === "View Appointment by ID" && (
        <div className={styles['form-container']}>
          <div className={styles['input-section']}>
            <h3>View Appointment by Code or ID</h3>
            <label>Appointment Code / ID:</label>
            <div style={{ display: "flex", gap: "10px", maxWidth: "500px" }}>
              <input
                type="text"
                placeholder="e.g. APP-10023 or 101"
                value={viewAppointmentId}
                onChange={(e) => setViewAppointmentId(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); fetchAppointmentById(); } }}
              />
              <button onClick={fetchAppointmentById} disabled={loading}>Fetch</button>
            </div>
          </div>
          {appointments.length > 0 && (
            <div className={styles['results-section']}>
              <AppointmentTable
                appointments={appointments}
                user={user}
                getAppointmentCharge={() => 500}
                onPay={(id, amount) => {
                  setSelectedAppointment({ appointmentId: id, amount });
                  setShowPaymentModal(true);
                }}
                prescribedAppointmentCodes={prescribedAppointmentCodes}
              />
            </div>
          )}
        </div>
      )}

      {/* TAB 5: VIEW ALL APPOINTMENTS */}
      {internalOperationMode === "View All Appointments" && (
        <div className={styles['all-appointments-container']}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0 }}>All Appointments Registry</h3>
            <button
              type="button"
              className={styles['tab-btn']}
              style={{ background: "#f8fafc", border: "1px solid #cbd5e1" }}
              onClick={() => fetchAllAppointments(currentPage)}
              disabled={loading}
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {appointments.length > 0 ? (
            <>
              <AppointmentTable
                appointments={appointments}
                user={user}
                getAppointmentCharge={() => 500}
                onPay={(id, amount) => {
                  setSelectedAppointment({ appointmentId: id, amount });
                  setShowPaymentModal(true);
                }}
                prescribedAppointmentCodes={prescribedAppointmentCodes}
              />
              <div className={styles['pagination-controls']}>
                <button 
                  disabled={currentPage === 0 || loading} 
                  onClick={() => fetchAllAppointments(currentPage - 1)}
                >
                  Previous
                </button>
                <span>Page {currentPage + 1} of {Math.max(1, totalPages)}</span>
                <button 
                  disabled={currentPage >= totalPages - 1 || loading} 
                  onClick={() => fetchAllAppointments(currentPage + 1)}
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <p>No appointments found.</p>
          )}
        </div>
      )}

      {showPaymentModal && selectedAppointment && (
        <PaymentModal
          appointmentId={selectedAppointment.appointmentId}
          amount={selectedAppointment.amount}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            if (createdAppointment) {
              setCreatedAppointment((prev) => ({ ...prev, isPaid: true }));
            }
            if (internalOperationMode === "View All Appointments") {
              fetchAllAppointments(currentPage);
            }
          }}
        />
      )}
    </div>
  );
};

export default AppointmentManagement;
