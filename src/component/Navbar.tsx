import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import "./Navbar.css"

const Navbar = () => {
  const location = useLocation();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    // Get role from localStorage when the component is mounted
    const storedRole = localStorage.getItem('role');
    console.log('Stored role:', storedRole); // Debug log
    setRole(storedRole); // Set role in the state
  }, [location]); // Re-run the effect when the location changes

  // If the user is on the login page, don't render the navbar
  if (location.pathname === '/') {
    return null;
  }

  // Determine the page name based on role
  const getPageName = () => {
    switch (role) {
      case 'patient':
        return 'Patient Page';
      case 'doctor':
        return 'Doctor Page';
      case 'admin':
        return 'Admin Page';
      case 'super-admin':
        return 'Super Admin Dashboard';
      default:
        return 'Unknown Page';
    }
  };

  return (
    <nav className="navigation">
      <ul className="nav-links">
        <li className="nav-item active-page"> {/* Apply active-page by default */}
          <span className="nav-link">{getPageName()}</span>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;