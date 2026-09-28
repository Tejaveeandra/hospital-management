import React, { useState, useEffect } from "react";
import axios from "axios";
import api from "../api/api";
import styles from "./AppointmentPage.module.css";
import PaymentModal from "../component/PaymentModal";
import AppointmentTable from "../component/appointments/AppointmentTable";
import { Calendar, CalendarPlus, ListFilter, Search, Clock, XCircle, Building2, Stethoscope, User, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, DollarSign } from "lucide-react";

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
    branchId: "1",
    departmentId: "",
    subDeptId: "",
    appointmentDate: new Date().toISOString().split("T")[0],
    timeSlot: "MORNING",
    preferredDoctorCode: "",
    isEmergency: false,
    emergencySeverity: "URGENT",
  });

  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subDepartments, setSubDepartments] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);

  const [viewAppointmentId, setViewAppointmentId] = useState("");
  const [doctorIdFilter, setDoctorIdFilter] = useState(doctorId || "");
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [hospitalCharges, setHospitalCharges] = useState([]);
  const [createdAppointment, setCreatedAppointment] = useState(null);
  const [user] = useState(() => {
    if (propUser) return propUser;
    const role = localStorage.getItem("role");
    const id = localStorage.getItem("userId") || localStorage.getItem("id");
    return role ? { role, id } : null;
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(0);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchStartDate, setSearchStartDate] = useState("");
  const [searchEndDate, setSearchEndDate] = useState("");
  const [searchPatientId, setSearchPatientId] = useState("");
  const [searchAppointmentId, setSearchAppointmentId] = useState("");
  const [prescribedAppointmentCodes, setPrescribedAppointmentCodes] = useState(new Set());

  const [internalOperationMode, setInternalOperationMode] = useState(
    operationMode || ops[0] || "Create Appointment"
  );

  useEffect(() => {
    if (operationMode && ops.includes(operationMode) && operationMode !== internalOperationMode) {
      setInternalOperationMode(operationMode);
      setFormData({
        patientId: user?.role === "patient" ? user.id : "",
        branchId: "1",
        departmentId: "",
        subDeptId: "",
        appointmentDate: new Date().toISOString().split("T")[0],
        timeSlot: "MORNING",
        preferredDoctorCode: "",
        isEmergency: false,
        emergencySeverity: "URGENT",
        appointmentId: "",
        newAppointmentDate: "",
        newTimeSlot: "",
      });
      setViewAppointmentId("");
      setAppointments([]);
      setCreatedAppointment(null);
      setMessage("");
    }
  }, [operationMode, allowedOperations, internalOperationMode, user?.role]);

  useEffect(() => {
    if (user?.role === "patient") {
      setFormData((prev) => ({ ...prev, patientId: user.id }));
    } else if (user?.role === "doctor") {
      setDoctorIdFilter(user.id);
    }
  }, [user]);

  useEffect(() => {
    setMessage("");
  }, [internalOperationMode]);

  // Load branches on mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await api.get("/api/branches/list");
        if (Array.isArray(res.data) && res.data.length > 0) {
          setBranches(res.data);
        } else {
          setBranches([{ branchId: 1, branchName: "Main Branch" }]);
        }
      } catch (e) {
        setBranches([{ branchId: 1, branchName: "Main Branch" }]);
      }
    };
    fetchBranches();
  }, []);

  // Fetch departments dynamically based on selected branch
  useEffect(() => {
    const fetchDeptForBranch = async () => {
      if (!formData.branchId) return;
      try {
        const res = await api.get(`/api/departments/branch/${formData.branchId}`);
        const deptList = Array.isArray(res.data) ? res.data : [];
        setDepartments(deptList);
        // If current department isn't in branch's departments, clear department & subDept
        if (deptList.length > 0) {
          if (!deptList.some(d => String(d.departmentId) === String(formData.departmentId))) {
            setFormData(prev => ({ ...prev, departmentId: "", subDeptId: "", preferredDoctorCode: "" }));
            setSubDepartments([]);
            setDoctorsList([]);
          }
        } else {
          setFormData(prev => ({ ...prev, departmentId: "", subDeptId: "", preferredDoctorCode: "" }));
          setSubDepartments([]);
          setDoctorsList([]);
        }
      } catch (e) {
        // Fallback to all departments
        try {
          const resAll = await api.get("/api/departments");
          setDepartments(Array.isArray(resAll.data) ? resAll.data : []);
        } catch {
          setDepartments([]);
        }
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
        const res = await api.get(`/admin/sub-departments/by-department/${formData.departmentId}`);
        const subList = Array.isArray(res.data) ? res.data : [];
        setSubDepartments(subList);
        setFormData(prev => ({ ...prev, subDeptId: "", preferredDoctorCode: "" }));
        setDoctorsList([]);
      } catch (e) {
        setSubDepartments([]);
        setDoctorsList([]);
      }
    };
    fetchSubDepts();
  }, [formData.departmentId]);

  // Fetch doctors dynamically based on selected sub-department or department
  useEffect(() => {
    const fetchDoctors = async () => {
      if (formData.subDeptId) {
        try {
          const res = await api.get(`/doctors/by-sub-department/${formData.subDeptId}`);
          setDoctorsList(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
          setDoctorsList([]);
        }
      } else if (formData.departmentId) {
        try {
          const res = await api.get(`/doctors/by-department/${formData.departmentId}`);
          setDoctorsList(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
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
      fetchAllAppointments();
    }
  }, [internalOperationMode, ops]);

  const fetchHospitalCharges = async () => {
    try {
      const res = await api.get("/api/hospital-charges/list");
      setHospitalCharges(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Error fetching hospital charges:", e);
    }
  };

  useEffect(() => {
    fetchHospitalCharges();
  }, []);

  const handlePay = (appointmentId, amount) => {
    setSelectedAppointment({ appointmentId, amount });
    setShowPaymentModal(true);
  };

  const getAppointmentCharge = (appointment) => {
    if (!appointment) {
      return 500;
    }
    const isEmergency = appointment.isEmergency || appointment.emergency;
    const chargeName = isEmergency ? "EMERGENCY_CONSULTATION" : "GENERAL_CONSULTATION";
    const charge = hospitalCharges.find(c => (c.chargeName === chargeName || c.name === chargeName));
    return charge ? charge.amount : 500;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "isEmergency" ? value === "true" : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (internalOperationMode !== "Create Appointment") return;
    if (!formData.patientId || isNaN(Number(formData.patientId)) || Number(formData.patientId) < 1) {
      setMessage("Please enter a valid Patient ID greater than 0.");
      return;
    }
    if (!formData.branchId) {
      setMessage("Please select a Branch.");
      return;
    }
    if (!formData.departmentId) {
      setMessage("Please select a Department.");
      return;
    }
    if (!formData.subDeptId) {
      setMessage("Please select a Sub-Department specialty.");
      return;
    }
    if (!formData.appointmentDate) {
      setMessage("Please select an appointment date.");
      return;
    }
    if (!formData.timeSlot) {
      setMessage("Please select a time slot.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        patientId: Number(formData.patientId),
        branchId: Number(formData.branchId),
        departmentId: Number(formData.departmentId),
        subDeptId: Number(formData.subDeptId),
        appointmentDate: formData.appointmentDate,
        shift: formData.timeSlot.toUpperCase(),
        preferredDoctorCode: formData.preferredDoctorCode ? formData.preferredDoctorCode : null,
        isPreferredDoctor: Boolean(formData.preferredDoctorCode),
        isEmergency: formData.isEmergency,
        emergencySeverity: formData.isEmergency ? (formData.emergencySeverity || "URGENT") : "URGENT",
      };
      const response = await api.post(
        "/appointments/fixAppointment",
        payload
      );
      const newAppointment = response.data;
      setMessage(`Appointment created: Code ${newAppointment.appointmentCode || newAppointment.appointmentId}`);
      if (user?.role === "patient" || user?.role === "admin") {
        const amount = getAppointmentCharge(newAppointment);
        setSelectedAppointment({
          appointmentId: newAppointment.appointmentId,
          amount
        });
        setShowPaymentModal(true);
      }
      setCreatedAppointment(newAppointment);
      setFormData({
        patientId: user?.role === "patient" ? user.id : "",
        branchId: "1",
        departmentId: "",
        subDeptId: "",
        appointmentDate: new Date().toISOString().split("T")[0],
        timeSlot: "MORNING",
        preferredDoctorCode: "",
        isEmergency: false,
        emergencySeverity: "URGENT",
      });
      if (ops.includes("View All Appointments")) fetchAllAppointments();
    } catch (error) {
      const errMsg = axios.isAxiosError(error) ? error.response?.data?.message || error.message : "Unknown error";
      setMessage(`Booking Error: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCreatedAppointment(null);
    setFormData({
      patientId: user?.role === "patient" ? user.id : "",
      branchId: "1",
      departmentId: "",
      subDeptId: "",
      appointmentDate: new Date().toISOString().split("T")[0],
      timeSlot: "MORNING",
      preferredDoctorCode: "",
      isEmergency: false,
      emergencySeverity: "URGENT",
      appointmentId: "",
      newAppointmentDate: "",
      newTimeSlot: "",
    });
  };

  const fetchAppointmentById = async () => {
    if (internalOperationMode !== "View Appointment by ID") return;
    if (!viewAppointmentId || !viewAppointmentId.trim()) {
      setMessage("Please enter a valid Appointment Code or ID.");
      return;
    }
    setLoading(true);
    try {
      const queryTerm = viewAppointmentId.trim();
      let response;
      try {
        response = await api.get(`/appointments/code/${encodeURIComponent(queryTerm)}`);
      } catch {
        response = await api.get(`/appointments/${queryTerm}`);
      }
      if (response && response.data) {
        setAppointments([response.data]);
        setMessage(`Appointment ${queryTerm} fetched successfully.`);
      } else {
        setAppointments([]);
        setMessage(`No appointment found with code/ID: ${queryTerm}`);
      }
    } catch (error) {
      setMessage("Error fetching appointment.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllAppointments = async (page = currentPage) => {
    if (internalOperationMode !== "View All Appointments") return;
    setLoading(true);
    try {
      if (showAdvancedSearch && searchAppointmentId && searchAppointmentId.trim() !== "") {
        const queryTerm = searchAppointmentId.trim();
        let response;
        try {
          response = await api.get(`/appointments/code/${encodeURIComponent(queryTerm)}`);
        } catch {
          response = await api.get(`/appointments/${queryTerm}`);
        }
        
        if (response && response.data) {
          setAppointments([response.data]);
          setTotalPages(1);
          setMessage(`Found appointment: ${queryTerm}`);
        } else {
          setAppointments([]);
          setTotalPages(0);
          setMessage(`No appointment found with code/ID: ${queryTerm}`);
        }
        setLoading(false);
        return;
      }

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

      const response = await api.get(
        "/appointments/ViewAllAppointments", { params }
      );
      
      if (response.data && response.data.content) {
        setAppointments(response.data.content);
        setTotalPages(response.data.totalPages);
      } else if (Array.isArray(response.data)) {
        setAppointments(response.data);
        setTotalPages(1);
      }
      setMessage("All appointments fetched.");
    } catch (error) {
      setMessage("Error fetching appointments.");
    } finally {
      setLoading(false);
    }
  };

  const rescheduleAppointment = async (e) => {
    if (internalOperationMode !== "Reschedule Appointment") return;
    e.preventDefault();
    if (!formData.appointmentId || isNaN(Number(formData.appointmentId))) {
      setMessage("Please enter a valid Appointment ID.");
      return;
    }
    if (!formData.newAppointmentDate) {
      setMessage("Please select a new appointment date.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.put(
        `/appointments/reschedule/${formData.appointmentId}`,
        {},
        {
          params: {
            newAppointmentDate: formData.newAppointmentDate,
            newTimeSlot: formData.newTimeSlot || "MORNING",
          }
        }
      );
      setMessage(`Appointment ID ${formData.appointmentId} rescheduled successfully.`);
      setFormData({
        ...formData,
        newAppointmentDate: new Date().toISOString().split("T")[0],
        newTimeSlot: "MORNING",
      });
      if (ops.includes("View All Appointments")) fetchAllAppointments();
    } catch (error) {
      setMessage("Error rescheduling appointment.");
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async () => {
    if (internalOperationMode !== "Cancel Appointment") return;
    if (!formData.appointmentId || isNaN(Number(formData.appointmentId))) {
      setMessage("Please enter a valid Appointment ID.");
      return;
    }
    setLoading(true);
    try {
      await api.delete(
        `/appointments/cancel/${formData.appointmentId}`
      );
      setMessage(`Appointment ID ${formData.appointmentId} canceled.`);
      setFormData({ ...formData, appointmentId: "" });
      if (ops.includes("View All Appointments")) fetchAllAppointments();
    } catch (error) {
      setMessage("Error canceling appointment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${styles['appointment-management']} ${isEmbedded ? styles['embedded-view'] : ''}`}>
      {loading && <div className={styles['loading']}>Loading...</div>}
      {message && <div className={styles['message']}>{message}</div>}

      {/* Operation Tabs Navigation Bar (only show if operationMode was not set explicitly) */}
      {!operationMode && ops && ops.length > 1 && (
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
              <ListFilter size={16} /> View All Appointments
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
      )}


      {internalOperationMode === "Create Appointment" && (
        <div className={styles['form-container']}>
          <h3>Book Hospital Appointment</h3>
          {createdAppointment ? (
            <div className={styles['appointment-details-form']}>
              <label>Appointment Code:</label>
              <input type="text" value={createdAppointment.appointmentCode || `APP-${createdAppointment.appointmentId}`} disabled />
              <label>Token Number:</label>
              <input type="text" value={`#${createdAppointment.tokenNumber}`} disabled />
              <label>Patient Name:</label>
              <input type="text" value={createdAppointment.patientName} disabled />
              <label>Doctor Name:</label>
              <input type="text" value={createdAppointment.doctorName} disabled />
              <label>Appointment Date:</label>
              <input type="text" value={createdAppointment.appointmentDate} disabled />
              <label>Shift:</label>
              <input type="text" value={createdAppointment.shift || createdAppointment.timeSlot} disabled />
              <label>Emergency Status:</label>
              <input type="text" value={createdAppointment.isEmergency || createdAppointment.emergency ? "YES (EMERGENCY)" : "NO (REGULAR)"} disabled />
              <label>Payment Status:</label>
              <input
                type="text"
                value={(createdAppointment.isPaid || createdAppointment.is_paid || createdAppointment.paid) ? "Paid" : "Unpaid"}
                className={(createdAppointment.isPaid || createdAppointment.is_paid || createdAppointment.paid) ? styles['status-paid-input'] : styles['status-unpaid-input']}
                disabled
              />
              <div className={styles['action-buttons']}>
                <button onClick={resetForm} disabled={loading}>Book Another Appointment</button>
                {(user?.role === "patient" || user?.role === "admin") && !(createdAppointment.isPaid || createdAppointment.is_paid || createdAppointment.paid) && (
                  <button
                    onClick={() => {
                      const amount = getAppointmentCharge(createdAppointment);
                      setSelectedAppointment({ appointmentId: createdAppointment.appointmentId, amount });
                      setShowPaymentModal(true);
                    }}
                    className={styles['pay-btn']}
                    disabled={loading}
                  >
                    Pay Now
                  </button>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
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

              <div>
                <label>Department *</label>
                <select
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">-- Choose Department --</option>
                  {departments.map(d => (
                    <option key={d.departmentId} value={d.departmentId}>
                      {d.departmentName}
                    </option>
                  ))}
                </select>
                {departments.length === 0 && formData.branchId && (
                  <span style={{ fontSize: "0.8rem", color: "#e74c3c" }}>
                    No departments available in this branch.
                  </span>
                )}
              </div>

              <div>
                <label>Sub-Specialty Division *</label>
                <select
                  name="subDeptId"
                  value={formData.subDeptId}
                  onChange={handleInputChange}
                  required
                  disabled={!formData.departmentId}
                >
                  <option value="">-- Choose Sub-Specialty Division --</option>
                  {subDepartments.map(sd => (
                    <option key={sd.subDeptId} value={sd.subDeptId}>
                      {sd.subDeptName}
                    </option>
                  ))}
                </select>
                {formData.departmentId && subDepartments.length === 0 && (
                  <span style={{ fontSize: "0.8rem", color: "#e67e22" }}>
                    No sub-divisions added for this department yet.
                  </span>
                )}
              </div>

              <div>
                <label>Doctor Preference</label>
                <select
                  name="preferredDoctorCode"
                  value={formData.preferredDoctorCode}
                  onChange={handleInputChange}
                  disabled={!formData.subDeptId && !formData.departmentId}
                >
                  <option value="">⚡ Any Available Specialist (Smart Auto-Assign)</option>
                  {doctorsList.map(doc => (
                    <option key={doc.doctorId} value={doc.doctorCode}>
                      {doc.doctorName} ({doc.specialization} - {doc.doctorCode})
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: "0.8rem", color: "#7f8c8d", display: "block", marginTop: "2px" }}>
                  {formData.preferredDoctorCode 
                    ? "⚠️ Preferred doctor selected: If doctor is unavailable or on leave, booking will throw error."
                    : "✨ Auto-Assign: Algorithm will automatically balance load to least busy doctor."}
                </span>
              </div>

              <div>
                <label>Patient ID *</label>
                <input
                  type="number"
                  name="patientId"
                  value={formData.patientId}
                  onChange={handleInputChange}
                  min="1"
                  required
                  placeholder="Enter Patient ID"
                />
              </div>

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
                  <option value="MORNING">Morning Shift (09:00 AM - 01:00 PM)</option>
                  <option value="EVENING">Evening Shift (04:00 PM - 08:00 PM)</option>
                </select>
              </div>

              <div>
                <label>Emergency Priority *</label>
                <select
                  name="isEmergency"
                  value={formData.isEmergency.toString()}
                  onChange={handleInputChange}
                  required
                >
                  <option value="false">No (Regular Appointment)</option>
                  <option value="true">Yes (Emergency)</option>
                </select>
              </div>

              {formData.isEmergency && (
                <div>
                  <label>Emergency Severity *</label>
                  <select
                    name="emergencySeverity"
                    value={formData.emergencySeverity}
                    onChange={handleInputChange}
                  >
                    <option value="URGENT">URGENT (Wrap up current patient in 5 mins)</option>
                    <option value="CRITICAL">CRITICAL (Stop current consultation immediately)</option>
                  </select>
                </div>
              )}

              <button type="submit" disabled={loading}>
                {loading ? "Processing Booking..." : "Book Appointment"}
              </button>
            </form>
          )}
        </div>
      )}

      {internalOperationMode === "View Appointment by ID" && (
        <div className={styles['form-container']}>
          <div className={styles['input-section']}>
            <h3>View Appointment by Code / ID</h3>
            <label>Appointment Code / ID:</label>
            <input
              type="text"
              placeholder="e.g. APP-10023 or 101"
              value={viewAppointmentId}
              onChange={(e) => setViewAppointmentId(e.target.value)}
            />
            <button onClick={fetchAppointmentById} disabled={loading}>Fetch</button>
          </div>
          {appointments.length > 0 && (
            <div className={styles['results-section']}>
              <AppointmentTable
                appointments={appointments}
                user={user}
                getAppointmentCharge={getAppointmentCharge}
                onPay={handlePay}
                prescribedAppointmentCodes={prescribedAppointmentCodes}
              />
            </div>
          )}
        </div>
      )}

      {internalOperationMode === "View All Appointments" && (
        <div className={styles['all-appointments-container']}>
          <h3>All Appointments</h3>
          
          {(user?.role === 'admin' || user?.role === 'receptionist') && (
            <div className={styles['advanced-search-container']}>
              <button 
                className={styles['toggle-search-btn']}
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              >
                🔍 Search Past Data
              </button>
              
              {showAdvancedSearch && (
                <div className={styles['search-panel']}>
                  <div className={styles['search-group']}>
                    <label>Appointment Code:</label>
                    <input type="text" placeholder="e.g. APP-10023 or 101" value={searchAppointmentId} onChange={(e) => setSearchAppointmentId(e.target.value)} />
                  </div>
                  <div className={styles['search-group']}>
                    <label>Start Date:</label>
                    <input type="date" value={searchStartDate} onChange={(e) => setSearchStartDate(e.target.value)} />
                  </div>
                  <div className={styles['search-group']}>
                    <label>End Date:</label>
                    <input type="date" value={searchEndDate} onChange={(e) => setSearchEndDate(e.target.value)} />
                  </div>
                  <div className={styles['search-group']}>
                    <label>Patient UHID / ID:</label>
                    <input type="text" placeholder="e.g. UHID-2026-001 or 1" value={searchPatientId} onChange={(e) => setSearchPatientId(e.target.value)} />
                  </div>
                  <button onClick={() => { setCurrentPage(0); fetchAllAppointments(0); }}>Search</button>
                </div>
              )}
            </div>
          )}

          {appointments.length > 0 ? (
            <>
              <AppointmentTable
                appointments={appointments}
                user={user}
                getAppointmentCharge={getAppointmentCharge}
                onPay={handlePay}
                prescribedAppointmentCodes={prescribedAppointmentCodes}
              />
              <div className={styles['pagination-controls']}>
                <button 
                  disabled={currentPage === 0} 
                  onClick={() => {
                    const newPage = currentPage - 1;
                    setCurrentPage(newPage);
                    fetchAllAppointments(newPage);
                  }}
                >
                  Previous
                </button>
                <span>Page {currentPage + 1} of {totalPages}</span>
                <button 
                  disabled={currentPage >= totalPages - 1} 
                  onClick={() => {
                    const newPage = currentPage + 1;
                    setCurrentPage(newPage);
                    fetchAllAppointments(newPage);
                  }}
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
              fetchAllAppointments();
            }
          }}
        />
      )}
    </div>
  );
};

export default AppointmentManagement;