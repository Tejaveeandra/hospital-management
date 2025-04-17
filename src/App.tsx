import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './component/Navbar'; // Import Navbar component

import PatientPage from './pages/PatientPage';
import DoctorPage from './pages/DoctorPage';
import AdminPage from './pages/AdminPage';
import Login from './pages/LoginPage';

const App = () => {
  return (
    <Router>
      <div>
        <Navbar /> {/* Include the Navbar here */}

        
      
        <Routes>
         
          <Route path="/" element={<Login />} />

          
          <Route path="/patient" element={<PatientPage />} />
          <Route path="/doctor" element={<DoctorPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/super-admin-dashboard" element={<AdminPage />} /> {/* You can customize this */}
        </Routes>
      </div>
    </Router>
  );
};

export default App;
