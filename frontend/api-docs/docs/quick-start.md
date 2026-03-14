# Quick Start Guide

Get up and running with the STEP Clone API in just a few minutes.

## Prerequisites

- A STEP Clone API server running (default: http://localhost:9999)
- A valid user account or admin access
- Basic knowledge of REST APIs and HTTP requests

## Step 1: Authentication

First, obtain an authentication token by logging in:

```bash
curl -X POST http://localhost:9999/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@stepclone.com",
    "password": "demo123456"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-uuid",
      "email": "demo@stepclone.com",
      "firstName": "Demo",
      "lastName": "User"
    }
  }
}
```

Save the token - you'll need it for all subsequent requests.

## Step 2: Get Your Profile

Use the token to fetch your user profile:

```bash
curl -X GET http://localhost:9999/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Step 3: Create a Travel Plan

Let's create your first travel plan:

```bash
curl -X POST http://localhost:9999/api/travel-plans \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Weekend in Paris",
    "description": "Short vacation",
    "startDate": "2024-06-15",
    "endDate": "2024-06-17",
    "countryId": "france-uuid",
    "emergencyContacts": [
      {
        "name": "Emergency Contact",
        "relationship": "Friend",
        "phone": "+1234567890",
        "email": "friend@example.com"
      }
    ]
  }'
```

## Step 4: Get Travel Alerts

Check for any travel alerts related to your destinations:

```bash
curl -X GET http://localhost:9999/api/alerts/my-destinations \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Complete Example: JavaScript

Here's a complete example using JavaScript:

```javascript
class StepCloneClient {
  constructor(baseUrl = 'http://localhost:9999/api') {
    this.baseUrl = baseUrl;
    this.token = null;
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
    }

    return data;
  }

  async makeRequest(endpoint, options = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    return response.json();
  }

  async getProfile() {
    return this.makeRequest('/users/profile');
  }

  async createTravelPlan(planData) {
    return this.makeRequest('/travel-plans', {
      method: 'POST',
      body: JSON.stringify(planData)
    });
  }

  async getAlerts() {
    return this.makeRequest('/alerts');
  }
}

// Usage
async function example() {
  const client = new StepCloneClient();

  // Login
  await client.login('demo@stepclone.com', 'demo123456');

  // Get profile
  const profile = await client.getProfile();
  console.log('User:', profile.data.user);

  // Create travel plan
  const travelPlan = await client.createTravelPlan({
    title: 'Business Trip',
    startDate: '2024-05-01',
    endDate: '2024-05-05',
    countryId: 'germany-uuid'
  });

  // Get alerts
  const alerts = await client.getAlerts();
  console.log('Active alerts:', alerts.data.alerts.length);
}

example();
```

## Complete Example: Python

```python
import requests
import json

class StepCloneClient:
    def __init__(self, base_url='http://localhost:9999/api'):
        self.base_url = base_url
        self.token = None

    def login(self, email, password):
        response = requests.post(f"{self.base_url}/auth/login", json={
            'email': email,
            'password': password
        })

        data = response.json()

        if data['success']:
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

    def get_profile(self):
        return self.make_request('/users/profile')

    def create_travel_plan(self, plan_data):
        return self.make_request('/travel-plans', 'POST', plan_data)

    def get_alerts(self):
        return self.make_request('/alerts')

# Usage
def example():
    client = StepCloneClient()

    # Login
    client.login('demo@stepclone.com', 'demo123456')

    # Get profile
    profile = client.get_profile()
    print(f"User: {profile['data']['user']['email']}")

    # Create travel plan
    travel_plan = client.create_travel_plan({
        'title': 'Conference Trip',
        'startDate': '2024-05-01',
        'endDate': '2024-05-05',
        'countryId': 'spain-uuid'
    })

    # Get alerts
    alerts = client.get_alerts()
    print(f"Active alerts: {len(alerts['data']['alerts'])}")

example()
```

## Next Steps

Now that you have the basics working, explore more features:

1. **[User Management](/api/users)** - Update profiles and preferences
2. **[Countries](/api/countries)** - Get country risk information
3. **[Alerts](/api/alerts)** - Create and manage travel alerts
4. **[Notifications](/api/notifications)** - Set up multi-channel messaging

## Demo Data

The API comes with sample data for testing:

### Users
- **demo@stepclone.com** / demo123456 (Regular user)
- **admin@stepclone.com** / admin123456 (Admin user)

### Countries
- France (Low risk)
- Spain (Low risk)
- Germany (Low risk)
- Various other countries with different risk levels

### Sample Alerts
- Security advisories
- Health notifications
- Transportation updates
- Weather warnings

## Error Handling

Always check the `success` field in responses:

```javascript
const response = await client.makeRequest('/some-endpoint');

if (!response.success) {
  console.error('API Error:', response.error);

  // Handle specific errors
  switch (response.code) {
    case 'TOKEN_EXPIRED':
      // Redirect to login
      break;
    case 'VALIDATION_ERROR':
      // Show validation errors
      console.log('Validation errors:', response.details);
      break;
    default:
      // Generic error handling
      break;
  }
}
```

## Rate Limiting

Be aware of rate limits:
- **Authenticated requests**: 1000/hour
- **Unauthenticated requests**: 100/hour

Check rate limit headers in responses:
```javascript
console.log('Rate limit remaining:', response.headers['X-RateLimit-Remaining']);
```

## Admin Dashboard

For a visual interface, use the admin dashboard at:
**http://localhost:3001**

Login with the demo credentials to explore the full feature set through the web interface.

## Need Help?

- 📖 [Complete API Reference](/api/)
- 🔐 [Authentication Guide](/authentication)
- ❌ [Error Handling](/error-handling)
- 💬 GitHub Issues for support