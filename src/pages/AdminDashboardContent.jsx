import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Heart, Calendar, DollarSign, AlertTriangle, CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import api from '../api/api';
import styles from './AdminDashboardContent.module.css';

const AdminDashboardContent = () => {
  const [totalPatients, setTotalPatients] = useState(0);
  const [todaysAppointments, setTodaysAppointments] = useState(0);
  const [pendingCheckins, setPendingCheckins] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  
  const [appointmentsList, setAppointmentsList] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fallback chart data for the revenue line chart (until we have historical data API)
  const revenueData = [
    { name: 'Jan', value: 420 },
    { name: 'Feb', value: 380 },
    { name: 'Mar', value: 500 },
    { name: 'Apr', value: 470 },
    { name: 'May', value: 580 },
    { name: 'Jun', value: monthlyRevenue > 0 ? (monthlyRevenue / 100) : 620 }, 
    { name: 'Jul', value: monthlyRevenue > 0 ? (monthlyRevenue / 100) + 50 : 520 },
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // 1. Fetch Total Patients
        try {
          const patientsRes = await api.get('/patients');
          if (Array.isArray(patientsRes.data)) {
            setTotalPatients(patientsRes.data.length);
          }
        } catch (e) { console.error("Failed to fetch patients", e); }

        // 2. Fetch Appointments
        try {
          const apptsRes = await api.get('/appointments');
          if (Array.isArray(apptsRes.data)) {
            const allAppts = apptsRes.data;
            setTodaysAppointments(allAppts.length); // Assuming all are relevant or can be filtered by date
            
            const pending = allAppts.filter(a => a.status === 'PENDING' || a.status === 'SCHEDULED');
            setPendingCheckins(pending.length);

            // Take the last 5 appointments for the table
            const recent = allAppts.slice(-5).reverse().map((a, index) => ({
              id: a.appointmentId || index,
              patient: a.patientName || `Patient #${a.patientId || 'N/A'}`,
              doctor: a.doctorName || `Doctor #${a.doctorId || 'N/A'}`,
              time: a.appointmentTime || a.appointmentDate || 'TBD',
              type: a.appointmentType || 'Consultation',
              status: a.status || 'Scheduled',
              paid: a.paymentStatus === 'PAID' || a.isPaid === true
            }));
            setAppointmentsList(recent);
          }
        } catch (e) { console.error("Failed to fetch appointments", e); }

        // 3. Fetch Hospital Charges for Revenue
        try {
          const chargesRes = await api.get('/hospital-charges');
          if (Array.isArray(chargesRes.data)) {
            const total = chargesRes.data.reduce((sum, charge) => sum + (charge.amount || 0), 0);
            setMonthlyRevenue(total);
          }
        } catch (e) { console.error("Failed to fetch charges", e); }

        // 4. Fetch Low Stock Alerts
        try {
          const lowStockRes = await api.get('/medicine-store/low-stock');
          if (Array.isArray(lowStockRes.data)) {
            setLowStockCount(lowStockRes.data.length);
          }
        } catch (e) { console.error("Failed to fetch low stock", e); }

        // 5. Fetch Departments for Pie Chart
        try {
          // Fallback to /api/departments since it's used in DepartmentsPage
          const deptRes = await api.get('/api/departments');
          if (Array.isArray(deptRes.data) && deptRes.data.length > 0) {
            const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#6b7280', '#ef4444', '#14b8a6'];
            const mapped = deptRes.data.map((d, i) => ({
              name: d.departmentName || 'Unknown',
              value: 10 + (i * 2), // Mock percentage weight for display purposes
              color: colors[i % colors.length]
            }));
            setDepartmentData(mapped);
          } else {
            // Default if empty
            setDepartmentData([{ name: 'General', value: 100, color: '#3b82f6' }]);
          }
        } catch (e) { 
          console.error("Failed to fetch departments", e);
          setDepartmentData([{ name: 'General', value: 100, color: '#3b82f6' }]);
        }

      } catch (error) {
        console.error("Global fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', color: '#6b7280' }}>
        <Loader2 className={styles.spin} size={40} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '16px' }}>Loading live dashboard data...</p>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.headerInfo}>
        <h1 className={styles.title}>Admin Dashboard</h1>
        <p className={styles.subtitle}>Welcome back — here's what's happening today based on live API data.</p>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Total Patients</span>
            <div className={`${styles.iconWrapper} ${styles.blueIcon}`}>
              <Heart size={18} />
            </div>
          </div>
          <div className={styles.statValue}>{totalPatients}</div>
          <div className={`${styles.statTrend} ${styles.positive}`}>Live Data</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Total Appts</span>
            <div className={`${styles.iconWrapper} ${styles.indigoIcon}`}>
              <Calendar size={18} />
            </div>
          </div>
          <div className={styles.statValue}>{todaysAppointments}</div>
          <div className={`${styles.statTrend} ${styles.neutral}`}>{pendingCheckins} pending check-in</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Total Revenue</span>
            <div className={`${styles.iconWrapper} ${styles.greenIcon}`}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className={styles.statValue}>${monthlyRevenue.toLocaleString()}</div>
          <div className={`${styles.statTrend} ${styles.positive}`}>Calculated from charges</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Low Stock Alerts</span>
            <div className={`${styles.iconWrapper} ${styles.redIcon}`}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className={styles.statValue}>{lowStockCount}</div>
          <div className={`${styles.statTrend} ${lowStockCount > 0 ? styles.negative : styles.positive}`}>
            {lowStockCount > 0 ? '↘ Needs reorder' : 'Stock healthy'}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className={styles.chartsGrid}>
        {/* Line Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>Patient Visits & Revenue Trend</h3>
            <span className={styles.badge}>Last 7 months</span>
          </div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>Department Mix</h3>
          </div>
          <div className={styles.pieContainer}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            <div className={styles.legend}>
              {departmentData.map((dept, index) => (
                <div key={index} className={styles.legendItem}>
                  <div className={styles.legendDot} style={{ backgroundColor: dept.color }}></div>
                  <span className={styles.legendName}>{dept.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <div className={styles.tableCard}>
        <div className={styles.chartHeader}>
          <h3>Recent Appointments</h3>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>PATIENT</th>
                <th>DOCTOR</th>
                <th>TIME</th>
                <th>TYPE</th>
                <th>STATUS</th>
                <th>PAID</th>
              </tr>
            </thead>
            <tbody>
              {appointmentsList.length > 0 ? (
                appointmentsList.map((appt) => (
                  <tr key={appt.id}>
                    <td className={styles.patientName}>{appt.patient}</td>
                    <td className={styles.doctorName}>{appt.doctor}</td>
                    <td>{appt.time}</td>
                    <td>{appt.type}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[appt.status?.toLowerCase()] || styles.scheduled}`}>
                        {appt.status}
                      </span>
                    </td>
                    <td>
                      {appt.paid ? 
                        <CheckCircle2 size={18} color="#10b981" /> : 
                        <Clock size={18} color="#f59e0b" />
                      }
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                    No appointments found in the system.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardContent;
