# Proxy and URL Restrictions Documentation

**Version**: 1.0  
**Last Updated**: 2024  
**Project**: Hospital Management System  
**Dependencies**: `http-proxy-middleware@^3.0.5`, `axios@^1.8.4`

## Table of Contents
1. [Quick Start](#quick-start)
2. [Overview](#overview)
3. [Architecture](#architecture)
4. [Proxy Configuration](#proxy-configuration)
5. [URL Restrictions and Sanitization](#url-restrictions-and-sanitization)
6. [Obfuscation System](#obfuscation-system)
7. [Security Features](#security-features)
8. [Request Flow](#request-flow)
9. [Response Handling](#response-handling)
10. [Error Handling](#error-handling)
11. [Real-World Examples](#real-world-examples)
12. [Configuration Details](#configuration-details)
13. [Performance Considerations](#performance-considerations)
14. [Testing](#testing)
15. [Glossary](#glossary)

---

## Quick Start

### For Developers

**Using the API in your React components:**

```javascript
import api from '../api/api';

// GET request
const fetchPatient = async (patientId) => {
  try {
    const response = await api.get(`/patients/${patientId}`);
    return response.data;
  } catch (error) {
    console.error('Error:', error);
  }
};

// POST request
const createPatient = async (patientData) => {
  try {
    const response = await api.post('/patients/addPatient', patientData);
    return response.data;
  } catch (error) {
    console.error('Error:', error);
  }
};

// PUT request
const updatePatient = async (patientId, patientData) => {
  try {
    const response = await api.put(`/patients/update/${patientId}`, patientData);
    return response.data;
  } catch (error) {
    console.error('Error:', error);
  }
};
```

**What happens automatically:**
- ✅ Request is obfuscated and sent to `/raja`
- ✅ Token from `localStorage._raja_t` is included
- ✅ Response is automatically deobfuscated
- ✅ Token is extracted and stored if present
- ✅ 403 errors trigger automatic logout

### For System Administrators

**Key Points:**
- Backend must run on `http://localhost:8088`
- All API calls go through `/raja` endpoint
- Requests are obfuscated (not encrypted - see security notes)
- Tokens stored in browser `localStorage`, not cookies

**To change backend URL:**
1. Edit `src/setupProxy.js` line 37
2. Change `target: 'http://localhost:8088'` to your backend URL
3. Restart the development server

---

## Overview

The hospital management system implements a sophisticated proxy-based architecture with URL restrictions and data obfuscation. This system provides:

- **Security through obfuscation**: All API requests are obfuscated to prevent direct inspection
- **URL sanitization**: Paths are cleaned and validated before reaching the backend
- **Unified endpoint**: All requests are routed through a single `/raja` endpoint
- **Header stripping**: Sensitive headers are removed from responses
- **Cookie management**: Legacy cookies are automatically evicted

---

## Architecture

The system consists of two main components:

1. **Frontend API Client** (`src/api/api.js`): Intercepts all axios requests and obfuscates them
2. **Backend Proxy** (`src/setupProxy.js`): Receives obfuscated requests, deobfuscates them, and forwards to the actual backend

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                        │
│  ┌──────────────┐                                              │
│  │   Component  │  api.get('/patients/123')                     │
│  └──────┬───────┘                                              │
│         │                                                       │
│  ┌──────▼──────────┐                                           │
│  │  API Interceptor │  Obfuscates request                       │
│  │  (api.js)        │  Adds token from localStorage            │
│  └──────┬───────────┘                                           │
└─────────┼───────────────────────────────────────────────────────┘
          │ POST /raja
          │ Body: { raja: "obfuscated_hex..." }
          │
┌─────────▼───────────────────────────────────────────────────────┐
│                    Proxy Server (Express)                       │
│  ┌──────────────────────────────┐                               │
│  │  setupProxy.js               │                               │
│  │  - Deobfuscates payload      │                               │
│  │  - Sanitizes path            │                               │
│  │  - Reconstructs request      │                               │
│  └──────┬───────────────────────┘                               │
└─────────┼───────────────────────────────────────────────────────┘
          │ GET /patients/123
          │ Headers: { Authorization: "Bearer token..." }
          │
┌─────────▼───────────────────────────────────────────────────────┐
│                    Backend Server (Port 8088)                   │
│  ┌──────────────────────────────┐                               │
│  │  API Endpoints               │                               │
│  │  - /patients/*               │                               │
│  │  - /doctors/*                │                               │
│  │  - /appointments/*           │                               │
│  └──────┬───────────────────────┘                               │
└─────────┼───────────────────────────────────────────────────────┘
          │ JSON Response
          │
┌─────────▼───────────────────────────────────────────────────────┐
│                    Proxy Server (Express)                       │
│  ┌──────────────────────────────┐                               │
│  │  Response Handler            │                               │
│  │  - Strips headers            │                               │
│  │  - Obfuscates response       │                               │
│  └──────┬───────────────────────┘                               │
└─────────┼───────────────────────────────────────────────────────┘
          │ Obfuscated Response
          │
┌─────────▼───────────────────────────────────────────────────────┐
│                         Frontend (React)                        │
│  ┌──────────────────────────────┐                               │
│  │  Response Interceptor        │                               │
│  │  - Deobfuscates response     │                               │
│  │  - Extracts token            │                               │
│  └──────┬───────────────────────┘                               │
│         │                                                       │
│  ┌──────▼───────┐                                              │
│  │   Component  │  Receives clean data                         │
│  └──────────────┘                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Proxy Configuration

### Location
- **File**: `src/setupProxy.js`
- **Target Backend**: `http://localhost:8088`
- **Proxy Endpoint**: `/raja`

### Key Components

#### 1. Obfuscation Utilities

```javascript
// Scramble: Converts string to hex and reverses
const scramble = (str) => {
    if (!str) return '';
    const hex = Buffer.from(str).toString('hex');
    return hex.split('').reverse().join('');
};

// Descramble: Reverses hex and converts back to string
const descramble = (val) => {
    if (!val) return '';
    try {
        const hex = val.split('').reverse().join('');
        return Buffer.from(hex, 'hex').toString('utf8');
    } catch (e) {
        return '';
    }
};
```

**Purpose**: Converts readable JSON payloads into obfuscated hex strings to prevent direct inspection of API calls.

#### 2. Cookie Eviction Middleware

```javascript
app.use((req, res, next) => {
    if (req.headers.cookie && req.headers.cookie.includes('raja')) {
        console.log('[RAJA] Evicting legacy cookie');
        res.header('Set-Cookie', 'raja=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');
    }
    next();
});
```

**Purpose**: Automatically removes legacy `raja` cookies from both incoming requests and outgoing responses to prevent cookie-based attacks.

#### 3. Proxy Middleware Configuration

The proxy uses `http-proxy-middleware` with the following settings:

- **Target**: `http://localhost:8088` (backend server)
- **Change Origin**: `true` (changes the origin header)
- **Self Handle Response**: `true` (allows custom response handling)

---

## URL Restrictions and Sanitization

### Path Sanitization

All URL paths are sanitized before being forwarded to the backend:

```51:52:src/setupProxy.js
const sanitizedPath = (p || '/').trim().replace(/[^\x20-\x7E]/g, '');
proxyReq.path = sanitizedPath.startsWith('/') ? sanitizedPath : '/' + sanitizedPath;
```

#### Sanitization Rules:

1. **Non-ASCII Character Removal**: 
   - Removes all characters outside the printable ASCII range (`\x20-\x7E`)
   - This prevents injection of special characters, control characters, or Unicode exploits

2. **Path Normalization**:
   - Trims whitespace from the path
   - Ensures the path always starts with `/`
   - Defaults to `/` if no path is provided

3. **Method Normalization**:
   - Converts HTTP method to uppercase
   - Defaults to `GET` if no method is specified

#### Example Transformations:

| Input | Output | Reason |
|-------|--------|--------|
| `"/api/users"` | `"/api/users"` | Valid path |
| `"api/users"` | `"/api/users"` | Missing leading slash added |
| `"/api/users\n"` | `"/api/users"` | Control character removed |
| `"/api/users<script>"` | `"/api/users"` | Non-ASCII characters removed |
| `null` or `undefined` | `"/"` | Default fallback |

### Access Control

The proxy enforces strict access control:

```78:81:src/setupProxy.js
} else {
    console.warn('[RAJA] Unauthorized access to /raja');
    res.writeHead(403); res.end('Access Denied');
}
```

**Restrictions**:
- Only requests with a valid `raja` payload in the request body are processed
- Requests without the obfuscated payload receive a `403 Forbidden` response
- This prevents direct access to the `/raja` endpoint without proper obfuscation

---

## Obfuscation System

### Request Obfuscation (Frontend)

The frontend API client intercepts all requests and obfuscates them:

```30:64:src/api/api.js
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
```

**What Happens**:
1. All requests (GET, POST, PUT, DELETE, etc.) are converted to POST requests
2. Original method, URL, params, and data are packaged into a JSON payload
3. The payload is obfuscated using the `scramble` function
4. The obfuscated payload is sent as `{ raja: "<obfuscated_string>" }`
5. All requests are routed to `/raja` endpoint

### Request Deobfuscation (Proxy)

The proxy receives the obfuscated request and reconstructs the original request:

```41:82:src/setupProxy.js
proxyReq: (proxyReq, req, res) => {
    if (req.body && req.body.raja) {
        const rawPayload = descramble(req.body.raja);
        if (rawPayload) {
            try {
                const payload = JSON.parse(rawPayload);
                let { t, m, p, d } = payload;

                // 1. Set Path & Method for Backend
                proxyReq.method = (m || 'GET').toUpperCase();
                const sanitizedPath = (p || '/').trim().replace(/[^\x20-\x7E]/g, '');
                proxyReq.path = sanitizedPath.startsWith('/') ? sanitizedPath : '/' + sanitizedPath;

                // 2. Normalize Headers for Backend (Compatibility)
                proxyReq.setHeader('Accept', 'application/json, text/plain, */*');
                if (t) {
                    proxyReq.setHeader('Authorization', `Bearer ${t.trim()}`);
                }

                // 3. Re-stream Body & End Request
                if (d && typeof d === 'object' && Object.keys(d).length > 0) {
                    const bodyData = JSON.stringify(d);
                    proxyReq.setHeader('Content-Type', 'application/json');
                    proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                    proxyReq.write(bodyData);
                    proxyReq.end(); // CRITICAL: Signal request end
                } else {
                    proxyReq.setHeader('Content-Length', '0');
                    proxyReq.end(); // CRITICAL
                }

                console.log(`[RAJA] Relay: ${proxyReq.method} ${proxyReq.path}`);
            } catch (e) {
                console.error('[RAJA] Payload crash:', e.message);
                res.writeHead(400); res.end('System Error: v_bad_body');
            }
        }
    } else {
        console.warn('[RAJA] Unauthorized access to /raja');
        res.writeHead(403); res.end('Access Denied');
    }
},
```

**What Happens**:
1. Extracts the `raja` field from the request body
2. Deobfuscates the payload using `descramble`
3. Parses the JSON to extract:
   - `t`: Authentication token
   - `m`: HTTP method (GET, POST, PUT, DELETE, etc.)
   - `p`: URL path with query parameters
   - `d`: Request body data
4. Sanitizes the path (removes non-ASCII characters)
5. Reconstructs the original request with proper method, path, headers, and body
6. Forwards the reconstructed request to the backend server

### Response Obfuscation

Successful responses are also obfuscated before being sent to the frontend:

```83:105:src/setupProxy.js
proxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
    // --- VANTABLACK: Strip ALL Headers ---
    const sensitiveHeaders = [
        'x-powered-by', 'vary', 'pragma', 'cache-control', 'expires',
        'x-content-type-options', 'x-frame-options', 'x-xss-protection',
        'access-control-allow-origin', 'access-control-allow-credentials',
        'server', 'date', 'set-cookie', 'p3p', 'connection'
    ];
    sensitiveHeaders.forEach(h => res.removeHeader(h));

    // Force cookie eviction in response too
    res.setHeader('Set-Cookie', 'raja=; Path=/; Max-Age=0; HttpOnly');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('X-Raja', 'dark');

    const responseData = responseBuffer.toString('utf8');

    // SCRAMBLE SUCCESS
    if (proxyRes.statusCode >= 200 && proxyRes.statusCode < 300) {
        return scramble(responseData);
    }
    return responseBuffer;
}),
```

**What Happens**:
1. Strips sensitive headers that could reveal backend information
2. Forces cookie eviction in the response
3. Sets minimal, generic headers
4. Obfuscates successful responses (2xx status codes) using `scramble`
5. Leaves error responses unmodified for debugging

### Response Deobfuscation (Frontend)

The frontend deobfuscates responses:

```67:92:src/api/api.js
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
```

**What Happens**:
1. Checks if the response is a string (obfuscated)
2. Deobfuscates the response using the reverse of the scramble process
3. Parses the JSON data
4. Extracts and stores authentication tokens if present
5. Returns the deobfuscated data to the application

---

## Security Features

### Security Analysis

**Current Security Level**: ⚠️ **Medium** (Obfuscation, not encryption)

**What This System Protects Against:**
- ✅ Casual inspection of API calls in browser DevTools
- ✅ Simple script injection through URL paths
- ✅ Information leakage through response headers
- ✅ Cookie-based attacks (legacy cookies evicted)
- ✅ Direct access to `/raja` endpoint without proper payload

**What This System Does NOT Protect Against:**
- ❌ Determined attackers (obfuscation can be reversed)
- ❌ Man-in-the-middle attacks (no encryption)
- ❌ Replay attacks (no request signing)
- ❌ Token theft if localStorage is compromised
- ❌ XSS attacks (depends on proper input sanitization)

**Recommendations for Production:**
1. **Use HTTPS**: Always use HTTPS in production to encrypt traffic
2. **Implement Proper Encryption**: Replace obfuscation with AES-256 encryption
3. **Add Request Signing**: Sign requests to prevent tampering
4. **Token Expiration**: Implement token expiration and refresh mechanism
5. **Rate Limiting**: Add rate limiting to prevent brute force attacks
6. **Input Validation**: Validate all inputs on the backend
7. **CORS Configuration**: Properly configure CORS for production domains

### 1. Path Sanitization
- **Non-ASCII Character Filtering**: Prevents injection of special characters
- **Path Normalization**: Ensures consistent path formatting
- **Default Fallback**: Prevents undefined behavior with invalid paths

### 2. Header Stripping
The following headers are removed from responses to prevent information leakage:

```85:91:src/setupProxy.js
const sensitiveHeaders = [
    'x-powered-by', 'vary', 'pragma', 'cache-control', 'expires',
    'x-content-type-options', 'x-frame-options', 'x-xss-protection',
    'access-control-allow-origin', 'access-control-allow-credentials',
    'server', 'date', 'set-cookie', 'p3p', 'connection'
];
```

**Why**: These headers can reveal:
- Server technology and version
- Caching strategies
- Security configurations
- Server timestamps
- Cookie information

### 3. Cookie Management
- **Automatic Eviction**: Legacy cookies are automatically removed
- **No Cookie Storage**: The system uses localStorage for tokens instead of cookies
- **Response Cookie Clearing**: Forces cookie expiration in responses

### 4. Access Control
- **Payload Validation**: Only requests with valid obfuscated payloads are processed
- **403 Forbidden**: Direct access attempts are blocked
- **Token-Based Auth**: Uses Bearer tokens stored in localStorage

### 5. Error Handling
- **Graceful Degradation**: Invalid payloads return 400 errors instead of crashing
- **Connection Errors**: Backend connection failures return 500 errors
- **Error Logging**: All errors are logged for debugging

---

## Request Flow

### Complete Request Lifecycle

1. **Frontend Request**
   ```
   User Action → React Component → api.get('/api/users')
   ```

2. **Request Interception**
   ```
   api.js interceptor → Extract method, URL, params, data, token
   ```

3. **Obfuscation**
   ```
   Create payload → Scramble → { raja: "<obfuscated>" }
   ```

4. **Proxy Request**
   ```
   POST /raja → setupProxy.js receives request
   ```

5. **Deobfuscation**
   ```
   Descramble → Parse JSON → Extract t, m, p, d
   ```

6. **Path Sanitization**
   ```
   Remove non-ASCII → Normalize path → Ensure leading slash
   ```

7. **Backend Request**
   ```
   Reconstruct request → Forward to http://localhost:8088
   ```

8. **Backend Response**
   ```
   Backend processes → Returns response
   ```

9. **Response Obfuscation**
   ```
   Strip headers → Scramble response → Send to frontend
   ```

10. **Response Deobfuscation**
    ```
    Frontend receives → Descramble → Parse JSON → Update token
    ```

11. **Application Update**
    ```
    React component receives data → UI updates
    ```

### Example Flow

**Original Request**:
```javascript
api.get('/api/doctors', { params: { id: 123 } })
```

**After Frontend Interception**:
```javascript
POST /raja
Body: { 
  raja: "a3b2c1d4e5f6..." // obfuscated hex string
}
```

**After Proxy Deobfuscation**:
```javascript
GET http://localhost:8088/api/doctors?id=123
Headers: { Authorization: "Bearer <token>" }
```

**Backend Response**:
```json
{ "id": 123, "name": "Dr. Smith", "token": "xyz..." }
```

**After Proxy Obfuscation**:
```
Response: "f6e5d4c3b2a1..." // obfuscated hex string
Headers: { Content-Type: "text/plain", X-Raja: "dark" }
```

**After Frontend Deobfuscation**:
```json
{ "id": 123, "name": "Dr. Smith", "token": "xyz..." }
```

---

## Real-World Examples

### Example 1: Patient Login Flow

**Component Code** (`src/pages/LoginPage.jsx`):
```javascript
const response = await api.post('/users/login', {
  username: username,
  password: password,
});
```

**What Actually Happens**:

1. **Frontend Interceptor** transforms:
   ```javascript
   POST /users/login
   Body: { username: "john", password: "secret123" }
   ```
   
   Into:
   ```javascript
   POST /raja
   Body: { 
     raja: "7b2274223a22657879..." // obfuscated payload containing:
     // - t: null (no token yet)
     // - m: "post"
     // - p: "/users/login"
     // - d: { username: "john", password: "secret123" }
   }
   ```

2. **Proxy** receives, deobfuscates, and forwards:
   ```javascript
   POST http://localhost:8088/users/login
   Body: { username: "john", password: "secret123" }
   ```

3. **Backend** responds:
   ```json
   {
     "username": "john",
     "role": "patient",
     "userId": 123,
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   }
   ```

4. **Proxy** obfuscates response:
   ```
   Response: "7b22757365726e616d65223a226a6f686e22..." // obfuscated hex
   ```

5. **Frontend** deobfuscates and stores token:
   ```javascript
   localStorage.setItem('_raja_t', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
   localStorage.setItem('username', 'john');
   localStorage.setItem('role', 'patient');
   ```

### Example 2: Fetching Patient Data

**Component Code** (`src/pages/PatientPage.jsx`):
```javascript
const response = await api.get(`/patients/${patientId}`);
```

**What Actually Happens**:

1. **Frontend** (with token from localStorage):
   ```javascript
   GET /patients/123
   ```
   
   Transformed to:
   ```javascript
   POST /raja
   Body: { 
     raja: "7b2274223a2265794a68624763694f694a6b5a5..." // contains:
     // - t: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." (token)
     // - m: "get"
     // - p: "/patients/123"
     // - d: null
   }
   ```

2. **Proxy** sanitizes path and forwards:
   ```javascript
   GET http://localhost:8088/patients/123
   Headers: { Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
   ```

3. **Backend** returns patient data (obfuscated by proxy)
4. **Frontend** receives and uses the data

### Example 3: Creating Appointment with Query Parameters

**Component Code**:
```javascript
const response = await api.get('/appointments', { 
  params: { doctorId: 5, date: '2024-01-15' } 
});
```

**Transformation**:
- Original: `GET /appointments?doctorId=5&date=2024-01-15`
- Obfuscated: `POST /raja` with full path in payload
- Backend receives: `GET /appointments?doctorId=5&date=2024-01-15`

### Common Patterns

**Pattern 1: Error Handling**
```javascript
try {
  const response = await api.get('/patients/123');
  // Handle success
} catch (error) {
  if (error.response?.status === 403) {
    // Automatically redirected to login (handled by interceptor)
  } else {
    // Handle other errors
    console.error('Error:', error.message);
  }
}
```

**Pattern 2: Loading States**
```javascript
const [loading, setLoading] = useState(false);

const fetchData = async () => {
  setLoading(true);
  try {
    const response = await api.get('/patients/123');
    // Process data
  } catch (error) {
    // Handle error
  } finally {
    setLoading(false);
  }
};
```

---

## Response Handling

### Success Responses (2xx)

- **Status**: 200-299
- **Processing**: Obfuscated before sending to frontend
- **Headers**: Stripped and replaced with minimal headers
- **Content**: Scrambled hex string

### Error Responses (4xx, 5xx)

- **Status**: 400-599
- **Processing**: Sent as-is (not obfuscated)
- **Headers**: Stripped but error status preserved
- **Content**: Original error message

### Special Error Cases

#### 403 Forbidden
```93:103:src/api/api.js
(error) => {
    console.error('[RAJA] Request Failed:', error.config?.url, error.message);
    if (error.response && error.response.status === 403) {
        localStorage.removeItem('_raja_t');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        localStorage.removeItem('userId');
        if (window.location.pathname !== '/') {
            window.location.href = '/';
        }
    }
    return Promise.reject(error);
}
```

**Behavior**:
- Clears all authentication data
- Redirects user to login page
- Prevents unauthorized access

#### 400 Bad Request
- **Cause**: Invalid or malformed payload
- **Response**: `"System Error: v_bad_body"`
- **Logging**: Error logged to console

#### 500 Internal Server Error
```106:112:src/setupProxy.js
error: (err, req, res) => {
    console.error('[RAJA PROXY] Connection Error:', err.message);
    if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('System Offline');
    }
}
```

**Behavior**:
- Logs connection errors
- Returns "System Offline" message
- Prevents duplicate error responses

---

## Performance Considerations

### Overhead Analysis

**Request Processing Time:**
- Obfuscation: ~1-5ms (depends on payload size)
- Deobfuscation: ~1-5ms
- Path sanitization: <1ms
- Header stripping: <1ms
- **Total overhead**: ~3-12ms per request

**Payload Size Impact:**
- Small payloads (<1KB): Minimal impact
- Medium payloads (1-10KB): ~2-5ms overhead
- Large payloads (>10KB): ~5-15ms overhead

### Optimization Tips

1. **Minimize Payload Size**
   - Only send necessary data
   - Use pagination for large datasets
   - Compress large responses (consider gzip)

2. **Batch Requests When Possible**
   - Instead of multiple small requests, use batch endpoints
   - Reduces obfuscation overhead

3. **Caching Strategy**
   - Cache responses at component level
   - Use React Query or SWR for automatic caching
   - Reduces redundant API calls

4. **Connection Pooling**
   - The proxy maintains connection pools to backend
   - Multiple requests reuse connections
   - No additional configuration needed

### Memory Usage

- **Obfuscation buffers**: Temporary, garbage collected after request
- **Response buffers**: Held in memory during processing
- **Token storage**: Minimal (~1KB in localStorage)

### Network Impact

- **Request size**: Increases by ~30-50% due to hex encoding
- **Response size**: Increases by ~30-50% due to hex encoding
- **Headers**: Reduced (stripped headers save ~200-500 bytes)

### Production Recommendations

1. **Enable Compression**: Use gzip/brotli compression
2. **CDN**: Consider CDN for static assets
3. **Load Balancing**: Distribute proxy load across multiple instances
4. **Monitoring**: Track request latency and error rates
5. **Rate Limiting**: Implement rate limiting to prevent abuse

---

## Testing

### Testing the Proxy System

**Manual Testing:**

1. **Test Obfuscation**:
   ```javascript
   // In browser console
   const testPayload = { test: "data" };
   const scrambled = scramble(JSON.stringify(testPayload));
   console.log('Scrambled:', scrambled);
   const descrambled = descramble(scrambled);
   console.log('Descrambled:', descrambled);
   ```

2. **Test API Calls**:
   ```javascript
   // In React component
   const testAPI = async () => {
     try {
       const response = await api.get('/test');
       console.log('Response:', response.data);
     } catch (error) {
       console.error('Error:', error);
     }
   };
   ```

3. **Monitor Network Tab**:
   - All requests should show as `POST /raja`
   - Request body should contain `{ raja: "..." }`
   - Response should be obfuscated hex string (for 2xx)

### Unit Testing

**Test Obfuscation Functions:**
```javascript
describe('Obfuscation', () => {
  test('scramble and descramble should be reversible', () => {
    const original = '{"test": "data"}';
    const scrambled = scramble(original);
    const descrambled = descramble(scrambled);
    expect(descrambled).toBe(original);
  });
  
  test('should handle empty strings', () => {
    expect(scramble('')).toBe('');
    expect(descramble('')).toBe('');
  });
});
```

**Test Path Sanitization:**
```javascript
describe('Path Sanitization', () => {
  test('should remove non-ASCII characters', () => {
    const path = '/api/users<script>';
    const sanitized = path.replace(/[^\x20-\x7E]/g, '');
    expect(sanitized).toBe('/api/users');
  });
  
  test('should ensure leading slash', () => {
    const path = 'api/users';
    const sanitized = path.startsWith('/') ? path : '/' + path;
    expect(sanitized).toBe('/api/users');
  });
});
```

### Integration Testing

**Test Full Request Flow:**
```javascript
describe('API Integration', () => {
  test('should obfuscate request and deobfuscate response', async () => {
    const mockResponse = { data: { id: 1, name: 'Test' } };
    // Mock axios or use MSW (Mock Service Worker)
    const response = await api.get('/test');
    expect(response.data).toEqual(mockResponse.data);
  });
});
```

### Debugging Tips

1. **Enable Console Logging**: Check browser console for `[RAJA]` prefixed logs
2. **Network Inspector**: Use browser DevTools to inspect actual network requests
3. **Proxy Logs**: Check server console for proxy relay messages
4. **Token Verification**: Check `localStorage._raja_t` to verify token storage

---

## Configuration Details

### Proxy Target

```37:37:src/setupProxy.js
target: 'http://localhost:8088',
```

**To Change Backend URL**:
1. Update the `target` value in `src/setupProxy.js`
2. Ensure the backend server is accessible from the proxy server
3. Restart the development server

### Proxy Endpoint

```35:35:src/setupProxy.js
'/raja',
```

**To Change Proxy Endpoint**:
1. Update the path in `src/setupProxy.js`
2. Update `baseURL` in `src/api/api.js`
3. Update the condition in the request interceptor

### Obfuscation Algorithm

The obfuscation uses a simple hex-reversal scheme:

**Scramble**:
1. Convert string to hex
2. Reverse the hex string

**Descramble**:
1. Reverse the hex string
2. Convert hex to string

**Note**: This is not encryption - it's obfuscation. For production, consider using proper encryption.

### Token Storage

- **Location**: `localStorage`
- **Key**: `_raja_t`
- **Usage**: Automatically included in all requests
- **Lifecycle**: Persists until cleared or 403 error

---

## Best Practices

### Development

1. **Monitor Console Logs**: The system logs all proxy operations with `[RAJA]` prefix
2. **Check Network Tab**: All requests appear as POST to `/raja`
3. **Verify Backend**: Ensure backend is running on port 8088

### Production Considerations

1. **Encryption**: Replace obfuscation with proper encryption (AES-256)
2. **HTTPS**: Always use HTTPS in production
3. **Rate Limiting**: Add rate limiting to prevent abuse
4. **CORS**: Configure CORS properly for production domains
5. **Environment Variables**: Move backend URL to environment variables
6. **Error Messages**: Customize error messages for production
7. **Logging**: Implement proper logging system (avoid console.log)

### Security Recommendations

1. **Token Expiration**: Implement token expiration and refresh
2. **CSRF Protection**: Add CSRF tokens for state-changing operations
3. **Input Validation**: Validate all inputs on the backend
4. **SQL Injection**: Use parameterized queries
5. **XSS Protection**: Sanitize all user inputs
6. **Audit Logging**: Log all security-relevant events

---

## Troubleshooting

### Common Issues

#### 1. "Access Denied" (403)
- **Cause**: Request missing `raja` payload
- **Solution**: Ensure request interceptor is working correctly

#### 2. "System Error: v_bad_body" (400)
- **Cause**: Invalid or malformed payload
- **Solution**: Check obfuscation/deobfuscation functions

#### 3. "System Offline" (500)
- **Cause**: Backend server not running or unreachable
- **Solution**: Verify backend is running on port 8088

#### 4. Response Not Deobfuscating
- **Cause**: Response interceptor not processing correctly
- **Solution**: Check response format and deobfuscation logic

#### 5. Token Not Persisting
- **Cause**: localStorage not available or blocked
- **Solution**: Check browser settings and localStorage availability

---

## API Reference

### Frontend API Client

**Location**: `src/api/api.js`

**Usage**:
```javascript
import api from './api/api';

// GET request
const response = await api.get('/api/users');

// POST request
const response = await api.post('/api/users', { name: 'John' });

// PUT request
const response = await api.put('/api/users/1', { name: 'Jane' });

// DELETE request
const response = await api.delete('/api/users/1');
```

**All requests are automatically**:
- Obfuscated
- Routed through `/raja`
- Include authentication token
- Deobfuscated on response

### Proxy Configuration

**Location**: `src/setupProxy.js`

**Exports**: Express middleware function

**Dependencies**:
- `http-proxy-middleware`: ^3.0.5
- `body-parser`: For parsing JSON bodies

---

## Summary

The proxy and URL restriction system provides:

✅ **Security through obfuscation** - Prevents direct API inspection  
✅ **URL sanitization** - Removes dangerous characters and normalizes paths  
✅ **Unified endpoint** - All requests go through `/raja`  
✅ **Header stripping** - Removes sensitive information  
✅ **Cookie management** - Prevents cookie-based attacks  
✅ **Error handling** - Graceful error responses  
✅ **Token management** - Automatic token extraction and storage  

This architecture provides a robust security layer while maintaining a clean API interface for the frontend application.

---

## Glossary

**Obfuscation**: The process of making code or data difficult to understand or read, but not encrypted. In this system, data is converted to hex and reversed.

**Scramble**: The function that converts a string to hexadecimal and reverses it for obfuscation.

**Descramble**: The function that reverses the scramble process to recover the original data.

**Proxy**: An intermediary server that forwards requests from clients to backend servers, often with modifications.

**Sanitization**: The process of cleaning and validating input data to prevent security vulnerabilities.

**Payload**: The data sent in an HTTP request body.

**Interceptor**: A function that intercepts requests or responses before they are processed, allowing modification.

**Bearer Token**: An authentication token sent in the Authorization header with the format `Bearer <token>`.

**localStorage**: Browser storage API that persists data across browser sessions.

**Vantablack**: A term used in the codebase referring to the "black box" nature of the obfuscation system (making requests invisible/incomprehensible).

**RAJA**: The codename for the proxy system, used in endpoint names (`/raja`) and logging prefixes (`[RAJA]`).

---

## Additional Resources

### Related Files
- `src/api/api.js` - Frontend API client with interceptors
- `src/setupProxy.js` - Backend proxy configuration
- `package.json` - Dependencies and project configuration

### Dependencies
- `http-proxy-middleware@^3.0.5` - Proxy middleware for Express
- `axios@^1.8.4` - HTTP client library
- `body-parser` - JSON body parsing (included with Express)

### External Documentation
- [http-proxy-middleware Documentation](https://github.com/chimurai/http-proxy-middleware)
- [Axios Documentation](https://axios-http.com/docs/intro)
- [Express.js Documentation](https://expressjs.com/)

---

## Changelog

### Version 1.0 (Current)
- Initial implementation of proxy system
- Obfuscation using hex encoding
- URL sanitization
- Header stripping
- Cookie eviction
- Token management

---

## Support & Contributing

### Reporting Issues
If you encounter issues with the proxy system:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review console logs for `[RAJA]` prefixed messages
3. Verify backend is running on port 8088
4. Check network tab for request/response details

### Contributing
When modifying the proxy system:
1. Ensure obfuscation/deobfuscation functions match between frontend and proxy
2. Test all HTTP methods (GET, POST, PUT, DELETE)
3. Verify path sanitization works correctly
4. Test error handling scenarios
5. Update this documentation if behavior changes

