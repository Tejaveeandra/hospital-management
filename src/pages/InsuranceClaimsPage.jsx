import React, { useState, useEffect } from 'react';
import { claimInsurance, getInvoicesByPatient } from '../api/financeApi';
import { getPatients } from '../api/facilityApi';
import styles from './ModulePages.module.css';
import { useSearchParams } from 'react-router-dom';

const InsuranceClaimsPage = () => {
  const [searchParams] = useSearchParams();
  const op = searchParams.get('op') || 'claim';

  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState('');
  
  const [claimAmount, setClaimAmount] = useState('');
  const [insuranceProvider, setInsuranceProvider] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      loadInvoices(selectedPatient);
    } else {
      setInvoices([]);
      setSelectedInvoice('');
    }
  }, [selectedPatient]);

  const loadPatients = async () => {
    try {
      const res = await getPatients();
      setPatients(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadInvoices = async (uhid) => {
    try {
      const res = await getInvoicesByPatient(uhid);
      setInvoices(res.data);
    } catch (e) {
      console.error(e);
      setInvoices([]);
    }
  };

  const handleClaim = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg('');
    try {
      await claimInsurance(selectedInvoice, { provider: insuranceProvider, amount: parseFloat(claimAmount) });
      setMsg('Claim submitted successfully to ' + insuranceProvider);
      setSelectedInvoice(''); setClaimAmount(''); setInsuranceProvider('');
    } catch (e) {
      setMsg('Error submitting claim. Ensure invoice is valid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <h2>Insurance & Claims Department</h2>
      
      {op === 'claim' && (
        <div className={styles.formCard}>
          <h3>Submit New Insurance Claim</h3>
          {msg && <div style={{color: msg.includes('Error') ? 'red' : 'green', marginBottom: '1rem', fontWeight: 'bold'}}>{msg}</div>}
          <form onSubmit={handleClaim} style={{display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px'}}>
            
            <div>
              <label>Select Patient:</label>
              <select value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)} required className={styles.formInput}>
                <option value="">-- Choose Patient --</option>
                {patients.map(p => (
                  <option key={p.uhid || p.patientId} value={p.uhid || p.patientId}>
                    {p.patientName || p.firstName} (ID: {p.uhid || p.patientId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Select Invoice:</label>
              <select value={selectedInvoice} onChange={e => setSelectedInvoice(e.target.value)} required className={styles.formInput} disabled={!selectedPatient}>
                <option value="">-- Choose Invoice --</option>
                {invoices.map(inv => (
                  <option key={inv.id || inv.invoiceNumber} value={inv.id || inv.invoiceNumber}>
                    Invoice #{inv.invoiceNumber} - Total:  ({inv.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Provider (e.g. BlueCross, Medicare):</label>
              <input type="text" value={insuranceProvider} onChange={e => setInsuranceProvider(e.target.value)} required className={styles.formInput} />
            </div>
            
            <div>
              <label>Claim Amount ($):</label>
              <input type="number" step="0.01" value={claimAmount} onChange={e => setClaimAmount(e.target.value)} required className={styles.formInput} />
            </div>
            
            <button type="submit" disabled={loading} className={styles.submitBtn}>Submit Claim to Payer</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default InsuranceClaimsPage;
