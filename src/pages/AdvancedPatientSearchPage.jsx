import React, { useState } from 'react';
import { searchPatients, getPatientByUhid } from '../api/generatedApi';
import styles from './ModulePages.module.css';

const AdvancedPatientSearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // If the query looks like a UHID, we try getPatientByUhid first
      if (query.startsWith('PT-')) {
        const res = await getPatientByUhid(query);
        setResults(res.data ? [res.data] : []);
      } else {
        const res = await searchPatients({ q: query });
        setResults(res.data || []);
      }
    } catch (e) {
      console.error(e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <h2>Advanced Patient Search</h2>
      <div className={styles.formCard} style={{marginBottom: '2rem'}}>
        <form onSubmit={handleSearch} style={{display: 'flex', gap: '1rem', alignItems: 'flex-end'}}>
          <div style={{flex: 1}}>
            <label>Search by Name, Email, Phone, or UHID:</label>
            <input type="text" value={query} onChange={e => setQuery(e.target.value)} required className={styles.formInput} placeholder="e.g. John Doe or PT-1001" />
          </div>
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      <div className={styles.tableCard}>
        <h3>Search Results ({results.length})</h3>
        <table className={styles.dataTable}>
          <thead>
            <tr><th>UHID</th><th>Name</th><th>Email</th><th>Phone</th><th>Status</th></tr>
          </thead>
          <tbody>
            {results.map(p => (
              <tr key={p.id || p.uhid}>
                <td style={{fontWeight: 'bold', color: 'var(--primary-color)'}}>{p.uhid}</td>
                <td>{p.firstName} {p.lastName}</td>
                <td>{p.email}</td>
                <td>{p.phone}</td>
                <td>{p.status || 'ACTIVE'}</td>
              </tr>
            ))}
            {results.length === 0 && !loading && <tr><td colSpan="5">No patients found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdvancedPatientSearchPage;
