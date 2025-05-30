// src/index.tsx
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';  // **Named import** here
import reportWebVitals from './reportWebVitals';
import React from 'react';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
