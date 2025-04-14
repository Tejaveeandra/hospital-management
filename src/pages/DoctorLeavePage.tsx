import React, { useState, useEffect } from "react";
import axios from "axios";
import "./DoctorLeavePage.css";

// Define interfaces
interface DoctorLeave {
  leaveId: number;
  doctorId: number;
  startDate: string;
  endDate: string;
  leaveType: "FULL_DAY" | "HALF_DAY";
  status: "APPROVED" | "REJECTED" | "PENDING";
  startTime?: string; // Optional field for half-day leaves
  endTime?: string;   // Optional field for half-day leaves
}

export type LeaveOperation =
  | "Create Leave"
  | "View Leave by Doctor ID"
  | "View All Leaves"
  | "View Pending Leaves"
  | "Update Leave Status"
  | "Delete Leave";

interface LeaveManagementProps {
  allowedOperations: LeaveOperation[];
  doctorId?: string;
}

// Define form data interface
interface LeaveFormData {
  doctorId: string;
  startDate: string;
  endDate: string;
  leaveType: "FULL_DAY" | "HALF_DAY";
  startTime: string;
  endTime: string;
}

const LeaveManagement: React.FC<LeaveManagementProps> = ({ allowedOperations, doctorId }) => {
  const [operationMode, setOperationMode] = useState<LeaveOperation | null>(null);
  const [formData, setFormData] = useState<LeaveFormData>({
    doctorId: doctorId || "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    leaveType: "FULL_DAY",
    startTime: "",
    endTime: "",
  });
  const [viewDoctorId, setViewDoctorId] = useState<string>(doctorId || "");
  const [leaveId, setLeaveId] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [leaves, setLeaves] = useState<DoctorLeave[]>([]);

  useEffect(() => {
    if (allowedOperations.length > 0) {
      setOperationMode(allowedOperations[0]);
    }
  }, [allowedOperations]);

  // Reset message when operationMode changes
  useEffect(() => {
    setMessage(""); // Clear message whenever operationMode changes
  }, [operationMode]);

  useEffect(() => {
    if (operationMode === "View All Leaves") {
      fetchAllLeaves();
    } else if (operationMode === "View Pending Leaves") {
      fetchPendingLeaves();
    }
  }, [operationMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log(`Changing ${name} to ${value}`); // Debug log
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.doctorId || isNaN(Number(formData.doctorId))) {
      setMessage("Please enter a valid Doctor ID.");
      return;
    }
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      setMessage("Start Date cannot be after End Date.");
      return;
    }
    // Validate startTime and endTime for HALF_DAY
    if (formData.leaveType === "HALF_DAY" && (!formData.startTime || !formData.endTime)) {
      setMessage("Please enter both Start Time and End Time for half-day leave.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        doctorId: Number(formData.doctorId),
        startTime: formData.leaveType === "HALF_DAY" ? formData.startTime : undefined,
        endTime: formData.leaveType === "HALF_DAY" ? formData.endTime : undefined,
      };
      console.log("Submitting payload:", payload); // Debug log
      const response = await axios.post<DoctorLeave>("http://localhost:8081/api/doctor-leaves/addLeave", payload);
      setMessage(`Leave created: ID ${response.data.leaveId}`);
      setFormData({
        doctorId: doctorId || "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
        leaveType: "FULL_DAY",
        startTime: "",
        endTime: "",
      });
      if (allowedOperations.includes("View All Leaves")) fetchAllLeaves();
    } catch (error) {
      const errMsg = axios.isAxiosError(error) ? error.response?.data?.message || error.message : "Unknown error";
      setMessage(`Error creating leave: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeavesByDoctorId = async () => {
    if (!viewDoctorId) {
      setMessage("Please enter a Doctor ID.");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get<DoctorLeave[]>(`http://localhost:8081/api/doctor-leaves/doctorLeave/${viewDoctorId}`);
      setLeaves(response.data);
      setMessage(`Leaves for Doctor ID: ${viewDoctorId}`);
    } catch (error) {
      setMessage("Error fetching leaves.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllLeaves = async () => {
    setLoading(true);
    try {
      const response = await axios.get<DoctorLeave[]>("http://localhost:8081/api/doctor-leaves");
      setLeaves(response.data);
      setMessage("All leaves fetched.");
    } catch (error) {
      setMessage("Error fetching leaves.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingLeaves = async () => {
    setLoading(true);
    try {
      const response = await axios.get<DoctorLeave[]>("http://localhost:8081/api/doctor-leaves/doctor-leave/pending");
      setLeaves(response.data);
      setMessage("Pending leaves fetched.");
    } catch (error) {
      setMessage("Error fetching pending leaves.");
    } finally {
      setLoading(false);
    }
  };

  const updateLeaveStatus = async (status: string) => {
    if (!leaveId) {
      setMessage("Please enter a Leave ID.");
      return;
    }
    setLoading(true);
    try {
      await axios.put(`http://localhost:8081/api/doctor-leaves/doctor-leave/${leaveId}/status`, null, {
        params: { status },
      });
      setMessage(`Leave ID ${leaveId} updated to ${status}`);
      if (allowedOperations.includes("View All Leaves")) fetchAllLeaves();
    } catch (error) {
      setMessage("Error updating leave.");
    } finally {
      setLoading(false);
    }
  };

  const deleteLeave = async () => {
    if (!leaveId) {
      setMessage("Please enter a Leave ID.");
      return;
    }
    setLoading(true);
    try {
      await axios.delete(`http://localhost:8081/api/doctor-leaves/${leaveId}`);
      setMessage(`Leave ID ${leaveId} deleted`);
      setLeaveId("");
      if (allowedOperations.includes("View All Leaves")) fetchAllLeaves();
    } catch (error) {
      setMessage("Error deleting leave.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="leave-management">
      {loading && <div className="loading">Loading...</div>}
      {message && <div className="message">{message}</div>}

      {operationMode === "Create Leave" && (
        <div className="form-container">
          <h3>Create Leave</h3>
          <form onSubmit={handleSubmit}>
            <>
              <label>Doctor ID:</label>
              <input name="doctorId" value={formData.doctorId} onChange={handleInputChange} disabled={!!doctorId} />
              <label>Start Date:</label>
              <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} />
              <label>End Date:</label>
              <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} />
              <label>Leave Type:</label>
              <select name="leaveType" value={formData.leaveType} onChange={handleInputChange}>
                <option value="FULL_DAY">Full Day</option>
                <option value="HALF_DAY">Half Day</option>
              </select>
              {console.log("Current leaveType:", formData.leaveType)} {/* Debug log */}
              {formData.leaveType === "HALF_DAY" && (
                <>
                  <label>Start Time:</label>
                  <input type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} required />
                  <label>End Time:</label>
                  <input type="time" name="endTime" value={formData.endTime} onChange={handleInputChange} required />
                </>
              )}
              <button type="submit" disabled={loading}>Create</button>
            </>
          </form>
        </div>
      )}

      {operationMode === "View Leave by Doctor ID" && (
        <div className="form-container">
          <h3>View Leaves by Doctor ID</h3>
          <label>Doctor ID:</label>
          <input value={viewDoctorId} onChange={(e) => setViewDoctorId(e.target.value)} disabled={!!doctorId} />
          <button onClick={fetchLeavesByDoctorId} disabled={loading}>Fetch</button>
          {leaves.length > 0 && (
            <ul>
              {leaves.map((leave) => (
                <li key={leave.leaveId}>
                  {`ID: ${leave.leaveId}, ${leave.startDate} to ${leave.endDate}, ${leave.leaveType === "HALF_DAY" && leave.startTime && leave.endTime ? `Time: ${leave.startTime} to ${leave.endTime}, ` : ""}Type: ${leave.leaveType}, Status: ${leave.status}`}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {operationMode === "View All Leaves" && (
        <div className="all-leaves-container">
          <h3>All Leaves</h3>
          {leaves.length > 0 ? (
            <table className="leaves-table">
              <thead>
                <tr>
                  <th>Leave ID</th>
                  <th>Doctor ID</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave) => (
                  <tr key={leave.leaveId}>
                    <td>{leave.leaveId}</td>
                    <td>{leave.doctorId}</td>
                    <td>{leave.startDate}</td>
                    <td>{leave.endDate}</td>
                    <td>{leave.startTime || "N/A"}</td>
                    <td>{leave.endTime || "N/A"}</td>
                    <td>{leave.leaveType}</td>
                    <td>{leave.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No leaves available.</p>
          )}
        </div>
      )}

      {operationMode === "View Pending Leaves" && (
        <div className="all-leaves-container">
          <h3>Pending Leaves</h3>
          {leaves.length > 0 ? (
            <table className="leaves-table">
              <thead>
                <tr>
                  <th>Leave ID</th>
                  <th>Doctor ID</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave) => (
                  <tr key={leave.leaveId}>
                    <td>{leave.leaveId}</td>
                    <td>{leave.doctorId}</td>
                    <td>{leave.startDate}</td>
                    <td>{leave.endDate}</td>
                    <td>{leave.startTime || "N/A"}</td>
                    <td>{leave.endTime || "N/A"}</td>
                    <td>{leave.leaveType}</td>
                    <td>{leave.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No pending leaves available.</p>
          )}
        </div>
      )}

      {operationMode === "Update Leave Status" && (
        <div className="form-container">
          <h3>Update Leave Status</h3>
          <label>Leave ID:</label>
          <input value={leaveId} onChange={(e) => setLeaveId(e.target.value)} />
          <select onChange={(e) => updateLeaveStatus(e.target.value)} disabled={loading}>
            <option value="">Select Status</option>
            <option value="APPROVED">Approve</option>
            <option value="REJECTED">Reject</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      )}

      {operationMode === "Delete Leave" && (
        <div className="form-container">
          <h3>Delete Leave</h3>
          <label>Leave ID:</label>
          <input value={leaveId} onChange={(e) => setLeaveId(e.target.value)} />
          <button onClick={deleteLeave} disabled={loading}>Delete</button>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;