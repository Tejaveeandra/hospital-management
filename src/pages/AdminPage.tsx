import React, { useState } from "react";
import DoctorPage from "./DoctorPage";
import "./AdminPage.css";
import LeaveManagement from "./DoctorLeavePage";
import AppointmentManagement, { AppointmentOperation } from "./AppointmentPage"; // Import the existing AppointmentManagement component

type LeaveOperation =
  | "View All Leaves"
  | "View Pending Leaves"
  | "Update Leave Status"
  | "Delete Leave";

const AdminPage = () => {
  const userRole = localStorage.getItem("role") || "patient";
  const isAdmin = ["admin", "super-admin"].includes(userRole);
  const [activeSection, setActiveSection] = useState<"doctors" | "leaves" | "appointments" | null>(null);
  const [doctorOperation, setDoctorOperation] = useState<"create" | "viewAll" | "delete" | null>(null);
  const [leaveOperation, setLeaveOperation] = useState<LeaveOperation | null>(null);
  const [appointmentOperation, setAppointmentOperation] = useState<
    | "Create Appointment"
    | "View Appointment by ID"
    | "View All Appointments"
    | "Update Appointment"
    | "Reschedule Appointment"
    | "Cancel Appointment"
    | "Delete All Appointments"
    | "View Appointments by Doctor and Date"
    | "Get Appointment Count by Doctor and Date"
    | null
  >(null);

  if (!isAdmin) {
    return (
      <div className="access-denied">
        <h1>Admin Dashboard</h1>
        <p>Access Denied: You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <h1>WELCOME TO THE HOSPITAL MANAGEMENT SYSTEM</h1>
      <h2>ADMIN DASHBOARD</h2>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="sidebar-section">
            <h3>Doctor Operations</h3>
            <button
              onClick={() => {
                setActiveSection("doctors");
                setDoctorOperation("create");
                setLeaveOperation(null);
                setAppointmentOperation(null);
              }}
            >
              CREATE DOCTOR
            </button>
            <button
              onClick={() => {
                setActiveSection("doctors");
                setDoctorOperation("viewAll");
                setLeaveOperation(null);
                setAppointmentOperation(null);
              }}
            >
              VIEW ALL DOCTORS
            </button>
            <button
              onClick={() => {
                setActiveSection("doctors");
                setDoctorOperation("delete");
                setLeaveOperation(null);
                setAppointmentOperation(null);
              }}
            >
              DELETE DOCTOR
            </button>
          </div>

          <div className="sidebar-section">
            <h3>Leave Operations</h3>
            <button
              onClick={() => {
                setActiveSection("leaves");
                setLeaveOperation("View All Leaves");
                setDoctorOperation(null);
                setAppointmentOperation(null);
              }}
            >
              VIEW ALL LEAVES
            </button>
            <button
              onClick={() => {
                setActiveSection("leaves");
                setLeaveOperation("View Pending Leaves");
                setDoctorOperation(null);
                setAppointmentOperation(null);
              }}
            >
              VIEW PENDING LEAVES
            </button>
            <button
              onClick={() => {
                setActiveSection("leaves");
                setLeaveOperation("Update Leave Status");
                setDoctorOperation(null);
                setAppointmentOperation(null);
              }}
            >
              UPDATE LEAVE STATUS
            </button>
            <button
              onClick={() => {
                setActiveSection("leaves");
                setLeaveOperation("Delete Leave");
                setDoctorOperation(null);
                setAppointmentOperation(null);
              }}
            >
              DELETE LEAVE
            </button>
          </div>

          <div className="sidebar-section">
            <h3>Appointment Operations</h3>
            <button
              onClick={() => {
                setActiveSection("appointments");
                setAppointmentOperation("Create Appointment");
                setDoctorOperation(null);
                setLeaveOperation(null);
              }}
            >
              CREATE APPOINTMENT
            </button>
            <button
              onClick={() => {
                setActiveSection("appointments");
                setAppointmentOperation("View Appointment by ID");
                setDoctorOperation(null);
                setLeaveOperation(null);
              }}
            >
              VIEW APPOINTMENT BY ID
            </button>
            <button
              onClick={() => {
                setActiveSection("appointments");
                setAppointmentOperation("View All Appointments");
                setDoctorOperation(null);
                setLeaveOperation(null);
              }}
            >
              VIEW ALL APPOINTMENTS
            </button>
            <button
              onClick={() => {
                setActiveSection("appointments");
                setAppointmentOperation("View Appointments by Doctor and Date");
                setDoctorOperation(null);
                setLeaveOperation(null);
              }}
            >
              VIEW APPOINTMENTS BY DOCTOR AND DATE
            </button>
            <button
              onClick={() => {
                setActiveSection("appointments");
                setAppointmentOperation("Get Appointment Count by Doctor and Date");
                setDoctorOperation(null);
                setLeaveOperation(null);
              }}
            >
              GET APPOINTMENT COUNT BY DOCTOR AND DATE
            </button>
            <button
              onClick={() => {
                setActiveSection("appointments");
                setAppointmentOperation("Update Appointment");
                setDoctorOperation(null);
                setLeaveOperation(null);
              }}
            >
              UPDATE APPOINTMENT
            </button>
            <button
              onClick={() => {
                setActiveSection("appointments");
                setAppointmentOperation("Reschedule Appointment");
                setDoctorOperation(null);
                setLeaveOperation(null);
              }}
            >
              RESCHEDULE APPOINTMENT
            </button>
            <button
              onClick={() => {
                setActiveSection("appointments");
                setAppointmentOperation("Cancel Appointment");
                setDoctorOperation(null);
                setLeaveOperation(null);
              }}
            >
              CANCEL APPOINTMENT
            </button>
            <button
              onClick={() => {
                setActiveSection("appointments");
                setAppointmentOperation("Delete All Appointments");
                setDoctorOperation(null);
                setLeaveOperation(null);
              }}
            >
              DELETE ALL APPOINTMENTS
            </button>
          </div>
        </aside>

        <main className="admin-content">
          {activeSection === "doctors" && doctorOperation && (
            <DoctorPage
              allowedOperations={[doctorOperation]}
              initialOperation={doctorOperation}
              showHeaders={false} // Suppress headers in AdminPage
            />
          )}
          {activeSection === "leaves" && leaveOperation && (
            <LeaveManagement
              allowedOperations={[leaveOperation]}
            />
          )}
          {activeSection === "appointments" && appointmentOperation && (
            <AppointmentManagement
              allowedOperations={[appointmentOperation]} // Use the current operation
              operationMode={appointmentOperation} // Pass the current operation as prop
              doctorId={userRole === "doctor" ? localStorage.getItem("id") || undefined : undefined}
            />
          )}
          {!activeSection && (
            <div className="default-message">
              <p>Select an operation from the sidebar to begin.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminPage;