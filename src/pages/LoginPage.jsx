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

  const initialRemaining = getRemainingSeconds();
  const [isLocked, setIsLocked]             = useState(initialRemaining > 0);
  const [lockCountdown, setLockCountdown]   = useState(initialRemaining > 0 ? initialRemaining : TOTAL_LOCK_SECS);

  const [warningAttempts, setWarningAttempts] = useState(0);
  const [showWarning, setShowWarning]         = useState(false);
  const [showForgot, setShowForgot]           = useState(false);
  const [forgotStep, setForgotStep]           = useState(1);
  const [activationEmail, setActivationEmail] = useState('');

  const navigate = useNavigate();

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

      const role = data.role.toUpperCase();
      if      (role === 'ADMIN')        navigate('/admin');
      else if (role === 'DOCTOR')       navigate('/doctor');
      else if (role === 'PATIENT')      navigate('/patient');
      else if (role === 'SUPER_ADMIN')  navigate('/super-admin-dashboard');
      else if (role === 'RECEPTIONIST') navigate('/receptionist');
      else                              navigate(`/${role.toLowerCase()}`);

    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Login failed. Please check your credentials.';
      setError(msg);
      if (msg.toLowerCase().includes('locked')) {
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

  /* ── Normal login form (2-step) ── */
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
            <h2>{step === 1 ? 'Sign in' : 'Welcome'}</h2>
            <p>{step === 1 ? 'Continue to MedCenter' : identifier}</p>
          </div>

          <div className={styles.formRelativeContainer}>
            <form onSubmit={step === 1 ? handleNext : handleLogin} className={styles.form}>

              {error && <div className={styles.errorMessage}>{error}</div>}

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
          </div>
        </div>
      </div>

    </div>
  );
};

export default Login;
