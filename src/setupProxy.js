const { createProxyMiddleware } = require('http-proxy-middleware');

const GATEWAY_URL = process.env.REACT_APP_API_URL || 'https://api-gateway:9191';

module.exports = function (app) {
    // Use pathFilter so Express does NOT strip the path prefix.
    // e.g. /users/login stays /users/login, not /login
    app.use(
        createProxyMiddleware({
            pathFilter: ['/users', '/patients', '/doctors', '/appointments', '/api'],
            target: GATEWAY_URL,
            changeOrigin: true,
            secure: false,
            on: {
                error: (err, req, res) => {
                    console.error('[PROXY] Error:', err.message);
                    if (!res.headersSent) {
                        res.writeHead(502, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Proxy Error', message: err.message }));
                    }
                }
            }
        })
    );
};
