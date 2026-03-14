# Authentication

The STEP Clone API uses JWT (JSON Web Tokens) for secure authentication. This guide covers how to obtain and use authentication tokens.

## Overview

All API endpoints require authentication except for:
- User registration (`POST /auth/register`)
- User login (`POST /auth/login`)
- Health check (`GET /health`)

## Getting a Token

### Login

Exchange your credentials for a JWT token:

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-string",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isVerified": true
    }
  },
  "message": "Login successful"
}
```

### Registration

Create a new user account:

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure-password",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-string",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isVerified": false
    }
  },
  "message": "User registered successfully"
}
```

## Using Authentication Tokens

Include your JWT token in the `Authorization` header of all API requests:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Example Request

```http
GET /api/users/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Token Verification

Verify if your token is still valid:

```http
GET /api/auth/verify
Authorization: Bearer your-jwt-token
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-string",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  },
  "message": "Token is valid"
}
```

## Token Expiration

JWT tokens expire after 24 hours by default. When a token expires, you'll receive a `401 Unauthorized` response:

```json
{
  "success": false,
  "error": "Token expired",
  "code": "TOKEN_EXPIRED"
}
```

## Security Best Practices

### Store Tokens Securely

- **Web applications**: Store in httpOnly cookies or secure localStorage
- **Mobile apps**: Use secure keychain/keystore
- **Server-to-server**: Use environment variables

### Token Rotation

Implement token refresh mechanism:

```javascript
// Example token refresh logic
const refreshToken = async () => {
  try {
    const response = await fetch('/api/auth/verify', {
      headers: {
        'Authorization': `Bearer ${currentToken}`
      }
    });

    if (!response.ok) {
      // Token expired, redirect to login
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Token verification failed:', error);
  }
};
```

### Logout

For security, implement proper logout:

```javascript
// Client-side logout
const logout = () => {
  // Remove token from storage
  localStorage.removeItem('token');

  // Redirect to login page
  window.location.href = '/login';
};
```

## Demo Credentials

For testing and development, use these credentials:

```json
{
  "email": "demo@stepclone.com",
  "password": "demo123456"
}
```

```json
{
  "email": "admin@stepclone.com",
  "password": "admin123456"
}
```

## Error Responses

### Invalid Credentials

```json
{
  "success": false,
  "error": "Invalid credentials",
  "code": "INVALID_CREDENTIALS"
}
```

### Token Missing

```json
{
  "success": false,
  "error": "Authentication required",
  "code": "NO_TOKEN"
}
```

### Token Invalid

```json
{
  "success": false,
  "error": "Invalid token",
  "code": "INVALID_TOKEN"
}
```

## Example Implementation

### JavaScript/Node.js

```javascript
class StepCloneAPI {
  constructor(baseUrl, token = null) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async login(email, password) {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success) {
      this.token = data.data.token;
      localStorage.setItem('step_token', this.token);
    }

    return data;
  }

  async makeAuthenticatedRequest(endpoint, options = {}) {
    return fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
  }
}

// Usage
const api = new StepCloneAPI('http://localhost:9999/api');
await api.login('demo@stepclone.com', 'demo123456');

// Now make authenticated requests
const profile = await api.makeAuthenticatedRequest('/users/profile');
```

### Python

```python
import requests
import json

class StepCloneAPI:
    def __init__(self, base_url, token=None):
        self.base_url = base_url
        self.token = token

    def login(self, email, password):
        response = requests.post(f"{self.base_url}/auth/login",
            json={"email": email, "password": password}
        )
        data = response.json()

        if data.get('success'):
            self.token = data['data']['token']

        return data

    def make_request(self, endpoint, method='GET', data=None):
        headers = {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }

        response = requests.request(
            method=method,
            url=f"{self.base_url}{endpoint}",
            headers=headers,
            json=data
        )

        return response.json()

# Usage
api = StepCloneAPI('http://localhost:9999/api')
api.login('demo@stepclone.com', 'demo123456')

# Make authenticated request
profile = api.make_request('/users/profile')
```