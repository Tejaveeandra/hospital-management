import React, { useState, useEffect } from 'react';
import styles from './WarningPopup.module.css';

const LOCK_AT = 5;

function WarningPopup({ attempts, onDismiss }) {
  const remaining = LOCK_AT - attempts;
  const [visible, setVisible] = useState(false);

  useEffect(() => { 
    requestAnimationFrame(() => setVisible(true)); 
  }, []);

  const dismiss = () => { 
    setVisible(false); 
    setTimeout(onDismiss, 320); 
  };

  return (
    <div className={styles.overlay} style={{ opacity: visible ? 1 : 0 }}>
      {/* card */}
      <div 
        className={styles.card}
        style={{ transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.97)" }}
      >
        {/* top ─ icon + badge */}
        <div className={styles.topSection}>
          {/* animated warning icon */}
          <div className={styles.iconContainer}>
            {/* outer pulse rings */}
            {[0, 1, 2].map(i => (
              <div 
                key={i} 
                className={styles.pulseRing}
                style={{
                  width: 64 + i * 22, 
                  height: 64 + i * 22,
                  animation: `warnPing 2s ease-out ${i * 0.6}s infinite`,
                }}
              />
            ))}
            {/* icon circle */}
            <div className={styles.iconCircle}>
              <div className={styles.iconGlow} />
              {/* triangle warning */}
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className={styles.iconSvg}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
          </div>

          {/* status badge */}
          <div className={styles.statusBadge}>
            <div className={styles.badgeDot} />
            <span className={styles.badgeText}>
              Security Warning
            </span>
          </div>
        </div>

        {/* headline */}
        <h2 className={styles.headline}>
          Invalid Credentials Detected
        </h2>
        <p className={styles.description}>
          You have entered an incorrect password {attempts} time{attempts > 1 ? "s" : ""}.
          For your security, please verify your identity.
        </p>

        {/* attempts counter block */}
        <div className={styles.counterBlock}>
          <div className={styles.counterHeader}>
            <span className={styles.counterLabel}>
              Failed Attempts
            </span>
            <span className={styles.counterValue}>
              {attempts} / {LOCK_AT}
            </span>
          </div>

          {/* pip row */}
          <div className={styles.pipRow}>
            {Array.from({ length: LOCK_AT }).map((_, i) => (
              <div 
                key={i} 
                className={styles.pip}
                style={{
                  background: i < attempts
                    ? "linear-gradient(to right,#dc2626,#ef4444)"
                    : "rgba(255,255,255,0.07)",
                  boxShadow: i < attempts ? "0 0 8px #ef444466" : "none",
                }}
              />
            ))}
          </div>

          {/* remaining warning */}
          <div className={styles.remainingWarning}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b"
              strokeWidth="2" strokeLinecap="round" className={styles.warningIcon}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div>
              <p className={styles.warningTitle}>
                {remaining} attempt{remaining !== 1 ? "s" : ""} remaining
              </p>
              <p className={styles.warningText}>
                After {remaining} more incorrect attempt{remaining !== 1 ? "s" : ""}, your account will be
                locked for <span className={styles.warningHighlight}>15 minutes</span>.
              </p>
            </div>
          </div>
        </div>

        {/* lock-preview strip */}
        <div className={styles.lockPreview}>
          <div className={styles.lockPreviewIcon}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div className={styles.lockPreviewDetails}>
            <div className={styles.lockPreviewTitle}>Account lockout duration</div>
            <div className={styles.lockPreviewSub}>15:00 minutes · Admin will be notified</div>
          </div>
          <div className={styles.lockPreviewTime}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            15:00
          </div>
        </div>

        {/* CTA button */}
        <button onClick={dismiss} className={styles.ctaButton}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          I Understand — Try Again
        </button>

        {/* footer */}
        <div className={styles.footer}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          MedCenter Security · HIPAA Compliant
        </div>
      </div>
    </div>
  );
}

export default WarningPopup;
