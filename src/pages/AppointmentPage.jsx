import React, { useState, useEffect } from "react";
import axios from "axios";
import api from "../api/api";
import styles from "./AppointmentPage.module.css";
import PaymentModal from "../component/PaymentModal";

const AppointmentManagement = ({ allowedOperations, doctorId, operationMode, user: propUser, isEmbedded = false }) => {
  const [formData, setFormData] = useState({
    patientId: propUser?.role === "patient" ? propUser.id : "",
    departmentId: "",
    appointmentDate: new Date().toISOString().split("T")[0],
    timeSlot: "",
    preferredDoctorId: "0",
    isEmergency: false,
    isPreferredDoctor: false,
  });
  const [viewAppointmentId, setViewAppointmentId] = useState("");
  const [doctorIdFilter, setDoctorIdFilter] = useState(doctorId || "");
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [appointmentCount, setAppointmentCount] = useState(0);
  const [createdAppointment, setCreatedAppointment] = useState(null);
  const [user] = useState(() => {
    if (propUser) return propUser;
    const role = localStorage.getItem("role");
    // Some pages use 'userId', some use 'id'. Check both.
    const id = localStorage.getItem("userId") || localStorage.getItem("id");
    return role ? { role, id } : null;
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Use the prop-based operationMode if provided, otherwise fall back to the first allowed operation
  const [internalOperationMode, setInternalOperationMode] = useState(
    operationMode || allowedOperations[0] || "View Appointment by ID"
  );

  // Reset state when operationMode prop changes to a different operation
  useEffect(() => {
    if (operationMode && allowedOperations.includes(operationMode) && operationMode !== internalOperationMode) {
      setInternalOperationMode(operationMode);
      setFormData({
        patientId: user?.role === "patient" ? user.id : "",
        departmentId: "",
        appointmentDate: new Date().toISOString().split("T")[0],
        timeSlot: "",
        preferredDoctorId: "0",
        isEmergency: false,
        isPreferredDoctor: false,
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

  // Role-based operations mapping
  const roleOperations = {
    patient: ["Create Appointment", "View Appointment by ID", "Reschedule Appointment", "Cancel Appointment"],
    doctor: [
      "View Appointment by ID",
      "Update Appointment",
      "Reschedule Appointment",
      "Cancel Appointment",
      "View Appointments by Doctor and Date",
      "Get Appointment Count by Doctor and Date",
    ],
    admin: [
      "Create Appointment",
      "View Appointment by ID",
      "View All Appointments",
      "Update Appointment",
      "Reschedule Appointment",
      "Cancel Appointment",
      "View Appointments by Doctor and Date",
      "Get Appointment Count by Doctor and Date",
    ],
  };

  // Set initial user-specific settings
  useEffect(() => {
    if (user?.role === "patient") {
      setFormData((prev) => ({ ...prev, patientId: user.id }));
    } else if (user?.role === "doctor") {
      setDoctorIdFilter(user.id);
    }
  }, [user]);

  // Clear message when operation mode changes internally
  useEffect(() => {
    setMessage("");
  }, [internalOperationMode]);

  // Fetch all appointments when viewing all (only for Admin)
  useEffect(() => {
    if (internalOperationMode === "View All Appointments" && allowedOperations.includes("View All Appointments")) {
      fetchAllAppointments();
    }
  }, [internalOperationMode, allowedOperations]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "isEmergency" || name === "isPreferredDoctor" ? value === "true" : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (internalOperationMode !== "Create Appointment") return;
    if (!formData.patientId || isNaN(Number(formData.patientId)) || Number(formData.patientId) < 1) {
      setMessage("Please enter a valid Patient ID greater than 0.");
      return;
    }
    if (!formData.departmentId || isNaN(Number(formData.departmentId)) || Number(formData.departmentId) < 1) {
      setMessage("Please enter a valid Department ID greater than 0.");
      return;
    }
    if (!formData.appointmentDate) {
      setMessage("Please select an appointment date.");
      return;
    }
    if (!formData.timeSlot) {
      setMessage("Please enter a time slot.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        patientId: Number(formData.patientId),
        departmentId: Number(formData.departmentId),
        appointmentDate: formData.appointmentDate,
        timeSlot: formData.timeSlot,
        preferredDoctorId: Number(formData.preferredDoctorId),
        isEmergency: formData.isEmergency,
        isPreferredDoctor: formData.isPreferredDoctor,
      };
      const response = await api.post(
        "/appointments/fixAppointment",
        payload
      );
      const newAppointment = response.data;
      setMessage(`Appointment created: ID ${newAppointment.appointmentId}`);
      if (user?.role === "patient" || user?.role === "admin") {
        setSelectedAppointment({
          appointmentId: newAppointment.appointmentId,
          amount: 500 // Default or fetched from backend if available
        });
        setShowPaymentModal(true);
      }
      setCreatedAppointment(newAppointment);
      setFormData({
        patientId: user?.role === "patient" ? user.id : "",
        departmentId: "",
        appointmentDate: new Date().toISOString().split("T")[0],
        timeSlot: "",
        preferredDoctorId: "0",
        isEmergency: false,
        isPreferredDoctor: false,
      });
      if (allowedOperations.includes("View All Appointments")) fetchAllAppointments();
    } catch (error) {
      const errMsg = axios.isAxiosError(error) ? error.response?.data?.message || error.message : "Unknown error";
      setMessage(`Error creating appointment: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCreatedAppointment(null);
    setFormData({
      patientId: user?.role === "patient" ? user.id : "",
      departmentId: "",
      appointmentDate: new Date().toISOString().split("T")[0],
      timeSlot: "",
      preferredDoctorId: "0",
      isEmergency: false,
      isPreferredDoctor: false,
      appointmentId: "",
      newAppointmentDate: "",
      newTimeSlot: "",
    });
  };

  const fetchAppointmentById = async () => {
    if (internalOperationMode !== "View Appointment by ID") return;
    if (!viewAppointmentId || isNaN(Number(viewAppointmentId))) {
      setMessage("Please enter a valid Appointment ID.");
      return;
    }
    setLoading(true);
    try {
      const response = await api.get(
        `/appointments/${viewAppointmentId}`
      );
      setAppointments([response.data]);
      setMessage(`Appointment ID ${viewAppointmentId} fetched.`);
    } catch (error) {
      setMessage("Error fetching appointment.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllAppointments = async () => {
    if (internalOperationMode !== "View All Appointments") return;
    setLoading(true);
    try {
      const response = await api.get(
        "/appointments/ViewAllAppointments"
      );
      setAppointments(response.data);
      setMessage("All appointments fetched.");
    } catch (error) {
      setMessage("Error fetching appointments.");
    } finally {
      setLoading(false);
    }
  };

  const updateAppointment = async (e) => {
    if (internalOperationMode !== "Update Appointment") return;
    e.preventDefault();
    if (!formData.appointmentId || isNaN(Number(formData.appointmentId))) {
      setMessage("Please enter a valid Appointment ID.");
      return;
    }
    if (!formData.patientId || isNaN(Number(formData.patientId)) || Number(formData.patientId) < 1) {
      setMessage("Please enter a valid Patient ID greater than 0.");
      return;
    }
    if (!formData.departmentId || isNaN(Number(formData.departmentId)) || Number(formData.departmentId) < 1) {
      setMessage("Please enter a valid Department ID greater than 0.");
      return;
    }
    if (!formData.appointmentDate) {
      setMessage("Please select an appointment date.");
      return;
    }
    if (!formData.timeSlot) {
      setMessage("Please enter a time slot.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        patientId: Number(formData.patientId),
        departmentId: Number(formData.departmentId),
        appointmentDate: formData.appointmentDate,
        timeSlot: formData.timeSlot,
        preferredDoctorId: Number(formData.preferredDoctorId),
        isEmergency: formData.isEmergency,
      };
      const response = await api.put(
        `/appointments/${formData.appointmentId}`,
        payload
      );
      setMessage(`Appointment ID ${formData.appointmentId} updated.`);
      setFormData({
        patientId: user?.role === "patient" ? user.id : "",
        departmentId: "",
        appointmentDate: new Date().toISOString().split("T")[0],
        timeSlot: "",
        preferredDoctorId: "0",
        isEmergency: false,
        isPreferredDoctor: false,
        appointmentId: "",
      });
      if (allowedOperations.includes("View All Appointments")) fetchAllAppointments();
    } catch (error) {
      setMessage("Error updating appointment.");
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
    if (!formData.newTimeSlot) {
      setMessage("Please enter a new time slot.");
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
            newTimeSlot: formData.newTimeSlot,
          }
        }
      );
      setMessage(`Appointment ID ${formData.appointmentId} rescheduled.`);
      // Keep form state to retain the form in the UI
      setFormData({
        ...formData,
        newAppointmentDate: new Date().toISOString().split("T")[0], // Reset only date and time
        newTimeSlot: "",
      });
      if (allowedOperations.includes("View All Appointments")) fetchAllAppointments();
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
      if (allowedOperations.includes("View All Appointments")) fetchAllAppointments();
    } catch (error) {
      setMessage("Error canceling appointment.");
    } finally {
      setLoading(false);
    }
  };

  const deleteAllAppointments = async () => {
    if (internalOperationMode !== "Delete All Appointments") return;
    setLoading(true);
    try {
      await api.delete("/appointments/deleteAll");
      setMessage("All appointments deleted.");
      setAppointments([]);
    } catch (error) {
      setMessage("Error deleting all appointments.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointmentsByDoctorAndDate = async () => {
    if (internalOperationMode !== "View Appointments by Doctor and Date") return;
    if (!doctorIdFilter || isNaN(Number(doctorIdFilter))) {
      setMessage("Please enter a valid Doctor ID.");
      return;
    }
    if (!dateFilter) {
      setMessage("Please select a date.");
      return;
    }
    setLoading(true);
    try {
      const response = await api.get(
        `/appointments/doctor/${doctorIdFilter}/date/${dateFilter}`
      );
      setAppointments(response.data);
      setMessage(`Appointments for Doctor ID ${doctorIdFilter} on ${dateFilter} fetched.`);
    } catch (error) {
      setMessage("Error fetching appointments.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointmentCountByDoctorAndDate = async () => {
    if (internalOperationMode !== "Get Appointment Count by Doctor and Date") return;
    if (!doctorIdFilter || isNaN(Number(doctorIdFilter))) {
      setMessage("Please enter a valid Doctor ID.");
      return;
    }
    if (!dateFilter) {
      setMessage("Please select a date.");
      return;
    }
    setLoading(true);
    try {
      const response = await api.get(
        `/appointments/doctor/${doctorIdFilter}/count/date/${dateFilter}`
      );
      setAppointmentCount(response.data);
      setMessage(`Appointment count for Doctor ID ${doctorIdFilter} on ${dateFilter}: ${response.data}`);
    } catch (error) {
      setMessage("Error fetching appointment count.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setMessage("Payment successful! Updating appointment list...");
    if (internalOperationMode === "View All Appointments") fetchAllAppointments();
    else if (internalOperationMode === "View Appointment by ID" && viewAppointmentId) fetchAppointmentById();
    else if (internalOperationMode === "View Appointments by Doctor and Date") fetchAppointmentsByDoctorAndDate();
  };

  return (
    <div className={`${styles['appointment-management']} ${isEmbedded ? styles['embedded-view'] : ''}`}>
      {loading && <div className={styles['loading']}>Loading...</div>}
      {message && <div className={styles['message']}>{message}</div>}

      {internalOperationMode === "Create Appointment" && (
        <div className={styles['form-container']}>
          <h3>Create Appointment</h3>
          {createdAppointment ? (
            <div className={styles['appointment-details-form']}>
              <label>Appointment ID:</label>
              <input type="text" value={createdAppointment.appointmentId} disabled />
              <label>Patient ID:</label>
              <input type="text" value={createdAppointment.patientId} disabled />
              <label>Patient Name:</label>
              <input type="text" value={createdAppointment.patientName} disabled />
              <label>Disease:</label>
              <input type="text" value={createdAppointment.disease} disabled />
              <label>Doctor ID:</label>
              <input type="text" value={createdAppointment.doctorId} disabled />
              <label>Doctor Name:</label>
              <input type="text" value={createdAppointment.doctorName} disabled />
              <label>Appointment Date:</label>
              <input type="text" value={createdAppointment.appointmentDate} disabled />
              <label>Time Slot:</label>
              <input type="text" value={createdAppointment.timeSlot} disabled />
              <label>Emergency:</label>
              <input type="text" value={createdAppointment.isEmergency ? "Yes" : "No"} disabled />
              <label>Payment Status:</label>
              <input
                type="text"
                value={createdAppointment.isPaid ? "Paid" : "Unpaid"}
                className={createdAppointment.isPaid ? styles['status-paid-input'] : styles['status-unpaid-input']}
                disabled
              />
              {/* <label>Preferred Doctor:</label> */}
              {/* <input type="text" value={createdAppointment.isPreferredDoctor ? "Yes" : "No"} disabled /> */}
              <div className={styles['action-buttons']}>
                <button onClick={resetForm} disabled={loading}>Create New Appointment</button>
                {(user?.role === "patient" || user?.role === "admin") && !createdAppointment.isPaid && (
                  <button
                    onClick={() => {
                      setSelectedAppointment({ appointmentId: createdAppointment.appointmentId, amount: 500 });
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
              <label>Patient ID:</label>
              <input
                type="number"
                name="patientId"
                value={formData.patientId}
                onChange={handleInputChange}
                min="1"
                required
              />
              <label>Department ID:</label>
              <input
                type="number"
                name="departmentId"
                value={formData.departmentId}
                onChange={handleInputChange}
                min="1"
                required
              />
              <label>Appointment Date:</label>
              <input
                type="date"
                name="appointmentDate"
                value={formData.appointmentDate}
                onChange={handleInputChange}
                min={new Date().toISOString().split("T")[0]}
                required
              />
              <label>Time Slot:</label>
              <input
                type="time"
                name="timeSlot"
                value={formData.timeSlot}
                onChange={handleInputChange}
                required
              />
              <label>Preferred Doctor ID:</label>
              <input
                type="number"
                name="preferredDoctorId"
                value={formData.preferredDoctorId}
                onChange={handleInputChange}
                min="0"
              />
              <label>Emergency:</label>
              <select
                name="isEmergency"
                value={formData.isEmergency.toString()}
                onChange={handleInputChange}
                required
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
              <label>Preferred Doctor:</label>
              <select
                name="isPreferredDoctor"
                value={formData.isPreferredDoctor.toString()}
                onChange={handleInputChange}
                required
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
              <button type="submit" disabled={loading}>Create</button>
            </form>
          )}
        </div>
      )}

      {internalOperationMode === "View Appointment by ID" && (
        <div className={styles['form-container']}>
          <div className={styles['input-section']}>
            <h3>View Appointment by ID</h3>
            <label>Appointment ID:</label>
            <input
              type="number"
              value={viewAppointmentId}
              onChange={(e) => setViewAppointmentId(e.target.value)}
            />
            <button onClick={fetchAppointmentById} disabled={loading}>Fetch</button>
          </div>
          {appointments.length > 0 && (
            <div className={styles['results-section']}>
              <table className={styles['appointments-table']}>
                <thead>
                  <tr>
                    <th>Appointment ID</th>
                    <th>Patient ID</th>
                    <th>Patient Name</th>
                    <th>Disease</th>
                    <th>Doctor ID</th>
                    <th>Doctor Name</th>
                    <th>Date</th>
                    <th>Time Slot</th>
                    <th>Emergency</th>
                    {/* <th>Preferred Doctor</th> */}
                    <th>Payment Status</th>
                    {(user?.role === 'patient' || user?.role === 'admin') && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment) => (
                    <tr key={appointment.appointmentId}>
                      <td>{appointment.appointmentId}</td>
                      <td>{appointment.patientId}</td>
                      <td>{appointment.patientName}</td>
                      <td>{appointment.disease}</td>
                      <td>{appointment.doctorId}</td>
                      <td>{appointment.doctorName}</td>
                      <td>{appointment.appointmentDate}</td>
                      <td>{appointment.timeSlot}</td>
                      <td>{appointment.isEmergency ? "Yes" : "No"}</td>
                      {/* <td>{appointment.isPreferredDoctor ? "Yes" : "No"}</td> */}
                      <td>
                        <span className={appointment.isPaid ? styles['status-paid'] : styles['status-unpaid']}>
                          {appointment.isPaid ? "Paid" : "Unpaid"}
                        </span>
                      </td>
                      {(user?.role === 'patient' || user?.role === 'admin') && (
                        <td>
                          {!appointment.isPaid && (
                            <button
                              onClick={() => {
                                setSelectedAppointment({ appointmentId: appointment.appointmentId, amount: 500 });
                                setShowPaymentModal(true);
                              }}
                              className={styles['pay-button-table']}
                            >
                              Pay
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {internalOperationMode === "View All Appointments" && (
        <div className={styles['all-appointments-container']}>
          <h3>All Appointments</h3>
          {appointments.length > 0 ? (
            <table className={styles['appointments-table']}>
              <thead>
                <tr>
                  <th>Appointment ID</th>
                  <th>Patient ID</th>
                  <th>Patient Name</th>
                  <th>Disease</th>
                  <th>Doctor ID</th>
                  <th>Doctor Name</th>
                  <th>Date</th>
                  <th>Time Slot</th>
                  <th>Emergency</th>
                  {/* <th>Preferred Doctor</th> */}
                  <th>Payment Status</th>
                  {(user?.role === 'patient' || user?.role === 'admin') && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => (
                  <tr key={appointment.appointmentId}>
                    <td>{appointment.appointmentId}</td>
                    <td>{appointment.patientId}</td>
                    <td>{appointment.patientName}</td>
                    <td>{appointment.disease}</td>
                    <td>{appointment.doctorId}</td>
                    <td>{appointment.doctorName}</td>
                    <td>{appointment.appointmentDate}</td>
                    <td>{appointment.timeSlot}</td>
                    <td>{appointment.isEmergency ? "Yes" : "No"}</td>
                    {/* <td>{appointment.isPreferredDoctor ? "Yes" : "No"}</td> */}
                    <td>
                      <span className={appointment.isPaid ? styles['status-paid'] : styles['status-unpaid']}>
                        {appointment.isPaid ? "Paid" : "Unpaid"}
                      </span>
                    </td>
                    {(user?.role === 'patient' || user?.role === 'admin') && (
                      <td>
                        {!appointment.isPaid && (
                          <button
                            onClick={() => {
                              setSelectedAppointment({ appointmentId: appointment.appointmentId, amount: 500 });
                              setShowPaymentModal(true);
                            }}
                            className={styles['pay-button-table']}
                          >
                            Pay
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No appointments available.</p>
          )}
        </div>
      )}

      {internalOperationMode === "Update Appointment" && (
        <div className={styles['form-container']}>
          <h3>Update Appointment</h3>
          <form onSubmit={updateAppointment}>
            <label>Appointment ID:</label>
            <input
              type="number"
              name="appointmentId"
              value={formData.appointmentId || ""}
              onChange={handleInputChange}
              required
            />
            <label>Patient ID:</label>
            <input
              type="number"
              name="patientId"
              value={formData.patientId}
              onChange={handleInputChange}
              min="1"
              required
            />
            <label>Department ID:</label>
            <input
              type="number"
              name="departmentId"
              value={formData.departmentId}
              onChange={handleInputChange}
              min="1"
              required
            />
            <label>Appointment Date:</label>
            <input
              type="date"
              name="appointmentDate"
              value={formData.appointmentDate}
              onChange={handleInputChange}
              min={new Date().toISOString().split("T")[0]}
              required
            />
            <label>Time Slot:</label>
            <input
              type="time"
              name="timeSlot"
              value={formData.timeSlot}
              onChange={handleInputChange}
              required
            />
            <label>Preferred Doctor ID:</label>
            <input
              type="number"
              name="preferredDoctorId"
              value={formData.preferredDoctorId}
              onChange={handleInputChange}
              min="0"
            />
            <label>Emergency:</label>
            <input
              type="checkbox"
              name="isEmergency"
              checked={formData.isEmergency}
              onChange={handleInputChange}
            />
            <button type="submit" disabled={loading}>Update</button>
          </form>
        </div>
      )}

      {internalOperationMode === "Reschedule Appointment" && (
        <div className={styles['form-container']}>
          <h3>Reschedule Appointment</h3>
          <form onSubmit={rescheduleAppointment}>
            <label>Appointment ID:</label>
            <input
              type="number"
              name="appointmentId"
              value={formData.appointmentId || ""}
              onChange={handleInputChange}
              required
            />
            <label>New Appointment Date:</label>
            <input
              type="date"
              name="newAppointmentDate"
              value={formData.newAppointmentDate || new Date().toISOString().split("T")[0]}
              onChange={handleInputChange}
              min={new Date().toISOString().split("T")[0]}
              required
            />
            <label>New Time Slot:</label>
            <input
              type="time"
              name="newTimeSlot"
              value={formData.newTimeSlot || ""}
              onChange={handleInputChange}
              required
            />
            <button type="submit" disabled={loading}>Reschedule</button>
          </form>
        </div>
      )}

      {internalOperationMode === "Cancel Appointment" && (
        <div className={styles['form-container']}>
          <h3>Cancel Appointment</h3>
          <label>Appointment ID:</label>
          <input
            type="number"
            name="appointmentId"
            value={formData.appointmentId || ""}
            onChange={handleInputChange}
          />
          <button onClick={cancelAppointment} disabled={loading}>Cancel</button>
        </div>
      )}

      {internalOperationMode === "Delete All Appointments" && (
        <div className={styles['form-container']}>
          <h3>Delete All Appointments</h3>
          <button onClick={deleteAllAppointments} disabled={loading}>Delete All</button>
        </div>
      )}

      {internalOperationMode === "View Appointments by Doctor and Date" && (
        <div className={styles['form-container']}>
          <h3>View Appointments by Doctor and Date</h3>
          <label>Doctor ID:</label>
          <input
            type="number"
            value={doctorIdFilter}
            onChange={(e) => setDoctorIdFilter(e.target.value)}
            disabled={!!doctorId}
          />
          <label>Date:</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
          />
          <button onClick={fetchAppointmentsByDoctorAndDate} disabled={loading}>Fetch</button>
          {appointments.length > 0 && (
            <table className={styles['appointments-table']}>
              <thead>
                <tr>
                  <th>Appointment ID</th>
                  <th>Patient ID</th>
                  <th>Patient Name</th>
                  <th>Disease</th>
                  <th>Doctor ID</th>
                  <th>Doctor Name</th>
                  <th>Date</th>
                  <th>Time Slot</th>
                  <th>Emergency</th>
                  <th>Preferred Doctor</th>
                  <th>Payment Status</th>
                  {(user?.role === 'patient' || user?.role === 'admin') && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => (
                  <tr key={appointment.appointmentId}>
                    <td>{appointment.appointmentId}</td>
                    <td>{appointment.patientId}</td>
                    <td>{appointment.patientName}</td>
                    <td>{appointment.disease}</td>
                    <td>{appointment.doctorId}</td>
                    <td>{appointment.doctorName}</td>
                    <td>{appointment.appointmentDate}</td>
                    <td>{appointment.timeSlot}</td>
                    <td>{appointment.isEmergency ? "Yes" : "No"}</td>
                    <td>{appointment.isPreferredDoctor ? "Yes" : "No"}</td>
                    <td>
                      <span className={appointment.isPaid ? styles['status-paid'] : styles['status-unpaid']}>
                        {appointment.isPaid ? "Paid" : "Unpaid"}
                      </span>
                    </td>
                    {(user?.role === 'patient' || user?.role === 'admin') && (
                      <td>
                        {!appointment.isPaid && (
                          <button
                            onClick={() => {
                              setSelectedAppointment({ appointmentId: appointment.appointmentId, amount: 500 });
                              setShowPaymentModal(true);
                            }}
                            className={styles['pay-button-table']}
                          >
                            Pay
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {internalOperationMode === "Get Appointment Count by Doctor and Date" && (
        <div className={styles['form-container']}>
          <h4>Get Appointment Count by Doctor and Date</h4>
          <label>Doctor ID:</label>
          <input
            type="number"
            value={doctorIdFilter}
            onChange={(e) => setDoctorIdFilter(e.target.value)}
            disabled={!!doctorId}
          />
          <label>Date:</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
          />
          <button onClick={fetchAppointmentCountByDoctorAndDate} disabled={loading}>Fetch Count</button>
          {appointmentCount >= 0 && <p>Appointment Count: {appointmentCount}</p>}
        </div>
      )}

      {showPaymentModal && selectedAppointment && (
        <PaymentModal
          appointmentId={selectedAppointment.appointmentId}
          amount={selectedAppointment.amount}
          onClose={() => setShowPaymentModal(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default AppointmentManagement;