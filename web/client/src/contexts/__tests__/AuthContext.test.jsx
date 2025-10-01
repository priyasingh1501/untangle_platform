import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthProvider, useAuth } from '../AuthContext';
import axios from 'axios';

// Mock axios
vi.mock('axios');

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
  success: vi.fn(),
  error: vi.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Test component to access context
const TestComponent = () => {
  const { user, loading, token, isAuthenticated } = useAuth();
  return (
    <div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'no-user'}</div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="token">{token || 'no-token'}</div>
      <div data-testid="authenticated">{isAuthenticated.toString()}</div>
    </div>
  );
};

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});
  });

  test('provides initial state correctly', async () => {
    renderWithProviders(<TestComponent />);
    
    // Wait for the initial state to be set
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    expect(screen.getByTestId('token')).toHaveTextContent('no-token');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
  });

  test('loads user profile when token exists', async () => {
    const mockToken = 'mock-token';
    const mockUser = { id: '1', email: 'test@example.com' };
    
    localStorageMock.getItem.mockReturnValue(mockToken);
    axios.get.mockResolvedValue({ data: { user: mockUser } });
    
    renderWithProviders(<TestComponent />);
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/api/auth/profile'));
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('token')).toHaveTextContent(mockToken);
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    });
  });

  test('handles profile fetch error by logging out', async () => {
    const mockToken = 'mock-token';
    
    localStorageMock.getItem.mockReturnValue(mockToken);
    axios.get.mockRejectedValue(new Error('Profile fetch failed'));
    
    renderWithProviders(<TestComponent />);
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/api/auth/profile'));
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('token')).toHaveTextContent('no-token');
    });
  });

  test('login function works correctly', async () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    const mockToken = 'new-token';
    
    axios.post.mockResolvedValue({ 
      data: { token: mockToken, user: mockUser } 
    });
    
    const LoginTestComponent = () => {
      const { login } = useAuth();
      const [result, setResult] = React.useState(null);
      
      React.useEffect(() => {
        const testLogin = async () => {
          const loginResult = await login('test@example.com', 'password');
          setResult(loginResult);
        };
        testLogin();
      }, [login]);
      
      return <div data-testid="login-result">{result ? result.success.toString() : 'loading'}</div>;
    };
    
    renderWithProviders(<LoginTestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('login-result')).toHaveTextContent('true');
    });
    
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/login'),
      { email: 'test@example.com', password: 'password' }
    );
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', mockToken);
  });

  test('login function handles errors correctly', async () => {
    const errorMessage = 'Invalid credentials';
    axios.post.mockRejectedValue({ 
      response: { data: { message: errorMessage } } 
    });
    
    const LoginErrorTestComponent = () => {
      const { login } = useAuth();
      const [result, setResult] = React.useState(null);
      
      React.useEffect(() => {
        const testLogin = async () => {
          const loginResult = await login('test@example.com', 'wrong-password');
          setResult(loginResult);
        };
        testLogin();
      }, [login]);
      
      return <div data-testid="login-error-result">{result ? result.success.toString() : 'loading'}</div>;
    };
    
    renderWithProviders(<LoginErrorTestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('login-error-result')).toHaveTextContent('false');
    });
  });

  test('register function works correctly', async () => {
    const mockUser = { id: '1', email: 'new@example.com' };
    const mockToken = 'new-token';
    const userData = { email: 'new@example.com', password: 'password123' };
    
    axios.post.mockResolvedValue({ 
      data: { token: mockToken, user: mockUser } 
    });
    
    const RegisterTestComponent = () => {
      const { register } = useAuth();
      const [result, setResult] = React.useState(null);
      
      React.useEffect(() => {
        const testRegister = async () => {
          const registerResult = await register(userData);
          setResult(registerResult);
        };
        testRegister();
      }, [register]);
      
      return <div data-testid="register-result">{result ? result.success.toString() : 'loading'}</div>;
    };
    
    renderWithProviders(<RegisterTestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('register-result')).toHaveTextContent('true');
    });
    
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/register'),
      userData
    );
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', mockToken);
  });

  test('logout function works correctly', async () => {
    const mockToken = 'mock-token';
    localStorageMock.getItem.mockReturnValue(mockToken);
    
    const LogoutTestComponent = () => {
      const { logout } = useAuth();
      const [loggedOut, setLoggedOut] = React.useState(false);
      
      React.useEffect(() => {
        const testLogout = async () => {
          logout();
          setLoggedOut(true);
        };
        testLogout();
      }, [logout]);
      
      return <div data-testid="logout-result">{loggedOut ? 'logged-out' : 'loading'}</div>;
    };
    
    renderWithProviders(<LogoutTestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('logout-result')).toHaveTextContent('logged-out');
    });
    
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
  });

  test('updateProfile function works correctly', async () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    const updatedUser = { ...mockUser, name: 'John Doe' };
    
    axios.put.mockResolvedValue({ data: { user: updatedUser } });
    
    const UpdateProfileTestComponent = () => {
      const { updateProfile } = useAuth();
      const [result, setResult] = React.useState(null);
      
      React.useEffect(() => {
        const testUpdateProfile = async () => {
          const updateResult = await updateProfile({ name: 'John Doe' });
          setResult(updateResult);
        };
        testUpdateProfile();
      }, [updateProfile]);
      
      return <div data-testid="update-profile-result">{result ? result.success.toString() : 'loading'}</div>;
    };
    
    renderWithProviders(<UpdateProfileTestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('update-profile-result')).toHaveTextContent('true');
    });
    
    expect(axios.put).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/profile'),
      { name: 'John Doe' }
    );
  });

  test('changePassword function works correctly', async () => {
    axios.put.mockResolvedValue({ data: { message: 'Password changed' } });
    
    const ChangePasswordTestComponent = () => {
      const { changePassword } = useAuth();
      const [result, setResult] = React.useState(null);
      
      React.useEffect(() => {
        const testChangePassword = async () => {
          const changeResult = await changePassword('oldpass', 'newpass');
          setResult(changeResult);
        };
        testChangePassword();
      }, [changePassword]);
      
      return <div data-testid="change-password-result">{result ? result.success.toString() : 'loading'}</div>;
    };
    
    renderWithProviders(<ChangePasswordTestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('change-password-result')).toHaveTextContent('true');
    });
    
    expect(axios.put).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/change-password'),
      { currentPassword: 'oldpass', newPassword: 'newpass' }
    );
  });

  test('refreshToken function works correctly', async () => {
    const mockToken = 'mock-token';
    const mockRefreshToken = 'mock-refresh-token';
    const newToken = 'new-token';
    
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'token') return mockToken;
      if (key === 'refreshToken') return mockRefreshToken;
      return null;
    });
    axios.post.mockResolvedValue({ data: { tokens: { accessToken: newToken, refreshToken: 'new-refresh-token' } } });
    
    const RefreshTokenTestComponent = () => {
      const { refreshToken } = useAuth();
      const [result, setResult] = React.useState(null);
      
      React.useEffect(() => {
        const testRefreshToken = async () => {
          const refreshResult = await refreshToken();
          setResult(refreshResult);
        };
        testRefreshToken();
      }, [refreshToken]);
      
      return <div data-testid="refresh-token-result">{result ? result.success.toString() : 'loading'}</div>;
    };
    
    renderWithProviders(<RefreshTokenTestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('refresh-token-result')).toHaveTextContent('true');
    });
    
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/refresh'),
      { refreshToken: mockRefreshToken }
    );
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', newToken);
  });
});
