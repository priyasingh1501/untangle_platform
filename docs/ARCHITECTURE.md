# Untangle Platform Architecture

## Overview

The Untangle Platform is a comprehensive lifestyle management system built with a modern, scalable architecture. It consists of three main applications: a Node.js/Express backend API, a React web application, and an Expo React Native mobile application.

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web App       │    │   Mobile App    │    │   Backend API   │
│   (React)       │    │   (React Native)│    │   (Node.js)     │
│   Port: 3000    │    │   Port: 8081    │    │   Port: 5000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   MongoDB       │
                    │   Database      │
                    └─────────────────┘
```

## Backend Architecture

### Core Principles

1. **Dependency Injection**: All services are managed through a centralized container
2. **Facade Pattern**: Side-effects are encapsulated behind facade functions
3. **Error Handling**: Centralized error handling with standardized responses
4. **Configuration Management**: Environment-based configuration with validation
5. **Modular Design**: Clear separation of concerns with well-defined boundaries

### Directory Structure

```
backend/
├── server/
│   ├── config/           # Configuration management
│   │   ├── appConfig.js  # Centralized app configuration
│   │   ├── logger.js     # Logging configuration
│   │   └── security.js   # Security configuration
│   ├── facades/          # Side-effect facades
│   │   ├── configFacade.js
│   │   ├── loggerFacade.js
│   │   └── httpFacade.js
│   ├── middleware/       # Express middleware
│   │   ├── auth.js       # Authentication middleware
│   │   ├── validation.js # Input validation
│   │   └── rateLimiting.js
│   ├── models/           # Mongoose models
│   ├── routes/           # API route handlers
│   ├── services/         # Business logic services
│   │   ├── serviceFactory.js
│   │   └── ...
│   ├── utils/            # Utility functions
│   │   ├── errorHandler.js
│   │   └── responseHelper.js
│   ├── container.js      # Dependency injection container
│   └── index.js          # Application entry point
├── scripts/              # Database scripts and utilities
├── data/                 # Seed data files
└── __tests__/            # Test files
```

### Key Components

#### 1. Dependency Injection Container (`container.js`)

Centralized service management that provides:
- Service registration and resolution
- Singleton management
- Easy mocking for testing

```javascript
// Register a service
container.register('UserService', () => new UserService());

// Get a service
const userService = container.get('UserService');
```

#### 2. Service Factory (`services/serviceFactory.js`)

Provides clean interface for accessing services:

```javascript
// Get models
const { User, Journal } = ServiceFactory.getModels();

// Get services
const { OpenAIService } = ServiceFactory.getServices();

// Get facades
const LoggerFacade = ServiceFactory.get('LoggerFacade');
```

#### 3. Facades

Encapsulate side-effects for better testability:

- **LoggerFacade**: Centralized logging operations
- **ConfigFacade**: Environment variable access
- **HttpFacade**: HTTP requests with retry logic

#### 4. Error Handling (`utils/errorHandler.js`)

Standardized error handling with:
- Custom error types
- Centralized error processing
- Retry policies
- Security event logging

#### 5. Configuration Management (`config/appConfig.js`)

Centralized configuration with:
- Environment-based settings
- Validation of required values
- Feature flags
- Type-safe access

## API Design

### RESTful Endpoints

```
/api/auth          # Authentication
/api/users         # User management
/api/journal       # Journal entries
/api/tasks         # Task management
/api/finance       # Financial tracking
/api/meals         # Meal planning
/api/goals         # Goal setting
/api/habits        # Habit tracking
/api/mindfulness   # Mindfulness check-ins
/api/content       # Content management
/api/ai-chat       # AI chat functionality
```

### Response Format

All API responses follow a consistent format:

```javascript
// Success Response
{
  "success": true,
  "message": "Success",
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}

// Error Response
{
  "success": false,
  "message": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "details": { ... }
}
```

## Database Design

### MongoDB Collections

- **users**: User accounts and profiles
- **journals**: Journal entries with encryption
- **tasks**: Task management
- **finance**: Financial transactions
- **meals**: Meal planning and tracking
- **goals**: User goals and objectives
- **habits**: Habit tracking
- **mindfulness**: Mindfulness check-ins
- **content**: Content library
- **ai_chats**: AI conversation history

### Data Relationships

```
User (1) ──→ (N) Journal
User (1) ──→ (N) Task
User (1) ──→ (N) Finance
User (1) ──→ (N) Meal
User (1) ──→ (N) Goal
User (1) ──→ (N) Habit
User (1) ──→ (N) MindfulnessCheckin
User (1) ──→ (N) AiChat
```

## Security

### Authentication & Authorization

- JWT-based authentication
- Role-based access control
- Session management
- Two-factor authentication support

### Data Protection

- Password hashing with bcrypt
- Journal entry encryption
- Input validation and sanitization
- Rate limiting
- CORS configuration

### Security Middleware

- Helmet for security headers
- CSRF protection
- XSS prevention
- SQL injection prevention

## Testing Strategy

### Test Types

1. **Unit Tests**: Individual functions and components
2. **Integration Tests**: API endpoints and database interactions
3. **End-to-End Tests**: Complete user workflows

### Test Structure

```
__tests__/
├── middleware/     # Middleware tests
├── models/         # Model tests
├── routes/         # Route tests
├── services/       # Service tests
└── setup.js        # Test setup
```

### Testing Tools

- **Vitest**: Test runner
- **Supertest**: HTTP testing
- **MongoDB Memory Server**: In-memory database
- **Jest**: Mocking utilities

## Development Workflow

### Code Quality

- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript**: Type checking
- **Husky**: Git hooks

### CI/CD Pipeline

- **GitHub Actions**: Automated testing
- **Code Coverage**: Test coverage reporting
- **Automated Deployment**: Production deployment

## Performance Considerations

### Caching Strategy

- In-memory caching for frequently accessed data
- Redis for session storage (planned)
- CDN for static assets

### Database Optimization

- Proper indexing
- Query optimization
- Connection pooling
- Read replicas (planned)

### API Optimization

- Response compression
- Request size limits
- Rate limiting
- Pagination

## Monitoring & Logging

### Logging Levels

- **Error**: System errors and exceptions
- **Warn**: Warning conditions
- **Info**: General information
- **Debug**: Detailed debugging information

### Security Logging

- Authentication attempts
- Authorization failures
- Suspicious activities
- API usage patterns

## Deployment

### Environment Configuration

- **Development**: Local development
- **Staging**: Pre-production testing
- **Production**: Live environment

### Infrastructure

- **Backend**: Railway/Heroku
- **Database**: MongoDB Atlas
- **Web App**: Vercel/Netlify
- **Mobile**: Expo App Store

## Code Ownership

### Backend Team

- **API Development**: All backend routes and services
- **Database Design**: Schema and migrations
- **Authentication**: Security and user management
- **Integration**: External API integrations

### Frontend Team

- **Web App**: React web application
- **Mobile App**: React Native mobile app
- **UI/UX**: User interface and experience
- **State Management**: Client-side state

### DevOps Team

- **Infrastructure**: Server and deployment
- **CI/CD**: Pipeline and automation
- **Monitoring**: System monitoring and alerts
- **Security**: Security policies and compliance

## Future Improvements

### Planned Features

1. **Microservices Architecture**: Break down monolithic backend
2. **Event-Driven Architecture**: Implement event sourcing
3. **GraphQL API**: Add GraphQL alongside REST
4. **Real-time Features**: WebSocket support
5. **Advanced Analytics**: User behavior analytics

### Technical Debt

1. **Database Migrations**: Implement proper migration system
2. **API Versioning**: Add API versioning strategy
3. **Documentation**: Auto-generated API documentation
4. **Monitoring**: Advanced monitoring and alerting
5. **Testing**: Increase test coverage

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB 6.0+
- npm 8+

### Installation

```bash
# Install dependencies
npm run install:all

# Start development servers
npm run dev
```

### Environment Setup

Create `.env` file with required variables:

```env
MONGODB_URI=mongodb://localhost:27017/untangle
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
ENCRYPTION_KEY=your-encryption-key
```

## Contributing

### Code Standards

- Follow ESLint configuration
- Use Prettier for formatting
- Write tests for new features
- Update documentation

### Pull Request Process

1. Create feature branch
2. Make changes with tests
3. Run linting and tests
4. Submit pull request
5. Code review and merge

---

*This architecture document is maintained by the development team and should be updated as the system evolves.*
