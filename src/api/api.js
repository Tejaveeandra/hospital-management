import axios from 'axios';

const api = axios.create({
    baseURL: '/raja',
});

// Obfuscation Utilities (matching proxy)
const scramble = (str) => {
    if (!str) return '';
    // Convert to Hex and reverse for "noise" effect
    const hex = Array.from(new TextEncoder().encode(str))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    return hex.split('').reverse().join('');
};

const descramble = (val) => {
    if (!val) return null;
    try {
        const hex = val.split('').reverse().join('');
        const bytes = new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
        const decoded = new TextDecoder().decode(bytes);
        return JSON.parse(decoded);
    } catch (e) {
        return val;
    }
};


// Request interceptor: Move EVERYTHING to a single scrambled POST body
api.interceptors.request.use(
    (config) => {
        if (config.url && config.url !== '/raja') {
            const token = localStorage.getItem('_raja_t');
            const originalUrl = config.url;
            const originalMethod = config.method || 'get';
            const params = config.params ? new URLSearchParams(config.params).toString() : '';
            const fullPath = `${originalUrl}${params ? '?' + params : ''}`;

            // Unified Vantablack Payload
            const payload = {
                t: token,               // Token
                m: originalMethod,      // Real Method
                p: fullPath,            // Real Path
                d: config.data          // Real Data
            };

            config.data = { raja: scramble(JSON.stringify(payload)) };
            console.log(`[RAJA] Request: ${originalMethod} ${fullPath}`, payload);
            config.method = 'post'; // EVERYTHING IS POST
            config.url = '/raja';
            config.baseURL = '';
            config.params = {};

            // --- VANTABLACK HEADERS: Minimal but standard ---
            config.headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*',
                'X-Raja-V': '1'
            };
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: Capture token and descramble
api.interceptors.response.use(
    (response) => {
        let data = response.data;

        // 1. Descramble if needed
        if (data && typeof data === 'string') {
            try {
                // Manually descramble hex
                const hex = data.split('').reverse().join('');
                const bytes = new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
                const decoded = new TextDecoder().decode(bytes);
                data = JSON.parse(decoded);
            } catch (e) {
                // If not scrambled or not JSON, leave as is
            }
        }

        // 2. Capture and persist token
        if (data && data.token) {
            localStorage.setItem('_raja_t', data.token);
            console.log('[RAJA] Session synchronized');
        }

        response.data = data;
        return response;
    },
    (error) => {
        console.error('[RAJA] Request Failed:', error.config?.url, error.message);
        if (error.response) {
            console.error('[RAJA] Status:', error.response.status);
            console.error('[RAJA] Data:', error.response.data);
        }
        if (error.response && error.response.status === 403) {
            console.warn('[RAJA] Session expired or unauthorized.');
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
