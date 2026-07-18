import React, { useState, useEffect, useRef } from 'react';
import styles from './ForgotPasswordPage.module.css';
import api from '../api/api';

const FLOAT_CROSSES = [
  { x: '7%',  y: '15%', s: 26, op: 0.07, d: 0   },
  { x: '88%', y: '10%', s: 18, op: 0.05, d: 0.5 },
  { x: '4%',  y: '68%', s: 32, op: 0.08, d: 1   },
  { x: '91%', y: '70%', s: 20, op: 0.06, d: 1.4 },
  { x: '45%', y: '6%',  s: 14, op: 0.04, d: 0.8 },
  { x: '70%', y: '88%', s: 22, op: 0.06, d: 1.8 },
];

/* ── Password strength calculator ── */
function calcStrength(pass) {
  if (!pass) return 0;
  let s = 0;
  if (pass.length >= 8)          s++;
  if (/[A-Z]/.test(pass))        s++;
  if (/[0-9]/.test(pass))        s++;
  if (/[^A-Za-z0-9]/.test(pass)) s++;
  return s;
}
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];

/* ══════════════════════════════════════════════════════════════════════════ */
function ForgotPasswordPage({ onBack }) {
  const [step, setStep]               = useState(1);
  const [email, setEmail]             = useState('');
  const [otp, setOtp]                 = useState(['', '', '', '', '', '']);
  const [newPass, setNewPass]         = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [animDir, setAnimDir]         = useState('forward');
  const [visible, setVisible]         = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const resendRef                     = useRef(null);

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  useEffect(() => {
    if (step === 2) {
      setResendTimer(30);
      resendRef.current = setInterval(() => {
        setResendTimer(t => {
          if (t <= 1) { clearInterval(resendRef.current); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(resendRef.current);
  }, [step]);

  const goStep = (next, dir = 'forward') => {
    setAnimDir(dir);
    setError('');
    setVisible(false);
    setTimeout(() => { setStep(next); setVisible(true); }, 280);
  };

  const cardStyle = {
    opacity: visible ? 1 : 0,
    transform: visible
      ? 'translateX(0) scale(1)'
      : `translateX(${animDir === 'forward' ? 40 : -40}px) scale(0.97)`,
  };

  const strength = calcStrength(newPass);
  const strengthLabel = STRENGTH_LABELS[strength];
  const strengthColor = STRENGTH_COLORS[strength];

  /* ── OTP handlers ── */
  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[i] = val; setOtp(next);
    if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
  };
  const handleOtpKey = (i, val, e) => {
    if (e.key === 'Backspace' && !val && i > 0)
      document.getElementById(`otp-${i - 1}`)?.focus();
  };

  /* ── API: Step 1 → Send OTP ── */
  const handleSendOtp = async () => {
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/users/forgot-password/send-otp', { email });
      goStep(2);
    } catch (err) {
      setError(err.response?.data || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── API: Step 2 → Resend OTP ── */
  const handleResend = async () => {
    setResendTimer(30);
    setOtp(['', '', '', '', '', '']);
    resendRef.current = setInterval(() => {
      setResendTimer(t => { if (t <= 1) { clearInterval(resendRef.current); return 0; } return t - 1; });
    }, 1000);
    try {
      await api.post('/users/forgot-password/send-otp', { email });
    } catch (err) {
      setError(err.response?.data || 'Failed to resend OTP.');
    }
  };

  /* ── API: Step 3 → Reset Password ── */
  const handleReset = async () => {
    if (strength < 2 || confirmPass !== newPass) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/users/forgot-password/reset', {
        email,
        otp: otp.join(''),
        newPassword: newPass,
      });
      goStep(4);
    } catch (err) {
      setError(err.response?.data || 'Failed to reset password. Please try again.');
      // If OTP is wrong, go back to step 2
      if (err.response?.data?.toLowerCase().includes('otp') ||
          err.response?.data?.toLowerCase().includes('invalid')) {
        goStep(2);
      }
    } finally {
      setLoading(false);
    }
  };

  const otpComplete = otp.every(d => d);
  const passValid   = strength >= 4 && confirmPass === newPass && confirmPass.length > 0;

  /* ═══════════════════════════════════════════════════ RENDER */
  return (
    <div className={styles.fullPage}>

      {/* hex bg */}
      <svg className={styles.hexBg}>
        <defs>
          <pattern id="fhex" x="0" y="0" width="56" height="48" patternUnits="userSpaceOnUse">
            <polygon points="28,2 54,16 54,32 28,46 2,32 2,16" fill="none" stroke="#3b82f6" strokeWidth="0.8"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#fhex)"/>
      </svg>

      {/* radial glow */}
      <div className={styles.radialGlow}/>

      {/* floating medical crosses */}
      {FLOAT_CROSSES.map((c, i) => (
        <div key={i} className={styles.floatCross}
          style={{ left: c.x, top: c.y, opacity: c.op,
            animation: `floatUp 7s ease-in-out ${c.d}s infinite alternate` }}>
          <svg width={c.s} height={c.s} viewBox="0 0 40 40">
            <rect x="14" y="0"  width="12" height="40" rx="3" fill="#60a5fa"/>
            <rect x="0"  y="14" width="40" height="12" rx="3" fill="#60a5fa"/>
          </svg>
        </div>
      ))}

      {/* ECG strip */}
      <div className={styles.ecgStrip}>
        <svg className={styles.ecgSvg} width="200%" height="48" viewBox="0 0 2400 48" preserveAspectRatio="none">
          {Array.from({ length: 12 }).map((_, i) => (
            <g key={i} transform={`translate(${i * 200},0)`}>
              <polyline points="0,24 60,24 88,24 104,6 116,42 132,24 154,24 162,18 170,24 240,24"
                fill="none" stroke="#2563eb" strokeWidth="1.4"/>
            </g>
          ))}
        </svg>
      </div>

      {/* top progress bar */}
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${((step - 1) / 3) * 100}%` }}/>
      </div>

      {/* ── CARD ── */}
      <div className={styles.card} style={cardStyle}>

        {/* logo row */}
        <div className={styles.logoRow}>
          <div className={styles.logoIcon}>
            <svg width="15" height="15" viewBox="0 0 40 40">
              <rect x="14" y="0"  width="12" height="40" rx="2" fill="#60a5fa"/>
              <rect x="0"  y="14" width="40" height="12" rx="2" fill="#60a5fa"/>
            </svg>
          </div>
          <div>
            <div className={styles.logoLabel}>MedCenter HMS</div>
            <div className={styles.logoSub}>Password Recovery</div>
          </div>
          <button onClick={onBack} className={styles.backBtn}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to login
          </button>
        </div>

        {/* step dots */}
        <div className={styles.stepsRow}>
          {[1, 2, 3].map(s => (
            <div key={s} className={styles.stepItem}>
              <div className={styles.stepCircleWrap}>
                <div className={`${styles.stepCircle} ${step > s ? styles.done : step === s ? styles.active : styles.inactive}`}>
                  {step > s
                    ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    : s}
                </div>
                <span className={`${styles.stepLabel} ${step >= s ? '' : styles.dim}`}>
                  {['Email', 'Verify', 'Reset'][s - 1]}
                </span>
              </div>
              {s < 3 && (
                <div className={`${styles.stepConnector} ${step > s ? styles.filled : styles.empty}`}/>
              )}
            </div>
          ))}
        </div>

        {/* error banner */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 16,
            color: '#f87171', fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* ══ STEP 1 — Email ══ */}
        {step === 1 && (
          <div className={styles.formGap}>
            <div>
              <h2 className={styles.stepTitle}>Forgot your password?</h2>
              <p className={styles.stepDesc}>Enter your registered email address and we'll send a 6-digit verification code.</p>
            </div>

            <div>
              <label className={styles.fieldLabel}>Email Address</label>
              <div className={styles.inputWrap}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  className={styles.inputIcon}>
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input type="email" className={styles.input} value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                  placeholder="you@medcenter.com"/>
              </div>
            </div>

            <div className={styles.infoStrip}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className={styles.infoStripText}>
                The OTP expires in <span className={styles.infoHighlight}>10 minutes</span>. Check your spam folder if you don't see it.
              </p>
            </div>

            <button className={`${styles.ctaBtn} ${email ? styles.active : styles.disabled}`}
              onClick={handleSendOtp} disabled={!email || loading}>
              {loading ? 'Sending...' : 'Send Verification Code →'}
            </button>
          </div>
        )}

        {/* ══ STEP 2 — OTP ══ */}
        {step === 2 && (
          <div className={styles.formGap}>
            <div>
              <h2 className={styles.stepTitle}>Enter verification code</h2>
              <p className={styles.stepDesc}>
                We sent a 6-digit code to <span style={{ color: '#60a5fa', fontWeight: 500 }}>{email}</span>
              </p>
            </div>

            {/* OTP input boxes */}
            <div className={styles.otpRow}>
              {otp.map((digit, i) => (
                <input
                  key={i} id={`otp-${i}`}
                  className={styles.otpBox}
                  type="text" inputMode="numeric" maxLength={1} value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKey(i, digit, e)}
                  style={{
                    background: digit ? 'rgba(37,99,235,0.12)' : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${digit ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`,
                    boxShadow: digit ? '0 0 12px rgba(37,99,235,0.3)' : 'none',
                  }}
                />
              ))}
            </div>

            {/* pip progress */}
            <div className={styles.pipRow}>
              {otp.map((d, i) => (
                <div key={i} className={styles.pip}
                  style={{
                    width: d ? 22 : 8,
                    background: d ? '#2563eb' : 'rgba(255,255,255,0.08)',
                    boxShadow: d ? '0 0 6px rgba(37,99,235,0.5)' : 'none',
                  }}/>
              ))}
            </div>

            {/* resend row */}
            <div className={styles.resendRow}>
              <span>Didn't receive the code?</span>
              {resendTimer > 0
                ? <span className={styles.resendTimer}>Resend in {resendTimer}s</span>
                : <button className={styles.resendBtn} onClick={handleResend}>Resend code</button>
              }
            </div>

            <button className={`${styles.ctaBtn} ${otpComplete ? styles.active : styles.disabled}`}
              onClick={() => otpComplete && goStep(3)} disabled={!otpComplete}>
              Verify Code →
            </button>

            <button className={styles.backLink} onClick={() => goStep(1, 'back')}>
              ← Change email address
            </button>
          </div>
        )}

        {/* ══ STEP 3 — New Password ══ */}
        {step === 3 && (
          <div className={styles.formGap}>
            <div>
              <h2 className={styles.stepTitle}>Set new password</h2>
              <p className={styles.stepDesc}>Choose a strong password for your account.</p>
            </div>

            {/* new password */}
            <div>
              <label className={styles.fieldLabel}>New Password</label>
              <div className={styles.inputWrap}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" className={styles.inputIcon}>
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  type={showNew ? 'text' : 'password'}
                  className={`${styles.input} ${styles.inputEyeRight}`}
                  value={newPass} onChange={e => setNewPass(e.target.value)}
                  placeholder="Min 8 characters"/>
                <button className={styles.eyeBtn} onClick={() => setShowNew(!showNew)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round">
                    {showNew
                      ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                    }
                  </svg>
                </button>
              </div>

              {/* strength meter */}
              {newPass && (
                <>
                  <div className={styles.strengthBarRow}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={styles.strengthSeg}
                        style={{
                          background: i <= strength ? strengthColor : 'rgba(255,255,255,0.07)',
                          boxShadow: i <= strength ? `0 0 6px ${strengthColor}60` : 'none',
                        }}/>
                    ))}
                  </div>
                  <div className={styles.strengthMeta}>
                    <span className={styles.strengthMetaLabel}>Password strength</span>
                    <span style={{ color: strengthColor, fontWeight: 600 }}>{strengthLabel}</span>
                  </div>
                </>
              )}

              {/* requirements */}
              <div className={styles.reqGrid}>
                {[
                  { label: 'Min 8 characters', ok: newPass.length >= 8 },
                  { label: 'Uppercase letter',  ok: /[A-Z]/.test(newPass) },
                  { label: 'Number',            ok: /[0-9]/.test(newPass) },
                  { label: 'Special character', ok: /[^A-Za-z0-9]/.test(newPass) },
                ].map(r => (
                  <div key={r.label} className={styles.reqItem}>
                    <div className={`${styles.reqDot} ${r.ok ? styles.ok : styles.fail}`}>
                      {r.ok && (
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>
                    <span style={{ color: r.ok ? '#4ade80' : '#334155' }}>{r.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* confirm password */}
            <div>
              <label className={styles.fieldLabel}>Confirm Password</label>
              <div className={styles.inputWrap}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" className={styles.inputIcon}>
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className={`${styles.input} ${styles.inputEyeRight}`}
                  value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                  placeholder="Repeat password"
                  style={{
                    borderColor: confirmPass && confirmPass !== newPass
                      ? '#ef4444'
                      : confirmPass && confirmPass === newPass
                        ? '#22c55e'
                        : 'rgba(255,255,255,0.1)',
                  }}/>
                <button className={styles.eyeBtn} onClick={() => setShowConfirm(!showConfirm)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round">
                    {showConfirm
                      ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                    }
                  </svg>
                </button>
              </div>
              {confirmPass && confirmPass !== newPass && (
                <div className={styles.matchMsg} style={{ color: '#ef4444' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  Passwords do not match
                </div>
              )}
              {confirmPass && confirmPass === newPass && (
                <div className={styles.matchMsg} style={{ color: '#22c55e' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  Passwords match
                </div>
              )}
            </div>

            <button className={`${styles.ctaBtn} ${passValid ? styles.active : styles.disabled}`}
              onClick={handleReset} disabled={!passValid || loading}>
              {loading ? 'Resetting...' : 'Reset Password →'}
            </button>
          </div>
        )}

        {/* ══ STEP 4 — Success ══ */}
        {step === 4 && (
          <div className={styles.successWrap}>
            {/* animated icon */}
            <div className={styles.successIconWrap}>
              {[0, 1].map(i => (
                <div key={i} className={styles.successPulse}
                  style={{
                    width: 72 + i * 24, height: 72 + i * 24,
                    animation: `medPing 2s ease-out ${i * 0.6}s infinite`,
                  }}/>
              ))}
              <div className={styles.successIcon}>
                <div className={styles.successIconGlow}/>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e"
                  strokeWidth="2.5" strokeLinecap="round" style={{ position: 'relative', zIndex: 10 }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
            </div>

            <div className={styles.successText}>
              <h2 className={styles.successTitle}>Password Reset!</h2>
              <p className={styles.successDesc}>
                Your password has been successfully updated.<br/>
                You can now sign in with your new credentials.
              </p>
            </div>

            <div className={styles.confirmStrip}>
              <div className={styles.confirmStripIcon}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <div>
                <div className={styles.confirmStripTitle}>Confirmation sent</div>
                <div className={styles.confirmStripEmail}>{email}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" style={{ marginLeft: 'auto' }}>
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>

            <button className={`${styles.ctaBtn} ${styles.active}`} onClick={onBack}>
              Back to Sign In
            </button>

            <div className={styles.securityFooter}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              MedCenter Security · HIPAA Compliant
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
