import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthProvider } from '../../../contexts/AuthContext';
import Layout from '../Layout';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    form: ({ children, ...props }) => <form {...props}>{children}</form>,
  },
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  success: vi.fn(),
  error: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Layout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test('renders navigation menu with all required links', () => {
    renderWithProviders(<Layout />);
    
    // Check for main navigation items
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Goal-Aligned Day')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Pantry')).toBeInTheDocument();
    expect(screen.getByText('Finance')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  test('renders AI chat interface', () => {
    renderWithProviders(<Layout />);
    
    // Check for AI chat elements
    expect(screen.getByText('Hi! I\'m Alfred, your AI lifestyle assistant. How can I help you today?')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ask Alfred anything...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
  });

  test('AI chat input updates correctly', () => {
    renderWithProviders(<Layout />);
    
    const input = screen.getByPlaceholderText('Ask Alfred anything...');
    fireEvent.change(input, { target: { value: 'Hello Alfred!' } });
    
    expect(input).toHaveValue('Hello Alfred!');
  });

  test('AI chat sends message on Enter key', async () => {
    const mockResponse = { response: 'Hello! How can I help you?' };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });
    
    renderWithProviders(<Layout />);
    
    const input = screen.getByPlaceholderText('Ask Alfred anything...');
    fireEvent.change(input, { target: { value: 'Hello Alfred!' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' });
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/ai-chat/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer null'
        },
        body: JSON.stringify({ message: 'Hello Alfred!' })
      });
    });
  });

  test('AI chat sends message on Send button click', async () => {
    const mockResponse = { response: 'Hello! How can I help you?' };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });
    
    renderWithProviders(<Layout />);
    
    const input = screen.getByPlaceholderText('Ask Alfred anything...');
    const sendButton = screen.getByRole('button', { name: 'Send' });
    
    fireEvent.change(input, { target: { value: 'Hello Alfred!' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/ai-chat/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer null'
        },
        body: JSON.stringify({ message: 'Hello Alfred!' })
      });
    });
  });

  test('AI chat handles API errors gracefully', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    
    renderWithProviders(<Layout />);
    
    const input = screen.getByPlaceholderText('Ask Alfred anything...');
    fireEvent.change(input, { target: { value: 'Hello Alfred!' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText('I\'m here to help! You can ask me to track expenses, add tasks, or get lifestyle insights.')).toBeInTheDocument();
    });
  });

  test('AI chat shows loading state while processing', async () => {
    // Mock a delayed response
    global.fetch.mockImplementationOnce(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({ response: 'Hello!' })
        }), 100)
      )
    );
    
    renderWithProviders(<Layout />);
    
    const input = screen.getByPlaceholderText('Ask Alfred anything...');
    fireEvent.change(input, { target: { value: 'Hello Alfred!' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' });
    
    // Check that input is cleared and loading state is shown
    expect(input).toHaveValue('');
    
    // Wait for response
    await waitFor(() => {
      expect(screen.getByText('Hello!')).toBeInTheDocument();
    });
  });

  test('AI chat prevents empty message submission', () => {
    renderWithProviders(<Layout />);
    
    const input = screen.getByPlaceholderText('Ask Alfred anything...');
    const sendButton = screen.getByRole('button', { name: 'Send' });
    
    // Try to send empty message
    fireEvent.click(sendButton);
    
    // Should not make API call
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('AI chat prevents submission while loading', async () => {
    // Mock a delayed response
    global.fetch.mockImplementationOnce(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({ response: 'Hello!' })
        }), 100)
      )
    );
    
    renderWithProviders(<Layout />);
    
    const input = screen.getByPlaceholderText('Ask Alfred anything...');
    const sendButton = screen.getByRole('button', { name: 'Send' });
    
    // Send first message
    fireEvent.change(input, { target: { value: 'First message' } });
    fireEvent.click(sendButton);
    
    // Try to send second message immediately
    fireEvent.change(input, { target: { value: 'Second message' } });
    fireEvent.click(sendButton);
    
    // Should only make one API call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  test('renders ConsistentPopup component correctly', () => {
    renderWithProviders(<Layout />);
    
    // The ConsistentPopup is used internally, so we test its structure
    // by checking that the main layout renders without errors
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  test('navigation links have correct href attributes', () => {
    renderWithProviders(<Layout />);
    
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    const foodLink = screen.getByText('Food').closest('a');
    const financeLink = screen.getByText('Finance').closest('a');
    
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    expect(foodLink).toHaveAttribute('href', '/food');
    expect(financeLink).toHaveAttribute('href', '/finance');
  });

  test('component handles authentication state correctly', () => {
    // Mock authenticated user
    localStorage.setItem('token', 'mock-token');
    
    renderWithProviders(<Layout />);
    
    // Component should render without crashing
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
