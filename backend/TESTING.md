# Testing Guide

This document provides comprehensive information about the testing setup and how to run tests for the Untangle application.

## Test Structure

The application uses a multi-layered testing approach:

### 1. Unit Tests (Vitest)
- **Location**: `client/src/__tests__/` and `server/__tests__/`
- **Framework**: Vitest
- **Purpose**: Test individual components and functions in isolation

### 2. Integration Tests (Vitest + Supertest)
- **Location**: `server/__tests__/routes/`
- **Framework**: Vitest + Supertest
- **Purpose**: Test API endpoints and database interactions

### 3. End-to-End Tests (Playwright)
- **Location**: `client/src/__tests__/e2e/`
- **Framework**: Playwright
- **Purpose**: Test complete user workflows across the application

## Test Categories

### Frontend Tests
- **AuthContext Tests**: Authentication state management
- **Component Tests**: React component rendering and behavior
- **Page Tests**: Full page functionality
- **E2E Tests**: Complete user journeys

### Backend Tests
- **API Route Tests**: All REST endpoints
- **Database Model Tests**: Data validation and operations
- **Authentication Tests**: JWT token handling
- **Business Logic Tests**: Core application functionality

## Running Tests

### Prerequisites
```bash
# Install dependencies
npm install
cd client && npm install
```

### Unit Tests
```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

### End-to-End Tests
```bash
# Run all E2E tests
npm run e2e

# Run E2E tests with UI
npm run e2e:ui

# Run E2E tests in headed mode
npm run e2e:headed
```

### Client-Specific Tests
```bash
cd client

# Run client tests
npm test

# Run client tests with coverage
npm run test:coverage

# Run client E2E tests
npm run e2e
```

## Test Configuration

### Vitest Configuration
- **File**: `vitest.config.js` (root) and `client/vitest.config.js`
- **Environment**: jsdom for frontend, node for backend
- **Coverage**: V8 provider with HTML, JSON, and text reports

### Playwright Configuration
- **File**: `playwright.config.js`
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Base URL**: http://localhost:3000

## Test Coverage

The test suite covers:

### Authentication Flow
- User registration
- User login
- Password validation
- Token management
- Profile updates

### Core Features
- Dashboard functionality
- Food tracking and nutrition
- Task management
- Goal setting and tracking
- Journal entries
- Health metrics
- Financial tracking
- Relationship management
- Time management

### API Endpoints
- All CRUD operations
- Data validation
- Error handling
- Authentication middleware
- Database interactions

### User Interface
- Component rendering
- User interactions
- Form validation
- Navigation
- Responsive design
- Accessibility

## Test Data

### Mock Data
- User accounts for testing
- Sample food items
- Test tasks and goals
- Mock API responses

### Database Setup
- Test database configuration
- Data seeding for tests
- Cleanup after each test

## Best Practices

### Writing Tests
1. **Arrange-Act-Assert**: Structure tests clearly
2. **Descriptive Names**: Use clear, descriptive test names
3. **Single Responsibility**: One test per behavior
4. **Mock External Dependencies**: Isolate units under test
5. **Test Edge Cases**: Include error conditions and boundary values

### Test Maintenance
1. **Keep Tests Updated**: Update tests when code changes
2. **Remove Obsolete Tests**: Delete tests for removed features
3. **Regular Review**: Review test coverage and quality
4. **Performance**: Keep tests fast and reliable

## Debugging Tests

### Unit Tests
```bash
# Run specific test file
npm test -- auth.test.js

# Run tests with verbose output
npm test -- --reporter=verbose

# Debug tests
npm test -- --inspect-brk
```

### E2E Tests
```bash
# Run specific test file
npm run e2e -- auth-flow.test.js

# Run tests in debug mode
npm run e2e -- --debug

# Run tests in headed mode for visual debugging
npm run e2e:headed
```

## Continuous Integration

### GitHub Actions
Tests are automatically run on:
- Pull requests
- Pushes to main branch
- Release tags

### Test Reports
- Coverage reports generated in `coverage/` directory
- E2E test reports in `playwright-report/` directory
- Test results available in CI logs

## Troubleshooting

### Common Issues

1. **Tests Failing Locally**
   - Check if all dependencies are installed
   - Verify database connection
   - Clear node_modules and reinstall

2. **E2E Tests Failing**
   - Ensure application is running on localhost:3000
   - Check browser installation
   - Verify test data setup

3. **Coverage Issues**
   - Check if all files are included in coverage
   - Verify test file naming conventions
   - Review coverage configuration

### Getting Help
- Check test logs for detailed error messages
- Review test documentation
- Consult team members for complex issues

## Test Metrics

### Coverage Targets
- **Unit Tests**: >80% code coverage
- **Integration Tests**: >90% API endpoint coverage
- **E2E Tests**: >95% critical user flow coverage

### Performance Targets
- **Unit Tests**: <5 seconds total runtime
- **Integration Tests**: <30 seconds total runtime
- **E2E Tests**: <5 minutes total runtime

## Future Improvements

### Planned Enhancements
1. **Visual Regression Testing**: Screenshot comparisons
2. **Performance Testing**: Load and stress testing
3. **Accessibility Testing**: Automated a11y checks
4. **Mobile Testing**: Enhanced mobile device testing
5. **API Testing**: Contract testing and API documentation

### Test Automation
1. **Pre-commit Hooks**: Run tests before commits
2. **Scheduled Testing**: Regular test execution
3. **Test Data Management**: Automated test data generation
4. **Test Reporting**: Enhanced reporting and notifications
