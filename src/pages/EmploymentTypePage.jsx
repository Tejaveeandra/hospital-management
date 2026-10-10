import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './ModulePages.module.css';

const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers['Authorization'] = 'Bearer ' + token;
  return config;
});

const EmploymentTypePage = () => {
  const [types, setTypes] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTypes = async () => {
    try {
      const response = await api.get('/hr/employment-types');
      setTypes(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/hr/employment-types', { name, description });
      setName('');
      setDescription('');
      fetchTypes();
    } catch (err) {
      setError('Failed to create employment type');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <h2>Manage Employment Types</h2>
      
      {error && <div style={{color: 'red', marginBottom: '1rem'}}>{error}</div>}
      
      <div className={styles.formCard} style={{marginBottom: '2rem'}}>
        <h3>Create New Type</h3>
        <form onSubmit={handleSubmit} style={{display: 'flex', gap: '1rem', alignItems: 'flex-end'}}>
          <div>
            <label>Name (e.g. FULL_TIME):</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required className={styles.formInput} />
          </div>
          <div>
            <label>Description:</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} required className={styles.formInput} />
          </div>
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Saving...' : 'Add Type'}
          </button>
        </form>
      </div>

      <div className={styles.tableCard}>
        <h3>Existing Employment Types</h3>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {types.map(t => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.name}</td>
                <td>{t.description}</td>
              </tr>
            ))}
            {types.length === 0 && <tr><td colSpan="3">No employment types found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmploymentTypePage;


