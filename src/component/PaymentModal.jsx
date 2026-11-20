import React, { useState, useEffect, useRef } from 'react';
import api from '../api/api';
import { showToast } from '../components/ToastPopup';
import styles from './PaymentModal.module.css';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51T7u4I2Ox9guQuIW4ulim6NlQltJzuBbxEAfl704dvuYlXWEdjFpAUbYVwAj3xYCNnEFm8zf4R4CzUQ35LOMXjhW00Mpi0g543';

const PaymentModal = ({ appointmentId, amount, onClose, onPaymentSuccess }) => {
    const [paymentMethod, setPaymentMethod] = useState('UPI');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [qrCodeUrl, setQrCodeUrl] = useState(null);
    const [success, setSuccess] = useState(false);
    const [txnId, setTxnId] = useState('');
    const [paymentId, setPaymentId] = useState(null);
    const [taxAmount, setTaxAmount] = useState(0);
    const idempotencyKeyRef = useRef(
        (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : `IDEM-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    );
    const [splits, setSplits] = useState([
        { paymentMethod: 'CASH', amount: '', referenceNumber: '' },
        { paymentMethod: 'UPI', amount: '', referenceNumber: '' }
    ]);

    const [stripe, setStripe] = useState(null);
    const [elements, setElements] = useState(null);
    const cardRef = useRef(null);
    const cardElementRef = useRef(null);

    const [upiData, setUpiData] = useState({
        upiVpa: ''
    });
    const [offlineData, setOfflineData] = useState({
        referenceNumber: '',
        bankName: '',
        instrumentDate: new Date().toISOString().split('T')[0]
    });
    const [pendingMessage, setPendingMessage] = useState('');

    const userRole = (localStorage.getItem('role') || '').toUpperCase();
    const isStaffCollector = ['ADMIN', 'SUPER_ADMIN', 'RECEPTIONIST'].includes(userRole);
    const isOfflineMethod = ['CASH', 'POS_MACHINE', 'DD', 'CHEQUE'].includes(paymentMethod);

    const [availableMethods, setAvailableMethods] = useState([
        { code: 'UPI', displayName: 'UPI', icon: '📱', staffOnly: false },
        { code: 'CREDIT_CARD', displayName: 'Card', icon: '💳', staffOnly: false },
        ...(isStaffCollector ? [
            { code: 'CASH', displayName: 'Cash', icon: '💵', staffOnly: true },
            { code: 'POS_MACHINE', displayName: 'POS', icon: '🖨️', staffOnly: true },
            { code: 'DD', displayName: 'DD', icon: '📄', staffOnly: true },
            { code: 'CHEQUE', displayName: 'Cheque', icon: '🏦', staffOnly: true },
            { code: 'SPLIT', displayName: 'Split', icon: '🔀', staffOnly: true },
        ] : [])
    ]);

    useEffect(() => {
        api.get('/api/payments/methods')
            .then(res => {
                if (Array.isArray(res.data) && res.data.length > 0) {
                    const list = isStaffCollector && !res.data.some(m => m.code === 'SPLIT')
                        ? [...res.data, { code: 'SPLIT', displayName: 'Split', icon: '🔀', staffOnly: true }]
                        : res.data;
                    setAvailableMethods(list);
                }
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (window.Stripe) {
            const stripeInstance = window.Stripe(STRIPE_PUBLISHABLE_KEY);
            setStripe(stripeInstance);
            setElements(stripeInstance.elements());
        } else {
            setError('Stripe.js failed to load. Please refresh the page.');
        }
    }, []);

    useEffect(() => {
        if (paymentMethod === 'CREDIT_CARD' && elements && cardRef.current && !cardElementRef.current) {
            const card = elements.create('card', {
                style: {
                    base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': {
                            color: '#aab7c4',
                        },
                    },
                    invalid: {
                        color: '#9e2146',
                    },
                },
            });
            card.mount(cardRef.current);
            cardElementRef.current = card;
        }

        return () => {
            if (paymentMethod !== 'CREDIT_CARD' && cardElementRef.current) {
                cardElementRef.current.unmount();
                cardElementRef.current = null;
            }
        };
    }, [paymentMethod, elements]);

    const handleUpiChange = (e) => {
        const { name, value } = e.target;
        setUpiData(prev => ({ ...prev, [name]: value }));
    };

    const triggerWebhook = async (id) => {
        try {
            console.log(`[RAJA] Triggering webhook for txn: ${id}`);
            await api.post('/api/payments/webhook/process', {
                transactionId: id,
                appointmentId: appointmentId,
                status: 'SUCCESS'
            });
            setSuccess(true);
            showToast(`Payment #${appointmentId} completed successfully!`, 'success');
            if (onPaymentSuccess) onPaymentSuccess();
        } catch (err) {
            const msg = 'Payment notification failed: ' + (err.response?.data?.message || err.message);
            setError(msg);
            showToast(msg, 'error');
        }
    };

    const handleInitiatePayment = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Generate a local ref ID just to send to initiate - backend may replace it with Stripe's pi_... ID
        const localTxnId = "TXN_" + Date.now();

        const splitTotal = splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
        if (paymentMethod === 'SPLIT' && Math.abs(splitTotal - Number(amount)) > 0.01) {
            setError(`Split amounts (₹${splitTotal.toFixed(2)}) must equal ₹${amount}.`);
            setLoading(false);
            return;
        }

        const payload = {
            appointmentId,
            amount,
            paymentMethod,
            transactionId: localTxnId,
            idempotencyKey: idempotencyKeyRef.current,
            ...(paymentMethod === 'UPI' ? upiData : {}),
            ...(isOfflineMethod ? offlineData : {}),
            ...(paymentMethod === 'SPLIT' ? {
                paymentType: 'SPLIT',
                splits: splits.map(s => ({
                    paymentMethod: s.paymentMethod,
                    amount: parseFloat(s.amount) || 0,
                    referenceNumber: s.referenceNumber || null
                }))
            } : {})
        };

        try {
            const response = await api.post('/api/payments/initiate', payload, {
                headers: { 'Idempotency-Key': idempotencyKeyRef.current }
            });

            // Use the transactionId returned by the backend (the real Stripe pi_... ID)
            const backendTxnId = response.data?.transactionId || localTxnId;
            setTxnId(backendTxnId);
            setPaymentId(response.data?.paymentId || null);
            setTaxAmount(response.data?.taxAmount || 0);
            console.log(`[RAJA] Backend returned transactionId: ${backendTxnId}`);

            if (isOfflineMethod || paymentMethod === 'SPLIT') {
                const status = response.data?.paymentStatus;
                if (status === 'PENDING') {
                    setPendingMessage(`${paymentMethod} #${offlineData.referenceNumber} recorded as PENDING bank realization.`);
                }
                setSuccess(true);
                showToast(
                    status === 'PENDING'
                        ? `${paymentMethod} recorded as PENDING bank realization.`
                        : `Payment #${appointmentId} completed successfully!`,
                    'success'
                );
                if (onPaymentSuccess) onPaymentSuccess();
            } else if (paymentMethod === 'UPI') {
                if (response.data.qrCodeUrl) {
                    setQrCodeUrl(response.data.qrCodeUrl);
                } else {
                    setError('Failed to generate QR code.');
                }
            } else if (paymentMethod === 'CREDIT_CARD') {
                const clientSecret = response.data.clientSecret;
                if (!clientSecret) {
                    throw new Error('No clientSecret returned from server');
                }

                if (!stripe || !cardElementRef.current) {
                    throw new Error('Stripe is not initialized yet');
                }

                const result = await stripe.confirmCardPayment(clientSecret, {
                    payment_method: {
                        card: cardElementRef.current,
                        billing_details: {
                            name: 'Patient Name',
                        },
                    }
                });

                if (result.error) {
                    setError(result.error.message);
                    showToast(result.error.message, 'error');
                } else if (result.paymentIntent?.status === 'succeeded') {
                    const stripePaymentIntentId = result.paymentIntent.id;
                    console.log(`[RAJA] Stripe PaymentIntent ID: ${stripePaymentIntentId}`);
                    await triggerWebhook(stripePaymentIntentId || backendTxnId);
                } else {
                    const msg = `Payment status: ${result.paymentIntent?.status || 'incomplete'}`;
                    setError(msg);
                    showToast(msg, 'error');
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Payment initiation failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleManualWebhook = async () => {
        setLoading(true);
        await triggerWebhook(txnId);
        setLoading(false);
    };

    const handleDownloadReceipt = async () => {
        if (!paymentId) return;
        try {
            const res = await api.get(`/api/payments/${paymentId}/receipt/pdf`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `receipt-${paymentId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError('Could not download receipt PDF: ' + (err.message || 'Error'));
        }
    };

    if (success) {
        return (
            <div className={styles.modalOverlay}>
                <div className={styles.modalContent}>
                    <div className={styles.successMessage}>
                        <div className={styles.successIcon}>{pendingMessage ? '⏳' : '✅'}</div>
                        <h2>{pendingMessage ? 'Provisional Receipt Recorded' : 'Payment Successful!'}</h2>
                        <p>{pendingMessage || `Your payment for appointment #${appointmentId} is being processed.`}</p>
                        {taxAmount > 0 && <p>Included GST/Tax: ₹{Number(taxAmount).toFixed(2)}</p>}
                        {paymentId && (
                            <button type="button" className={styles.payButton} onClick={handleDownloadReceipt} style={{ marginTop: '0.75rem' }}>
                                📄 Download Receipt (PDF)
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => { if (onPaymentSuccess) onPaymentSuccess(); onClose(); }}
                            style={{ marginTop: '0.75rem', padding: '0.6rem 1.4rem', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600 }}
                        >
                            Done & Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <button className={styles.closeButton} onClick={onClose}>&times;</button>
                <h2>Secure Payment</h2>

                <div className={styles.paymentMethods} style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                    {availableMethods.map(m => (
                        <button
                            key={m.code}
                            type="button"
                            className={`${styles.methodBtn} ${paymentMethod === m.code ? styles.active : ''}`}
                            onClick={() => { setPaymentMethod(m.code); setQrCodeUrl(null); setError(''); }}
                        >
                            <span>{m.icon || '💳'} {m.displayName}</span>
                        </button>
                    ))}
                </div>

                {error && <div className={styles.errorMessage}>{error}</div>}

                <div className={styles.paymentFormContainer}>
                    {!qrCodeUrl ? (
                        <form onSubmit={handleInitiatePayment}>
                            {paymentMethod === 'UPI' ? (
                                <div className={styles.inputGroup}>
                                    <label>UPI VPA</label>
                                    <input
                                        type="text"
                                        name="upiVpa"
                                        placeholder="user@upi"
                                        value={upiData.upiVpa}
                                        onChange={handleUpiChange}
                                        required
                                    />
                                </div>
                            ) : paymentMethod === 'CREDIT_CARD' ? (
                                <div className={styles.stripeContainer}>
                                    <label>Card Information</label>
                                    <div ref={cardRef} className={styles.stripeCardElement}></div>
                                    <p className={styles.infoText}>Testing? Use card 4242 4242 4242 4242</p>
                                </div>
                            ) : paymentMethod === 'CASH' ? (
                                <p className={styles.infoText}>Collect ₹{amount} cash at counter and issue receipt.</p>
                            ) : paymentMethod === 'SPLIT' ? (
                                <div className={styles.inputGroup}>
                                    <label>Split Payment Breakdown (Total: ₹{amount})</label>
                                    {splits.map((s, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            <select
                                                value={s.paymentMethod}
                                                onChange={(e) => {
                                                    const next = [...splits];
                                                    next[idx].paymentMethod = e.target.value;
                                                    setSplits(next);
                                                }}
                                            >
                                                <option value="CASH">Cash</option>
                                                <option value="UPI">UPI</option>
                                                <option value="POS_MACHINE">POS</option>
                                            </select>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="Amount"
                                                value={s.amount}
                                                onChange={(e) => {
                                                    const next = [...splits];
                                                    next[idx].amount = e.target.value;
                                                    setSplits(next);
                                                }}
                                                required
                                            />
                                            <input
                                                type="text"
                                                placeholder="Ref (optional)"
                                                value={s.referenceNumber}
                                                onChange={(e) => {
                                                    const next = [...splits];
                                                    next[idx].referenceNumber = e.target.value;
                                                    setSplits(next);
                                                }}
                                            />
                                        </div>
                                    ))}
                                    <p className={styles.infoText}>
                                        Remaining to allocate: ₹{(Number(amount) - splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0)).toFixed(2)}
                                    </p>
                                </div>
                            ) : paymentMethod === 'POS_MACHINE' ? (
                                <div className={styles.inputGroup}>
                                    <label>POS Approval / RRN Number</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., 429104821902"
                                        value={offlineData.referenceNumber}
                                        onChange={(e) => setOfflineData(prev => ({ ...prev, referenceNumber: e.target.value }))}
                                        required
                                    />
                                </div>
                            ) : (
                                <>
                                    <div className={styles.inputGroup}>
                                        <label>{paymentMethod} Number (6 digits)</label>
                                        <input
                                            type="text"
                                            maxLength={6}
                                            pattern="[0-9]{6}"
                                            placeholder="e.g., 482910"
                                            value={offlineData.referenceNumber}
                                            onChange={(e) => setOfflineData(prev => ({ ...prev, referenceNumber: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>Bank Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., SBI / HDFC"
                                            value={offlineData.bankName}
                                            onChange={(e) => setOfflineData(prev => ({ ...prev, bankName: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>{paymentMethod} Date</label>
                                        <input
                                            type="date"
                                            value={offlineData.instrumentDate}
                                            onChange={(e) => setOfflineData(prev => ({ ...prev, instrumentDate: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <p className={styles.infoText}>Saved as PENDING until bank realization.</p>
                                </>
                            )}

                            <div style={{ marginTop: '1rem', fontWeight: 'bold' }}>
                                Total Amount: ₹{amount}
                            </div>

                            <button type="submit" className={styles.payButton} disabled={loading}>
                                {loading ? 'Processing...' : `Pay ₹${amount}`}
                            </button>
                        </form>
                    ) : (
                        <div className={styles.qrContainer}>
                            <img src={qrCodeUrl} alt="UPI QR Code" className={styles.qrImage} />
                            <p className={styles.qrInstructions}>Scan this QR code with any UPI app to pay</p>
                            <p>Txn ID: <strong>{txnId}</strong></p>
                            {isStaffCollector ? (
                                <button
                                    className={styles.payButton}
                                    onClick={handleManualWebhook}
                                    disabled={loading}
                                >
                                    {loading ? 'Confirming...' : 'Confirm UPI Received'}
                                </button>
                            ) : (
                                <p className={styles.infoText}>After scanning, ask the reception desk to verify your UPI transaction ID, or pay instantly online using Card.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
