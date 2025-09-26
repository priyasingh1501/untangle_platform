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

  test('provides initial state correctly', () => {
    renderWithProviders(<TestComponent />);
    
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    expect(screen.getByTestId('loading')).toHaveTextContent('true');
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
    
    renderWithProviders(<TestComponent />);
    
    const { login } = useAuth();
    
    await act(async () => {
      const result = await login('test@example.com', 'password');
      expect(result.success).toBe(true);
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
    
    renderWithProviders(<TestComponent />);
    
    const { login } = useAuth();
    
    await act(async () => {
      const result = await login('test@example.com', 'wrong-password');
      expect(result.success).toBe(false);
      expect(result.message).toBe(errorMessage);
    });
  });

  test('register function works correctly', async () => {
    const mockUser = { id: '1', email: 'new@example.com' };
    const mockToken = 'new-token';
    const userData = { email: 'new@example.com', password: 'password123' };
    
    axios.post.mockResolvedValue({ 
      data: { token: mockToken, user: mockUser } 
    });
    
    renderWithProviders(<TestComponent />);
    
    const { register } = useAuth();
    
    await act(async () => {
      const result = await register(userData);
      expect(result.success).toBe(true);
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
    
    renderWithProviders(<TestComponent />);
    
    const { logout } = useAuth();
    
    await act(async () => {
      logout();
    });
    
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    expect(screen.getByTestId('token')).toHaveTextContent('no-token');
  });

  test('updateProfile function works correctly', async () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    const updatedUser = { ...mockUser, name: 'John Doe' };
    
    axios.put.mockResolvedValue({ data: { user: updatedUser } });
    
    renderWithProviders(<TestComponent />);
    
    const { updateProfile } = useAuth();
    
    await act(async () => {
      const result = await updateProfile({ name: 'John Doe' });
      expect(result.success).toBe(true);
    });
    
    expect(axios.put).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/profile'),
      { name: 'John Doe' }
    );
  });

  test('changePassword function works correctly', async () => {
    axios.put.mockResolvedValue({ data: { message: 'Password changed' } });
    
    renderWithProviders(<TestComponent />);
    
    const { changePassword } = useAuth();
    
    await act(async () => {
      const result = await changePassword('oldpass', 'newpass');
      expect(result.success).toBe(true);
    });
    
    expect(axios.put).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/change-password'),
      { currentPassword: 'oldpass', newPassword: 'newpass' }
    );
  });

  test('refreshToken function works correctly', async () => {
    const mockToken = 'mock-token';
    const newToken = 'new-token';
    
    localStorageMock.getItem.mockReturnValue(mockToken);
    axios.post.mockResolvedValue({ data: { token: newToken } });
    
    renderWithProviders(<TestComponent />);
    
    const { refreshToken } = useAuth();
    
    await act(async () => {
      const result = await refreshToken();
      expect(result.success).toBe(true);
    });
    
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/refresh-token')
    );
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', newToken);
  });
});
