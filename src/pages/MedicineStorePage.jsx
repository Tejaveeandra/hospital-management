import React, { useState, useEffect } from "react";
import api from "../api/api";
import styles from "./MedicineStorePage.module.css";

const MedicineStorePage = ({ allowedOperations = [], initialOperation, isEmbedded = false }) => {
  const [operationMode, setOperationMode] = useState(initialOperation || "");
  const [items, setItems] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [formData, setFormData] = useState({ name: "", price: "", stockCount: "" });
  const [deleteId, setDeleteId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialOperation) setOperationMode(initialOperation);
    if (allowedOperations?.length > 0 && !initialOperation) setOperationMode(allowedOperations[0]);
  }, [initialOperation, allowedOperations]);

  useEffect(() => {
    setMessage("");
  }, [operationMode]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/medicine-store/list");
      setItems(Array.isArray(res.data) ? res.data : []);
      setMessage("Store list loaded.");
    } catch (e) {
      setMessage("Error loading medicine store.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchByName = async () => {
    if (!searchName?.trim()) {
      setMessage("Enter medicine name.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/api/medicine-store/name/${encodeURIComponent(searchName.trim())}`);
      setItems(res.data ? [res.data] : []);
      setMessage(res.data ? "Found." : "Not found.");
    } catch (e) {
      setMessage("Not found or error.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const name = formData.name?.trim();
    const price = Number(formData.price);
    const stockCount = Number(formData.stockCount);
    if (!name) {
      setMessage("Enter medicine name.");
      return;
    }
    if (isNaN(price) || price < 0) {
      setMessage("Enter a valid price.");
      return;
    }
    if (isNaN(stockCount) || stockCount < 0) {
      setMessage("Enter a valid stock count.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/medicine-store/add", { name, price, stockCount });
      setMessage("Medicine added to store.");
      setFormData({ name: "", price: "", stockCount: "" });
      fetchList();
    } catch (e) {
      setMessage("Error adding to store.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId?.trim()) {
      setMessage("Enter ID to delete.");
      return;
    }
    setLoading(true);
    try {
      await api.delete(`/api/medicine-store/delete/${deleteId.trim()}`);
      setMessage("Removed from store.");
      setDeleteId("");
      fetchList();
    } catch (e) {
      setMessage("Error deleting.");
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setLoading(true);
    try {
      await api.post("/api/medicine-store/seed");
      setMessage("Store seeded.");
      fetchList();
    } catch (e) {
      setMessage("Error seeding store.");
    } finally {
      setLoading(false);
    }
  };

  const showList = operationMode === "List Medicine Store" || operationMode === "View Medicine Store";
  const showSearch = operationMode === "Search Medicine" || operationMode === "Get by Name";
  const showAdd = operationMode === "Add to Store" || operationMode === "Add Medicine";
  const showDelete = operationMode === "Delete from Store" || operationMode === "Remove from Store";
  const showSeed = operationMode === "Seed Store";

  useEffect(() => {
    if (showList) fetchList();
  }, [operationMode]);

  return (
    <div className={styles.container}>
      {!isEmbedded && <h2 className={styles.title}>Medicine Store</h2>}
      {loading && <p className={styles.loading}>Loading...</p>}

      {showList && (
        <div className={styles.section}>
          <h3>Store Inventory</h3>
          {items.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>{item.price}</td>
                    <td>{item.stockCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No medicines in store.</p>
          )}
        </div>
      )}

      {showSearch && (
        <div className={styles.section}>
          <h3>Search by Name</h3>
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Medicine name"
            disabled={loading}
          />
          <button type="button" onClick={fetchByName} disabled={loading}>Search</button>
          {items.length > 0 && (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>{item.price}</td>
                    <td>{item.stockCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showAdd && (
        <div className={styles.section}>
          <h3>Add to Store</h3>
          <form onSubmit={handleAdd}>
            <label>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              disabled={loading}
            />
            <label>Price</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))}
              disabled={loading}
            />
            <label>Stock Count</label>
            <input
              type="number"
              min="0"
              value={formData.stockCount}
              onChange={(e) => setFormData((p) => ({ ...p, stockCount: e.target.value }))}
              disabled={loading}
            />
            <button type="submit" disabled={loading}>Add</button>
          </form>
        </div>
      )}

      {showDelete && (
        <div className={styles.section}>
          <h3>Remove from Store</h3>
          <label>Medicine ID</label>
          <input
            type="text"
            value={deleteId}
            onChange={(e) => setDeleteId(e.target.value)}
            placeholder="ID"
            disabled={loading}
          />
          <button type="button" onClick={handleDelete} disabled={loading} className={styles.danger}>Delete</button>
        </div>
      )}

      {showSeed && (
        <div className={styles.section}>
          <h3>Seed Default Data</h3>
          <p>Load default medicines into the store (admin).</p>
          <button type="button" onClick={handleSeed} disabled={loading}>Seed Store</button>
        </div>
      )}

      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
};

export default MedicineStorePage;
