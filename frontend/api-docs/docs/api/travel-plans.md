# Travel Plans API

Endpoints for creating and managing user travel itineraries and plans.

## List Travel Plans

Retrieve travel plans for the current user or all users (admin only).

```http
GET /api/travel-plans
```

### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `page` | integer | Page number | 1 |
| `limit` | integer | Items per page (max 100) | 20 |
| `userId` | string | Filter by user ID (admin only) | - |
| `countryId` | string | Filter by destination country | - |
| `status` | string | Filter by status (active, upcoming, completed) | - |
| `search` | string | Search in title and description | - |

### Response

```json
{
  "success": true,
  "data": {
    "travelPlans": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "title": "Europe Business Trip",
        "description": "Quarterly meeting with European partners",
        "startDate": "2024-03-15",
        "endDate": "2024-03-25",
        "countryId": "france-uuid",
        "country": {
          "id": "france-uuid",
          "name": "France",
          "code": "FR",
          "flag": "🇫🇷",
          "riskLevel": "low"
        },
        "status": "upcoming",
        "emergencyContacts": [
          {
            "name": "Jane Doe",
            "relationship": "Spouse",
            "phone": "+1234567890",
            "email": "jane@example.com"
          }
        ],
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z",
        "user": {
          "id": "user-uuid",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com"
        }
      }
    ],
    "total": 12,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  },
  "message": "Travel plans retrieved successfully"
}
```

### Example

::: code-group

```javascript [JavaScript]
const response = await fetch('/api/travel-plans?status=active', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log(`Found ${data.data.total} travel plans`);
```

```bash [cURL]
curl -X GET "http://localhost:9999/api/travel-plans?page=1&limit=10" \
  -H "Authorization: Bearer your-jwt-token"
```

:::

---

## Get Travel Plan Details

Retrieve detailed information about a specific travel plan.

```http
GET /api/travel-plans/:id
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Travel plan ID |

### Response

```json
{
  "success": true,
  "data": {
    "travelPlan": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Europe Business Trip",
      "description": "Quarterly meeting with European partners and client visits",
      "startDate": "2024-03-15",
      "endDate": "2024-03-25",
      "countryId": "france-uuid",
      "country": {
        "id": "france-uuid",
        "name": "France",
        "code": "FR",
        "flag": "🇫🇷",
        "riskLevel": "low",
        "riskLevelReason": "Generally safe for travelers",
        "capital": "Paris",
        "currency": "Euro (EUR)"
      },
      "status": "upcoming",
      "emergencyContacts": [
        {
          "name": "Jane Doe",
          "relationship": "Spouse",
          "phone": "+1234567890",
          "email": "jane@example.com"
        },
        {
          "name": "Work Emergency",
          "relationship": "Employer",
          "phone": "+1987654321",
          "email": "emergency@company.com"
        }
      ],
      "alerts": [
        {
          "id": "alert-uuid",
          "title": "Transportation Notice",
          "message": "Planned rail strikes may affect travel on March 20th",
          "severity": "warning",
          "alertType": "transportation",
          "createdAt": "2024-03-10T10:00:00Z"
        }
      ],
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "user": {
        "id": "user-uuid",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phone": "+1234567890"
      }
    }
  },
  "message": "Travel plan retrieved successfully"
}
```

---

## Create Travel Plan

Create a new travel plan.

```http
POST /api/travel-plans
```

### Request Body

```json
{
  "title": "Summer Vacation",
  "description": "Family vacation to Italy",
  "startDate": "2024-07-15",
  "endDate": "2024-07-25",
  "countryId": "italy-uuid",
  "emergencyContacts": [
    {
      "name": "Emergency Contact",
      "relationship": "Friend",
      "phone": "+1234567890",
      "email": "emergency@example.com"
    }
  ]
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | Yes | Travel plan title |
| `description` | string | No | Detailed description |
| `startDate` | string | Yes | Start date (YYYY-MM-DD) |
| `endDate` | string | Yes | End date (YYYY-MM-DD) |
| `countryId` | string | Yes | Destination country ID |
| `emergencyContacts` | array | No | List of emergency contacts |

### Emergency Contact Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Contact name |
| `relationship` | string | Yes | Relationship to traveler |
| `phone` | string | Yes | Phone number |
| `email` | string | No | Email address |

### Response

```json
{
  "success": true,
  "data": {
    "travelPlan": {
      "id": "new-plan-uuid",
      "title": "Summer Vacation",
      "description": "Family vacation to Italy",
      "startDate": "2024-07-15",
      "endDate": "2024-07-25",
      "countryId": "italy-uuid",
      "country": {
        "id": "italy-uuid",
        "name": "Italy",
        "code": "IT",
        "flag": "🇮🇹"
      },
      "status": "upcoming",
      "emergencyContacts": [
        {
          "name": "Emergency Contact",
          "relationship": "Friend",
          "phone": "+1234567890",
          "email": "emergency@example.com"
        }
      ],
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  },
  "message": "Travel plan created successfully"
}
```

### Example

::: code-group

```javascript [JavaScript]
const response = await fetch('/api/travel-plans', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Business Trip to Germany',
    description: 'Conference and client meetings',
    startDate: '2024-04-10',
    endDate: '2024-04-15',
    countryId: 'germany-uuid',
    emergencyContacts: [
      {
        name: 'Company Emergency',
        relationship: 'Employer',
        phone: '+1234567890',
        email: 'emergency@company.com'
      }
    ]
  })
});

const data = await response.json();
```

```bash [cURL]
curl -X POST http://localhost:9999/api/travel-plans \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Weekend Getaway",
    "startDate": "2024-05-01",
    "endDate": "2024-05-03",
    "countryId": "spain-uuid"
  }'
```

:::

---

## Update Travel Plan

Update an existing travel plan.

```http
PUT /api/travel-plans/:id
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Travel plan ID |

### Request Body

```json
{
  "title": "Updated Business Trip",
  "description": "Extended stay for additional meetings",
  "endDate": "2024-03-28",
  "emergencyContacts": [
    {
      "name": "Updated Contact",
      "relationship": "Spouse",
      "phone": "+1234567890",
      "email": "spouse@example.com"
    }
  ]
}
```

### Response

```json
{
  "success": true,
  "data": {
    "travelPlan": {
      "id": "plan-uuid",
      "title": "Updated Business Trip",
      "description": "Extended stay for additional meetings",
      "endDate": "2024-03-28",
      "updatedAt": "2024-01-15T11:30:00Z"
    }
  },
  "message": "Travel plan updated successfully"
}
```

---

## Delete Travel Plan

Delete a travel plan.

```http
DELETE /api/travel-plans/:id
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Travel plan ID |

### Response

```json
{
  "success": true,
  "message": "Travel plan deleted successfully"
}
```

### Example

::: code-group

```javascript [JavaScript]
const response = await fetch(`/api/travel-plans/${planId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

if (response.ok) {
  console.log('Travel plan deleted');
}
```

```bash [cURL]
curl -X DELETE http://localhost:9999/api/travel-plans/plan-uuid \
  -H "Authorization: Bearer your-jwt-token"
```

:::

---

## Get Travel Plan Statistics

Retrieve travel plan statistics and metrics.

```http
GET /api/travel-plans/stats
```

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | string | Filter by user ID (admin only) |

### Response

```json
{
  "success": true,
  "data": {
    "total": 45,
    "active": 12,
    "upcoming": 18,
    "completed": 15,
    "byCountry": [
      {
        "country": "France",
        "countryId": "france-uuid",
        "count": 8
      },
      {
        "country": "Spain",
        "countryId": "spain-uuid",
        "count": 6
      }
    ],
    "byMonth": [
      {
        "month": "2024-01",
        "count": 5
      },
      {
        "month": "2024-02",
        "count": 8
      }
    ],
    "averageDuration": 7.5,
    "totalDays": 340
  },
  "message": "Travel plan statistics retrieved successfully"
}
```

## Travel Plan Status

Travel plan status is automatically calculated based on dates:

| Status | Description |
|--------|-------------|
| `upcoming` | Start date is in the future |
| `active` | Currently between start and end dates |
| `completed` | End date has passed |

## Validation Rules

### Date Validation
- `startDate` must be a valid date in YYYY-MM-DD format
- `endDate` must be after `startDate`
- Maximum trip duration is 365 days

### Emergency Contacts
- Minimum 0, maximum 5 contacts per travel plan
- Each contact must have name, relationship, and phone
- Phone numbers must include country code

### Plan Limits
- Maximum 10 active travel plans per user
- Title must be 1-100 characters
- Description maximum 500 characters

## Error Responses

### Travel Plan Not Found (404)

```json
{
  "success": false,
  "error": "Travel plan not found",
  "code": "TRAVEL_PLAN_NOT_FOUND"
}
```

### Access Denied (403)

```json
{
  "success": false,
  "error": "You can only access your own travel plans",
  "code": "ACCESS_DENIED"
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
      "field": "startDate",
      "message": "Start date must be in the future"
    },
    {
      "field": "endDate",
      "message": "End date must be after start date"
    }
  ]
}
```

### Plan Limit Exceeded (429)

```json
{
  "success": false,
  "error": "Maximum number of active travel plans reached",
  "code": "PLAN_LIMIT_EXCEEDED",
  "details": {
    "limit": 10,
    "current": 10
  }
}
```