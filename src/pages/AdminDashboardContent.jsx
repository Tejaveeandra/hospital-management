import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Heart, Calendar, DollarSign, AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import styles from './AdminDashboardContent.module.css';

// Mock Data
const revenueData = [
  { name: 'Jan', value: 420 },
  { name: 'Feb', value: 380 },
  { name: 'Mar', value: 500 },
  { name: 'Apr', value: 470 },
  { name: 'May', value: 580 },
  { name: 'Jun', value: 620 },
  { name: 'Jul', value: 520 },
];

const departmentData = [
  { name: 'Cardiology', value: 28, color: '#3b82f6' },
  { name: 'Neurology', value: 22, color: '#10b981' },
  { name: 'Pediatrics', value: 18, color: '#f59e0b' },
  { name: 'Orthopedics', value: 15, color: '#8b5cf6' },
  { name: 'General', value: 17, color: '#6b7280' },
];

const appointmentsData = [
  { id: 1, patient: 'Maria Santos', doctor: 'Dr. Sarah Chen', time: '09:00', type: 'Follow-up', status: 'Scheduled', paid: true },
  { id: 2, patient: 'Carlos Rivera', doctor: 'Dr. Rajesh Patel', time: '10:30', type: 'Consultation', status: 'Completed', paid: true },
  { id: 3, patient: 'Linda Park', doctor: 'Dr. Sarah Chen', time: '14:00', type: 'Routine', status: 'Scheduled', paid: false },
  { id: 4, patient: 'Thomas Hughes', doctor: 'Dr. Rajesh Patel', time: '11:00', type: 'Follow-up', status: 'Cancelled', paid: false },
];

const AdminDashboardContent = () => {
  return (
    <div className={styles.dashboard}>
      <div className={styles.headerInfo}>
        <h1 className={styles.title}>Admin Dashboard</h1>
        <p className={styles.subtitle}>Welcome back — here's what's happening today.</p>
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
          <div className={styles.statValue}>1,248</div>
          <div className={`${styles.statTrend} ${styles.positive}`}>↗ +12 this week</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Today's Appts</span>
            <div className={`${styles.iconWrapper} ${styles.indigoIcon}`}>
              <Calendar size={18} />
            </div>
          </div>
          <div className={styles.statValue}>38</div>
          <div className={`${styles.statTrend} ${styles.neutral}`}>6 pending check-in</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Monthly Revenue</span>
            <div className={`${styles.iconWrapper} ${styles.greenIcon}`}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className={styles.statValue}>$58,900</div>
          <div className={`${styles.statTrend} ${styles.positive}`}>↗ +8.4% vs last month</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Low Stock Alerts</span>
            <div className={`${styles.iconWrapper} ${styles.redIcon}`}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className={styles.statValue}>4</div>
          <div className={`${styles.statTrend} ${styles.negative}`}>↘ Needs reorder</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className={styles.chartsGrid}>
        {/* Line Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>Patient Visits & Revenue</h3>
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
                  <span className={styles.legendValue}>{dept.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <div className={styles.tableCard}>
        <div className={styles.chartHeader}>
          <h3>Today's Appointments</h3>
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
              {appointmentsData.map((appt) => (
                <tr key={appt.id}>
                  <td className={styles.patientName}>{appt.patient}</td>
                  <td className={styles.doctorName}>{appt.doctor}</td>
                  <td>{appt.time}</td>
                  <td>{appt.type}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[appt.status.toLowerCase()]}`}>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardContent;
