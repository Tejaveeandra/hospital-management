import React, { useEffect } from 'react';
import styles from './LockoutScreen.module.css';

const TOTAL_LOCK_SECS = 15 * 60;
const ECG_PTS = '0,48 60,48 88,48 104,8 116,88 132,48 154,48 162,36 170,48 240,48';

/* ─── Floating cross positions ─── */
const PARTICLES = [
  { x: '9%',  y: '14%', s: 30, op: 0.09, d: 0,   r: 0   },
  { x: '86%', y: '9%',  s: 20, op: 0.07, d: 0.5, r: 15  },
  { x: '5%',  y: '70%', s: 38, op: 0.10, d: 1,   r: -8  },
  { x: '90%', y: '62%', s: 24, op: 0.08, d: 1.5, r: 20  },
  { x: '48%', y: '5%',  s: 16, op: 0.06, d: 0.3, r: -12 },
  { x: '22%', y: '86%', s: 22, op: 0.07, d: 1.8, r: 10  },
  { x: '73%', y: '88%', s: 18, op: 0.06, d: 0.7, r: -5  },
  { x: '14%', y: '42%', s: 14, op: 0.05, d: 1.2, r: 18  },
  { x: '80%', y: '38%', s: 14, op: 0.05, d: 0.9, r: -15 },
  { x: '60%', y: '92%', s: 26, op: 0.08, d: 0.4, r: 8   },
  { x: '35%', y: '7%',  s: 12, op: 0.05, d: 2.0, r: -20 },
];

/* ─── 7-segment digit display ─── */
const SegDisplay = ({ chars }) => (
  <div className={styles.segRow}>
    {chars.map((ch, i) => (
      <div key={i} className={styles.segDigit}>{ch}</div>
    ))}
  </div>
);

/* ════════════════════════════════════
   LockoutScreen component
════════════════════════════════════ */
const LockoutScreen = ({ lockCountdown, onUnlock }) => {
  /* hide body scrollbar while lockout is visible */
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const remaining   = lockCountdown;
  const pct         = Math.max(0, Math.min(1, remaining / TOTAL_LOCK_SECS));
  const R = 84, THICK = 11;
  const C           = 2 * Math.PI * R;
  const dash        = C * pct;
  const mins        = String(Math.floor(remaining / 60)).padStart(2, '0');
  const secs        = String(remaining % 60).padStart(2, '0');

  /* colour changes as time runs out: red → amber → green */
  const ringColor   = pct > 0.5 ? '#ef4444' : pct > 0.25 ? '#f59e0b' : '#22c55e';
  const ringRgb     = pct > 0.5 ? '239,68,68' : pct > 0.25 ? '245,158,11' : '34,197,94';

  /* CSS custom properties injected at root — used throughout the CSS module */
  const cssVars = { '--lk-color': ringColor, '--lk-rgb': ringRgb };

  return (
    <div className={styles.lockWrapper} style={cssVars}>

      {/* scanline */}
      <div className={styles.scanline}/>

      {/* colour-reactive radial glow */}
      <div className={styles.radialGlow}/>

      {/* hex grid */}
      <svg className={styles.hexGrid}>
        <defs>
          <pattern id="lkHex" x="0" y="0" width="56" height="48" patternUnits="userSpaceOnUse">
            <polygon points="28,2 54,16 54,32 28,46 2,32 2,16" fill="none" stroke="#3b82f6" strokeWidth="0.8"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#lkHex)"/>
      </svg>

      {/* floating medical crosses */}
      {PARTICLES.map((p, i) => (
        <div key={i} className={styles.crossParticle}
          style={{ left: p.x, top: p.y, opacity: p.op, animationDelay: `${p.d}s` }}>
          <svg width={p.s} height={p.s} viewBox="0 0 40 40" style={{ transform: `rotate(${p.r}deg)` }}>
            <rect x="14" y="0"  width="12" height="40" rx="3" fill="#60a5fa"/>
            <rect x="0"  y="14" width="40" height="12" rx="3" fill="#60a5fa"/>
          </svg>
        </div>
      ))}

      {/* mid ECG strip */}
      <div className={styles.ecgMid}>
        <svg width="200%" height="64" viewBox="0 0 2400 64" preserveAspectRatio="none" className={styles.ecgMidSvg}>
          <defs>
            <linearGradient id="lkEcgFade" x1="0" x2="1">
              <stop offset="0%"   stopColor="#2563eb" stopOpacity="0"/>
              <stop offset="20%"  stopColor="#3b82f6" stopOpacity="0.7"/>
              <stop offset="80%"  stopColor="#3b82f6" stopOpacity="0.7"/>
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0"/>
            </linearGradient>
          </defs>
          {Array.from({ length: 12 }).map((_, i) => (
            <g key={i} transform={`translate(${i * 200},0)`}>
              <polyline points={ECG_PTS} fill="none" stroke="url(#lkEcgFade)" strokeWidth="1.6"/>
              <polyline points={ECG_PTS} fill="none" stroke="#60a5fa" strokeWidth="5" opacity="0.07"/>
            </g>
          ))}
        </svg>
      </div>

      {/* top ECG strip */}
      <div className={styles.ecgTop}>
        <svg width="200%" height="48" viewBox="0 0 2400 48" preserveAspectRatio="none" className={styles.ecgTopSvg}>
          {Array.from({ length: 12 }).map((_, i) => (
            <g key={i} transform={`translate(${i * 200},0)`}>
              <polyline points="0,24 60,24 88,24 104,6 116,42 132,24 154,24 162,18 170,24 240,24"
                fill="none" stroke="#1d4ed8" strokeWidth="1.2"/>
            </g>
          ))}
        </svg>
      </div>

      {/* ══ CENTRE CARD ══ */}
      <div className={styles.centerCard}>

        {/* logo bar */}
        <div className={styles.logoBar}>
          <div className={styles.logoIconBox}>
            <svg width="16" height="16" viewBox="0 0 40 40">
              <rect x="14" y="0" width="12" height="40" rx="2" fill="#60a5fa"/>
              <rect x="0"  y="14" width="40" height="12" rx="2" fill="#60a5fa"/>
            </svg>
          </div>
          <div>
            <p className={styles.brandName}>MedCenter HMS</p>
            <p className={styles.brandVersion}>sec.auth.v2.4.1</p>
          </div>
        </div>

        {/* ── ring ── */}
        <div className={styles.ringWrapper}>

          <div className={styles.ringGlow}/>

          {/* radar sweep */}
          <svg width="218" height="218" className={styles.radarSvg}>
            <defs>
              <radialGradient id="lkSweep" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor={ringColor} stopOpacity="0.8"/>
                <stop offset="100%" stopColor={ringColor} stopOpacity="0"/>
              </radialGradient>
            </defs>
            <path d="M109,109 L109,10 A99,99 0 0,1 209,109 Z" fill="url(#lkSweep)"/>
          </svg>

          {/* arc rings */}
          <svg width="218" height="218" className={styles.arcSvg}>
            <circle cx="109" cy="109" r="105" fill="none" stroke="rgba(59,130,246,0.07)" strokeWidth="1" strokeDasharray="4 8"/>
            <circle cx="109" cy="109" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={THICK}/>
            <circle cx="109" cy="109" r={R}
              fill="none"
              stroke={ringColor}
              strokeWidth={THICK}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${C}`}
              style={{ transition: 'stroke-dasharray 1s linear, stroke 0.8s ease', filter: `drop-shadow(0 0 12px ${ringColor})` }}
            />
          </svg>

          {/* tick marks */}
          <svg width="218" height="218" className={styles.tickSvg}>
            {Array.from({ length: 60 }).map((_, i) => {
              const a   = (i / 60) * 360 - 90;
              const rad = (a * Math.PI) / 180;
              const maj = i % 5 === 0;
              return (
                <line key={i}
                  x1={109 + (maj ? 92 : 96) * Math.cos(rad)}
                  y1={109 + (maj ? 92 : 96) * Math.sin(rad)}
                  x2={109 + 103 * Math.cos(rad)}
                  y2={109 + 103 * Math.sin(rad)}
                  stroke="white"
                  strokeWidth={maj ? 1.8 : 0.9}
                />
              );
            })}
          </svg>

          {/* centre content */}
          <div className={styles.ringCenter}>

            {/* lock icon + ping rings */}
            <div className={styles.lockIconArea}>
              {[0, 1, 2].map(i => (
                <div key={i} className={styles.pingRing}
                  style={{
                    width:  50 + i * 18,
                    height: 50 + i * 18,
                    animationDelay: `${i * 0.65}s`,
                  }}
                />
              ))}
              <div className={styles.lockBox}>
                <div className={styles.lockGlow}/>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke={ringColor} strokeWidth="2.2" strokeLinecap="round"
                  style={{ position: 'relative', zIndex: 1 }}>
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
            </div>

            {/* MM:SS 7-segment digits */}
            <div className={styles.timerRow}>
              <SegDisplay chars={mins.split('')}/>
              <div className={styles.colonDots}>
                <div className={styles.colonDot}/>
                <div className={styles.colonDot}/>
              </div>
              <SegDisplay chars={secs.split('')}/>
            </div>
          </div>
        </div>

        {/* status pill */}
        <div className={styles.statusPill}>
          <div className={styles.statusDot}/>
          <span className={styles.statusLabel}>
            {remaining > 0 ? 'Account Locked' : 'Lockout Expired'}
          </span>
        </div>

        {/* message */}
        <p className={styles.messageText}>
          Too many failed sign-in attempts.<br/>
          <span className={styles.messageSub}>Your access has been temporarily suspended.</span>
        </p>

        {/* attempt pips */}
        <div className={styles.pipsRow}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={styles.pip}/>
          ))}
          <span className={styles.pipsCount}>5/5</span>
        </div>

        {/* restore / unlock text */}
        <div className={styles.restoreText}>
          {remaining > 0
            ? `↻ Access restored in ${mins}:${secs}`
            : (
              <button className={styles.unlockBtn} onClick={onUnlock}>
                Lockout expired — click to retry
              </button>
            )}
        </div>

        {/* footer */}
        <div className={styles.footer}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span className={styles.footerText}>Protected by MedCenter Security · HIPAA compliant</span>
        </div>
      </div>

    </div>
  );
};

export default LockoutScreen;
