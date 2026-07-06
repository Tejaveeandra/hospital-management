import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LoginPage.module.css';
import api from '../api/api';

// Inline SVGs for roles
const AdminIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.roleIcon}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
);

const DoctorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.roleIcon}>
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
  </svg>
);

const PatientIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.roleIcon}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
);

const ReceptionistIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.roleIcon}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const HospitalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.logoIcon}>
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
  </svg>
);

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'username') {
      setUsername(value);
      if (value.trim() === '') setUsernameError('Please provide username');
      else setUsernameError('');
    }
    if (name === 'password') {
      setPassword(value);
      if (value.trim() === '') setPasswordError('Please provide password');
      else setPasswordError('');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    let valid = true;

    if (!username) {
      setUsernameError('Please provide username');
      valid = false;
    }
    if (!password) {
      setPasswordError('Please provide password');
      valid = false;
    }

    if (valid) {
      setLoading(true);
      try {
        const response = await api.post('/users/login', {
          username: username,
          password: password,
        });

        let data = response.data;
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (e) {
            setError('Login failed. Unexpected response format.');
            setLoading(false);
            return;
          }
        }

        if (!data || !data.role) {
          setError('Login failed. Server response missing expected fields.');
          setLoading(false);
          return;
        }

        localStorage.setItem('username', data.username);
        localStorage.setItem('role', data.role.toLowerCase().replace('_', '-'));
        localStorage.setItem('userId', data.userId.toString());
        if (data.token) {
          localStorage.setItem('token', data.token);
        }

        const userRole = data.role.toUpperCase();
        if (userRole === 'ADMIN') navigate('/admin');
        else if (userRole === 'DOCTOR') navigate('/doctor');
        else if (userRole === 'PATIENT') navigate('/patient');
        else if (userRole === 'SUPER_ADMIN') navigate('/super-admin-dashboard');
        else if (userRole === 'RECEPTIONIST') navigate('/receptionist');
        else navigate(`/${userRole.toLowerCase()}`);
      } catch (err) {
        setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className={styles.splitLayout}>
      {/* LEFT SIDE: Information Panel */}
      <div className={styles.leftPane}>
        <div className={styles.leftContent}>
          <h1 className={styles.mainTitle}>Role-Based Access Control</h1>
          <p className={styles.subtitle}>
            Secure, efficient, and role-specific access to hospital operations. 
            Each user sees only the tools and data they need.
          </p>
          
          <div className={styles.rolesList}>
            <div className={styles.roleCard}>
              <div className={`${styles.iconContainer} ${styles.adminIconBg}`}>
                <AdminIcon />
              </div>
              <div className={styles.roleInfo}>
                <h3>Administrator</h3>
                <p>Full system access — patient management, billing, staff, and audit logs.</p>
              </div>
            </div>

            <div className={styles.roleCard}>
              <div className={`${styles.iconContainer} ${styles.doctorIconBg}`}>
                <DoctorIcon />
              </div>
              <div className={styles.roleInfo}>
                <h3>Doctor & Medical Staff</h3>
                <p>Clinical operations — patient records, prescriptions, and appointment schedules.</p>
              </div>
            </div>

            <div className={styles.roleCard}>
              <div className={`${styles.iconContainer} ${styles.patientIconBg}`}>
                <PatientIcon />
              </div>
              <div className={styles.roleInfo}>
                <h3>Patient Portal</h3>
                <p>Self-service — book appointments, view medical records, and manage billing.</p>
              </div>
            </div>

            <div className={styles.roleCard}>
              <div className={`${styles.iconContainer} ${styles.receptionIconBg}`}>
                <ReceptionistIcon />
              </div>
              <div className={styles.roleInfo}>
                <h3>Receptionist</h3>
                <p>Front desk operations — registrations, appointment bookings, and inquiries.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Login Form */}
      <div className={styles.rightPane}>
        <div className={styles.loginFormContainer}>
          <div className={styles.logoHeader}>
            <div className={styles.logoWrapper}>
               <HospitalIcon />
            </div>
            <div>
              <h2>MedCenter</h2>
              <span>Hospital Management System</span>
            </div>
          </div>

          <div className={styles.welcomeText}>
            <h2>Welcome back</h2>
            <p>Sign in to access your dashboard</p>
          </div>

          <form onSubmit={handleLogin} className={styles.form}>
            {error && <div className={styles.errorMessage}>{error}</div>}

            <div className={styles.inputGroup}>
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                placeholder="Enter your username"
                value={username}
                onChange={handleInputChange}
                className={usernameError ? styles.inputError : ''}
              />
              {usernameError && <span className={styles.errorText}>{usernameError}</span>}
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="••••••••"
                value={password}
                onChange={handleInputChange}
                className={passwordError ? styles.inputError : ''}
              />
              {passwordError && <span className={styles.errorText}>{passwordError}</span>}
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
