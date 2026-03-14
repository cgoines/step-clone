# STEP Clone Admin Dashboard

A comprehensive admin dashboard for managing the STEP Clone travel safety system. Built with React, Vite, and Tailwind CSS.

## Features

### 📊 Dashboard Overview
- System health monitoring
- Real-time statistics and metrics
- Interactive charts for data visualization
- Quick access to key functions

### 👥 User Management
- View and search registered users
- Filter by verification status
- User profile information
- Notification preferences management

### 🚨 Alert Management
- Create and manage travel alerts
- Filter by severity, type, and country
- Real-time alert statistics
- Alert expiration management

### 🌍 Country Information
- Monitor countries by risk level
- View travel advisory information
- Country-specific alert history
- Regional filtering and search

### ✈️ Travel Plan Monitoring
- Track active and upcoming travel plans
- View traveler information and itineraries
- Monitor alerts for travel destinations
- Emergency contact management

### 📢 Notification System
- Monitor notification delivery
- Test notification channels (Email, SMS, Push)
- Delivery statistics and trends
- Channel-specific analytics

### ⚙️ System Settings
- Configure notification providers
- Security settings management
- System health monitoring
- Maintenance operations

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- STEP Clone backend API running

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your API configuration
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

### Default Login Credentials

For development and testing:
- **Email**: demo@stepclone.com
- **Password**: demo123456

## Environment Configuration

Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:9999/api
```

## Build for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   └── Layout.jsx      # Main layout with navigation
├── contexts/           # React contexts
│   └── AuthContext.jsx # Authentication state management
├── pages/              # Page components
│   ├── Dashboard.jsx   # Main dashboard
│   ├── UsersPage.jsx   # User management
│   ├── AlertsPage.jsx  # Alert management
│   ├── CountriesPage.jsx # Country information
│   ├── TravelPlansPage.jsx # Travel plan monitoring
│   ├── NotificationsPage.jsx # Notification management
│   ├── SettingsPage.jsx # System settings
│   └── LoginPage.jsx   # Authentication
├── services/           # API services
│   └── api.js         # API client with authentication
├── App.jsx            # Main app component
└── main.jsx           # Application entry point
```

## API Integration

The dashboard integrates with the STEP Clone backend API for:

- **Authentication**: JWT-based login and session management
- **User Management**: CRUD operations for user accounts
- **Alert System**: Creating and managing travel alerts
- **Country Data**: Retrieving country risk information
- **Travel Plans**: Monitoring user travel itineraries
- **Notifications**: Sending and tracking notifications
- **System Health**: Real-time system status monitoring

## Technologies Used

- **React 18**: Modern React with hooks and context
- **Vite**: Fast build tool and development server
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Modern icon library
- **Recharts**: Data visualization components
- **Axios**: HTTP client with interceptors
- **React Hot Toast**: Toast notifications

## Development Guidelines

### Code Style
- Use functional components with hooks
- Follow React best practices
- Use Tailwind CSS for styling
- Keep components focused and reusable

### State Management
- Local component state with `useState`
- Global auth state with React Context
- API calls with async/await

### Error Handling
- User-friendly error messages
- Toast notifications for feedback
- Graceful fallbacks for failed requests

## Security Features

- JWT authentication with automatic token refresh
- Protected routes requiring authentication
- Secure API communication
- Input validation and sanitization
- Role-based access control ready

## Contributing

1. Follow the existing code style
2. Add proper error handling
3. Include user feedback for all actions
4. Test with both demo and real data
5. Ensure responsive design works on all screen sizes

## Troubleshooting

### Common Issues

**Login fails**: Ensure the backend API is running on the correct port (9999)

**Charts not loading**: Check that the API endpoints return properly formatted data

**Styles not applying**: Verify Tailwind CSS is properly configured and building

**API errors**: Check browser console and network tab for detailed error messages

## License

This project is part of the STEP Clone system and follows the same licensing terms.