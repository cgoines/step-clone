# Alerts API

Endpoints for managing travel safety alerts and warnings.

## List Alerts

Retrieve a list of travel alerts with optional filtering and pagination.

```http
GET /api/alerts
```

### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `page` | integer | Page number | 1 |
| `limit` | integer | Items per page (max 100) | 20 |
| `countryId` | string | Filter by country ID | - |
| `severity` | string | Filter by severity (info, warning, critical, emergency) | - |
| `alertType` | string | Filter by alert type | - |
| `active` | boolean | Filter by active status | - |
| `search` | string | Search in title and message | - |

### Response

```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "title": "Travel Advisory Update",
        "message": "Updated security information for travelers",
        "severity": "warning",
        "alertType": "security",
        "isActive": true,
        "expiresAt": "2024-02-15T23:59:59Z",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z",
        "country": {
          "id": "country-uuid",
          "name": "France",
          "code": "FR",
          "flag": "🇫🇷"
        }
      }
    ],
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  },
  "message": "Alerts retrieved successfully"
}
```

### Example

::: code-group

```javascript [JavaScript]
const response = await fetch('/api/alerts?countryId=france-id&severity=critical', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log(`Found ${data.data.total} alerts`);
```

```bash [cURL]
curl -X GET "http://localhost:9999/api/alerts?page=1&limit=10&severity=warning" \
  -H "Authorization: Bearer your-jwt-token"
```

:::

---

## Get Alert Details

Retrieve detailed information about a specific alert.

```http
GET /api/alerts/:id
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Alert ID |

### Response

```json
{
  "success": true,
  "data": {
    "alert": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Security Alert: Increased Risk Level",
      "message": "Due to recent security incidents, travelers should exercise increased caution...",
      "severity": "critical",
      "alertType": "security",
      "isActive": true,
      "expiresAt": "2024-02-15T23:59:59Z",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "country": {
        "id": "country-uuid",
        "name": "France",
        "code": "FR",
        "flag": "🇫🇷",
        "riskLevel": "medium"
      },
      "affectedUsers": 1250,
      "notificationsSent": {
        "email": 1200,
        "sms": 800,
        "push": 950
      }
    }
  },
  "message": "Alert retrieved successfully"
}
```

---

## Create Alert

Create a new travel alert. **Requires admin permissions.**

```http
POST /api/alerts
```

### Request Body

```json
{
  "title": "Security Advisory",
  "message": "Travelers should avoid large gatherings and monitor local news for updates.",
  "severity": "warning",
  "alertType": "security",
  "countryId": "country-uuid-here",
  "isActive": true,
  "expiresAt": "2024-03-15T23:59:59Z"
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | Yes | Alert title (max 200 chars) |
| `message` | string | Yes | Alert message (max 1000 chars) |
| `severity` | string | Yes | info, warning, critical, emergency |
| `alertType` | string | Yes | security, health, natural_disaster, political_unrest, transportation, general |
| `countryId` | string | No | Country to associate alert with |
| `isActive` | boolean | No | Whether alert is active (default: true) |
| `expiresAt` | string | No | ISO 8601 expiration date |

### Response

```json
{
  "success": true,
  "data": {
    "alert": {
      "id": "new-alert-uuid",
      "title": "Security Advisory",
      "message": "Travelers should avoid large gatherings...",
      "severity": "warning",
      "alertType": "security",
      "isActive": true,
      "expiresAt": "2024-03-15T23:59:59Z",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "country": {
        "id": "country-uuid",
        "name": "France",
        "code": "FR"
      }
    }
  },
  "message": "Alert created successfully"
}
```

### Example

::: code-group

```javascript [JavaScript]
const response = await fetch('/api/alerts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Weather Alert',
    message: 'Severe thunderstorms expected in the region. Travelers should stay indoors and avoid outdoor activities.',
    severity: 'warning',
    alertType: 'natural_disaster',
    countryId: 'france-uuid',
    expiresAt: '2024-02-20T23:59:59Z'
  })
});

const data = await response.json();
```

```bash [cURL]
curl -X POST http://localhost:9999/api/alerts \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Security Advisory",
    "message": "Exercise increased caution due to recent incidents",
    "severity": "warning",
    "alertType": "security",
    "countryId": "country-uuid"
  }'
```

:::

---

## Update Alert

Update an existing alert. **Requires admin permissions.**

```http
PUT /api/alerts/:id
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Alert ID |

### Request Body

```json
{
  "title": "Updated Security Advisory",
  "message": "Updated information about security situation...",
  "severity": "critical",
  "isActive": false
}
```

### Response

```json
{
  "success": true,
  "data": {
    "alert": {
      "id": "alert-uuid",
      "title": "Updated Security Advisory",
      "message": "Updated information about security situation...",
      "severity": "critical",
      "isActive": false,
      "updatedAt": "2024-01-15T11:30:00Z"
    }
  },
  "message": "Alert updated successfully"
}
```

---

## Get Alert Statistics

Retrieve alert statistics and metrics.

```http
GET /api/alerts/stats
```

### Response

```json
{
  "success": true,
  "data": {
    "overall": {
      "total_alerts": 156,
      "active_alerts": 23,
      "emergency_alerts": 2,
      "critical_alerts": 8,
      "warning_alerts": 45,
      "info_alerts": 101
    },
    "byCountry": [
      {
        "country": "France",
        "countryId": "france-uuid",
        "total": 12,
        "active": 3
      }
    ],
    "byType": [
      {
        "alertType": "security",
        "count": 45
      },
      {
        "alertType": "health",
        "count": 23
      }
    ],
    "recent": {
      "last24h": 5,
      "last7d": 18,
      "last30d": 67
    }
  },
  "message": "Alert statistics retrieved successfully"
}
```

---

## Get My Destination Alerts

Get active alerts for the current user's travel destinations.

```http
GET /api/alerts/my-destinations
```

### Response

```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "alert-uuid",
        "title": "Health Advisory",
        "message": "Increased health screening at airports",
        "severity": "info",
        "alertType": "health",
        "country": {
          "name": "Spain",
          "code": "ES"
        },
        "travelPlan": {
          "id": "plan-uuid",
          "title": "Europe Trip 2024",
          "startDate": "2024-02-01",
          "endDate": "2024-02-15"
        }
      }
    ],
    "totalAlerts": 3,
    "affectedDestinations": 2
  },
  "message": "Destination alerts retrieved successfully"
}
```

## Alert Types

| Type | Description |
|------|-------------|
| `security` | Security-related warnings and advisories |
| `health` | Health and medical information |
| `natural_disaster` | Natural disasters and weather events |
| `political_unrest` | Political instability or civil unrest |
| `transportation` | Transportation disruptions |
| `general` | General travel information |

## Severity Levels

| Level | Description | Color |
|-------|-------------|-------|
| `info` | General information | Blue |
| `warning` | Caution advised | Yellow |
| `critical` | High risk, avoid if possible | Red |
| `emergency` | Immediate danger, evacuate | Dark Red |

## Error Responses

### Alert Not Found (404)

```json
{
  "success": false,
  "error": "Alert not found",
  "code": "ALERT_NOT_FOUND"
}
```

### Insufficient Permissions (403)

```json
{
  "success": false,
  "error": "Admin permissions required",
  "code": "INSUFFICIENT_PERMISSIONS"
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
      "field": "severity",
      "message": "Severity must be one of: info, warning, critical, emergency"
    }
  ]
}
```