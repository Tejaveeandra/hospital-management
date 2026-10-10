import React, { useState } from 'react';
import { dispensePrescription } from '../api/generatedApi';
import styles from './ModulePages.module.css';

const PrescriptionsPage = () => {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');

  const handleDispense = async (e) => {
    e.preventDefault();
    try {
      await dispensePrescription(code);
      setMsg('Prescription Dispensed Successfully!');
      setCode('');
    } catch(e) {
      setMsg('Error dispensing prescription. Invalid code.');
    }
  };

  return (
    <div className={styles.pageContainer}>
      <h2>Pharmacy Dispensing</h2>
      {msg && <div style={{color: msg.includes('Error') ? 'red' : 'green', marginBottom: '1rem'}}>{msg}</div>}
      
      <div className={styles.formCard}>
        <h3>Dispense Prescription</h3>
        <form onSubmit={handleDispense} style={{display: 'flex', gap: '1rem', alignItems: 'flex-end'}}>
          <div>
            <label>Prescription Code:</label>
            <input type="text" value={code} onChange={e => setCode(e.target.value)} className={styles.formInput} required />
          </div>
          <button type="submit" className={styles.submitBtn}>Dispense Medicines</button>
        </form>
      </div>
    </div>
  );
};
export default PrescriptionsPage;
