import React, { useState, useEffect } from 'react';
import * as generatedApi from '../api/generatedApi';
import * as facilityApi from '../api/facilityApi';
import * as clinicalApi from '../api/clinicalApi';
import * as financeApi from '../api/financeApi';
import styles from './ModulePages.module.css';

const MasterOperationsPage = () => {
  const [selectedApi, setSelectedApi] = useState('');
  const [params, setParams] = useState([]);
  const [formData, setFormData] = useState({});
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  // Dictionaries for dropdowns
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [branches, setBranches] = useState([]);

  const allApis = { ...generatedApi, ...facilityApi, ...clinicalApi, ...financeApi };
  const apiNames = Object.keys(allApis).filter(k => typeof allApis[k] === 'function').sort();

  useEffect(() => {
    // Preload basic lookup tables for dropdowns
    facilityApi.getPatients().then(res => setPatients(res.data)).catch(() => {});
    generatedApi.filterDoctors({}).then(res => setDoctors(res.data)).catch(() => {});
    facilityApi.getBranches().then(res => setBranches(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedApi) {
      const funcStr = allApis[selectedApi].toString();
      // Extremely basic parameter parsing (ignores complex destructuring)
      const paramMatch = funcStr.match(/\(([^)]*)\)/);
      if (paramMatch && paramMatch[1]) {
        const paramNames = paramMatch[1].split(',').map(p => p.trim()).filter(p => p);
        setParams(paramNames);
        setFormData({});
      } else {
        setParams([]);
        setFormData({});
      }
      setResponse('');
    }
  }, [selectedApi]);

  const handleInputChange = (paramName, value) => {
    setFormData(prev => ({ ...prev, [paramName]: value }));
  };

  const executeApi = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse('Executing...');
    try {
      const args = params.map(p => {
        if (p === 'data' || p === 'result') {
          try { return JSON.parse(formData[p] || '{}'); } catch(e) { return formData[p]; }
        }
        return formData[p] || '';
      });
      const res = await allApis[selectedApi](...args);
      setResponse(JSON.stringify(res.data, null, 2));
    } catch (e) {
      setResponse('ERROR: ' + (e.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  };

  const renderInputForParam = (paramName) => {
    const isJson = paramName === 'data' || paramName === 'result';
    
    // Smart Dropdown: Patient
    if (paramName.toLowerCase().includes('uhid') || paramName === 'patientId') {
      return (
        <select value={formData[paramName] || ''} onChange={e => handleInputChange(paramName, e.target.value)} required className={styles.formInput}>
          <option value="">-- Select Patient --</option>
          {patients.map(p => <option key={p.uhid} value={p.uhid}>{p.firstName} (ID: {p.uhid})</option>)}
        </select>
      );
    }
    // Smart Dropdown: Doctor
    if (paramName.toLowerCase().includes('doctorid') || paramName === 'doctorCode') {
      return (
        <select value={formData[paramName] || ''} onChange={e => handleInputChange(paramName, e.target.value)} required className={styles.formInput}>
          <option value="">-- Select Doctor --</option>
          {doctors.map(d => <option key={d.id} value={d.doctorCode}>{d.name} ({d.doctorCode})</option>)}
        </select>
      );
    }
    // Smart Dropdown: Branch
    if (paramName.toLowerCase().includes('branchid')) {
      return (
        <select value={formData[paramName] || ''} onChange={e => handleInputChange(paramName, e.target.value)} required className={styles.formInput}>
          <option value="">-- Select Branch --</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.branchName}</option>)}
        </select>
      );
    }

    if (isJson) {
      return <textarea value={formData[paramName] || ''} onChange={e => handleInputChange(paramName, e.target.value)} className={styles.formInput} placeholder="{}" rows="4" required />;
    }
    
    return <input type="text" value={formData[paramName] || ''} onChange={e => handleInputChange(paramName, e.target.value)} className={styles.formInput} required />;
  };

  return (
    <div className={styles.pageContainer}>
      <h2>Master API Form Builder (All 196 Endpoints)</h2>
      
      <div className={styles.formCard} style={{marginBottom: '20px'}}>
        <label style={{fontWeight: 'bold'}}>Select API Endpoint to Generate Form:</label>
        <select value={selectedApi} onChange={e => setSelectedApi(e.target.value)} className={styles.formInput} style={{marginTop: '10px'}}>
          <option value="">-- Choose API --</option>
          {apiNames.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
      </div>

      {selectedApi && (
        <div className={styles.formCard} style={{marginBottom: '20px'}}>
          <h3 style={{color: 'var(--primary-color)'}}>Execute: {selectedApi}()</h3>
          <form onSubmit={executeApi} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
            {params.length === 0 && <p style={{color: '#64748b'}}>No parameters required. Just click execute.</p>}
            
            {params.map(p => (
              <div key={p}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                  Argument: <span style={{color: '#0ea5e9'}}>{p}</span>
                  {(p === 'data' || p === 'result') && <span style={{fontSize: '0.8rem', color: '#64748b'}}> (Enter Valid JSON)</span>}
                </label>
                {renderInputForParam(p)}
              </div>
            ))}
            
            <button type="submit" className={styles.submitBtn} disabled={loading} style={{alignSelf: 'flex-start'}}>
              {loading ? 'Sending Request...' : 'Trigger API'}
            </button>
          </form>
        </div>
      )}

      {response && (
        <div style={{ background: '#1e293b', color: '#a5b4fc', padding: '15px', borderRadius: '8px', overflowX: 'auto', fontFamily: 'monospace' }}>
          <strong>API Response:</strong>
          <pre style={{marginTop: '10px', whiteSpace: 'pre-wrap'}}>{response}</pre>
        </div>
      )}
    </div>
  );
};

export default MasterOperationsPage;
