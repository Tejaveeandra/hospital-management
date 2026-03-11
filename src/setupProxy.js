const { createProxyMiddleware, responseInterceptor } = require('http-proxy-middleware');
const bodyParser = require('body-parser');

// Universal Raja Obfuscation Utilities
const scramble = (str) => {
    if (!str) return '';
    const hex = Buffer.from(str).toString('hex');
    return hex.split('').reverse().join('');
};

const descramble = (val) => {
    if (!val) return '';
    try {
        const hex = val.split('').reverse().join('');
        return Buffer.from(hex, 'hex').toString('utf8');
    } catch (e) {
        return '';
    }
};

module.exports = function (app) {
    // Middleware to clear cookies from the browser automatically
    app.use((req, res, next) => {
        if (req.headers.cookie && req.headers.cookie.includes('raja')) {
            console.log('[RAJA] Evicting legacy cookie');
            res.header('Set-Cookie', 'raja=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');
        }
        next();
    });

    // Middleware to parse JSON for body manipulation
    app.use(bodyParser.json());

    app.use(
        '/raja',
        createProxyMiddleware({
            target: 'http://localhost:8088',
            changeOrigin: true,
            selfHandleResponse: true,
            on: {
                proxyReq: (proxyReq, req, res) => {
                    // Preflight handling
                    if (req.method === 'OPTIONS') {
                        res.writeHead(200, {
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                            'Access-Control-Allow-Headers': 'Content-Type, X-Raja-V, Authorization',
                        });
                        return res.end();
                    }

                    if (req.body && req.body.raja) {
                        const rawPayload = descramble(req.body.raja);
                        if (rawPayload) {
                            try {
                                const payload = JSON.parse(rawPayload);
                                let { t, m, p, d } = payload;

                                // 0. Forward Original Headers (Metadata, Cookies, etc.)
                                Object.keys(req.headers).forEach(h => {
                                    if (!['content-length', 'content-type', 'host', 'raja-v'].includes(h.toLowerCase())) {
                                        proxyReq.setHeader(h, req.headers[h]);
                                    }
                                });

                                // 1. Set Path & Method for Backend
                                proxyReq.method = (m || 'GET').toUpperCase();
                                const sanitizedPath = (p || '/').trim().replace(/[^\x20-\x7E]/g, '');
                                proxyReq.path = sanitizedPath.startsWith('/') ? sanitizedPath : '/' + sanitizedPath;

                                // 2. Normalize Headers for Backend (Compatibility)
                                proxyReq.setHeader('Accept', 'application/json, text/plain, */*');
                                const useAuth = !!t && p !== '/users/login';
                                if (useAuth) {
                                    proxyReq.setHeader('Authorization', `Bearer ${t.trim()}`);
                                }

                                // 3. Re-stream Body & End Request
                                if (d && typeof d === 'object' && Object.keys(d).length > 0) {
                                    const bodyData = JSON.stringify(d);
                                    proxyReq.setHeader('Content-Type', 'application/json');
                                    proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                                    proxyReq.write(bodyData);
                                    proxyReq.end();
                                } else {
                                    proxyReq.setHeader('Content-Length', '0');
                                    proxyReq.end();
                                }

                                console.log(`[RAJA] Relay: ${proxyReq.method} ${proxyReq.path} (Auth: ${useAuth})`);
                            } catch (e) {
                                console.error('[RAJA] Payload crash:', e.message);
                                res.writeHead(400); res.end('System Error: v_bad_body');
                            }
                        }
                    } else {
                        console.warn(`[RAJA] Access Denied: Method=${req.method}, BodyKeys=${req.body ? Object.keys(req.body).join(',') : 'null'}`);
                        res.writeHead(403); res.end('Access Denied');
                    }
                },
                proxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
                    console.log(`[RAJA] Response: ${proxyRes.statusCode} for ${req.method} ${req.url}`);
                    const sensitiveHeaders = [
                        'x-powered-by', 'vary', 'pragma', 'cache-control', 'expires',
                        'x-content-type-options', 'x-frame-options', 'x-xss-protection',
                        'access-control-allow-origin', 'access-control-allow-credentials',
                        'server', 'date', 'set-cookie', 'p3p', 'connection'
                    ];
                    sensitiveHeaders.forEach(h => res.removeHeader(h));
                    res.setHeader('Set-Cookie', 'raja=; Path=/; Max-Age=0; HttpOnly');
                    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                    res.setHeader('X-Raja', 'dark');

                    const responseData = responseBuffer.toString('utf8');
                    if (proxyRes.statusCode >= 200 && proxyRes.statusCode < 300) {
                        return scramble(responseData);
                    }
                    // Log backend error body so we can diagnose it
                    console.error(`[RAJA] Backend Error Body for ${req.method} ${req.url}:`, responseData.substring(0, 500));
                    return responseBuffer;
                }),
                error: (err, req, res) => {
                    console.error('[RAJA PROXY] Connection Error:', err.message);
                    if (!res.headersSent) {
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('System Offline');
                    }
                }
            }
        })
    );
};
