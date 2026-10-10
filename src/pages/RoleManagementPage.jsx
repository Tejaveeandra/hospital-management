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

const RoleManagementPage = () => {
  const [roles, setRoles] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSystemRole, setIsSystemRole] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchRoles = async () => {
    try {
      const response = await api.get('/users/roles');
      setRoles(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/users/roles', { name, description, isSystemRole });
      setName('');
      setDescription('');
      setIsSystemRole(false);
      fetchRoles();
    } catch (err) {
      setError('Failed to create role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <h2>System Role Management</h2>
      
      {error && <div style={{color: 'red', marginBottom: '1rem'}}>{error}</div>}
      
      <div className={styles.formCard} style={{marginBottom: '2rem'}}>
        <h3>Create New Role</h3>
        <form onSubmit={handleSubmit} style={{display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap'}}>
          <div>
            <label>Role Name (e.g. NURSE):</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required className={styles.formInput} />
          </div>
          <div>
            <label>Description:</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} required className={styles.formInput} />
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.5rem'}}>
            <input type="checkbox" id="sysRole" checked={isSystemRole} onChange={e => setIsSystemRole(e.target.checked)} />
            <label htmlFor="sysRole" style={{marginBottom: 0}}>Is System Role?</label>
          </div>
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Saving...' : 'Add Role'}
          </button>
        </form>
      </div>

      <div className={styles.tableCard}>
        <h3>Existing Roles</h3>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Role Name</th>
              <th>Description</th>
              <th>System Role</th>
            </tr>
          </thead>
          <tbody>
            {roles.map(r => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td style={{fontWeight: 'bold', color: 'var(--primary-color)'}}>{r.name}</td>
                <td>{r.description}</td>
                <td>{r.isSystemRole ? '✅' : '❌'}</td>
              </tr>
            ))}
            {roles.length === 0 && <tr><td colSpan="4">No roles found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoleManagementPage;


