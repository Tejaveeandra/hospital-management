import React, { useState } from 'react';
import api from '../api/api';

const ClinicalRecordsPage = () => {
  const [activeTab, setActiveTab] = useState('vitals');
  const [uhid, setUhid] = useState('');
  const [vitalsList, setVitalsList] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [vitalsForm, setVitalsForm] = useState({
    patientUhid: '', visitId: '', bloodPressure: '', temperatureF: '', pulseBpm: '', spo2Percent: '', weightKg: '', heightCm: '', notes: ''
  });

  const [summaryForm, setSummaryForm] = useState({
    patientUhid: '', visitId: '', finalDiagnosis: '', treatmentGiven: '', dischargeMedications: '', followUpInstructions: '', followUpDate: ''
  });

  const handleLoad = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const [vRes, dRes] = await Promise.all([
        api.get(`/patients/vitals/uhid/${encodeURIComponent(uhid.trim())}`),
        api.get(`/patients/discharge-summary/uhid/${encodeURIComponent(uhid.trim())}`)
      ]);
      setVitalsList(vRes.data || []);
      setSummaries(dRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load clinical records');
    }
  };

  const handleRecordVitals = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post('/patients/vitals', {
        ...vitalsForm,
        visitId: vitalsForm.visitId ? Number(vitalsForm.visitId) : null,
        temperatureF: vitalsForm.temperatureF ? Number(vitalsForm.temperatureF) : null,
        pulseBpm: vitalsForm.pulseBpm ? Number(vitalsForm.pulseBpm) : null,
        spo2Percent: vitalsForm.spo2Percent ? Number(vitalsForm.spo2Percent) : null,
        weightKg: vitalsForm.weightKg ? Number(vitalsForm.weightKg) : null,
        heightCm: vitalsForm.heightCm ? Number(vitalsForm.heightCm) : null
      });
      setMessage('Vitals recorded.');
      setVitalsForm({ patientUhid: '', visitId: '', bloodPressure: '', temperatureF: '', pulseBpm: '', spo2Percent: '', weightKg: '', heightCm: '', notes: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record vitals');
    }
  };

  const handleCreateSummary = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post('/patients/discharge-summary', {
        ...summaryForm,
        visitId: Number(summaryForm.visitId)
      });
      setMessage('Discharge summary saved.');
      setSummaryForm({ patientUhid: '', visitId: '', finalDiagnosis: '', treatmentGiven: '', dischargeMedications: '', followUpInstructions: '', followUpDate: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save discharge summary');
    }
  };

  const cardStyle = { background: '#fff', borderRadius: 12, padding: '1.25rem', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', marginBottom: '1.25rem' };

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ marginBottom: '1rem' }}>Clinical Records — Vitals & Discharge Summary</h2>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <button onClick={() => setActiveTab('vitals')} style={{ padding: '0.5rem 1rem', borderRadius: 8, border: 'none', background: activeTab === 'vitals' ? '#2563eb' : '#e2e8f0', color: activeTab === 'vitals' ? '#fff' : '#1e293b' }}>Vitals / Triage</button>
        <button onClick={() => setActiveTab('discharge')} style={{ padding: '0.5rem 1rem', borderRadius: 8, border: 'none', background: activeTab === 'discharge' ? '#2563eb' : '#e2e8f0', color: activeTab === 'discharge' ? '#fff' : '#1e293b' }}>Discharge Summary</button>
        <button onClick={() => window.print()} style={{ marginLeft: 'auto', padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff' }}>Print / PDF</button>
      </div>

      {message && <div style={{ padding: '0.75rem', background: '#dcfce7', color: '#166534', borderRadius: 8, marginBottom: '1rem' }}>{message}</div>}
      {error && <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: 8, marginBottom: '1rem' }}>{error}</div>}

      <form onSubmit={handleLoad} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input placeholder="Lookup Patient UHID" value={uhid} onChange={e => setUhid(e.target.value)} required style={{ flex: 1, padding: '0.45rem' }} />
        <button type="submit" style={{ padding: '0.45rem 1rem', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 6 }}>Load History</button>
      </form>

      {activeTab === 'vitals' ? (
        <div style={cardStyle}>
          <h3>Record Vitals</h3>
          <form onSubmit={handleRecordVitals} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
            <input placeholder="Patient UHID *" value={vitalsForm.patientUhid} onChange={e => setVitalsForm(p => ({ ...p, patientUhid: e.target.value }))} required />
            <input type="number" placeholder="Visit ID" value={vitalsForm.visitId} onChange={e => setVitalsForm(p => ({ ...p, visitId: e.target.value }))} />
            <input placeholder="BP (e.g. 120/80)" value={vitalsForm.bloodPressure} onChange={e => setVitalsForm(p => ({ ...p, bloodPressure: e.target.value }))} />
            <input type="number" step="0.1" placeholder="Temp (°F)" value={vitalsForm.temperatureF} onChange={e => setVitalsForm(p => ({ ...p, temperatureF: e.target.value }))} />
            <input type="number" placeholder="Pulse (bpm)" value={vitalsForm.pulseBpm} onChange={e => setVitalsForm(p => ({ ...p, pulseBpm: e.target.value }))} />
            <input type="number" placeholder="SpO2 (%)" value={vitalsForm.spo2Percent} onChange={e => setVitalsForm(p => ({ ...p, spo2Percent: e.target.value }))} />
            <input type="number" step="0.1" placeholder="Weight (kg)" value={vitalsForm.weightKg} onChange={e => setVitalsForm(p => ({ ...p, weightKg: e.target.value }))} />
            <input placeholder="Notes" value={vitalsForm.notes} onChange={e => setVitalsForm(p => ({ ...p, notes: e.target.value }))} />
            <button type="submit" style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem' }}>Save Vitals</button>
          </form>

          {vitalsList.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem' }}>Recorded</th>
                  <th style={{ padding: '0.5rem' }}>BP</th>
                  <th style={{ padding: '0.5rem' }}>Temp</th>
                  <th style={{ padding: '0.5rem' }}>Pulse</th>
                  <th style={{ padding: '0.5rem' }}>SpO2</th>
                  <th style={{ padding: '0.5rem' }}>Weight</th>
                </tr>
              </thead>
              <tbody>
                {vitalsList.map(v => (
                  <tr key={v.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.5rem' }}>{v.recordedAt}</td>
                    <td style={{ padding: '0.5rem' }}>{v.bloodPressure}</td>
                    <td style={{ padding: '0.5rem' }}>{v.temperatureF}°F</td>
                    <td style={{ padding: '0.5rem' }}>{v.pulseBpm}</td>
                    <td style={{ padding: '0.5rem' }}>{v.spo2Percent}%</td>
                    <td style={{ padding: '0.5rem' }}>{v.weightKg} kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div style={cardStyle}>
          <h3>Create Discharge Summary</h3>
          <form onSubmit={handleCreateSummary} style={{ display: 'grid', gap: '0.6rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input placeholder="Patient UHID *" value={summaryForm.patientUhid} onChange={e => setSummaryForm(p => ({ ...p, patientUhid: e.target.value }))} required />
              <input type="number" placeholder="Visit ID *" value={summaryForm.visitId} onChange={e => setSummaryForm(p => ({ ...p, visitId: e.target.value }))} required />
              <input type="date" value={summaryForm.followUpDate} onChange={e => setSummaryForm(p => ({ ...p, followUpDate: e.target.value }))} />
            </div>
            <textarea placeholder="Final Diagnosis *" value={summaryForm.finalDiagnosis} onChange={e => setSummaryForm(p => ({ ...p, finalDiagnosis: e.target.value }))} required rows={2} />
            <textarea placeholder="Treatment Given" value={summaryForm.treatmentGiven} onChange={e => setSummaryForm(p => ({ ...p, treatmentGiven: e.target.value }))} rows={2} />
            <textarea placeholder="Discharge Medications" value={summaryForm.dischargeMedications} onChange={e => setSummaryForm(p => ({ ...p, dischargeMedications: e.target.value }))} rows={2} />
            <textarea placeholder="Follow-up Instructions" value={summaryForm.followUpInstructions} onChange={e => setSummaryForm(p => ({ ...p, followUpInstructions: e.target.value }))} rows={2} />
            <button type="submit" style={{ width: 200, background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem' }}>Save Summary</button>
          </form>

          {summaries.map(s => (
            <div key={s.id} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
              <strong>Visit #{s.visitId}</strong> — Discharged {s.dischargedAt}
              <p><strong>Diagnosis:</strong> {s.finalDiagnosis}</p>
              <p><strong>Treatment:</strong> {s.treatmentGiven}</p>
              <p><strong>Medications:</strong> {s.dischargeMedications}</p>
              <p><strong>Follow-up:</strong> {s.followUpDate} — {s.followUpInstructions}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClinicalRecordsPage;

