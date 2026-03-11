import React, { useState, useEffect, useRef } from 'react';
import api from '../api/api';
import styles from './PaymentModal.module.css';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51T7u4I2Ox9guQuIW4ulim6NlQltJzuBbxEAfl704dvuYlXWEdjFpAUbYVwAj3xYCNnEFm8zf4R4CzUQ35LOMXjhW00Mpi0g543';

const PaymentModal = ({ appointmentId, amount, onClose, onPaymentSuccess }) => {
    const [paymentMethod, setPaymentMethod] = useState('UPI');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [qrCodeUrl, setQrCodeUrl] = useState(null);
    const [success, setSuccess] = useState(false);
    const [txnId, setTxnId] = useState('');

    const [stripe, setStripe] = useState(null);
    const [elements, setElements] = useState(null);
    const cardRef = useRef(null);
    const cardElementRef = useRef(null);

    const [upiData, setUpiData] = useState({
        upiVpa: ''
    });

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
            setTimeout(() => {
                onPaymentSuccess();
                onClose();
            }, 2000);
        } catch (err) {
            setError('Payment notification failed: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleInitiatePayment = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Generate a local ref ID just to send to initiate - backend may replace it with Stripe's pi_... ID
        const localTxnId = "TXN_" + Date.now();

        const payload = {
            appointmentId,
            amount,
            paymentMethod,
            transactionId: localTxnId,
            ...(paymentMethod === 'UPI' ? upiData : {})
        };

        try {
            const response = await api.post('/api/payments/initiate', payload);

            // Use the transactionId returned by the backend (the real Stripe pi_... ID)
            const backendTxnId = response.data?.transactionId || localTxnId;
            setTxnId(backendTxnId);
            console.log(`[RAJA] Backend returned transactionId: ${backendTxnId}`);

            if (paymentMethod === 'UPI') {
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
                } else {
                    if (result.paymentIntent.status === 'succeeded') {
                        // Use real Stripe PaymentIntent ID from the confirmation result
                        const stripePaymentIntentId = result.paymentIntent.id;
                        console.log(`[RAJA] Stripe PaymentIntent ID: ${stripePaymentIntentId}`);
                        await triggerWebhook(stripePaymentIntentId || backendTxnId);
                    }
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

    if (success) {
        return (
            <div className={styles.modalOverlay}>
                <div className={styles.modalContent}>
                    <div className={styles.successMessage}>
                        <div className={styles.successIcon}>✅</div>
                        <h2>Payment Successful!</h2>
                        <p>Your payment for appointment #{appointmentId} is being processed.</p>
                        <p>Wait a moment...</p>
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

                <div className={styles.paymentMethods}>
                    <button
                        className={`${styles.methodBtn} ${paymentMethod === 'UPI' ? styles.active : ''}`}
                        onClick={() => { setPaymentMethod('UPI'); setQrCodeUrl(null); }}
                    >
                        <span>📱 UPI</span>
                    </button>
                    <button
                        className={`${styles.methodBtn} ${paymentMethod === 'CREDIT_CARD' ? styles.active : ''}`}
                        onClick={() => { setPaymentMethod('CREDIT_CARD'); setQrCodeUrl(null); }}
                    >
                        <span>💳 Card</span>
                    </button>
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
                            ) : (
                                <div className={styles.stripeContainer}>
                                    <label>Card Information</label>
                                    <div ref={cardRef} className={styles.stripeCardElement}></div>
                                    <p className={styles.infoText}>Testing? Use card 4242 4242 4242 4242</p>
                                </div>
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
                            <button
                                className={styles.payButton}
                                onClick={handleManualWebhook}
                                disabled={loading}
                            >
                                {loading ? 'Confirming...' : 'I have paid'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
