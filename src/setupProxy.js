const { createProxyMiddleware } = require('http-proxy-middleware');

const GATEWAY_PATHS = [
  '/users',
  '/patients',
  '/appointments',
  '/doctors',
  '/prescriptions',
  '/payments',
  '/hospital-charges',
  '/medicine-store',
  '/api',
  '/audit',
  '/departments',
  '/branches',
  '/leaves',
  '/hr',
  '/diagnostics',
  '/surgeries',
  '/admin/sub-departments',
];

module.exports = function (app) {
  app.use(
    GATEWAY_PATHS,
    createProxyMiddleware({
      target: 'https://localhost:9191',
      changeOrigin: true,
      secure: false,
    })
  );
};
