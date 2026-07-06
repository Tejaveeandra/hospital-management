import axios from 'axios';
import CryptoJS from 'crypto-js';

// Security Keys (Kept for potential individual field encryption)
const ENCRYPTION_KEY = process.env.REACT_APP_RAJA_ENCRYPTION_KEY || 'default_secure_key_32_characters_';
const SIGNING_KEY = process.env.REACT_APP_RAJA_SIGNING_KEY || 'default_secure_sign_key_32_chars';

// --- API CONFIGURATION ---
// We point to our local Proxy Server (setupProxy.js) which handles the RAJA security layer
const api = axios.create({
    baseURL: '', 
});

// Production-ready Encryption Utilities
const scramble = (str) => {
    if (!str) return '';
    const iv = CryptoJS.lib.WordArray.random(16);
    const key = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY);
    const encrypted = CryptoJS.AES.encrypt(str, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return iv.toString() + encrypted.toString();
};

const sign = (payload) => {
    return CryptoJS.HmacSHA256(payload, SIGNING_KEY).toString();
};

const descramble = (val) => {
    if (!val || typeof val !== 'string') return val;
    
    try {
        // 1. Extract IV and Ciphertext
        const iv = CryptoJS.enc.Hex.parse(val.substring(0, 32));
        const ciphertext = val.substring(32);
        const key = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY);
        
        // 2. Decrypt
        const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        
        const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
        if (!decryptedStr) return val; // Fallback if decryption fails

        // 3. Parse JSON
        return JSON.parse(decryptedStr);
    } catch (e) {
        console.warn('[RAJA] Decryption/Parsing Fallback:', e.message);
        return val;
    }
};

// Request interceptor: Transforming into RAJA Secure Payload
api.interceptors.request.use(
    (config) => {
        // Bypassing RAJA securely for development to avoid proxy crashes
        const shouldBypass = true;

        // Skip transformation if bypassed, already using /raja, or calling an absolute URL
        if (shouldBypass || config.url === '/raja' || config.url.startsWith('http')) {
            if (shouldBypass) {
                console.log(`[RAJA] Bypass Active: ${config.method?.toUpperCase()} ${config.url}`);
                const token = localStorage.getItem('token') || localStorage.getItem('_raja_t');
                if (token) {
                    config.headers = config.headers || {};
                    config.headers['Authorization'] = `Bearer ${token}`;
                }
            }
            return config;
        }

        const token = localStorage.getItem('token') || localStorage.getItem('_raja_t');
        
        // Prepare RAJA Payload: { t: token, m: method, p: path, d: data }
        const payload = JSON.stringify({
            t: token || '',
            m: config.method?.toUpperCase() || 'GET',
            p: config.url,
            d: config.data || {}
        });

        const scrambled = scramble(payload);
        const signature = sign(scrambled);

        // Transform the request to hit /raja with the secure payload
        config.url = '/raja';
        config.method = 'post';
        config.data = { raja: scrambled };
        config.headers['X-Raja-Signature'] = signature;
        config.headers['Content-Type'] = 'application/json';

        console.log(`[RAJA] Secure Wrapper: ${JSON.parse(payload).m} ${JSON.parse(payload).p}`);
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: Standard handling + Token persistence
api.interceptors.response.use(
    (response) => {
        const isBypassed = process.env.NODE_ENV === 'development' && localStorage.getItem('RAJA_BYPASS') === 'true';

        // Automatically descramble if not bypassed and the response is an encrypted string from RAJA
        if (!isBypassed && typeof response.data === 'string' && response.data.length > 32) {
            const descrambled = descramble(response.data);
            if (descrambled && typeof descrambled === 'object') {
                response.data = descrambled;
            }
        }

        const data = response.data;

        // Capture and persist token if returned in body
        if (data && data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('_raja_t', data.token);
            console.log('[GATEWAY] Session synchronized');
        }

        return response;
    },
    (error) => {
        console.error('[GATEWAY] Request Failed:', error.config?.url, error.message);
        
        // Handle Session Expiry (403 or 401)
        // Skip auto-redirect if this was a login request (let the login page show the error)
        const isLoginRequest = error.config && error.config.url && error.config.url.includes('/users/login');
        
        if (!isLoginRequest && error.response && (error.response.status === 403 || error.response.status === 401)) {
            console.warn('[GATEWAY] Session expired or unauthorized.');
            localStorage.removeItem('token');
            localStorage.removeItem('_raja_t');
            localStorage.removeItem('role');
            localStorage.removeItem('username');
            localStorage.removeItem('userId');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

export default api;

