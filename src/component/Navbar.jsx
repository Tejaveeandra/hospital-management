import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from "./Navbar.module.css";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [username, setUsername] = useState(null);

  useEffect(() => {
    // Get role and username from localStorage when the component is mounted or location changes
    const storedRole = localStorage.getItem('role');
    const storedUsername = localStorage.getItem('username');
    setRole(storedRole);
    setUsername(storedUsername);
  }, [location]);

  // If the user is on the login page or an admin page, don't render the global navbar
  if (location.pathname === '/' || location.pathname === '/admin' || location.pathname === '/super-admin-dashboard' || !localStorage.getItem('_raja_t')) {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('_raja_t');
    localStorage.removeItem('token'); // Keep for legacy if needed
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    navigate('/');
  };

  // Determine the page name based on role
  const getPageName = () => {
    switch (role) {
      case 'patient':
        return 'Patient Portal';
      case 'doctor':
        return 'Doctor Dashboard';
      case 'admin':
      case 'ADMIN':
        return 'Admin Panel';
      case 'super-admin':
      case 'SUPER_ADMIN':
        return 'Super Admin Dashboard';
      case 'receptionist':
      case 'RECEPTIONIST':
        return 'Receptionist Portal';
      default:
        return 'Hospital Management';
    }
  };

  return (
    <nav className={styles.navigation}>
      <div className={styles['nav-content']}>
        <ul className={styles['nav-links']}>
          <li className={`${styles['nav-item']} ${styles['active-page']}`}>
            <span className={styles['nav-link']}>{getPageName()}</span>
          </li>
        </ul>
        <div className={styles['user-info']}>
          {username && <span className={styles['username']}>Welcome, {username}</span>}
          <button onClick={handleLogout} className={styles['logout-btn']}>Logout</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;