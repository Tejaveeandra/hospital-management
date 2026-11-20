import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { showToast } from '../components/ToastPopup';

const BillingOperationsPage = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reconciliation, setReconciliation] = useState(null);
  const [lookupUhid, setLookupUhid] = useState('');
  const [payments, setPayments] = useState([]);
  const [message, setMessageState] = useState('');
  const [error, setErrorState] = useState('');

  const setMessage = (msg) => {
    setMessageState(msg);
    if (msg) showToast(msg, 'success');
  };
  const setError = (err) => {
    setErrorState(err);
    if (err) showToast(err, 'error');
  };

  // IPD Advance Wallet state
  const [walletUhid, setWalletUhid] = useState('');
  const [walletInfo, setWalletInfo] = useState(null);
  const [depositAmt, setDepositAmt] = useState('');
  const [settleVisitId, setSettleVisitId] = useState('');

  // IPD Master Invoice state
  const [visitIdLookup, setVisitIdLookup] = useState('');
  const [visitInvoice, setVisitInvoice] = useState(null);
  const [visitPayAmt, setVisitPayAmt] = useState('');
  const [visitPayMethod, setVisitPayMethod] = useState('CASH');

  // Tax Rules Admin state
  const [taxTypes, setTaxTypes] = useState([]);
  const [taxRules, setTaxRules] = useState([]);
  const [newRule, setNewRule] = useState({
    taxTypeId: '', branchId: '', departmentCategory: 'PHARMACY',
    itemCode: '', hsnSacCode: '', taxPercent: '', supplyScope: 'INTRA_STATE',
    taxInclusive: true, minAmountThreshold: '0'
  });

  // Hospital Expenses & P&L state
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [pnl, setPnl] = useState(null);
  const [pnlBranchId, setPnlBranchId] = useState('');
  const [newExpense, setNewExpense] = useState({
    branchId: '', categoryId: '', title: '', vendorName: '', invoiceRef: '',
    amount: '', taxAmount: '0', paymentMethod: 'BANK_TRANSFER', expenseDate: new Date().toISOString().split('T')[0]
  });

  const loadReconciliation = async () => {
    setError('');
    try {
      const res = await api.get(`/api/payments/reconciliation/shift?date=${date}`);
      setReconciliation(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load shift reconciliation');
    }
  };

  useEffect(() => {
    loadReconciliation();
    loadTaxConfig();
    loadExpensesAndPnl();
  }, [date]);

  const loadExpensesAndPnl = async () => {
    try {
      const q = pnlBranchId ? `?branchId=${pnlBranchId}` : '';
      const [catRes, expRes, pnlRes] = await Promise.all([
        api.get('/api/payments/expenses/categories'),
        api.get(`/api/payments/expenses${q}`),
        api.get(`/api/payments/expenses/pnl${q}`)
      ]);
      setExpenseCategories(catRes.data || []);
      setExpenses(expRes.data || []);
      setPnl(pnlRes.data || null);
    } catch { /* Non-admin or optional */ }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/payments/expenses', {
        ...newExpense,
        categoryId: Number(newExpense.categoryId),
        branchId: newExpense.branchId ? Number(newExpense.branchId) : null,
        amount: parseFloat(newExpense.amount),
        taxAmount: parseFloat(newExpense.taxAmount || '0')
      });
      setMessage('Hospital expense recorded.');
      setNewExpense({
        branchId: '', categoryId: '', title: '', vendorName: '', invoiceRef: '',
        amount: '', taxAmount: '0', paymentMethod: 'BANK_TRANSFER', expenseDate: new Date().toISOString().split('T')[0]
      });
      loadExpensesAndPnl();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record expense');
    }
  };

  const loadTaxConfig = async () => {
    try {
      const [typesRes, rulesRes] = await Promise.all([
        api.get('/api/payments/tax-types'),
        api.get('/api/payments/tax-rules')
      ]);
      setTaxTypes(typesRes.data || []);
      setTaxRules(rulesRes.data || []);
    } catch { /* Non-admin or optional */ }
  };

  const downloadPdf = async (url, filename) => {
    try {
      const res = await api.get(url, { responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = blobUrl;
      a.setAttribute('download', filename);
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to download PDF');
    }
  };

  const handleWalletLookup = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.get(`/api/payments/wallet/patient/${encodeURIComponent(walletUhid.trim())}`);
      setWalletInfo(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load wallet');
    }
  };

  const handleWalletDeposit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/api/payments/wallet/deposit', {
        patientUhid: walletUhid.trim(),
        amount: parseFloat(depositAmt),
        remarks: 'Counter Advance Deposit'
      });
      setWalletInfo(res.data);
      setDepositAmt('');
      setMessage(`Deposited ₹${depositAmt} into ${walletUhid}'s advance wallet.`);
    } catch (err) {
      setError(err.response?.data?.message || 'Wallet deposit failed');
    }
  };

  const handleWalletSettle = async () => {
    if (!settleVisitId) return;
    setError('');
    try {
      const res = await api.post(`/api/payments/wallet/settle-invoice/${settleVisitId}`, {});
      setMessage(`Applied ₹${res.data.appliedFromWallet} from wallet to Visit #${settleVisitId}. Remaining due: ₹${res.data.invoiceTotalDue}`);
      const w = await api.get(`/api/payments/wallet/patient/${encodeURIComponent(walletUhid.trim())}`);
      setWalletInfo(w.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Wallet settlement failed');
    }
  };

  const handleVisitInvoiceLookup = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.get(`/api/payments/invoices/visit/${visitIdLookup}`);
      setVisitInvoice(res.data);
      setVisitPayAmt(res.data?.totalDue || '');
    } catch (err) {
      setVisitInvoice(null);
      setError(err.response?.data?.message || 'Invoice not found for visit');
    }
  };

  const handlePayVisitInvoice = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/api/payments/invoices/visit/${visitIdLookup}/pay`, {
        amount: parseFloat(visitPayAmt),
        paymentMethod: visitPayMethod,
        idempotencyKey: crypto.randomUUID ? crypto.randomUUID() : `INV-${Date.now()}`
      });
      setMessage(`Paid ₹${visitPayAmt} (${visitPayMethod}) for Visit #${visitIdLookup}`);
      const res = await api.get(`/api/payments/invoices/visit/${visitIdLookup}`);
      setVisitInvoice(res.data);
      loadReconciliation();
    } catch (err) {
      setError(err.response?.data?.message || 'Visit invoice payment failed');
    }
  };

  const handleCreateTaxRule = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/payments/tax-rules', {
        ...newRule,
        taxTypeId: Number(newRule.taxTypeId),
        branchId: newRule.branchId ? Number(newRule.branchId) : null,
        itemCode: newRule.itemCode || null,
        taxPercent: parseFloat(newRule.taxPercent),
        minAmountThreshold: parseFloat(newRule.minAmountThreshold || '0')
      });
      setMessage('Tax rule created.');
      loadTaxConfig();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create tax rule');
    }
  };

  const handleToggleTaxRule = async (taxRuleId) => {
    try {
      await api.put(`/api/payments/tax-rules/${taxRuleId}/toggle`);
      loadTaxConfig();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle tax rule');
    }
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const res = await api.get(`/api/payments/patient/${encodeURIComponent(lookupUhid.trim())}`);
      setPayments(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch patient payments');
    }
  };

  const handleClearance = async (paymentId, status) => {
    const failureReason = status === 'FAILED' ? window.prompt('Enter bounce/failure reason:', 'Cheque bounced at bank') : '';
    if (status === 'FAILED' && failureReason === null) return;
    try {
      await api.post(`/api/payments/${paymentId}/clearance?status=${status}${failureReason ? `&failureReason=${encodeURIComponent(failureReason)}` : ''}`);
      setMessage(`Payment #${paymentId} marked ${status}`);
      const res = await api.get(`/api/payments/patient/${encodeURIComponent(lookupUhid.trim())}`);
      setPayments(res.data || []);
      loadReconciliation();
    } catch (err) {
      setError(err.response?.data?.message || 'Clearance update failed');
    }
  };

  const handleRefund = async (paymentId, maxAmount) => {
    const reason = window.prompt('Enter refund reason:', 'Appointment cancelled');
    if (reason === null) return;
    const amtInput = window.prompt(`Refund amount (max ₹${maxAmount}, leave blank for full):`, String(maxAmount || ''));
    if (amtInput === null) return;
    const toWallet = window.confirm('Credit this refund to the patient Advance Wallet? (Cancel = normal refund)');
    try {
      const params = new URLSearchParams({ reason, refundToWallet: String(toWallet) });
      if (amtInput.trim()) params.append('amount', amtInput.trim());
      await api.post(`/api/payments/${paymentId}/refund?${params.toString()}`);
      setMessage(`Payment #${paymentId} refunded (${toWallet ? 'credited to Wallet' : 'standard'}).`);
      const res = await api.get(`/api/payments/patient/${encodeURIComponent(lookupUhid.trim())}`);
      setPayments(res.data || []);
      loadReconciliation();
    } catch (err) {
      setError(err.response?.data?.message || 'Refund failed');
    }
  };

  const cardStyle = { background: '#fff', borderRadius: 12, padding: '1.25rem', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', marginBottom: '1.25rem' };

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ marginBottom: '1rem' }}>Billing Operations — Reconciliation, Clearance & Refunds</h2>

      {message && <div style={{ padding: '0.75rem', background: '#dcfce7', color: '#166534', borderRadius: 8, marginBottom: '1rem' }}>{message}</div>}
      {error && <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: 8, marginBottom: '1rem' }}>{error}</div>}

      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>Shift Reconciliation</h3>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          <button onClick={() => window.print()} style={{ marginLeft: 'auto', padding: '0.4rem 0.9rem', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff' }}>Print Shift Report</button>
        </div>

        {reconciliation && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
            <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: 8 }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Total Collected</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>₹{reconciliation.totalCollected}</div>
            </div>
            <div style={{ padding: '0.75rem', background: '#f0fdf4', borderRadius: 8 }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Cash in Drawer</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>₹{reconciliation.cashInDrawer}</div>
            </div>
            <div style={{ padding: '0.75rem', background: '#fefce8', borderRadius: 8 }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Pending Clearances</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{reconciliation.pendingClearances}</div>
            </div>
            <div style={{ padding: '0.75rem', background: '#fef2f2', borderRadius: 8 }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Total Refunded</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>₹{reconciliation.totalRefunded}</div>
            </div>
          </div>
        )}
      </div>

      <div style={cardStyle}>
        <h3>Cheque / DD Clearance & Refunds</h3>
        <form onSubmit={handleLookup} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input placeholder="Enter Patient UHID (e.g., UHID-2026-00123)" value={lookupUhid} onChange={e => setLookupUhid(e.target.value)} required style={{ flex: 1, padding: '0.45rem' }} />
          <button type="submit" style={{ padding: '0.45rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6 }}>Search Payments</button>
        </form>

        {payments.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                <th style={{ padding: '0.6rem' }}>Invoice</th>
                <th style={{ padding: '0.6rem' }}>Method</th>
                <th style={{ padding: '0.6rem' }}>Ref / Bank</th>
                <th style={{ padding: '0.6rem' }}>Amount</th>
                <th style={{ padding: '0.6rem' }}>Status</th>
                <th style={{ padding: '0.6rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.paymentId} style={{ borderTop: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '0.6rem' }}>{p.invoiceNumber || p.paymentId}</td>
                  <td style={{ padding: '0.6rem' }}>{p.paymentMethod} ({p.paymentType || 'FULL'})</td>
                  <td style={{ padding: '0.6rem' }}>{p.referenceNumber ? `${p.referenceNumber} (${p.bankName || ''})` : p.transactionId}</td>
                  <td style={{ padding: '0.6rem' }}>₹{p.amount}</td>
                  <td style={{ padding: '0.6rem' }}>{p.paymentStatus}</td>
                  <td style={{ padding: '0.6rem', display: 'flex', gap: '0.4rem' }}>
                    {p.paymentStatus === 'PENDING' && (
                      <>
                        <button onClick={() => handleClearance(p.paymentId, 'SUCCESS')}>Clear (Success)</button>
                        <button onClick={() => handleClearance(p.paymentId, 'FAILED')}>Bounce / Fail</button>
                      </>
                    )}
                    {p.paymentStatus === 'SUCCESS' && (
                      <>
                        <button onClick={() => handleRefund(p.paymentId, p.amount)} style={{ color: '#b91c1c' }}>Refund</button>
                        <button onClick={() => downloadPdf(`/api/payments/${p.paymentId}/receipt/pdf`, `receipt-${p.paymentId}.pdf`)}>PDF</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={cardStyle}>
        <h3>IPD Master Invoice & Direct Payment</h3>
        <form onSubmit={handleVisitInvoiceLookup} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input type="number" placeholder="Enter Visit ID" value={visitIdLookup} onChange={e => setVisitIdLookup(e.target.value)} required />
          <button type="submit" style={{ padding: '0.45rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6 }}>Load Invoice</button>
        </form>
        {visitInvoice && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <strong>UHID:</strong> {visitInvoice.patientUhid} | <strong>Subtotal:</strong> ₹{visitInvoice.subtotalAmount || 0} | <strong>Tax:</strong> ₹{visitInvoice.totalTaxAmount || 0} | <strong>Total:</strong> ₹{visitInvoice.totalAmount} | <strong>Due:</strong> ₹{visitInvoice.totalDue} ({visitInvoice.status})
              <button onClick={() => downloadPdf(`/api/payments/invoices/visit/${visitInvoice.visitId}/pdf`, `invoice-visit-${visitInvoice.visitId}.pdf`)} style={{ marginLeft: '1rem' }}>Download Invoice PDF</button>
            </div>
            {Number(visitInvoice.totalDue) > 0 && (
              <form onSubmit={handlePayVisitInvoice} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <select value={visitPayMethod} onChange={e => setVisitPayMethod(e.target.value)}>
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="POS_MACHINE">POS</option>
                </select>
                <input type="number" step="0.01" value={visitPayAmt} onChange={e => setVisitPayAmt(e.target.value)} required placeholder="Pay Amount" />
                <button type="submit" style={{ padding: '0.45rem 1rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6 }}>Pay Invoice</button>
              </form>
            )}
          </div>
        )}
      </div>

      <div style={cardStyle}>
        <h3>IPD Advance Wallet</h3>
        <form onSubmit={handleWalletLookup} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input placeholder="Enter Patient UHID" value={walletUhid} onChange={e => setWalletUhid(e.target.value)} required style={{ flex: 1, padding: '0.45rem' }} />
          <button type="submit" style={{ padding: '0.45rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6 }}>Check Wallet</button>
        </form>
        {walletInfo && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div><strong>Available Advance Balance:</strong> ₹{walletInfo.balance}</div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <form onSubmit={handleWalletDeposit} style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="number" step="0.01" placeholder="Deposit ₹" value={depositAmt} onChange={e => setDepositAmt(e.target.value)} required />
                <button type="submit">Deposit Advance</button>
              </form>
              <input type="number" placeholder="Visit ID to settle" value={settleVisitId} onChange={e => setSettleVisitId(e.target.value)} />
              <button type="button" onClick={handleWalletSettle}>Settle Visit from Wallet</button>
            </div>
          </div>
        )}
      </div>

      <div style={cardStyle}>
        <h3>Tax / GST Rules Master (Multi-Branch)</h3>
        <form onSubmit={handleCreateTaxRule} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.6rem', marginBottom: '1rem', alignItems: 'center' }}>
          <select value={newRule.taxTypeId} onChange={e => setNewRule({ ...newRule, taxTypeId: e.target.value })} required>
            <option value="">Tax Type</option>
            {taxTypes.map(t => <option key={t.taxTypeId} value={t.taxTypeId}>{t.taxCode}</option>)}
          </select>
          <input type="number" placeholder="Branch ID (blank=All)" value={newRule.branchId} onChange={e => setNewRule({ ...newRule, branchId: e.target.value })} />
          <input placeholder="Category (e.g. PHARMACY)" value={newRule.departmentCategory} onChange={e => setNewRule({ ...newRule, departmentCategory: e.target.value })} required />
          <input placeholder="Item Code (optional)" value={newRule.itemCode} onChange={e => setNewRule({ ...newRule, itemCode: e.target.value })} />
          <input type="number" step="0.01" placeholder="Tax %" value={newRule.taxPercent} onChange={e => setNewRule({ ...newRule, taxPercent: e.target.value })} required />
          <select value={newRule.supplyScope} onChange={e => setNewRule({ ...newRule, supplyScope: e.target.value })}>
            <option value="INTRA_STATE">INTRA_STATE</option>
            <option value="INTER_STATE">INTER_STATE</option>
          </select>
          <button type="submit">Add Tax Rule</button>
        </form>
        {taxRules.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                <th style={{ padding: '0.4rem' }}>ID</th>
                <th style={{ padding: '0.4rem' }}>Tax</th>
                <th style={{ padding: '0.4rem' }}>Branch</th>
                <th style={{ padding: '0.4rem' }}>Category / Item</th>
                <th style={{ padding: '0.4rem' }}>Scope</th>
                <th style={{ padding: '0.4rem' }}>%</th>
                <th style={{ padding: '0.4rem' }}>Active</th>
              </tr>
            </thead>
            <tbody>
              {taxRules.map(r => (
                <tr key={r.taxRuleId} style={{ borderTop: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '0.4rem' }}>{r.taxRuleId}</td>
                  <td style={{ padding: '0.4rem' }}>{r.taxType?.taxCode}</td>
                  <td style={{ padding: '0.4rem' }}>{r.branchId ?? 'Global'}</td>
                  <td style={{ padding: '0.4rem' }}>{r.departmentCategory}{r.itemCode ? ` / ${r.itemCode}` : ''}</td>
                  <td style={{ padding: '0.4rem' }}>{r.supplyScope}</td>
                  <td style={{ padding: '0.4rem' }}>{r.taxPercent}%</td>
                  <td style={{ padding: '0.4rem' }}>
                    <button onClick={() => handleToggleTaxRule(r.taxRuleId)}>{r.active ? 'Active' : 'Disabled'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 style={{ margin: 0 }}>Hospital Expenses & Net Profit / Loss (P&L)</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input type="number" placeholder="Filter Branch ID" value={pnlBranchId} onChange={e => setPnlBranchId(e.target.value)} style={{ width: 140 }} />
            <button type="button" onClick={loadExpensesAndPnl}>Refresh P&L</button>
          </div>
        </div>
        {pnl && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.6rem', marginBottom: '1rem' }}>
            <div style={{ padding: '0.6rem', background: '#f8fafc', borderRadius: 8 }}><small>Collections</small><div><strong>₹{pnl.totalCollections}</strong></div></div>
            <div style={{ padding: '0.6rem', background: '#fef2f2', borderRadius: 8 }}><small>Refunds</small><div><strong>₹{pnl.totalRefunds}</strong></div></div>
            <div style={{ padding: '0.6rem', background: '#fefce8', borderRadius: 8 }}><small>GST / Tax</small><div><strong>₹{pnl.totalTax}</strong></div></div>
            <div style={{ padding: '0.6rem', background: '#eff6ff', borderRadius: 8 }}><small>Doctor Share</small><div><strong>₹{pnl.doctorShare}</strong></div></div>
            <div style={{ padding: '0.6rem', background: '#fff7ed', borderRadius: 8 }}><small>Expenses</small><div><strong>₹{pnl.totalExpenses}</strong></div></div>
            <div style={{ padding: '0.6rem', background: Number(pnl.netProfit) >= 0 ? '#dcfce7' : '#fee2e2', borderRadius: 8 }}><small>Net Profit</small><div><strong>₹{pnl.netProfit}</strong></div></div>
          </div>
        )}
        <form onSubmit={handleCreateExpense} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.6rem', marginBottom: '1rem', alignItems: 'center' }}>
          <select value={newExpense.categoryId} onChange={e => setNewExpense({ ...newExpense, categoryId: e.target.value })} required>
            <option value="">Category</option>
            {expenseCategories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.displayName}</option>)}
          </select>
          <input type="number" placeholder="Branch ID (optional)" value={newExpense.branchId} onChange={e => setNewExpense({ ...newExpense, branchId: e.target.value })} />
          <input placeholder="Title (e.g. Electricity Bill)" value={newExpense.title} onChange={e => setNewExpense({ ...newExpense, title: e.target.value })} required />
          <input placeholder="Vendor Name" value={newExpense.vendorName} onChange={e => setNewExpense({ ...newExpense, vendorName: e.target.value })} />
          <input placeholder="Invoice Ref" value={newExpense.invoiceRef} onChange={e => setNewExpense({ ...newExpense, invoiceRef: e.target.value })} />
          <input type="number" step="0.01" placeholder="Amount ₹" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} required />
          <input type="number" step="0.01" placeholder="Tax ₹" value={newExpense.taxAmount} onChange={e => setNewExpense({ ...newExpense, taxAmount: e.target.value })} />
          <input type="date" value={newExpense.expenseDate} onChange={e => setNewExpense({ ...newExpense, expenseDate: e.target.value })} />
          <button type="submit">Add Expense</button>
        </form>
        {expenses.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                <th style={{ padding: '0.4rem' }}>Date</th>
                <th style={{ padding: '0.4rem' }}>Branch</th>
                <th style={{ padding: '0.4rem' }}>Category</th>
                <th style={{ padding: '0.4rem' }}>Title / Vendor</th>
                <th style={{ padding: '0.4rem' }}>Total</th>
                <th style={{ padding: '0.4rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(ex => (
                <tr key={ex.expenseId} style={{ borderTop: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '0.4rem' }}>{ex.expenseDate}</td>
                  <td style={{ padding: '0.4rem' }}>{ex.branchId ?? 'Global'}</td>
                  <td style={{ padding: '0.4rem' }}>{ex.category?.categoryCode}</td>
                  <td style={{ padding: '0.4rem' }}>{ex.title}{ex.vendorName ? ` (${ex.vendorName})` : ''}</td>
                  <td style={{ padding: '0.4rem' }}>₹{ex.totalAmount}</td>
                  <td style={{ padding: '0.4rem' }}>{ex.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default BillingOperationsPage;

