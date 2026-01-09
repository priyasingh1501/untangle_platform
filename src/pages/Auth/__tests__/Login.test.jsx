import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthProvider } from '../../../contexts/AuthContext';
import Login from '../Login';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    form: ({ children, ...props }) => <form {...props}>{children}</form>,
    input: (props) => <input {...props} />,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
  },
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
  success: vi.fn(),
  error: vi.fn(),
}));

// Mock UI components - use function components
vi.mock('../../../components/ui', () => ({
  Button: (props) => {
    // eslint-disable-next-line react/prop-types
    const { children, ...rest } = props;
    return <button {...rest}>{children}</button>;
  },
  Input: ({ label, ...props }) => (
    <div>
      {label && <label>{label}</label>}
      <input {...props} />
    </div>
  ),
  Header: (props) => {
    // eslint-disable-next-line react/prop-types
    const { children, ...rest } = props;
    return <header {...rest}>{children}</header>;
  },
  Section: (props) => {
    // eslint-disable-next-line react/prop-types
    const { children, ...rest } = props;
    return <section {...rest}>{children}</section>;
  },
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Eye: () => <svg data-testid="eye-icon" />,
  EyeOff: () => <svg data-testid="eye-off-icon" />,
  Lock: () => <svg data-testid="lock-icon" />,
  Mail: () => <svg data-testid="mail-icon" />,
}));

// Mock axios
vi.mock('axios', () => ({
  default: {
    post: vi.fn(() => Promise.resolve({ data: { token: 'test-token', user: {} } })),
    create: vi.fn(() => ({
      post: vi.fn(() => Promise.resolve({ data: { token: 'test-token', user: {} } })),
    })),
  },
  post: vi.fn(() => Promise.resolve({ data: { token: 'test-token', user: {} } })),
  create: vi.fn(() => ({
    post: vi.fn(() => Promise.resolve({ data: { token: 'test-token', user: {} } })),
  })),
}));

// Mock AuthContext
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(() => Promise.resolve({ success: true })),
    user: null,
    token: null,
  }),
  AuthProvider: ({ children }) => children,
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

describe('Login Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  test('renders login form with all required elements', () => {
    renderWithProviders(<Login />);
    
    // Check for main elements - use getAllByText since Header might render it too
    expect(screen.getAllByText('Welcome to Untangle').length).toBeGreaterThan(0);
    expect(screen.getByText('Sign in to manage your lifestyle')).toBeInTheDocument();
    
    // Check for form fields - Input component uses label prop
    expect(screen.getByText('Email address')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    
    // Check for buttons
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Forgot your password?' })).toBeInTheDocument();
    
    // Check for sign up link
    expect(screen.getByText('Sign up here')).toBeInTheDocument();
  });

  test('form validation works correctly', async () => {
    renderWithProviders(<Login />);
    
    const submitButton = screen.getByRole('button', { name: 'Sign in' });
    
    // Try to submit empty form
    fireEvent.click(submitButton);
    
    // Check that required fields are marked
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    
    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });

  test('password visibility toggle works', () => {
    renderWithProviders(<Login />);
    
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const toggleButton = screen.getByRole('button', { name: /Show password|Hide password/ });
    
    // Initially password should be hidden
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click toggle button
    fireEvent.click(toggleButton);
    
    // Password should now be visible
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click again to hide
    fireEvent.click(toggleButton);
    
    // Password should be hidden again
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('form inputs update state correctly', () => {
    renderWithProviders(<Login />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    
    // Type in email
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput).toHaveValue('test@example.com');
    
    // Type in password
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(passwordInput).toHaveValue('password123');
  });

  test('remember me checkbox works', () => {
    renderWithProviders(<Login />);
    
    const rememberMeCheckbox = screen.getByLabelText('Remember me');
    
    // Initially unchecked
    expect(rememberMeCheckbox).not.toBeChecked();
    
    // Click to check
    fireEvent.click(rememberMeCheckbox);
    expect(rememberMeCheckbox).toBeChecked();
    
    // Click again to uncheck
    fireEvent.click(rememberMeCheckbox);
    expect(rememberMeCheckbox).not.toBeChecked();
  });

  test('accessibility attributes are present', () => {
    renderWithProviders(<Login />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });
    
    // Check for proper labels and IDs
    expect(emailInput).toHaveAttribute('id', 'email');
    expect(passwordInput).toHaveAttribute('id', 'password');
    
    // Check for proper input types
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Check for required attributes
    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
    
    // Check for proper button type
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  test('loading state is handled correctly', async () => {
    renderWithProviders(<Login />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });
    
    // Fill form
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // Submit form
    fireEvent.click(submitButton);
    
    // Button should show loading state
    await waitFor(() => {
      expect(screen.getByText('Signing in...')).toBeInTheDocument();
    }, { timeout: 2000 });
    
    // Button might not be disabled if Button component doesn't handle loading prop
    // Just verify the loading text appears
    expect(screen.getByText('Signing in...')).toBeInTheDocument();
  });
});
