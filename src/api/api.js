import axios from 'axios';
import CryptoJS from 'crypto-js';

// Security Keys (Kept for potential individual field encryption)
const ENCRYPTION_KEY = process.env.REACT_APP_RAJA_ENCRYPTION_KEY || 'default_secure_key_32_characters_';
const SIGNING_KEY = process.env.REACT_APP_RAJA_SIGNING_KEY || 'default_secure_sign_key_32_chars';

// --- API CONFIGURATION ---
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
        const iv = CryptoJS.enc.Hex.parse(val.substring(0, 32));
        const ciphertext = val.substring(32);
        const key = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY);
        
        const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        
        const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
        if (!decryptedStr) return val;

        return JSON.parse(decryptedStr);
    } catch (e) {
        console.warn('[RAJA] Decryption/Parsing Fallback:', e.message);
        return val;
    }
};

// Queue handling for concurrent requests during token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

/**
 * Perform a clean refresh of the access token using the stored refresh token.
 * Updates both access token and rotated refresh token in localStorage.
 */
export const refreshUserToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
        console.warn('[AUTH] No refresh token found in storage.');
        return null;
    }

    try {
        // Direct call using raw axios to avoid interceptor recursion
        const response = await axios.post('/users/refresh', {
            refreshToken: refreshToken
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        const data = response.data;
        if (data && data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('_raja_t', data.token);
            if (data.refreshToken) {
                localStorage.setItem('refreshToken', data.refreshToken);
            }
            console.log('[AUTH] Token successfully refreshed and rotated.');
            return data.token;
        }
    } catch (err) {
        console.warn('[AUTH] Token refresh failed:', err.response?.data?.message || err.message);
        return null;
    }
    return null;
};

// Request interceptor: Transforming into RAJA Secure Payload
api.interceptors.request.use(
    (config) => {
        const shouldBypass = true;

        if (shouldBypass || config.url === '/raja' || config.url.startsWith('http')) {
            if (shouldBypass) {
                const token = localStorage.getItem('token') || localStorage.getItem('_raja_t');
                if (token) {
                    config.headers = config.headers || {};
                    config.headers['Authorization'] = `Bearer ${token}`;
                }
            }
            return config;
        }

        const token = localStorage.getItem('token') || localStorage.getItem('_raja_t');
        
        const payload = JSON.stringify({
            t: token || '',
            m: config.method?.toUpperCase() || 'GET',
            p: config.url,
            d: config.data || {}
        });

        const scrambled = scramble(payload);
        const signature = sign(scrambled);

        config.url = '/raja';
        config.method = 'post';
        config.data = { raja: scrambled };
        config.headers['X-Raja-Signature'] = signature;
        config.headers['Content-Type'] = 'application/json';

        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: Standard handling + Token persistence + 401 Silent Refresh
api.interceptors.response.use(
    (response) => {
        const isBypassed = process.env.NODE_ENV === 'development' && localStorage.getItem('RAJA_BYPASS') === 'true';

        if (!isBypassed && typeof response.data === 'string' && response.data.length > 32) {
            const descrambled = descramble(response.data);
            if (descrambled && typeof descrambled === 'object') {
                response.data = descrambled;
            }
        }

        const data = response.data;

        if (data && data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('_raja_t', data.token);
        }

        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        console.error('[GATEWAY] Request Failed:', originalRequest?.url, error.message);

        const isAuthEndpoint = originalRequest?.url && (
            originalRequest.url.includes('/users/login') || 
            originalRequest.url.includes('/users/refresh') ||
            originalRequest.url.includes('/users/logout') ||
            originalRequest.url.includes('/users/check-status') ||
            originalRequest.url.includes('/users/forgot-password')
        );

        // Handle 401 Unauthorized: Attempt seamless token refresh if not already retrying
        if (!isAuthEndpoint && error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                .then(token => {
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return api(originalRequest);
                })
                .catch(err => Promise.reject(err));
            }

            isRefreshing = true;

            try {
                const newToken = await refreshUserToken();
                if (newToken) {
                    processQueue(null, newToken);
                    originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
                    return api(originalRequest);
                } else {
                    processQueue(new Error('Token refresh failed'), null);
                    await logoutUser(true, 'expired');
                    return Promise.reject(error);
                }
            } catch (refreshErr) {
                processQueue(refreshErr, null);
                await logoutUser(true, 'expired');
                return Promise.reject(refreshErr);
            } finally {
                isRefreshing = false;
            }
        }

        // If refresh failed or request not eligible for refresh, logout
        if (!isAuthEndpoint && error.response && error.response.status === 401) {
            await logoutUser(true, 'expired');
        }

        return Promise.reject(error);
    }
);

export default api;

/**
 * Logout user: Calls backend /users/logout to revoke access token in Redis and delete refresh token,
 * then clears localStorage and optionally redirects.
 */
export const logoutUser = async (redirect = false, reason = '') => {
    const token = localStorage.getItem('token') || localStorage.getItem('_raja_t');
    const refreshToken = localStorage.getItem('refreshToken');

    try {
        if (token) {
            // Raw axios to avoid interceptor recursion
            await axios.post('/users/logout', {
                refreshToken: refreshToken || ''
            }, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('[AUTH] Token successfully revoked on backend.');
        }
    } catch (err) {
        console.warn('[AUTH] Revoke / Logout call failed:', err.message);
    } finally {
        localStorage.removeItem('_raja_t');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        localStorage.removeItem('userId');
        localStorage.removeItem('permissions');

        if (redirect) {
            window.location.href = reason ? `/?reason=${reason}` : '/';
        }
    }
};
