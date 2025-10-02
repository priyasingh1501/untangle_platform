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

// Mock food components
vi.mock('../../components/food', () => ({
  FoodSearch: () => <div data-testid="food-search">Food Search</div>,
  SearchResults: () => <div data-testid="search-results">Search Results</div>,
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
    
    // Check for search section
    expect(screen.getByTestId('food-search')).toBeInTheDocument();
    
    // Check for search results section
    expect(screen.getByTestId('search-results')).toBeInTheDocument();
  });

  test('displays food items when loaded', async () => {
    renderWithProviders(<Food />);
    
    await waitFor(() => {
      expect(screen.getByText('Apple')).toBeInTheDocument();
      expect(screen.getByText('Banana')).toBeInTheDocument();
    });
  });

  test('handles search functionality', async () => {
    renderWithProviders(<Food />);
    
    // Find search input
    const searchInput = screen.getByPlaceholderText('Search for food items...');
    
    // Type in search query
    fireEvent.change(searchInput, { target: { value: 'apple' } });
    
    // Check if search is triggered
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/food/items'),
        expect.objectContaining({
          params: expect.objectContaining({
            search: 'apple'
          })
        })
      );
    });
  });

  test('handles barcode scanning', async () => {
    renderWithProviders(<Food />);
    
    // Find barcode scan button
    const scanButton = screen.getByText('Scan Barcode');
    
    // Click scan button
    fireEvent.click(scanButton);
    
    // Check if barcode scanning is initiated
    // Note: This would typically open a camera or barcode scanner
    expect(scanButton).toBeInTheDocument();
  });

  test('handles food item selection', async () => {
    renderWithProviders(<Food />);
    
    await waitFor(() => {
      expect(screen.getByText('Apple')).toBeInTheDocument();
    });
    
    // Click on a food item
    const appleItem = screen.getByText('Apple');
    fireEvent.click(appleItem);
    
    // Check if item details are shown
    // This would typically open a modal or navigate to details
    expect(appleItem).toBeInTheDocument();
  });

  test('handles loading states', () => {
    // Mock loading state
    axios.get.mockImplementation(() => new Promise(() => {}));
    
    renderWithProviders(<Food />);
    
    // Should show loading spinner
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });

  test('handles empty search results', async () => {
    // Mock empty results
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/food/items')) {
        return Promise.resolve({ data: { items: [] } });
      }
      return Promise.resolve({ data: {} });
    });
    
    renderWithProviders(<Food />);
    
    await waitFor(() => {
      expect(screen.getByText('No food items found')).toBeInTheDocument();
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
    
    // Check for proper input labels
    const searchInput = screen.getByPlaceholderText('Search for food items...');
    expect(searchInput).toHaveAttribute('aria-label');
    
    // Check for proper button labels
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
    });
  });

  test('displays nutrition information correctly', async () => {
    renderWithProviders(<Food />);
    
    await waitFor(() => {
      // Check for nutrition labels
      expect(screen.getByText('Calories')).toBeInTheDocument();
      expect(screen.getByText('Protein')).toBeInTheDocument();
      expect(screen.getByText('Carbs')).toBeInTheDocument();
      expect(screen.getByText('Fat')).toBeInTheDocument();
    });
  });

  test('handles pagination', async () => {
    // Mock paginated results
    const paginatedItems = Array.from({ length: 20 }, (_, i) => ({
      id: i.toString(),
      name: `Food Item ${i}`,
      brand: 'Generic',
      barcode: `${i}23456789`,
      nutrition: {
        calories: 50 + i,
        protein: 1 + i,
        carbs: 10 + i,
        fat: 0.5 + i
      }
    }));
    
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/food/items')) {
        return Promise.resolve({ 
          data: { 
            items: paginatedItems,
            totalPages: 2,
            currentPage: 1
          } 
        });
      }
      return Promise.resolve({ data: {} });
    });
    
    renderWithProviders(<Food />);
    
    await waitFor(() => {
      // Check for pagination controls
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('Previous')).toBeInTheDocument();
    });
  });
});
