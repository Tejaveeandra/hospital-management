# ENCRYPTION_IMPLEMENTATION.md

## Technical Overview
The RAJA security layer implements a "Vantablack" pattern where all API requests are funneled through a single encrypted POST endpoint (`/raja`). This prevents traditional network analysis and scraping.

## Encryption Flow (Frontend)
1. **Payload Assembly**: Original request data (method, path, body, token) is serialized to JSON.
2. **IV Generation**: A random 16-byte Initialization Vector (IV) is generated using `CryptoJS.lib.WordArray.random(16)`.
3. **AES-256-CBC Encryption**: The JSON string is encrypted using AES-256 in CBC mode with PKCS7 padding.
4. **Scrambling**: The IV (hex-encoded) is prepended to the ciphertext (Base64-encoded).
5. **HMAC Signing**: An HMAC-SHA256 signature is calculated over the scrambled payload.
6. **Request Transmission**: The scrambled payload is sent in the `raja` field of a POST body, and the signature is sent in the `X-Raja-Signature` header.

## Decryption Flow (Proxy)
1. **Signature Verification**: The proxy recalculates the HMAC-SHA256 of the `raja` field and compares it with the `X-Raja-Signature` header.
2. **Payload Extraction**: The first 32 characters of the `raja` field are parsed as the IV. The remainder is treated as the ciphertext.
3. **AES-256-CBC Decryption**: The ciphertext is decrypted using the same shared `RAJA_ENCRYPTION_KEY`.
4. **Relay**: The decrypted payload is parsed, and the original request is re-constructed and forwarded to the backend.

## Security Properties
- **Confidentiality**: Provided by AES-256.
- **Integrity**: Provided by HMAC-SHA256.
- **Authenticity**: Guaranteed by the shared secret keys.
- **Replay Protection**: (Recommended) Can be enhanced by adding a timestamp inside the encrypted payload and verifying it in the proxy.
