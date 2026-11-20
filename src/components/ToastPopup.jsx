import React, { useState, useEffect } from 'react';

export const showToast = (message, type = 'success') => {
  if (!message) return;
  window.dispatchEvent(new CustomEvent('app:toast', { detail: { message, type } }));
};

const ToastPopup = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      const { message, type = 'success' } = e.detail || {};
      if (!message) return;
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    };
    window.addEventListener('app:toast', handler);
    return () => window.removeEventListener('app:toast', handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '380px',
      width: 'calc(100vw - 40px)'
    }}>
      {toasts.map((t) => {
        const isError = t.type === 'error';
        return (
          <div
            key={t.id}
            style={{
              background: isError ? '#fef2f2' : '#f0fdf4',
              border: `1px solid ${isError ? '#fca5a5' : '#86efac'}`,
              borderLeft: `5px solid ${isError ? '#dc2626' : '#16a34a'}`,
              color: isError ? '#991b1b' : '#166534',
              padding: '12px 14px',
              borderRadius: '10px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '10px',
              fontSize: '0.92rem',
              fontWeight: 500
            }}
          >
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span>{isError ? '❌' : '✅'}</span>
              <span>{t.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: '1rem',
                lineHeight: 1,
                padding: 0
              }}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastPopup;

