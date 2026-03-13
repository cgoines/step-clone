# STEP Clone - Smart Traveler Enrollment Program

A full-featured clone of the U.S. State Department's Smart Traveler Enrollment Program (STEP), built with Node.js, Express, PostgreSQL, and modern messaging services.

## Features

- **User Registration & Authentication** - JWT-based secure authentication
- **Travel Plan Management** - Create and manage travel itineraries
- **Real-time Travel Alerts** - Multi-channel notifications (SMS, Push, Email)
- **Country Risk Assessment** - Travel advisories and risk levels
- **Embassy Information** - Contact details for U.S. embassies worldwide
- **Scalable Messaging System** - Redis-backed job queues for high-volume notifications
- **Load Testing** - Simulate thousands of alerts and users

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with UUID support
- **Authentication**: JWT tokens with bcrypt password hashing
- **Messaging**:
  - SMS via Twilio
  - Push notifications via Firebase Cloud Messaging
  - Email via NodeMailer (SMTP/Gmail)
- **Queues**: BullMQ with Redis for background job processing
- **Logging**: Winston for structured logging
- **Validation**: express-validator for input validation
- **Security**: Helmet.js, CORS, rate limiting

## Quick Start

### Prerequisites

- Node.js 16+ and npm
- PostgreSQL 13+
- Redis 6+
- Twilio account (for SMS)
- Firebase project (for push notifications)

### Installation

1. **Clone and install dependencies:**
```bash
cd state-clone
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Set up the database:**
```bash
# Create a PostgreSQL database
createdb step_clone

# Run migrations
npm run migrate

# Seed with sample data
npm run seed
```

4. **Start the development server:**
```bash
npm run dev
```

The API will be available at `http://localhost:9999`

## 🐳 Docker Setup (Recommended)

The easiest way to run the complete STEP Clone system is using Docker with the included PostgreSQL and Redis services.

### Prerequisites
- Docker and Docker Compose
- 4GB+ RAM available for containers

### Quick Start with Docker

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd step-clone

# 2. Start all services (PostgreSQL, Redis, and the app)
npm run docker:up

# 3. The system will automatically:
#    - Start PostgreSQL database
#    - Start Redis for job queues
#    - Run database migrations
#    - Seed sample data (countries, test users, alerts)
#    - Start the API server

# 4. Access the application
# API: http://localhost:9999
# Health Check: http://localhost:9999/health
```

### Docker Services

| Service | Port | Description | Credentials |
|---------|------|-------------|-------------|
| **API Server** | 9999 | Main STEP Clone application | - |
| **PostgreSQL** | 5432 | Database | `stepuser` / `steppass123` |
| **Redis** | 6379 | Job queues & caching | No auth |
| **PgAdmin** | 8080 | Database GUI (optional) | `admin@stepclone.com` / `admin123` |
| **Redis Commander** | 8081 | Redis GUI (optional) | `admin` / `admin123` |

### Docker Commands

```bash
# Start all services
npm run docker:up

# View application logs
npm run docker:logs

# Stop all services
npm run docker:down

# Rebuild containers (after code changes)
npm run docker:build

# Start with database GUIs
npm run docker:tools

# Complete cleanup (removes all data!)
npm run docker:clean

# Restart just the app (after code changes)
npm run docker:restart
```

### Docker Environment Configuration

The Docker setup uses environment variables defined in `docker-compose-local.yml`. To add your API keys:

1. **Copy the Docker environment template:**
```bash
cp .env.docker .env
```

2. **Add your API credentials to `.env`:**
```env
# Twilio (for SMS)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# Firebase (for push notifications)
FIREBASE_PROJECT_ID=your_project_id
# ... etc
```

3. **Restart the application:**
```bash
npm run docker:restart
```

### Demo Users (Docker)
After the containers start, you can use these pre-seeded accounts:
- **Demo User**: `demo@stepclone.com` / `demo123456`
- **Admin User**: `admin@stepclone.com` / `admin123456`

## Environment Configuration

Key environment variables in `.env`:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/step_clone

# JWT Secret (generate a strong random key)
JWT_SECRET=your-super-secret-jwt-key-here

# Twilio SMS
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Firebase Push Notifications
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email

# Redis
REDIS_URL=redis://localhost:6379

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# External APIs (optional - for enhanced features)
STATE_DEPT_API_BASE=https://www.state.gov/wp-json/wp/v2
OPENWEATHER_API_KEY=your-openweather-api-key
OPENWEATHER_API_URL=https://api.openweathermap.org/data/2.5
REST_COUNTRIES_API_URL=https://restcountries.com/v3.1
```

### External API Integration (Optional)

The system can optionally integrate with external APIs for enhanced functionality:

- **State Department API**: Real travel advisories from state.gov
- **OpenWeather API**: Weather-related travel alerts (free tier available)
- **REST Countries API**: Enhanced country information (free, no key required)

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/change-password` - Change password

### User Management

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/preferences` - Update notification preferences
- `POST /api/users/devices` - Register device for push notifications

### Travel Plans

- `POST /api/travel-plans` - Create travel plan
- `GET /api/travel-plans` - Get user's travel plans
- `GET /api/travel-plans/:id` - Get specific travel plan
- `PUT /api/travel-plans/:id` - Update travel plan
- `DELETE /api/travel-plans/:id` - Deactivate travel plan

### Alerts

- `GET /api/alerts` - Get public alerts
- `GET /api/alerts/:id` - Get specific alert
- `POST /api/alerts` - Create new alert (admin)
- `GET /api/alerts/my-destinations` - Get alerts for user's destinations
- `GET /api/alerts/stats` - Get alert statistics

### Countries

- `GET /api/countries` - List all countries
- `GET /api/countries/:id` - Get country details
- `GET /api/countries/risk/:level` - Get countries by risk level
- `GET /api/countries/search?q=query` - Search countries

### Notifications

- `GET /api/notifications` - Get user's notification history
- `GET /api/notifications/stats` - Get notification statistics
- `POST /api/notifications/test` - Send test notification
- `POST /api/notifications/acknowledge` - Mark notifications as read

## Architecture

### Microservices Design

The system follows a microservices + event-driven architecture:

- **API Gateway**: Express.js server handling HTTP requests
- **Authentication Service**: JWT-based user authentication
- **User Service**: Profile and preference management
- **Travel Plan Service**: Itinerary management
- **Alert Service**: Travel advisory management
- **Notification Service**: Multi-channel message delivery
- **Queue Service**: Background job processing with BullMQ

### Database Schema

Key tables:
- `users` - User accounts and preferences
- `countries` - Country data with risk levels
- `travel_plans` - User travel itineraries
- `alerts` - Travel advisories and notifications
- `user_notifications` - Notification delivery tracking
- `device_tokens` - Push notification device registration
- `embassy_contacts` - U.S. embassy information

### Message Processing

1. **Alert Creation**: New alerts trigger queue jobs
2. **User Matching**: Find users with relevant travel plans
3. **Multi-channel Delivery**: Send via SMS, push, and email based on preferences
4. **Delivery Tracking**: Track success/failure rates
5. **Retry Logic**: Exponential backoff for failed deliveries

## Load Testing

Test the system with thousands of alerts and users:

```bash
# Generate 1000 users, 100 alerts
npm run load-test

# Custom configuration
node scripts/loadTest.js --users 5000 --alerts 500 --plansPerUser 3

# Skip user generation and use existing users
node scripts/loadTest.js --skipUserGeneration true --alerts 1000
```

## Demo Users

After seeding, you can use these test accounts:

- **Demo User**: `demo@stepclone.com` / `demo123456`
- **Admin User**: `admin@stepclone.com` / `admin123456`

## Scaling Considerations

### Performance Optimizations

1. **Database Indexing**: Strategic indexes on frequently queried columns
2. **Connection Pooling**: PostgreSQL connection pool for concurrent requests
3. **Queue Processing**: Horizontal scaling with multiple worker processes
4. **Batch Operations**: Bulk database operations for large datasets
5. **Caching**: Redis for session storage and caching (planned)

### Deployment Architecture

For production deployment:

- **Load Balancer**: Multiple API server instances
- **Database**: PostgreSQL with read replicas
- **Message Queue**: Redis cluster for high availability
- **Monitoring**: Application and infrastructure monitoring
- **Security**: Rate limiting, input validation, SQL injection protection

## Development

### Project Structure

```
state-clone/
├── config/          # Database and service configurations
├── database/        # SQL schema and migrations
├── middleware/      # Express middleware (auth, validation)
├── routes/          # API route handlers
├── services/        # Business logic services
├── scripts/         # Database migration, seeding, load testing
├── utils/           # Utility functions (logging, etc.)
├── logs/            # Application logs
└── server.js        # Main application entry point
```

### Adding New Features

1. **Database Changes**: Update `database/schema.sql`
2. **API Endpoints**: Add routes in `routes/` directory
3. **Business Logic**: Implement in `services/` directory
4. **Background Jobs**: Extend queue processors
5. **Tests**: Add API tests using Jest and Supertest

### Testing

```bash
# Run unit tests
npm test

# Run load tests
npm run load-test

# Test specific API endpoints
curl -X POST http://localhost:9999/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@stepclone.com","password":"demo123456"}'
```

## Security Features

- **Password Hashing**: bcrypt with configurable rounds
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: Comprehensive request validation
- **SQL Injection Protection**: Parameterized queries
- **CORS Configuration**: Configurable cross-origin requests
- **Security Headers**: Helmet.js security middleware

## Monitoring & Logging

- **Structured Logging**: JSON-formatted logs with Winston
- **Error Tracking**: Comprehensive error handling and logging
- **Performance Metrics**: Request timing and success rates
- **Queue Monitoring**: Background job processing statistics
- **Health Checks**: API endpoint health monitoring

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes with tests
4. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For questions or issues:
- Check the API documentation above
- Review the logs in the `logs/` directory
- Test with the provided demo accounts
- Use the load testing tools to verify functionality