import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/api";
import { Stethoscope, UserPlus, Search, Edit3, Trash2, ArrowLeft } from "lucide-react";
import { showToast } from "../components/ToastPopup";
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
  departments,
  subDepartments,
  onDeptChange,
  compDoctor,
  setCompDoctor,
  compForm,
  setCompForm,
  onOpenCompensation,
  onSaveCompensation,
}) => {
  return (
    <div className={styles['right-panel']}>
      {loading && <p className={styles['loading-message']}>Loading...</p>}

      {operationMode && operationMode !== "viewAll" && (
        <div className={styles['operation-content']}>
          <div className={styles.headerRow}>
            <div>
              <h2 className={styles.headerTitle}>
                {operationMode === "create" && createdDoctor ? "Created Doctor Details" :
                  operationMode === "create" ? "Add Doctor Profile" :
                    operationMode === "update" && createdDoctor ? "Updated Doctor Details" :
                      operationMode === "update" ? "Update Doctor Profile" :
                        operationMode === "delete" ? "Delete Doctor Record" : "Doctor Profile Details"}
              </h2>
              <div className={styles.headerSubtitle}>
                {operationMode === "create" ? "Onboard a new medical doctor with specialization and department" :
                  operationMode === "update" ? "Modify physician credentials, department, and contact information" :
                    operationMode === "getById" ? "Lookup physician profile by unique Doctor Code or ID" :
                      operationMode === "delete" ? "Remove physician profile from the active medical registry" :
                        "Physician information and credentials"}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className={styles.formContainer}>
            {(operationMode === "getById" || operationMode === "delete") && (
              <div className={`${styles.inputRow} ${styles.alignEnd}`}>
                <div className={styles.inputGroup}>
                  <label>Doctor Code / ID</label>
                  <input 
                    type="text" 
                    placeholder="Enter Doctor Code / ID (e.g. DOC-101 or 101)" 
                    value={doctorId || ""} 
                    onChange={(e) => setDoctorId(e.target.value)} 
                    required 
                    disabled={loading} 
                  />
                </div>
                <button 
                  type="button" 
                  className={`${styles.submitBtn} ${styles.btnNoMargin}`} 
                  onClick={operationMode === "getById" ? fetchDoctor : handleDeleteDoctor} 
                  disabled={loading}
                >
                  {loading ? (operationMode === "getById" ? "Fetching..." : "Deleting...") : (operationMode === "getById" ? "Fetch Doctor" : "Delete Doctor")}
                </button>
              </div>
            )}

            {operationMode === "update" && !doctorFetched && !createdDoctor && (
              <div className={`${styles.inputRow} ${styles.alignEnd}`}>
                <div className={styles.inputGroup}>
                  <label>Doctor Code / ID</label>
                  <input 
                    type="text" 
                    placeholder="Enter Doctor Code / ID (e.g. DOC-101 or 101)" 
                    value={doctorId || ""} 
                    onChange={(e) => setDoctorId(e.target.value)} 
                    required 
                    disabled={loading} 
                  />
                </div>
                <button type="button" className={`${styles.submitBtn} ${styles.btnNoMargin}`} onClick={fetchDoctor} disabled={loading}>
                  Fetch Doctor for Update
                </button>
              </div>
            )}

            {doctorFetched && operationMode === "getById" && (
              <>
                <div className={styles.inputRow}>
                  <div className={styles.inputGroup}>
                    <label>Doctor ID</label>
                    <input type="text" value={doctorId || ""} disabled />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Doctor Full Name</label>
                    <input type="text" value={formData.doctorName} disabled />
                  </div>
                </div>
                <div className={styles.inputRow}>
                  <div className={styles.inputGroup}>
                    <label>Specialization</label>
                    <input type="text" value={formData.specialization} disabled />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Contact Number</label>
                    <input type="text" value={formData.contact} disabled />
                  </div>
                </div>
                <div className={styles.inputRow}>
                  <div className={styles.inputGroup}>
                    <label>Years of Experience</label>
                    <input type="number" value={formData.yoe} disabled />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Department</label>
                    <input type="text" value={formData.departmentName || "N/A"} disabled />
                  </div>
                </div>
              </>
            )}

            {(operationMode === "create" || operationMode === "update") && (
              <>
                {createdDoctor ? (
                  <div className={styles['created-doctor-card']}>
                    <h3>Doctor Profile Saved</h3>
                    <div className={styles.profileSummaryGrid}>
                      <div><strong>Doctor ID:</strong> #{createdDoctor.doctorId}</div>
                      <div><strong>Doctor Code:</strong> {createdDoctor.doctorCode || "N/A"}</div>
                      <div><strong>Name:</strong> {createdDoctor.doctorName}</div>
                      <div><strong>Specialization:</strong> {createdDoctor.specialization}</div>
                      <div><strong>Contact:</strong> {createdDoctor.contact}</div>
                      <div><strong>Experience:</strong> {createdDoctor.yoe} years</div>
                    </div>
                  </div>
                ) : (
                  <>
                    {operationMode === "update" && (
                      <div className={styles.inputRow}>
                        <div className={styles.inputGroup}>
                          <label>Doctor ID</label>
                          <input type="text" value={doctorId || ""} disabled />
                        </div>
                      </div>
                    )}
                    <div className={styles.inputRow}>
                      <div className={styles.inputGroup}>
                        <label>Doctor Full Name</label>
                        <input type="text" name="doctorName" placeholder="Dr. John Smith" value={formData.doctorName} onChange={handleInputChange} required disabled={loading} />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>Specialization</label>
                        <input type="text" name="specialization" placeholder="e.g. Interventional Cardiology" value={formData.specialization} onChange={handleInputChange} required disabled={loading} />
                      </div>
                    </div>
                    <div className={styles.inputRow}>
                      <div className={styles.inputGroup}>
                        <label>Department</label>
                        <select
                          name="deptId"
                          value={formData.deptId || ""}
                          onChange={(e) => {
                            handleInputChange(e);
                            onDeptChange(e.target.value);
                          }}
                          disabled={loading}
                          required
                          style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                        >
                          <option value="">-- Select Department --</option>
                          {departments.map((d) => (
                            <option key={d.departmentId} value={d.departmentId}>
                              {d.departmentName} (ID: #{d.departmentId})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={styles.inputGroup}>
                        <label>Sub-Department Division</label>
                        <select
                          name="subDeptId"
                          value={formData.subDeptId || ""}
                          onChange={handleInputChange}
                          disabled={loading || !formData.deptId}
                          required
                          style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                        >
                          <option value="">-- Select Sub-Division --</option>
                          {subDepartments.map((sd) => (
                            <option key={sd.subDeptId} value={sd.subDeptId}>
                              {sd.subDeptName} (ID: #{sd.subDeptId})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className={styles.inputRow}>
                      <div className={styles.inputGroup}>
                        <label>Contact Number</label>
                        <input type="text" name="contact" placeholder="10-digit Phone Number" value={formData.contact} onChange={handleInputChange} required pattern="\\d{10}" disabled={loading} />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>Years of Experience</label>
                        <input type="number" name="yoe" placeholder="e.g. 12" value={formData.yoe} onChange={handleInputChange} required min="0" disabled={loading} />
                      </div>
                    </div>

                    {operationMode === "create" && (
                      <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                        <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.98rem', color: '#0f172a' }}>Compensation Contract</h4>
                        <div className={styles.inputRow}>
                          <div className={styles.inputGroup}>
                            <label>Compensation Type</label>
                            <select
                              value={compForm.compensationType}
                              onChange={e => setCompForm({ ...compForm, compensationType: e.target.value })}
                              disabled={loading}
                            >
                              <option value="COMMISSION">COMMISSION (Per-Consultation)</option>
                              <option value="FIXED">FIXED (Monthly Salary)</option>
                              <option value="HYBRID">HYBRID (Base Salary + Share)</option>
                            </select>
                          </div>

                          {(compForm.compensationType === "FIXED" || compForm.compensationType === "HYBRID") && (
                            <div className={styles.inputGroup}>
                              <label>Base Salary (₹)</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="e.g. 150000"
                                value={compForm.baseSalary}
                                onChange={e => setCompForm({ ...compForm, baseSalary: e.target.value })}
                                required
                                disabled={loading}
                              />
                            </div>
                          )}

                          {(compForm.compensationType === "COMMISSION" || compForm.compensationType === "HYBRID") && (
                            <>
                              <div className={styles.inputGroup}>
                                <label>Consultation Fee (₹)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="e.g. 500"
                                  value={compForm.consultationFee}
                                  onChange={e => setCompForm({ ...compForm, consultationFee: e.target.value })}
                                  required
                                  disabled={loading}
                                />
                              </div>
                              <div className={styles.inputGroup}>
                                <label>Doctor Share (%)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max="100"
                                  placeholder="e.g. 70"
                                  value={compForm.consultationSharePercent}
                                  onChange={e => setCompForm({ ...compForm, consultationSharePercent: e.target.value })}
                                  required
                                  disabled={loading}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    <div className={styles['doctor-action-buttons']}>
                      <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? (operationMode === "create" ? "Creating..." : "Updating...") : (operationMode === "create" ? "Create Doctor Profile" : "Update Doctor Profile")}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </form>
        </div>
      )}

      {operationMode === "viewAll" && viewAllMode && (
        <div className={styles['all-doctors-container']}>
          <div className={styles.headerRow}>
            <div>
              <h2 className={styles.headerTitle}>All Medical Doctors</h2>
              <div className={styles.headerSubtitle}>Active physician roster and sub-department specializations</div>
            </div>
          </div>
          {allDoctors.length > 0 ? (
            <>
              <table className={styles['doctors-table']}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Code</th>
                    <th>Doctor Name</th>
                    <th>Specialization</th>
                    <th>Contact</th>
                    <th>Experience</th>
                    <th>Sub-Dept ID</th>
                  </tr>
                </thead>
                <tbody>
                  {allDoctors.map((doctor) => (
                    <tr key={doctor.doctorId}>
                      <td className={styles.idCell}>#{doctor.doctorId}</td>
                      <td>{doctor.doctorCode || "N/A"}</td>
                      <td className={styles.nameCell}>{doctor.doctorName}</td>
                      <td>{doctor.specialization}</td>
                      <td>{doctor.contact}</td>
                      <td>{doctor.yoe} yrs</td>
                      <td>
                        <span className={styles.deptBadge}>
                          {doctor.subDeptId ? `Sub-Dept #${doctor.subDeptId}` : "General"}
                        </span>
                      </td>
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
            <p className={styles.emptyMessage}>No doctors available in directory.</p>
          )}
        </div>
      )}

      {message && <p className={styles['status-message']}>{message}</p>}
    </div>
  );
});

// DoctorPage component (Cleaned to contain ONLY Doctor operations)
const DoctorPage = ({ initialOperation, showHeaders = false }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [operationMode, setOperationMode] = useState(initialOperation || searchParams.get("op") || null);
  const [doctorId, setDoctorId] = useState(null);
  const [formData, setFormData] = useState({
    doctorName: "",
    specialization: "",
    contact: "",
    yoe: "",
    deptId: "",
    subDeptId: "",
  });
  const [departments, setDepartments] = useState([]);
  const [subDepartments, setSubDepartments] = useState([]);
  const [createdDoctor, setCreatedDoctor] = useState(null);
  const [doctorFetched, setDoctorFetched] = useState(false);
  const [message, setMessageState] = useState("");
  const setMessage = useCallback((m) => {
    setMessageState(m);
    if (m) showToast(m, (m.toLowerCase().includes("error") || m.toLowerCase().includes("failed") || m.toLowerCase().includes("not found")) ? "error" : "success");
  }, []);
  const [loading, setLoading] = useState(false);
  const [compDoctor, setCompDoctor] = useState(null);
  const [compForm, setCompForm] = useState({
    compensationType: "COMMISSION",
    baseSalary: "0",
    consultationFee: "500",
    consultationSharePercent: "70",
    active: true,
  });

  const onOpenCompensation = useCallback(async (doctor) => {
    setCompDoctor(doctor);
    setMessage("");
    try {
      const res = await api.get(`/doctors/${doctor.doctorId}/compensation`);
      if (res.data) {
        setCompForm({
          compensationType: res.data.compensationType || "COMMISSION",
          baseSalary: String(res.data.baseSalary ?? 0),
          consultationFee: String(res.data.consultationFee ?? 500),
          consultationSharePercent: String(res.data.consultationSharePercent ?? 70),
          active: res.data.active !== false,
        });
      }
    } catch { /* No existing contract yet */ }
  }, []);

  const onSaveCompensation = useCallback(async (e) => {
    e.preventDefault();
    if (!compDoctor) return;
    setLoading(true);
    try {
      await api.post(`/doctors/${compDoctor.doctorId}/compensation`, {
        compensationType: compForm.compensationType,
        baseSalary: parseFloat(compForm.baseSalary || "0"),
        consultationFee: parseFloat(compForm.consultationFee || "500"),
        consultationSharePercent: parseFloat(compForm.consultationSharePercent || "70"),
        active: compForm.active,
      });
      setMessage(`Compensation contract saved for ${compDoctor.doctorName}.`);
      setCompDoctor(null);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to save compensation contract.");
    } finally {
      setLoading(false);
    }
  }, [compDoctor, compForm]);

  // Pagination and View All Doctors State
  const [allDoctors, setAllDoctors] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy] = useState("doctorId");
  const [viewAllMode, setViewAllMode] = useState(true);

  const userRole = localStorage.getItem("role") || "ADMIN";
  const isAdminRole = ["admin", "super-admin", "ADMIN", "SUPER_ADMIN"].includes(userRole);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await api.get("/api/departments");
      if (response.status === 200) {
        setDepartments(response.data || []);
      }
    } catch (e) {
      console.error("Failed to fetch departments", e);
    }
  }, []);

  const handleDeptChange = useCallback(async (deptId) => {
    if (!deptId) {
      setSubDepartments([]);
      return;
    }
    try {
      const response = await api.get(`/admin/sub-departments/department/${deptId}`);
      if (response.status === 200) {
        setSubDepartments(response.data || []);
      }
    } catch (e) {
      console.error("Failed to fetch sub-departments", e);
      setSubDepartments([]);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const fetchAllDoctors = useCallback(async (page = 0) => {
    setLoading(true);
    try {
      const endpoint = isAdminRole ? "/doctors/admin/all" : "/doctors/getAllDoctors";
      const response = await api.get(endpoint, {
        params: { page, size: pageSize, sortBy },
      });
      if (response.status === 200 && response.data) {
        const content = response.data.content || response.data;
        setAllDoctors(Array.isArray(content) ? content : []);
        setTotalPages(response.data.totalPages || 1);
        setCurrentPage(response.data.number || page);
        setViewAllMode(true);
      }
    } catch (error) {
      setMessage("Error fetching all doctors.");
    } finally {
      setLoading(false);
    }
  }, [pageSize, sortBy, isAdminRole]);

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 0) fetchAllDoctors(currentPage - 1);
  }, [currentPage, fetchAllDoctors]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages - 1) fetchAllDoctors(currentPage + 1);
  }, [currentPage, totalPages, fetchAllDoctors]);

  const resetForm = useCallback(() => {
    setFormData({ doctorName: "", specialization: "", contact: "", yoe: "", deptId: "", subDeptId: "" });
    setDoctorId(null);
    setCreatedDoctor(null);
    setMessage("");
    setDoctorFetched(false);
    setLoading(false);
  }, []);

  const handleOperation = useCallback((mode) => {
    setMessage("");
    setOperationMode(mode);
    if (mode) {
      setSearchParams({ op: mode });
    } else {
      setSearchParams({});
    }
    resetForm();
    if (mode === "viewAll") {
      setViewAllMode(true);
      fetchAllDoctors(0);
    } else {
      setViewAllMode(false);
    }
  }, [resetForm, fetchAllDoctors, setSearchParams]);

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
          deptId: response.data.deptId || "",
          subDeptId: response.data.subDeptId || "",
          departmentName: response.data.departmentName || "",
        });
        if (response.data.deptId) {
          handleDeptChange(response.data.deptId);
        }
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
  }, [doctorId, handleDeptChange]);

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
      const payload = {
        ...formData,
        deptId: formData.deptId ? Number(formData.deptId) : null,
        subDeptId: formData.subDeptId ? Number(formData.subDeptId) : null,
        yoe: Number(formData.yoe),
      };
      let response;
      if (operationMode === "update" && doctorId) {
        response = await api.put(`/doctors/updateDoctor/${doctorId}`, payload);
        setMessage("Doctor updated successfully");
        setCreatedDoctor(response.data);
        setDoctorFetched(false);
      } else if (operationMode === "create") {
        response = await api.post("/doctors/addDoctor", payload);
        const newDocId = response.data.doctorId;
        setDoctorId(newDocId);
        try {
          const isFixed = compForm.compensationType === "FIXED";
          const isComm = compForm.compensationType === "COMMISSION";
          await api.post(`/doctors/${newDocId}/compensation`, {
            compensationType: compForm.compensationType,
            baseSalary: isComm ? 0 : parseFloat(compForm.baseSalary || "0"),
            consultationFee: isFixed ? 0 : parseFloat(compForm.consultationFee || "500"),
            consultationSharePercent: isFixed ? 0 : parseFloat(compForm.consultationSharePercent || "70"),
            active: true,
          });
          setMessage(`Doctor & compensation contract created (ID: ${newDocId})`);
        } catch {
          setMessage(`Doctor created (ID: ${newDocId}), but compensation contract failed to save.`);
        }
        setCreatedDoctor(response.data);
      }
    } catch (error) {
      setMessage("Error processing request.");
    } finally {
      setLoading(false);
    }
  }, [operationMode, doctorId, formData, userRole, compForm]);

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

  useEffect(() => {
    setMessage("");
  }, [operationMode]);

  useEffect(() => {
    const op = initialOperation || null;
    setOperationMode(op);
    if (op === "viewAll") {
      setViewAllMode(true);
      fetchAllDoctors(0);
    } else {
      setViewAllMode(false);
    }
  }, [initialOperation, fetchAllDoctors]);

  return (
    <div className={`${styles['doctor-container']} ${!showHeaders ? styles['admin-view'] : ''}`}>
      {showHeaders && (
        <>
          <h1>WELCOME TO THE HOSPITAL MANAGEMENT SYSTEM</h1>
          <h2>DOCTOR ROSTER</h2>
        </>
      )}

      {/* HUB VIEW: Doctor-Only Operations Cards when no operation is selected */}
      {!operationMode && (
        <div className={styles.hubWrapper}>
          <div className={styles.hubHeader}>
            <h2 className={styles.hubTitle}>Doctor Roster Management</h2>
            <p className={styles.hubSubtitle}>
              Select an operation below to open its dedicated page
            </p>
          </div>

          <div className={styles.operationCardsGrid}>
            <div 
              className={styles.opCard}
              onClick={() => handleOperation('viewAll')}
            >
              <div className={styles.opCardIcon}>
                <Stethoscope size={22} />
              </div>
              <div className={styles.opCardInfo}>
                <h4>Physician Directory</h4>
                <p>View all active doctors and department assignments</p>
              </div>
              <span className={styles.opCardBadge}>{allDoctors.length > 0 ? `${allDoctors.length} Doctors` : 'Directory'}</span>
            </div>

            {isAdminRole && (
              <div 
                className={styles.opCard}
                onClick={() => handleOperation('create')}
              >
                <div className={styles.opCardIcon}>
                  <UserPlus size={22} />
                </div>
                <div className={styles.opCardInfo}>
                  <h4>Onboard Physician</h4>
                  <p>Register new physician credentials and specialization</p>
                </div>
                <span className={`${styles.opCardBadge} ${styles.badgeGreen}`}>+ Onboard</span>
              </div>
            )}

            <div 
              className={styles.opCard}
              onClick={() => handleOperation('getById')}
            >
              <div className={styles.opCardIcon}>
                <Search size={22} />
              </div>
              <div className={styles.opCardInfo}>
                <h4>Search Doctor ID</h4>
                <p>Lookup physician profile by Doctor ID or code</p>
              </div>
              <span className={`${styles.opCardBadge} ${styles.badgeBlue}`}>ID Lookup</span>
            </div>

            <div 
              className={styles.opCard}
              onClick={() => handleOperation('update')}
            >
              <div className={styles.opCardIcon}>
                <Edit3 size={22} />
              </div>
              <div className={styles.opCardInfo}>
                <h4>Update Profile</h4>
                <p>Update specialization, department, and contact info</p>
              </div>
              <span className={`${styles.opCardBadge} ${styles.badgeOrange}`}>Edit Profile</span>
            </div>

            {isAdminRole && (
              <div 
                className={styles.opCard}
                onClick={() => handleOperation('delete')}
              >
                <div className={styles.opCardIcon}>
                  <Trash2 size={22} />
                </div>
                <div className={styles.opCardInfo}>
                  <h4>Delete Doctor</h4>
                  <p>Remove physician record from the system</p>
                </div>
                <span className={`${styles.opCardBadge} ${styles.badgeRed}`}>Delete</span>
              </div>
            )}
          </div>
        </div>
      )}

      {operationMode && (
        <div className={styles.dedicatedView}>
          <div className={styles.backBar}>
            <button
              type="button"
              onClick={() => handleOperation(null)}
              className={styles.backButton}
            >
              <ArrowLeft size={16} className={styles.backIcon} />
              <span>Back to Doctor Roster</span>
            </button>
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
            departments={departments}
            subDepartments={subDepartments}
            onDeptChange={handleDeptChange}
            compDoctor={compDoctor}
            setCompDoctor={setCompDoctor}
            compForm={compForm}
            setCompForm={setCompForm}
            onOpenCompensation={onOpenCompensation}
            onSaveCompensation={onSaveCompensation}
          />
        </div>
      )}
    </div>
  );
};

export default DoctorPage;
