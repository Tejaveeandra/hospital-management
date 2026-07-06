import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LoginPage.module.css';
import api from '../api/api';

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

    if (!username) { setUsernameError('Please provide username'); valid = false; }
    if (!password) { setPasswordError('Please provide password'); valid = false; }

    if (valid) {
      setLoading(true);
      try {
        const response = await api.post('/users/login', { username, password });

        let data = response.data;
        if (typeof data === 'string') {
          try { data = JSON.parse(data); }
          catch (e) {
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
        if (data.token) localStorage.setItem('token', data.token);

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
      {/* LEFT SIDE: Illustration */}
      <div
        className={styles.leftPane}
        style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/login-illustration.png)` }}
      >
        <div className={styles.illustrationOverlay}>
          <div className={styles.brandBadge}>
            <div className={styles.logoWrapper}>
              <HospitalIcon />
            </div>
            <div>
              <h2 className={styles.brandName}>MedCenter</h2>
              <span className={styles.brandTagline}>Hospital Management System</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Login Form */}
      <div
        className={styles.rightPane}
        style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/login-right-bg.png)` }}
      >
        <div className={styles.loginFormContainer}>
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
