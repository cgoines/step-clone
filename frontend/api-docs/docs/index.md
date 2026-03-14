# STEP Clone API Documentation

Welcome to the official API documentation for STEP Clone, a comprehensive travel safety system based on the U.S. State Department's Smart Traveler Enrollment Program (STEP).

## Overview

The STEP Clone API provides endpoints to manage users, travel plans, country risk information, travel alerts, and notifications. This RESTful API is designed for:

- **Travel Safety Management**: Monitor and alert travelers about potential risks
- **User Registration**: Manage traveler profiles and preferences
- **Alert System**: Create and distribute travel safety alerts
- **Notification Delivery**: Multi-channel messaging (Email, SMS, Push)
- **Administrative Functions**: Comprehensive admin dashboard and management tools

## Key Features

::: info Core Capabilities
- **User Management**: Registration, authentication, and profile management
- **Travel Planning**: Create and manage travel itineraries
- **Risk Assessment**: Real-time country risk level monitoring
- **Alert Distribution**: Multi-channel alert delivery system
- **Admin Dashboard**: Comprehensive management interface
- **Health Monitoring**: System status and performance tracking
:::

## Quick Start

Get started with the STEP Clone API in minutes:

1. **[Authentication](/authentication)** - Learn how to authenticate your requests
2. **[API Reference](/api/)** - Explore all available endpoints
3. **[Quick Start Guide](/quick-start)** - Build your first integration

## Base URL

All API requests should be made to:

```
https://api.stepclone.com/api
```

For development and testing:

```
http://localhost:9999/api
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include your token in the Authorization header:

```http
Authorization: Bearer your-jwt-token-here
```

[Learn more about authentication →](/authentication)

## Response Format

All API responses follow a consistent JSON format:

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

## Rate Limiting

API requests are rate limited to ensure fair usage:

- **Authenticated requests**: 1000 requests per hour
- **Unauthenticated requests**: 100 requests per hour

Rate limit headers are included in all responses:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1641384600
```

## Need Help?

- 📚 [API Reference](/api/) - Complete endpoint documentation
- 🚀 [Quick Start](/quick-start) - Get up and running quickly
- 🔐 [Authentication](/authentication) - Security and access control
- ❌ [Error Handling](/error-handling) - Handle errors gracefully

## Admin Dashboard

Access the administrative interface at [http://localhost:3001](http://localhost:3001) to:

- Manage users and travel plans
- Create and monitor alerts
- View system statistics
- Configure notification settings

**Demo Credentials:**
- Email: `demo@stepclone.com`
- Password: `demo123456`

---

*This documentation is automatically updated with each API release. For questions or support, please contact the development team.*