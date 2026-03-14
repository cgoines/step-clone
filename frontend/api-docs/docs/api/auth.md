# Authentication API

Endpoints for user authentication, registration, and token management.

## Register User

Create a new user account.

```http
POST /api/auth/register
```

### Request Body

```json
{
  "email": "user@example.com",
  "password": "secure-password",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | Yes | Valid email address |
| `password` | string | Yes | Password (min 8 characters) |
| `firstName` | string | Yes | User's first name |
| `lastName` | string | Yes | User's last name |
| `phone` | string | No | Phone number with country code |

### Response

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "isVerified": false,
      "createdAt": "2024-01-15T10:30:00Z",
      "preferences": {
        "emailEnabled": true,
        "smsEnabled": true,
        "pushEnabled": true
      }
    }
  },
  "message": "User registered successfully"
}
```

### Example

::: code-group

```javascript [JavaScript]
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'secure-password',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890'
  })
});

const data = await response.json();
console.log(data.data.token); // Save this token
```

```python [Python]
import requests

response = requests.post('http://localhost:9999/api/auth/register', json={
    'email': 'user@example.com',
    'password': 'secure-password',
    'firstName': 'John',
    'lastName': 'Doe',
    'phone': '+1234567890'
})

data = response.json()
token = data['data']['token']  # Save this token
```

```bash [cURL]
curl -X POST http://localhost:9999/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure-password",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890"
  }'
```

:::

---

## Login

Authenticate user and retrieve JWT token.

```http
POST /api/auth/login
```

### Request Body

```json
{
  "email": "user@example.com",
  "password": "secure-password"
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | Yes | User's email address |
| `password` | string | Yes | User's password |

### Response

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "isVerified": true,
      "lastLogin": "2024-01-15T10:30:00Z",
      "preferences": {
        "emailEnabled": true,
        "smsEnabled": true,
        "pushEnabled": true
      }
    }
  },
  "message": "Login successful"
}
```

### Example

::: code-group

```javascript [JavaScript]
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'demo@stepclone.com',
    password: 'demo123456'
  })
});

const data = await response.json();

if (data.success) {
  localStorage.setItem('token', data.data.token);
  console.log('Logged in as:', data.data.user.email);
}
```

```python [Python]
import requests

response = requests.post('http://localhost:9999/api/auth/login', json={
    'email': 'demo@stepclone.com',
    'password': 'demo123456'
})

data = response.json()

if data['success']:
    token = data['data']['token']
    user = data['data']['user']
    print(f"Logged in as: {user['email']}")
```

```bash [cURL]
curl -X POST http://localhost:9999/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@stepclone.com",
    "password": "demo123456"
  }'
```

:::

---

## Verify Token

Verify if the current JWT token is valid and get user information.

```http
GET /api/auth/verify
```

### Headers

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Response

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "isVerified": true,
      "preferences": {
        "emailEnabled": true,
        "smsEnabled": true,
        "pushEnabled": true
      }
    },
    "tokenExpiry": "2024-01-16T10:30:00Z"
  },
  "message": "Token is valid"
}
```

### Example

::: code-group

```javascript [JavaScript]
const token = localStorage.getItem('token');

const response = await fetch('/api/auth/verify', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();

if (!data.success) {
  // Token invalid, redirect to login
  window.location.href = '/login';
}
```

```python [Python]
import requests

headers = {
    'Authorization': f'Bearer {token}'
}

response = requests.get('http://localhost:9999/api/auth/verify', headers=headers)
data = response.json()

if not data['success']:
    print("Token invalid, please login again")
```

```bash [cURL]
curl -X GET http://localhost:9999/api/auth/verify \
  -H "Authorization: Bearer your-jwt-token-here"
```

:::

## Error Responses

### Invalid Credentials (401)

```json
{
  "success": false,
  "error": "Invalid email or password",
  "code": "INVALID_CREDENTIALS"
}
```

### User Already Exists (409)

```json
{
  "success": false,
  "error": "User with this email already exists",
  "code": "USER_EXISTS"
}
```

### Validation Error (422)

```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "email",
      "message": "Valid email address is required"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters long"
    }
  ]
}
```

### Token Expired (401)

```json
{
  "success": false,
  "error": "JWT token has expired",
  "code": "TOKEN_EXPIRED"
}
```

### Invalid Token (401)

```json
{
  "success": false,
  "error": "Invalid JWT token",
  "code": "INVALID_TOKEN"
}
```

## Demo Accounts

For testing, use these pre-configured accounts:

### Regular User
```json
{
  "email": "demo@stepclone.com",
  "password": "demo123456"
}
```

### Admin User
```json
{
  "email": "admin@stepclone.com",
  "password": "admin123456"
}
```

## Password Requirements

Passwords must meet these criteria:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

## Token Expiration

JWT tokens expire after **24 hours**. Implement token refresh logic to handle expiration gracefully.

## Security Notes

- Store tokens securely (httpOnly cookies recommended for web apps)
- Never log or expose tokens in client-side code
- Implement proper logout by removing tokens from storage
- Use HTTPS in production for all authentication requests
- Consider implementing refresh tokens for enhanced security