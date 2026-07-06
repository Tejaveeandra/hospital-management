# PRODUCTION_SECURITY_GUIDE.md

## Overview
The RAJA system uses a specialized encryption and signing layer to protect API communication between the frontend and the backend. This guide outlines the best practices for maintaining security in a production environment.

## Key Management
The system relies on two critical keys:
1. **RAJA_ENCRYPTION_KEY**: A 32-character string used for AES-256-CBC encryption.
2. **RAJA_SIGNING_KEY**: A string used for HMAC-SHA256 request signing.

### Best Practices
- **Rotation**: Rotate keys every 90 days or immediately if a breach is suspected.
- **Complexity**: Use high-entropy random strings. Avoid dictionary words.
- **Storage**: Never commit keys to version control. Use environment variables or a dedicated Secrets Manager (e.g., AWS Secrets Manager, HashiCorp Vault).

## Environment Security
- Ensure SSL/TLS is enabled for all production traffic. Encryption at the application layer (RAJA) is a secondary defense, not a replacement for HTTPS.
- Set `NODE_ENV=production` to disable verbose logging of raw payloads in the proxy.

## Monitoring & Alerts
- Monitor proxy logs for `[RAJA] Security Violation` messages. Frequent signature mismatches may indicate a coordinated tampering attempt.
- Alert on 403 status codes originating from the `/raja` endpoint.

## Security Controls
- **IP Whitelisting**: If possible, restrict access to the backend API so it only accepts requests from the Proxy IP.
- **Rate Limiting**: Implement rate limiting on the `/raja` endpoint to prevent brute-force attacks on the encryption layer.
