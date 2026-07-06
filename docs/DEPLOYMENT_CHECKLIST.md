# DEPLOYMENT_CHECKLIST.md

## Pre-Deployment Verification
- [ ] Verify `crypto-js` is present in `package.json`.
- [ ] Run a local build and test the `/raja` proxy flow.
- [ ] Ensure `X-Raja-Signature` is being sent in every request.
- [ ] Confirm `setupProxy.js` is correctly reading environment variables.

## Environment Setup
- [ ] Generate 64-character random hex strings for both encryption and signing keys.
- [ ] Configure production environment variables:
    - `RAJA_ENCRYPTION_KEY`
    - `RAJA_SIGNING_KEY`
- [ ] Ensure these variables are injected into the CI/CD pipeline.

## Security Lockdown
- [ ] Disable console logging in `api.js` for production builds (use conditional logic).
- [ ] Verify that the backend is NOT accessible via its direct URL except from the Proxy.
- [ ] Check that `X-Powered-By` and other sensitive headers are stripped by the proxy.

## Post-Deployment Validation
- [ ] Login to the production app.
- [ ] Perform a data fetch operation.
- [ ] Inspect Network tab to ensure all requests are `POST /raja` and payloads are unreadable.
- [ ] Attempt a manual request with an invalid signature via Postman; it should return `403`.
