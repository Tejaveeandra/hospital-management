import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

const Login = () => {
  
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  
  const [userIdError, setUserIdError] = useState('');  // For user ID validation error
  const [passwordError, setPasswordError] = useState('');  // For password validation error

  const navigate = useNavigate();

  // Handle form input changes and validation
  const handleInputChange = (e: { target: { name: any; value: any; }; }) => {
   
    const { name, value } = e.target;
    
    if (name === 'userId') {
      setUserId(value);
      if (value.trim() === '') {
        setUserIdError('Please provide user ID');
      } else {
        setUserIdError('');
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

  const handleLogin = () => {
    // Check if the fields are empty and set errors
    if (!userId) {
      setUserIdError('Please provide user ID');
    }
    if (!password) {
      setPasswordError('Please provide password');
    }

    // If both fields are filled, proceed with login
    if (userId && password) {
      // Store the role in localStorage to simulate session
      localStorage.setItem('role', role);
      navigate(`/${role}`); // Redirect to role-specific page
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      
      <label htmlFor="userId">User ID :</label>
      <input
        type="text"
        name="userId"
        placeholder="Enter 6-Digit Number"
        value={userId}
        onChange={handleInputChange}
        required
        maxLength={6}
      />
      {userIdError && <span style={{ color: 'red' }}>{userIdError}</span>} {/* Show error message for user ID */}
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
      {passwordError && <span style={{ color: 'red' }}>{passwordError}</span>} {/* Show error message for password */}
      <br /><br />
      
      <label htmlFor="level">Level of Login</label>
      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="super-admin">Super Admin</option>
        <option value="admin">Admin</option>
        <option value="doctor">Doctor</option>
        <option value="patient">Patient</option>
      </select>
      <br /><br />
      
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default Login;
