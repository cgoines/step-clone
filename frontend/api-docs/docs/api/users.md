# Users API

Endpoints for user profile management and account operations.

## Get User Profile

Retrieve the current user's profile information.

```http
GET /api/users/profile
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
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "lastLogin": "2024-01-15T14:22:00Z",
      "preferences": {
        "emailEnabled": true,
        "smsEnabled": true,
        "pushEnabled": false,
        "language": "en",
        "timezone": "America/New_York"
      },
      "travelPlans": {
        "total": 3,
        "active": 1,
        "upcoming": 2
      }
    }
  },
  "message": "User profile retrieved successfully"
}
```

### Example

::: code-group

```javascript [JavaScript]
const response = await fetch('/api/users/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
const user = data.data.user;

console.log(`Welcome, ${user.firstName} ${user.lastName}!`);
```

```bash [cURL]
curl -X GET http://localhost:9999/api/users/profile \
  -H "Authorization: Bearer your-jwt-token"
```

:::

---

## Update User Profile

Update the current user's profile information.

```http
PUT /api/users/profile
```

### Request Body

```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+1234567890"
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `firstName` | string | No | User's first name |
| `lastName` | string | No | User's last name |
| `phone` | string | No | Phone number with country code |

### Response

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Smith",
      "phone": "+1234567890",
      "updatedAt": "2024-01-15T15:30:00Z"
    }
  },
  "message": "Profile updated successfully"
}
```

### Example

::: code-group

```javascript [JavaScript]
const response = await fetch('/api/users/profile', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Smith',
    phone: '+1234567890'
  })
});

const data = await response.json();
```

```bash [cURL]
curl -X PUT http://localhost:9999/api/users/profile \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Smith",
    "phone": "+1234567890"
  }'
```

:::

---

## Update User Preferences

Update the current user's notification preferences.

```http
PUT /api/users/preferences
```

### Request Body

```json
{
  "emailEnabled": true,
  "smsEnabled": false,
  "pushEnabled": true,
  "language": "en",
  "timezone": "Europe/London"
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `emailEnabled` | boolean | No | Enable email notifications |
| `smsEnabled` | boolean | No | Enable SMS notifications |
| `pushEnabled` | boolean | No | Enable push notifications |
| `language` | string | No | Preferred language (ISO 639-1) |
| `timezone` | string | No | User timezone (IANA format) |

### Response

```json
{
  "success": true,
  "data": {
    "preferences": {
      "emailEnabled": true,
      "smsEnabled": false,
      "pushEnabled": true,
      "language": "en",
      "timezone": "Europe/London",
      "updatedAt": "2024-01-15T15:30:00Z"
    }
  },
  "message": "Preferences updated successfully"
}
```

### Example

::: code-group

```javascript [JavaScript]
const response = await fetch('/api/users/preferences', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    emailEnabled: true,
    smsEnabled: true,
    pushEnabled: false
  })
});

const data = await response.json();
console.log('Preferences updated');
```

```bash [cURL]
curl -X PUT http://localhost:9999/api/users/preferences \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "emailEnabled": true,
    "smsEnabled": true,
    "pushEnabled": false
  }'
```

:::

---

## List All Users

List all registered users. **Requires admin permissions.**

```http
GET /api/users
```

### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `page` | integer | Page number | 1 |
| `limit` | integer | Items per page (max 100) | 20 |
| `search` | string | Search in name and email | - |
| `verified` | boolean | Filter by verification status | - |

### Response

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "phone": "+1234567890",
        "isVerified": true,
        "createdAt": "2024-01-15T10:30:00Z",
        "lastLogin": "2024-01-15T14:22:00Z",
        "travelPlansCount": 3,
        "preferences": {
          "emailEnabled": true,
          "smsEnabled": true,
          "pushEnabled": false
        }
      }
    ],
    "total": 1250,
    "page": 1,
    "limit": 20,
    "totalPages": 63
  },
  "message": "Users retrieved successfully"
}
```

### Example

::: code-group

```javascript [JavaScript]
// Admin only
const response = await fetch('/api/users?page=1&limit=50&verified=true', {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});

const data = await response.json();
console.log(`Found ${data.data.total} users`);
```

```bash [cURL]
curl -X GET "http://localhost:9999/api/users?page=1&limit=10" \
  -H "Authorization: Bearer admin-jwt-token"
```

:::

---

## Register Device Token

Register a device token for push notifications.

```http
POST /api/users/devices
```

### Request Body

```json
{
  "token": "device-push-token-string",
  "platform": "ios"
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `token` | string | Yes | Device push notification token |
| `platform` | string | Yes | Platform type (ios, android, web) |

### Response

```json
{
  "success": true,
  "data": {
    "device": {
      "id": "device-uuid",
      "token": "device-push-token-string",
      "platform": "ios",
      "isActive": true,
      "registeredAt": "2024-01-15T15:30:00Z"
    }
  },
  "message": "Device token registered successfully"
}
```

### Example

::: code-group

```javascript [JavaScript]
// Register for push notifications
if ('serviceWorker' in navigator && 'PushManager' in window) {
  const registration = await navigator.serviceWorker.register('/sw.js');
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: 'your-vapid-public-key'
  });

  const response = await fetch('/api/users/devices', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      token: JSON.stringify(subscription),
      platform: 'web'
    })
  });
}
```

```bash [cURL]
curl -X POST http://localhost:9999/api/users/devices \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "device-token-here",
    "platform": "ios"
  }'
```

:::

---

## Get User Devices

Get all registered devices for the current user.

```http
GET /api/users/devices
```

### Response

```json
{
  "success": true,
  "data": {
    "devices": [
      {
        "id": "device-uuid",
        "platform": "ios",
        "isActive": true,
        "registeredAt": "2024-01-15T15:30:00Z",
        "lastUsed": "2024-01-15T16:00:00Z"
      },
      {
        "id": "device-uuid-2",
        "platform": "web",
        "isActive": true,
        "registeredAt": "2024-01-10T09:15:00Z",
        "lastUsed": "2024-01-15T14:45:00Z"
      }
    ],
    "total": 2
  },
  "message": "Devices retrieved successfully"
}
```

## Supported Languages

| Code | Language |
|------|----------|
| `en` | English |
| `es` | Spanish |
| `fr` | French |
| `de` | German |
| `it` | Italian |
| `pt` | Portuguese |
| `zh` | Chinese |
| `ja` | Japanese |

## Supported Timezones

Use IANA timezone identifiers:
- `America/New_York`
- `America/Los_Angeles`
- `Europe/London`
- `Europe/Paris`
- `Asia/Tokyo`
- `Australia/Sydney`

## Device Platforms

| Platform | Description |
|----------|-------------|
| `ios` | iOS devices (iPhone, iPad) |
| `android` | Android devices |
| `web` | Web browsers with push support |

## Error Responses

### User Not Found (404)

```json
{
  "success": false,
  "error": "User not found",
  "code": "USER_NOT_FOUND"
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
      "field": "phone",
      "message": "Valid phone number with country code is required"
    }
  ]
}
```

### Insufficient Permissions (403)

```json
{
  "success": false,
  "error": "Admin permissions required to list users",
  "code": "INSUFFICIENT_PERMISSIONS"
}
```