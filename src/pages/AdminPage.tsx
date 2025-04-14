import React, { useState } from "react";
import DoctorPage from "./DoctorPage";
import "./AdminPage.css";
import LeaveManagement from "./DoctorLeavePage";

type LeaveOperation =
  | "View All Leaves"
  | "View Pending Leaves"
  | "Update Leave Status"
  | "Delete Leave";

const AdminPage = () => {
  const userRole = localStorage.getItem("role") || "patient";
  const isAdmin = ["admin", "super-admin"].includes(userRole);
  const [activeSection, setActiveSection] = useState<"doctors" | "leaves" | null>(null);
  const [doctorOperation, setDoctorOperation] = useState<"create" | "viewAll" | "delete" | null>(null);
  const [leaveOperation, setLeaveOperation] = useState<LeaveOperation | null>(null);

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
              }}
            >
              CREATE DOCTOR
            </button>
            <button
              onClick={() => {
                setActiveSection("doctors");
                setDoctorOperation("viewAll");
                setLeaveOperation(null);
              }}
            >
              VIEW ALL DOCTORS
            </button>
            <button
              onClick={() => {
                setActiveSection("doctors");
                setDoctorOperation("delete");
                setLeaveOperation(null);
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
              }}
            >
              VIEW ALL LEAVES
            </button>
            <button
              onClick={() => {
                setActiveSection("leaves");
                setLeaveOperation("View Pending Leaves");
                setDoctorOperation(null);
              }}
            >
              VIEW PENDING LEAVES
            </button>
            <button
              onClick={() => {
                setActiveSection("leaves");
                setLeaveOperation("Update Leave Status");
                setDoctorOperation(null);
              }}
            >
              UPDATE LEAVE STATUS
            </button>
            <button
              onClick={() => {
                setActiveSection("leaves");
                setLeaveOperation("Delete Leave");
                setDoctorOperation(null);
              }}
            >
              DELETE LEAVE
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