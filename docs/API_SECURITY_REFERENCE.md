# API_SECURITY_REFERENCE.md

## Unified Endpoint
All communication occurs via:
- **URL**: `/raja`
- **Method**: `POST`
- **Content-Type**: `application/json`

## Request Format

### Headers
| Header | Description | Required |
|--------|-------------|----------|
| `X-Raja-V` | System Version (currently `2`) | Yes |
| `X-Raja-Signature` | HMAC-SHA256 signature of the payload | Yes |
| `Authorization` | Bearer token (not used directly relative to RAJA; extracted from payload) | No |

### Body
```json
{
  "raja": "[IV_HEX][ENCRYPTED_PAYLOAD_BASE64]"
}
```

## Internal Payload Structure (Decrypted)
```json
{
  "t": "JWT_TOKEN",
  "m": "ORIGINAL_METHOD",
  "p": "/api/original/path?query=params",
  "d": { "original": "data" }
}
```

## Security Status Codes
| Code | Meaning | Action |
|------|---------|--------|
| `400` | Bad Payload Format | Verify encryption implementation. |
| `403` | Forbidden / Invalid Signature | Check keys and signing logic. |
| `500` | System Error / Proxy Failure | Check proxy logs for crashes. |

## Versioning
- **v1**: Basic hex encoding (Legacy).
- **v2**: AES-256 + HMAC-SHA256 (Current).
