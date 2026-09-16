import React from 'react';
import styles from '../../pages/AppointmentPage.module.css';

const AppointmentTable = ({ appointments, user, getAppointmentCharge, onPay }) => {
  if (!appointments || appointments.length === 0) {
    return <p className={styles['message']}>No appointments found.</p>;
  }

  return (
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
            <th>Preferred Doctor</th>
            <th>Charge (₹)</th>
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
              <td>
                <span className={appointment.isEmergency || appointment.emergency ? styles['status-unpaid'] : styles['status-paid']}>
                  {appointment.isEmergency || appointment.emergency ? "Yes" : "No"}
                </span>
              </td>
              <td>{appointment.isPreferredDoctor ? "Yes" : "No"}</td>
              <td>{getAppointmentCharge(appointment)}</td>
              <td>
                {appointment.isPaid ? (
                  <span className={styles['status-paid']}>Paid</span>
                ) : (
                  <span className={styles['status-unpaid']}>Unpaid</span>
                )}
              </td>
              {(user?.role === 'patient' || user?.role === 'admin') && (
                <td>
                  {!appointment.isPaid && (
                    <button
                      onClick={() => onPay(appointment.appointmentId, getAppointmentCharge(appointment))}
                      className={styles['pay-button-table']}
                    >
                      Pay Now
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AppointmentTable;
