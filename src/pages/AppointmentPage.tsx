import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AppointmentPage.css";

// Define interfaces
interface Appointment {
  appointmentId: number;
  patientId: number;
  patientName: string;
  disease: string;
  doctorId: number;
  doctorName: string;
  appointmentDate: string;
  timeSlot: string;
  isEmergency: boolean;
  isPreferredDoctor: boolean;
}

export type AppointmentOperation =
  | "Create Appointment"
  | "View Appointment by ID"
  | "View All Appointments"
  | "Update Appointment"
  | "Reschedule Appointment"
  | "Cancel Appointment"
  | "Delete All Appointments"
  | "View Appointments by Doctor and Date"
  | "Get Appointment Count by Doctor and Date";

interface AppointmentManagementProps {
  allowedOperations: AppointmentOperation[];
  doctorId?: string;
  operationMode?: AppointmentOperation;
  user?: User | null; // Add user prop
}

interface AppointmentFormData {
  patientId: string;
  departmentId: string;
  appointmentDate: string;
  timeSlot: string;
  preferredDoctorId: string;
  isEmergency: boolean;
  isPreferredDoctor: boolean;
  appointmentId?: string;
  newAppointmentDate?: string;
  newTimeSlot?: string;
}

interface User {
  id: string;
  role: "patient" | "doctor" | "admin";
  token: string;
}

const AppointmentManagement: React.FC<AppointmentManagementProps> = ({ allowedOperations, doctorId, operationMode, user: propUser }) => {
  const [formData, setFormData] = useState<AppointmentFormData>({
    patientId: propUser?.role === "patient" ? propUser.id : "",
    departmentId: "",
    appointmentDate: new Date().toISOString().split("T")[0],
    timeSlot: "",
    preferredDoctorId: "0",
    isEmergency: false,
    isPreferredDoctor: false,
  });
  const [viewAppointmentId, setViewAppointmentId] = useState<string>("");
  const [doctorIdFilter, setDoctorIdFilter] = useState<string>(doctorId || "");
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split("T")[0]);
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentCount, setAppointmentCount] = useState<number>(0);
  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);
  const [user] = useState<User | null>(propUser || null); // Use propUser

  // Use the prop-based operationMode if provided, otherwise fall back to the first allowed operation
  const [internalOperationMode, setInternalOperationMode] = useState<AppointmentOperation>(
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
  const roleOperations: Record<string, AppointmentOperation[]> = {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "isEmergency" || name === "isPreferredDoctor" ? value === "true" : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      const response = await axios.post<Appointment>(
        "http://localhost:8081/appointments/fixAppointment",
        payload,
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      const newAppointment = response.data;
      setMessage(`Appointment created: ID ${newAppointment.appointmentId}`);
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
      const response = await axios.get<Appointment>(
        `http://localhost:8081/appointments/${viewAppointmentId}`,
        { headers: { Authorization: `Bearer ${user?.token}` } }
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
      const response = await axios.get<Appointment[]>(
        "http://localhost:8081/appointments/ViewAllAppointments",
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      setAppointments(response.data);
      setMessage("All appointments fetched.");
    } catch (error) {
      setMessage("Error fetching appointments.");
    } finally {
      setLoading(false);
    }
  };

  const updateAppointment = async (e: React.FormEvent) => {
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
      const response = await axios.put<Appointment>(
        `http://localhost:8081/appointments/${formData.appointmentId}`,
        payload,
        { headers: { Authorization: `Bearer ${user?.token}` } }
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

  const rescheduleAppointment = async (e: React.FormEvent) => {
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
      const response = await axios.put<Appointment>(
        `http://localhost:8081/appointments/appointments/reschedule/${formData.appointmentId}`,
        {},
        {
          params: {
            newAppointmentDate: formData.newAppointmentDate,
            newTimeSlot: formData.newTimeSlot,
          },
          headers: { Authorization: `Bearer ${user?.token}` },
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
      await axios.delete(
        `http://localhost:8081/appointments/appointments/cancel/${formData.appointmentId}`,
        { headers: { Authorization: `Bearer ${user?.token}` } }
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
      await axios.delete("http://localhost:8081/appointments/deleteAll", {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
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
      const response = await axios.get<Appointment[]>(
        `http://localhost:8081/appointments/doctor/${doctorIdFilter}/date/${dateFilter}`,
        { headers: { Authorization: `Bearer ${user?.token}` } }
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
      const response = await axios.get<number>(
        `http://localhost:8081/appointments/doctor/${doctorIdFilter}/count/date/${dateFilter}`,
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      setAppointmentCount(response.data);
      setMessage(`Appointment count for Doctor ID ${doctorIdFilter} on ${dateFilter}: ${response.data}`);
    } catch (error) {
      setMessage("Error fetching appointment count.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="appointment-management">
      {loading && <div className="loading">Loading...</div>}
      {message && <div className="message">{message}</div>}

      {internalOperationMode === "Create Appointment" && (
        <div className="form-container">
          <h3>Create Appointment</h3>
          {createdAppointment ? (
            <div className="appointment-details-form">
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
              <label>Preferred Doctor:</label>
              {/* <input type="text" value={createdAppointment.isPreferredDoctor ? "Yes" : "No"} disabled /> */}
              <button onClick={resetForm} disabled={loading}>Create New Appointment</button>
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
                disabled={user?.role === "patient"}
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
        <div className="form-container">
          <div className="input-section">
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
            <div className="results-section">
              <table className="appointments-table">
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {internalOperationMode === "View All Appointments" && (
        <div className="all-appointments-container">
          <h3>All Appointments</h3>
          {appointments.length > 0 ? (
            <table className="appointments-table">
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
        <div className="form-container">
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
        <div className="form-container">
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
        <div className="form-container">
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
        <div className="form-container">
          <h3>Delete All Appointments</h3>
          <button onClick={deleteAllAppointments} disabled={loading}>Delete All</button>
        </div>
      )}

      {internalOperationMode === "View Appointments by Doctor and Date" && (
        <div className="form-container">
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
            <table className="appointments-table">
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
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {internalOperationMode === "Get Appointment Count by Doctor and Date" && (
        <div className="form-container">
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
    </div>
  );
};

export default AppointmentManagement;