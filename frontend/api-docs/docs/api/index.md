# API Reference

Complete reference for all STEP Clone API endpoints. All endpoints return JSON responses and require authentication unless otherwise noted.

## Base URL

```
http://localhost:9999/api
```

## Authentication

Include your JWT token in the Authorization header:

```http
Authorization: Bearer your-jwt-token-here
```

## Endpoint Categories

### [Authentication](/api/auth)
User registration, login, and token management
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Authenticate and get token
- `GET /auth/verify` - Verify token validity

### [Users](/api/users)
User profile and account management
- `GET /users/profile` - Get current user profile
- `PUT /users/profile` - Update user profile
- `PUT /users/preferences` - Update notification preferences
- `GET /users` - List all users (admin only)

### [Countries](/api/countries)
Country information and risk levels
- `GET /countries` - List all countries
- `GET /countries/:id` - Get country details
- `GET /countries/stats` - Get country statistics

### [Alerts](/api/alerts)
Travel safety alerts and warnings
- `GET /alerts` - List travel alerts
- `GET /alerts/:id` - Get alert details
- `POST /alerts` - Create new alert (admin only)
- `PUT /alerts/:id` - Update alert (admin only)
- `GET /alerts/stats` - Get alert statistics
- `GET /alerts/my-destinations` - Get alerts for user's travel destinations

### [Travel Plans](/api/travel-plans)
User travel itineraries and plans
- `GET /travel-plans` - List travel plans
- `GET /travel-plans/:id` - Get travel plan details
- `POST /travel-plans` - Create travel plan
- `PUT /travel-plans/:id` - Update travel plan
- `DELETE /travel-plans/:id` - Delete travel plan
- `GET /travel-plans/stats` - Get travel plan statistics

### [Notifications](/api/notifications)
Notification delivery and management
- `GET /notifications` - List notifications
- `GET /notifications/stats` - Get notification statistics
- `POST /notifications/test` - Send test notification
- `POST /notifications/acknowledge` - Mark notifications as read
- `GET /notifications/unread-count` - Get unread notification count

### [Health Check](/api/health)
System health and status monitoring
- `GET /health` - Check system health status

## Response Format

All API responses follow this consistent format:

```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Operation completed successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Success Response

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid-string",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20
  },
  "message": "Users retrieved successfully"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Invalid request parameters",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "email",
    "message": "Valid email address is required"
  }
}
```

## Pagination

List endpoints support pagination using query parameters:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

```http
GET /api/alerts?page=2&limit=50
```

**Response:**

```json
{
  "success": true,
  "data": {
    "alerts": [...],
    "total": 150,
    "page": 2,
    "limit": 50,
    "totalPages": 3
  }
}
```

## Filtering and Searching

Many endpoints support filtering and searching:

### Query Parameters

- `search` - Text search across relevant fields
- `filter[field]` - Filter by field value
- `sort` - Sort field (prefix with `-` for descending)

```http
GET /api/countries?search=france&filter[riskLevel]=low&sort=-updatedAt
```

## Status Codes

The API uses standard HTTP status codes:

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid request parameters |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation errors |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

## Rate Limiting

API requests are rate limited:

- **Authenticated**: 1000 requests/hour
- **Unauthenticated**: 100 requests/hour

Rate limit headers:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1641384600
```

## Common Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `AUTHENTICATION_REQUIRED` | No authentication token provided |
| `INVALID_TOKEN` | Authentication token is invalid |
| `TOKEN_EXPIRED` | Authentication token has expired |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions |
| `RESOURCE_NOT_FOUND` | Requested resource does not exist |
| `DUPLICATE_RESOURCE` | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | Too many requests |

## Testing with cURL

### Login and get token:

```bash
curl -X POST http://localhost:9999/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@stepclone.com","password":"demo123456"}'
```

### Use token for authenticated requests:

```bash
curl -X GET http://localhost:9999/api/users/profile \
  -H "Authorization: Bearer your-jwt-token-here"
```

## SDKs and Libraries

Official SDKs are available for:

- **JavaScript/Node.js** - `npm install step-clone-sdk`
- **Python** - `pip install step-clone-sdk`
- **PHP** - `composer require step-clone/sdk`

[Learn more about SDKs →](/sdks)