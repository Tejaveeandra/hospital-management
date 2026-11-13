import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LoginPage.module.css';
import api from '../api/api';
import LockoutScreen from './LockoutScreen';
import WarningPopup from './WarningPopup';
import ForgotPasswordPage from './ForgotPasswordPage';

/* ─── Constants ─────────────────────────────────────── */
const LOCK_KEY         = 'loginLockUntil';
const LOCK_DURATION_MS = 15 * 60 * 1000;
const TOTAL_LOCK_SECS  = 15 * 60;

const getRemainingSeconds = () => {
  const lockUntil = parseInt(localStorage.getItem(LOCK_KEY) || '0', 10);
  const remaining = Math.floor((lockUntil - Date.now()) / 1000);
  return remaining > 0 ? remaining : 0;
};

/* ─── Hospital icon ─────────────────────────────────── */
const HospitalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.logoIcon}>
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
);

/* ─── Login page ────────────────────────────────────── */
const Login = () => {
  const [step, setStep]                     = useState(1);
  const [identifier, setIdentifier]         = useState('');
  const [password, setPassword]             = useState('');
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');
  const [identifierError, setIdentifierError] = useState('');
  const [passwordError, setPasswordError]   = useState('');

  localStorage.removeItem(LOCK_KEY);
  const initialRemaining = 0;
  const [isLocked, setIsLocked]             = useState(false);
  const [lockCountdown, setLockCountdown]   = useState(initialRemaining > 0 ? initialRemaining : TOTAL_LOCK_SECS);

  const [warningAttempts, setWarningAttempts] = useState(0);
  const [showWarning, setShowWarning]         = useState(false);
  const [showForgot, setShowForgot]           = useState(false);
  const [forgotStep, setForgotStep]           = useState(1);
  const [activationEmail, setActivationEmail] = useState('');
  const [isRegisteringPatient, setIsRegisteringPatient] = useState(false);
  const [regSuccess, setRegSuccess]           = useState('');
  const [regForm, setRegForm]                 = useState({
    patientName: '',
    username: '',
    email: '',
    password: '',
    contact: '',
    age: '',
    gender: 'Male',
  });

  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reason = params.get('reason');
    if (reason === 'inactivity') {
      setError('Session timed out after 15 minutes of inactivity for patient data safety. Please log in again.');
    } else if (reason === 'expired') {
      setError('Your session has expired. Please log in again.');
    }
  }, []);

  /* ── Countdown tick ── */
  useEffect(() => {
    let timer;
    if (isLocked && lockCountdown > 0) {
      timer = setInterval(() => {
        const remaining = getRemainingSeconds();
        if (remaining <= 0) {
          setIsLocked(false);
          setLockCountdown(TOTAL_LOCK_SECS);
          setError('');
          localStorage.removeItem(LOCK_KEY);
        } else {
          setLockCountdown(remaining);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLocked, lockCountdown]);

  /* ── Handlers ── */
  const handleUnlock = () => {
    localStorage.removeItem(LOCK_KEY);
    setIsLocked(false);
    setLockCountdown(TOTAL_LOCK_SECS);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'identifier') {
      setIdentifier(value);
      setIdentifierError(value.trim() === '' ? 'Please provide username or email' : '');
      setError('');
    }
    if (name === 'password') {
      setPassword(value);
      setPasswordError(value.trim() === '' ? 'Please provide password' : '');
      setError('');
    }
  };

  const handleRegChange = (e) => {
    setRegForm({ ...regForm, [e.target.name]: e.target.value });
    setError('');
  };

  const handlePatientSelfRegister = async (e) => {
    e.preventDefault();
    setError('');
    setRegSuccess('');
    setLoading(true);
    try {
      const cleanUsername = regForm.username.trim();
      // 1. Register user in auth-service (PATIENT role)
      await api.post('/users/register', {
        username: cleanUsername,
        email: regForm.email.trim(),
        password: regForm.password,
        role: 'PATIENT'
      });

      // 2. Log in to obtain JWT token so we can create the matching Patient record
      const loginRes = await api.post('/users/login', {
        username: cleanUsername,
        password: regForm.password
      });
      const loginData = typeof loginRes.data === 'string' ? JSON.parse(loginRes.data) : loginRes.data;

      if (loginData?.token) {
        localStorage.setItem('username', loginData.username);
        localStorage.setItem('role', 'patient');
        localStorage.setItem('userId', String(loginData.userId || ''));
        localStorage.setItem('token', loginData.token);
        if (loginData.refreshToken) localStorage.setItem('refreshToken', loginData.refreshToken);
        localStorage.setItem('permissions', JSON.stringify(loginData.permissions || []));

        // 3. Create Patient record in patient-service with exact same username
        await api.post('/patients/addPatient', {
          patientName: regForm.patientName.trim(),
          username: cleanUsername,
          contact: regForm.contact.trim(),
          age: Number(regForm.age),
          gender: regForm.gender,
          disease: 'General Consultation',
          date: new Date().toISOString().split('T')[0],
          prevMedication: 'None'
        });

        navigate('/patient');
        return;
      }

      setRegSuccess('Patient account created! Please sign in below.');
      setIsRegisteringPatient(false);
      setIdentifier(cleanUsername);
      setStep(2);
    } catch (err) {
      const msg = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response.data : 'Registration failed. Please check your details.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async (e) => {
    e.preventDefault();
    if (isLocked) return;
    
    if (!identifier.trim()) { 
      setIdentifierError('Please provide username or email'); 
      return; 
    }
    
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/users/check-status?identifier=${encodeURIComponent(identifier)}`);
      const data = res.data;
      if (!data.exists) {
        setError("Couldn't find your account");
      } else if (data.requiresActivation) {
        await api.post('/users/forgot-password/send-otp', { email: identifier });
        setActivationEmail(data.email);
        setForgotStep(2); // Skip to OTP step
        setShowForgot(true);
      } else {
        setStep(2);
      }
    } catch (err) {
      setError('An error occurred checking your account.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLocked) return;
    setError('');

    let valid = true;
    if (!password) { setPasswordError('Please provide password'); valid = false; }
    if (!valid) return;

    setLoading(true);
    try {
      const response = await api.post('/users/login', { username: identifier, password });
      let data = response.data;

      if (typeof data === 'string') {
        try { data = JSON.parse(data); }
        catch { setError('Login failed. Unexpected response format.'); setLoading(false); return; }
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
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
      if (data.permissions && Array.isArray(data.permissions)) {
        localStorage.setItem('permissions', JSON.stringify(data.permissions));
      } else {
        localStorage.setItem('permissions', JSON.stringify([]));
      }

      const role = data.role.toUpperCase().replace('-', '_');
      if (role === 'DOCTOR') {
        navigate('/doctor');
      } else if (role === 'PATIENT') {
        navigate('/patient');
      } else if (role === 'RECEPTIONIST') {
        navigate('/receptionist');
      } else if (role === 'SUPER_ADMIN') {
        navigate('/super-admin-dashboard');
      } else {
        navigate('/admin');
      }

    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Login failed. Please check your credentials.';
      setError(msg);
      if (false && msg.toLowerCase().includes('locked')) {
        const lockUntil = Date.now() + LOCK_DURATION_MS;
        localStorage.setItem(LOCK_KEY, lockUntil.toString());
        setIsLocked(true);
        setLockCountdown(getRemainingSeconds());
      } else {
        const match = msg.match(/(\d+)\s+attempt/i);
        if (match) {
          const remaining = parseInt(match[1], 10);
          const attempts = 5 - remaining;
          if (attempts >= 3) {
            setWarningAttempts(attempts);
            setShowWarning(true);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Show full-screen lockout if account is locked ── */
  if (isLocked) {
    return <LockoutScreen lockCountdown={lockCountdown} onUnlock={handleUnlock}/>;
  }

  /* ── Show Forgot Password or Activation screen ── */
  if (showForgot) {
    return <ForgotPasswordPage 
      onBack={() => setShowForgot(false)} 
      initialEmail={activationEmail} 
      initialStep={forgotStep} 
    />;
  }

  /* ── Normal login form (2-step) or Patient Self-Registration ── */
  return (
    <div className={styles.splitLayout}>
      
      {showWarning && (
        <WarningPopup 
          attempts={warningAttempts} 
          onDismiss={() => setShowWarning(false)} 
        />
      )}

      {/* LEFT: illustration */}
      <div className={styles.leftPane}
        style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/login-illustration.png)` }}>
        <div className={styles.illustrationOverlay}>
          <div className={styles.brandBadge}>
            <div className={styles.logoWrapper}><HospitalIcon /></div>
            <div>
              <h2 className={styles.brandName}>MedCenter</h2>
              <span className={styles.brandTagline}>Hospital Management System</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: login form */}
      <div className={styles.rightPane}
        style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/login-right-bg.png)` }}>
        <div className={styles.loginFormContainer}>

          <div className={styles.welcomeText}>
            <h2>{isRegisteringPatient ? 'Patient Registration' : step === 1 ? 'Sign in' : 'Welcome'}</h2>
            <p>{isRegisteringPatient ? 'Create your MedCenter Patient Portal account' : step === 1 ? 'Continue to MedCenter' : identifier}</p>
          </div>

          <div className={styles.formRelativeContainer}>
            {isRegisteringPatient ? (
              <form onSubmit={handlePatientSelfRegister} className={styles.form}>
                {error && <div className={styles.errorMessage}>{error}</div>}
                {regSuccess && <div className={styles.successMessage}>{regSuccess}</div>}

                <div className={styles.inputGroup}>
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="patientName"
                    placeholder="John Doe"
                    value={regForm.patientName}
                    onChange={handleRegChange}
                    required
                  />
                </div>

                <div className={styles.registerFormGrid}>
                  <div className={styles.inputGroup}>
                    <label>Username *</label>
                    <input
                      type="text"
                      name="username"
                      placeholder="john.doe"
                      value={regForm.username}
                      onChange={handleRegChange}
                      minLength={3}
                      required
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Phone (10 digits) *</label>
                    <input
                      type="tel"
                      name="contact"
                      placeholder="9876543210"
                      pattern="[0-9]{10}"
                      value={regForm.contact}
                      onChange={handleRegChange}
                      required
                    />
                  </div>
                </div>

                <div className={styles.registerFormGrid}>
                  <div className={styles.inputGroup}>
                    <label>Age *</label>
                    <input
                      type="number"
                      name="age"
                      placeholder="30"
                      min="0"
                      max="120"
                      value={regForm.age}
                      onChange={handleRegChange}
                      required
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Gender *</label>
                    <select name="gender" value={regForm.gender} onChange={handleRegChange} required>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="patient@example.com"
                    value={regForm.email}
                    onChange={handleRegChange}
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Password (min 8 chars) *</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    minLength={8}
                    value={regForm.password}
                    onChange={handleRegChange}
                    required
                  />
                </div>

                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? 'Registering...' : 'Register as Patient'}
                </button>

                <div className={styles.switchModeBox}>
                  <button
                    type="button"
                    className={styles.switchModeBtn}
                    onClick={() => {
                      setIsRegisteringPatient(false);
                      setError('');
                    }}
                  >
                    Already have an account? Sign In
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={step === 1 ? handleNext : handleLogin} className={styles.form}>

                {error && <div className={styles.errorMessage}>{error}</div>}
                {regSuccess && <div className={styles.successMessage}>{regSuccess}</div>}

                {step === 1 ? (
                  <div className={styles.inputGroup}>
                    <label htmlFor="identifier">Username or Email</label>
                    <input
                      type="text" id="identifier" name="identifier"
                      placeholder="Enter your username or email"
                      value={identifier} onChange={handleInputChange}
                      className={identifierError ? styles.inputError : ''}
                      autoFocus
                    />
                    {identifierError && <span className={styles.errorText}>{identifierError}</span>}
                  </div>
                ) : (
                  <div className={styles.inputGroup}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label htmlFor="password">Password</label>
                    </div>
                    <input
                      type="password" id="password" name="password"
                      placeholder="••••••••"
                      value={password} onChange={handleInputChange}
                      className={passwordError ? styles.inputError : ''}
                      autoFocus
                    />
                    {passwordError && <span className={styles.errorText}>{passwordError}</span>}
                  </div>
                )}

                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? 'Please wait...' : step === 1 ? 'Next' : 'Sign In'}
                </button>

                {step === 1 && (
                  <div className={styles.switchModeBox}>
                    <div className={styles.switchModeText}>New patient visiting MedCenter?</div>
                    <button
                      type="button"
                      className={styles.switchModeBtn}
                      onClick={() => {
                        setIsRegisteringPatient(true);
                        setError('');
                      }}
                    >
                      Register as New Patient
                    </button>
                  </div>
                )}

                {step === 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      setActivationEmail('');
                      setForgotStep(1);
                      setShowForgot(true);
                    }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#3b82f6', fontSize: '13px', fontWeight: 500,
                      textAlign: 'center', width: '100%', marginTop: 4,
                      textDecoration: 'underline', textUnderlineOffset: 3,
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#60a5fa'}
                    onMouseLeave={e => e.currentTarget.style.color = '#3b82f6'}
                  >
                    Forgot Password?
                  </button>
                )}
                
                {step === 2 && (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#64748b', fontSize: '13px', fontWeight: 500,
                      textAlign: 'center', width: '100%', marginTop: 12,
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
                    onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                  >
                    Use a different account
                  </button>
                )}

              </form>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Login;
