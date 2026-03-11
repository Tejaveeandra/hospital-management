import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LoginPage.module.css';
import api from '../api/api';

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
      if (value.trim() === '') {
        setUsernameError('Please provide username');
      } else {
        setUsernameError('');
      }
    }
    if (name === 'password') {
      setPassword(value);
      if (value.trim() === '') {
        setPasswordError('Please provide password');
      } else {
        setPasswordError('');
      }
    }
  };

  const handleLogin = async () => {
    // Reset error
    setError('');

    // Check if the fields are empty and set errors
    if (!username) {
      setUsernameError('Please provide username');
    }
    if (!password) {
      setPasswordError('Please provide password');
    }

    if (username && password) {
      setLoading(true);
      try {
        const response = await api.post('/users/login', {
          username: username,
          password: password,
        });

        const data = response.data;

        // Store session info (Token is now handled by HttpOnly cookie and stripped from response)
        localStorage.setItem('username', data.username);
        localStorage.setItem('role', data.role.toLowerCase().replace('_', '-'));
        localStorage.setItem('userId', data.userId.toString());

        // Redirect based on role returned from backend
        // Redirect based on role returned from backend
        const userRole = data.role.toUpperCase(); // Ensure uppercase for comparison
        if (userRole === 'ADMIN') {
          navigate('/admin');
        } else if (userRole === 'DOCTOR') {
          navigate('/doctor');
        } else if (userRole === 'PATIENT') {
          navigate('/patient');
        } else if (userRole === 'SUPER_ADMIN') {
          navigate('/super-admin-dashboard');
        } else if (userRole === 'RECEPTIONIST') {
          navigate('/receptionist');
        } else {
          navigate(`/${userRole.toLowerCase()}`);
        }
      } catch (err) {
        console.error('Login error:', err);
        if (err.response) console.error('Error Response Data:', err.response.data);
        setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className={styles['login-container']}>
      <h2>Login</h2>

      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

      <label htmlFor="username">Username :</label>
      <input
        type="text"
        name="username"
        placeholder="Enter Username"
        value={username}
        onChange={handleInputChange}
        required
      />
      {usernameError && <span style={{ color: 'red' }}>{usernameError}</span>}
      <br /><br />

      <label htmlFor="password">Password:</label>
      <input
        type="password"
        name="password"
        placeholder="Password"
        value={password}
        onChange={handleInputChange}
        required
      />
      {passwordError && <span style={{ color: 'red' }}>{passwordError}</span>}
      <br /><br />

      <button onClick={handleLogin} disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </div>
  );
};

export default Login;
