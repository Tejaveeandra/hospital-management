import React, { useState, useEffect } from "react";
import api from "../api/api";
import { showToast } from "../components/ToastPopup";
import styles from "./MedicineStorePage.module.css";

const MedicineStorePage = ({ allowedOperations = [], initialOperation, isEmbedded = false }) => {
  const [operationMode, setOperationMode] = useState(initialOperation || "");
  const [items, setItems] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [formData, setFormData] = useState({ name: "", price: "", stockCount: "" });
  const [updateId, setUpdateId] = useState("");
  const [updateData, setUpdateData] = useState({ name: "", price: "", stockCount: "" });
  const [deleteId, setDeleteId] = useState("");
  const [message, setMessageState] = useState("");
  const setMessage = (m) => {
    setMessageState(m);
    if (m) showToast(m, m.toLowerCase().includes("error") ? "error" : "success");
  };
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState({ lowStock: [], expiringSoon: [] });
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [batchMedName, setBatchMedName] = useState("");
  const [grnForm, setGrnForm] = useState({
    storeMedicineId: "", supplierName: "", supplierInvoiceNo: "",
    batchNumber: "", expiryDate: "", quantityReceived: "", purchasePrice: "", mrp: ""
  });

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
      const [res, alertsRes] = await Promise.all([
        api.get("/api/medicine-store/list"),
        api.get("/api/medicines/inventory-alerts").catch(() => ({ data: { lowStock: [], expiringSoon: [] } }))
      ]);
      setItems(Array.isArray(res.data) ? res.data : []);
      setAlerts(alertsRes.data || { lowStock: [], expiringSoon: [] });
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

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!updateId?.trim()) {
      setMessage("Enter Medicine ID to update.");
      return;
    }
    const name = updateData.name?.trim();
    const price = Number(updateData.price);
    const stockCount = Number(updateData.stockCount);

    setLoading(true);
    try {
      await api.put(`/api/medicine-store/update/${updateId.trim()}`, {
        name: name || undefined,
        price: !isNaN(price) && price >= 0 ? price : undefined,
        stockCount: !isNaN(stockCount) && stockCount >= 0 ? stockCount : undefined,
      });
      setMessage("Medicine updated successfully.");
      setUpdateId("");
      setUpdateData({ name: "", price: "", stockCount: "" });
      fetchList();
    } catch (e) {
      setMessage("Error updating medicine.");
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

  const handleViewBatches = async (item) => {
    try {
      const res = await api.get(`/api/medicine-store/${item.id}/batches`);
      setSelectedBatches(res.data || []);
      setBatchMedName(item.name);
    } catch {
      setMessage("Error loading batches.");
    }
  };

  const handleReceiveGrn = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/medicine-store/grn", {
        ...grnForm,
        storeMedicineId: Number(grnForm.storeMedicineId),
        quantityReceived: Number(grnForm.quantityReceived),
        purchasePrice: grnForm.purchasePrice ? Number(grnForm.purchasePrice) : 0,
        mrp: grnForm.mrp ? Number(grnForm.mrp) : 0,
      });
      setMessage("Supplier GRN stock received & batch created.");
      setGrnForm({ storeMedicineId: "", supplierName: "", supplierInvoiceNo: "", batchNumber: "", expiryDate: "", quantityReceived: "", purchasePrice: "", mrp: "" });
      fetchList();
    } catch (err) {
      setMessage(err.response?.data?.message || "Error receiving GRN stock.");
    } finally {
      setLoading(false);
    }
  };

  const showList = operationMode === "List Medicine Store" || operationMode === "View Medicine Store";
  const showSearch = operationMode === "Search Medicine" || operationMode === "Get by Name";
  const showAdd = operationMode === "Add to Store" || operationMode === "Add Medicine";
  const showUpdate = operationMode === "Update Store Item" || operationMode === "Edit Medicine";
  const showDelete = operationMode === "Delete from Store" || operationMode === "Remove from Store";

  useEffect(() => {
    if (showList) fetchList();
  }, [operationMode]);

  return (
    <div className={styles.container}>
      {!isEmbedded && <h2 className={styles.title}>Medicine Store</h2>}
      {loading && <p className={styles.loading}>Loading...</p>}

      {showList && (
        <div className={styles.section}>
          <div className={styles.headerRow}>
            <div>
              <h3 className={styles.headerTitle}>Pharmacy Store Inventory</h3>
              <div className={styles.headerSubtitle}>Available medicines, pricing, and stock levels</div>
            </div>
          </div>
          {(alerts.lowStock?.length > 0 || alerts.expiringSoon?.length > 0) && (
            <div style={{ padding: "0.75rem 1rem", background: "#fef3c7", border: "1px solid #f59e0b", borderRadius: 8, marginBottom: "1rem", color: "#92400e", fontSize: "0.9rem" }}>
              {alerts.lowStock?.length > 0 && (
                <div><strong>Low Stock ({alerts.lowStock.length}):</strong> {alerts.lowStock.map(m => `${m.name} (${m.stockCount})`).join(", ")}</div>
              )}
              {alerts.expiringSoon?.length > 0 && (
                <div><strong>Expiring Soon ({alerts.expiringSoon.length}):</strong> {alerts.expiringSoon.map(m => `${m.name} (${m.expiryDate})`).join(", ")}</div>
              )}
            </div>
          )}
          {items.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Medicine Name</th>
                  <th>FEFO Batch / Expiry</th>
                  <th>Price ($)</th>
                  <th>Stock Count</th>
                  <th>Status</th>
                  <th>Batches</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className={styles.idCell}>#{item.id}</td>
                    <td className={styles.nameCell}>{item.name}</td>
                    <td>{item.batchNumber || '-'} {item.expiryDate ? `(Exp: ${item.expiryDate})` : ''}</td>
                    <td className={styles.priceCell}>${Number(item.price).toFixed(2)}</td>
                    <td>{item.stockCount} units</td>
                    <td>
                      <span className={`${styles.stockBadge} ${item.stockCount > 10 ? styles.stockGood : item.stockCount > 0 ? styles.stockLow : styles.stockOut}`}>
                        {item.stockCount > 10 ? 'In Stock' : item.stockCount > 0 ? 'Low Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td>
                      <button type="button" onClick={() => handleViewBatches(item)}>View Batches</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className={styles.emptyMessage}>No medicines in store.</p>
          )}
          {batchMedName && (
            <div style={{ marginTop: "1rem", padding: "0.75rem", background: "#f8fafc", borderRadius: 8 }}>
              <strong>Batches for {batchMedName} (FEFO Order):</strong>
              {selectedBatches.length === 0 ? <div>No batch records yet (legacy stock).</div> : (
                <ul>
                  {selectedBatches.map(b => (
                    <li key={b.batchId}>Batch {b.batchNumber} — Qty: {b.quantityAvailable}, Expiry: {b.expiryDate || "N/A"}, MRP: ₹{b.mrp}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div style={{ marginTop: "1.25rem", padding: "1rem", background: "#f8fafc", borderRadius: 8 }}>
            <h4 style={{ marginTop: 0 }}>Stock-In / Supplier GRN (Multi-Batch)</h4>
            <form onSubmit={handleReceiveGrn} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "0.6rem", alignItems: "center" }}>
              <select value={grnForm.storeMedicineId} onChange={e => setGrnForm({ ...grnForm, storeMedicineId: e.target.value })} required>
                <option value="">Select Medicine</option>
                {items.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <input placeholder="Supplier Name" value={grnForm.supplierName} onChange={e => setGrnForm({ ...grnForm, supplierName: e.target.value })} required />
              <input placeholder="Supplier Invoice No" value={grnForm.supplierInvoiceNo} onChange={e => setGrnForm({ ...grnForm, supplierInvoiceNo: e.target.value })} required />
              <input placeholder="Batch No" value={grnForm.batchNumber} onChange={e => setGrnForm({ ...grnForm, batchNumber: e.target.value })} required />
              <input type="date" title="Expiry Date" value={grnForm.expiryDate} onChange={e => setGrnForm({ ...grnForm, expiryDate: e.target.value })} required />
              <input type="number" min="1" placeholder="Qty" value={grnForm.quantityReceived} onChange={e => setGrnForm({ ...grnForm, quantityReceived: e.target.value })} required />
              <input type="number" step="0.01" placeholder="Purchase Price ₹" value={grnForm.purchasePrice} onChange={e => setGrnForm({ ...grnForm, purchasePrice: e.target.value })} />
              <input type="number" step="0.01" placeholder="MRP ₹" value={grnForm.mrp} onChange={e => setGrnForm({ ...grnForm, mrp: e.target.value })} />
              <button type="submit" disabled={loading}>Receive Stock (GRN)</button>
            </form>
          </div>
        </div>
      )}

      {showSearch && (
        <div className={styles.section}>
          <div className={styles.headerRow}>
            <div>
              <h3 className={styles.headerTitle}>Search Medicine Store</h3>
              <div className={styles.headerSubtitle}>Search for specific medication by name</div>
            </div>
          </div>
          <div className={`${styles.inputRow} ${styles.alignEnd}`}>
            <div className={styles.inputGroup}>
              <label>Medicine Name</label>
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="e.g. Paracetamol, Amoxicillin"
                disabled={loading}
              />
            </div>
            <button type="button" className={`${styles.submitBtn} ${styles.btnNoMargin}`} onClick={fetchByName} disabled={loading}>
              Search Medicine
            </button>
          </div>

          {items.length > 0 && (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Medicine Name</th>
                  <th>Price ($)</th>
                  <th>Stock Count</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className={styles.idCell}>#{item.id}</td>
                    <td className={styles.nameCell}>{item.name}</td>
                    <td className={styles.priceCell}>${Number(item.price).toFixed(2)}</td>
                    <td>{item.stockCount} units</td>
                    <td>
                      <span className={`${styles.stockBadge} ${item.stockCount > 10 ? styles.stockGood : item.stockCount > 0 ? styles.stockLow : styles.stockOut}`}>
                        {item.stockCount > 10 ? 'In Stock' : item.stockCount > 0 ? 'Low Stock' : 'Out of Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showAdd && (
        <div className={styles.section}>
          <div className={styles.headerRow}>
            <div>
              <h3 className={styles.headerTitle}>Add Medicine to Pharmacy Store</h3>
              <div className={styles.headerSubtitle}>Register new medication, unit price, and starting inventory count</div>
            </div>
          </div>
          <form onSubmit={handleAdd} className={styles.formContainer}>
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label>Medicine Name</label>
                <input
                  type="text"
                  placeholder="e.g. Paracetamol 500mg"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  required
                  disabled={loading}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Unit Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 15.50"
                  value={formData.price}
                  onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))}
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label>Starting Stock Count</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 100"
                value={formData.stockCount}
                onChange={(e) => setFormData((p) => ({ ...p, stockCount: e.target.value }))}
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={loading}>Add to Inventory</button>
          </form>
        </div>
      )}

      {showUpdate && (
        <div className={styles.section}>
          <div className={styles.headerRow}>
            <div>
              <h3 className={styles.headerTitle}>Update Medicine Details</h3>
              <div className={styles.headerSubtitle}>Update price, stock count, or name by Medicine ID</div>
            </div>
          </div>
          <form onSubmit={handleUpdate} className={styles.formContainer}>
            <div className={styles.inputGroup}>
              <label>Medicine ID</label>
              <input
                type="text"
                placeholder="e.g. 1"
                value={updateId}
                onChange={(e) => setUpdateId(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label>Updated Name (Optional)</label>
                <input
                  type="text"
                  placeholder="New Medicine Name"
                  value={updateData.name}
                  onChange={(e) => setUpdateData((p) => ({ ...p, name: e.target.value }))}
                  disabled={loading}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Updated Unit Price ($) (Optional)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="New Price"
                  value={updateData.price}
                  onChange={(e) => setUpdateData((p) => ({ ...p, price: e.target.value }))}
                  disabled={loading}
                />
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label>Updated Stock Count (Optional)</label>
              <input
                type="number"
                min="0"
                placeholder="New Stock Count"
                value={updateData.stockCount}
                onChange={(e) => setUpdateData((p) => ({ ...p, stockCount: e.target.value }))}
                disabled={loading}
              />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={loading}>Update Inventory</button>
          </form>
        </div>
      )}

      {showDelete && (
        <div className={styles.section}>
          <div className={styles.headerRow}>
            <div>
              <h3 className={styles.headerTitle}>Remove Medicine from Store</h3>
              <div className={styles.headerSubtitle}>De-register item from pharmacy stock by ID</div>
            </div>
          </div>
          <div className={`${styles.inputRow} ${styles.alignEndNoMargin}`}>
            <div className={styles.inputGroup}>
              <label>Medicine ID</label>
              <input
                type="text"
                value={deleteId}
                onChange={(e) => setDeleteId(e.target.value)}
                placeholder="Enter Medicine ID (e.g. 1)"
                disabled={loading}
              />
            </div>
            <button type="button" onClick={handleDelete} disabled={loading} className={`${styles.submitBtn} ${styles.danger} ${styles.btnNoMargin}`}>Delete</button>
          </div>
        </div>
      )}

      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
};

export default MedicineStorePage;
