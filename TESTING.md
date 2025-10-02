# Testing Guide for Untangle Frontend

This document provides comprehensive information about testing the React frontend application.

## 🧪 Testing Setup

The project uses the following testing technologies:
- **Jest**: JavaScript testing framework
- **React Testing Library**: Testing utilities for React components
- **jsdom**: DOM environment for Node.js testing

## 📁 Test Structure

```
src/
├── __tests__/           # Test files
│   ├── components/      # Component tests
│   ├── contexts/        # Context tests
│   └── pages/          # Page tests
├── setupTests.js        # Global test setup
└── jest.config.js       # Jest configuration
```

## 🚀 Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

### Run Specific Test File
```bash
npm test -- Layout.test.js
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="Login"
```

## ✍️ Writing Tests

### Component Test Structure

```javascript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import ComponentName from '../ComponentName';

// Mock external dependencies
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('ComponentName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly', () => {
    renderWithProviders(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  test('handles user interactions', () => {
    renderWithProviders(<ComponentName />);
    const button = screen.getByRole('button', { name: 'Click Me' });
    fireEvent.click(button);
    // Assert expected behavior
  });
});
```

### Testing Hooks and Contexts

```javascript
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

const wrapper = ({ children }) => (
  <AuthProvider>{children}</AuthProvider>
);

test('useAuth hook works correctly', () => {
  const { result } = renderHook(() => useAuth(), { wrapper });
  
  expect(result.current.user).toBeNull();
  expect(result.current.loading).toBe(true);
});
```

### Testing Async Operations

```javascript
test('handles API calls correctly', async () => {
  const mockResponse = { data: 'test data' };
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => mockResponse,
  });

  renderWithProviders(<ComponentName />);
  
  const button = screen.getByRole('button', { name: 'Fetch Data' });
  fireEvent.click(button);

  await waitFor(() => {
    expect(screen.getByText('test data')).toBeInTheDocument();
  });
});
```

## 🔧 Test Utilities

### renderWithProviders
A custom render function that wraps components with necessary providers:
- `BrowserRouter` for routing
- `AuthProvider` for authentication context

### Common Testing Library Queries
- `getByText`: Find element by text content
- `getByRole`: Find element by ARIA role
- `getByLabelText`: Find form element by label
- `getByTestId`: Find element by data-testid attribute
- `getByPlaceholderText`: Find input by placeholder

### Common Testing Library Actions
- `fireEvent.click`: Simulate click events
- `fireEvent.change`: Simulate input changes
- `fireEvent.keyPress`: Simulate keyboard events
- `fireEvent.submit`: Simulate form submission

### Async Testing Utilities
- `waitFor`: Wait for asynchronous operations
- `act`: Wrap state updates in act for testing

## 🎭 Mocking

### Mocking External Libraries

```javascript
// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    form: ({ children, ...props }) => <form {...props}>{children}</form>,
  },
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// Mock axios
jest.mock('axios');
```

### Mocking Global Objects

```javascript
// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;
```

## 📊 Test Coverage

The project aims for 70% test coverage across:
- **Branches**: Conditional logic coverage
- **Functions**: Function execution coverage
- **Lines**: Line-by-line coverage
- **Statements**: Statement execution coverage

### Coverage Reports
Coverage reports are generated in the `coverage/` directory and can be viewed in HTML format.

## 🐛 Debugging Tests

### Verbose Output
```bash
npm test -- --verbose
```

### Debug Mode
```bash
npm test -- --detectOpenHandles
```

### Console Logs in Tests
```javascript
test('debug test', () => {
  console.log('Debug information');
  // Test code
});
```

## 📝 Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the component does, not how it does it
2. **Use Semantic Queries**: Prefer `getByRole` over `getByTestId` when possible
3. **Test User Interactions**: Test the component as a user would interact with it
4. **Keep Tests Simple**: Each test should verify one specific behavior
5. **Use Descriptive Test Names**: Test names should clearly describe what is being tested
6. **Clean Up After Tests**: Use `beforeEach` and `afterEach` for setup and cleanup
7. **Mock External Dependencies**: Don't test external libraries, mock them instead

## 🔍 Common Test Patterns

### Form Testing
```javascript
test('form submission works correctly', async () => {
  renderWithProviders(<LoginForm />);
  
  const emailInput = screen.getByLabelText('Email');
  const passwordInput = screen.getByLabelText('Password');
  const submitButton = screen.getByRole('button', { name: 'Submit' });
  
  fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
  fireEvent.change(passwordInput, { target: { value: 'password123' } });
  fireEvent.click(submitButton);
  
  await waitFor(() => {
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });
});
```

### API Error Handling
```javascript
test('handles API errors gracefully', async () => {
  global.fetch.mockRejectedValueOnce(new Error('Network error'));
  
  renderWithProviders(<DataComponent />);
  
  await waitFor(() => {
    expect(screen.getByText('Error loading data')).toBeInTheDocument();
  });
});
```

### Component State Changes
```javascript
test('updates state correctly', () => {
  renderWithProviders(<Counter />);
  
  const incrementButton = screen.getByRole('button', { name: 'Increment' });
  const countDisplay = screen.getByText('0');
  
  fireEvent.click(incrementButton);
  
  expect(countDisplay).toHaveTextContent('1');
});
```

## 🚨 Troubleshooting

### Common Issues

1. **Test Environment Issues**: Ensure `jsdom` is properly configured
2. **Async Test Failures**: Use `waitFor` for asynchronous operations
3. **Mock Not Working**: Check that mocks are defined before imports
4. **Provider Wrapper Issues**: Ensure all necessary providers are included in `renderWithProviders`

### Getting Help
- Check Jest documentation: https://jestjs.io/
- Check React Testing Library documentation: https://testing-library.com/docs/react-testing-library/intro/
- Review existing tests for patterns and examples
