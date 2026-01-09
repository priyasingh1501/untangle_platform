import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { vi } from 'vitest';
import Food from '../Food';
import { AuthProvider } from '../../contexts/AuthContext';
import axios from 'axios';

// Mock axios
vi.mock('axios');

// Mock AuthContext to provide a user
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe'
    },
    token: 'mock-token'
  }),
  AuthProvider: ({ children }) => children
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => children,
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  success: vi.fn(),
  error: vi.fn(),
}));

// Mock meal components that Food page uses
vi.mock('../../components/meal/MealBuilder', () => ({
  default: () => <div data-testid="meal-builder">Meal Builder</div>,
}));

vi.mock('../../components/meal/DailyMealKPIs', () => ({
  default: () => <div data-testid="daily-meal-kpis">Daily Meal KPIs</div>,
}));

// Mock UI components
vi.mock('../../components/ui', () => ({
  Section: ({ children }) => <section>{children}</section>,
  Banner: ({ children, variant }) => <div data-variant={variant}>{children}</div>,
  Card: ({ children, className }) => <div className={className}>{children}</div>,
  Header: ({ children, level, className }) => {
    const Tag = `h${level || 1}`;
    return <Tag className={className}>{children}</Tag>;
  },
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (component) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {component}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Food Page', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe'
  };

  const mockFoodItems = [
    {
      id: '1',
      name: 'Apple',
      brand: 'Generic',
      barcode: '123456789',
      nutrition: {
        calories: 52,
        protein: 0.3,
        carbs: 13.8,
        fat: 0.2
      }
    },
    {
      id: '2',
      name: 'Banana',
      brand: 'Generic',
      barcode: '987654321',
      nutrition: {
        calories: 89,
        protein: 1.1,
        carbs: 22.8,
        fat: 0.3
      }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock localStorage
    global.localStorage.setItem('token', 'mock-token');
    
    // Mock axios responses
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/food/items')) {
        return Promise.resolve({ data: { items: mockFoodItems } });
      }
      return Promise.resolve({ data: {} });
    });
  });

  test('renders food page with all main sections', async () => {
    renderWithProviders(<Food />);
    
    // Check for page title
    expect(screen.getByText('Food & Nutrition')).toBeInTheDocument();
    
    // Check for meal builder
    expect(screen.getByTestId('meal-builder')).toBeInTheDocument();
    
    // Check for daily meal KPIs
    expect(screen.getByTestId('daily-meal-kpis')).toBeInTheDocument();
  });

  test('displays meal builder component', async () => {
    renderWithProviders(<Food />);
    
    await waitFor(() => {
      expect(screen.getByTestId('meal-builder')).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    // Mock API error
    axios.get.mockRejectedValue(new Error('API Error'));
    
    renderWithProviders(<Food />);
    
    // Should still render the page
    expect(screen.getByText('Food & Nutrition')).toBeInTheDocument();
  });

  test('has proper accessibility attributes', () => {
    renderWithProviders(<Food />);
    
    // Check for proper heading structure
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});



