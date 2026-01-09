import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import MealBuilder from '../../../components/meal/MealBuilder';

// Mock the AuthContext
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    token: 'mock-token',
    user: { _id: 'mock-user-id' }
  })
}));

// Mock the config
vi.mock('../../../config', () => ({
  buildApiUrl: (endpoint) => `http://localhost:5002${endpoint}`
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  success: vi.fn(),
  error: vi.fn()
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({ children }) => children
}));

// Mock MealContext
vi.mock('../../../components/meal/MealContext', () => ({
  default: () => <div data-testid="meal-context">Meal Context</div>
}));

// Mock MealItems
vi.mock('../../../components/meal/MealItems', () => ({
  default: () => <div data-testid="meal-items">Meal Items</div>
}));

// Mock FoodSearch
vi.mock('../../../components/meal/FoodSearch', () => ({
  default: () => <div data-testid="food-search">Food Search</div>
}));

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('MealBuilder', () => {
  test('renders food search section', () => {
    renderWithRouter(<MealBuilder />);
    
    expect(screen.getByText('Search & Add Foods')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search foods/)).toBeInTheDocument();
  });

  test('renders meal items section', () => {
    renderWithRouter(<MealBuilder />);
    
    // Use getAllByText since Card title and component both have this text
    const mealItemsElements = screen.getAllByText('Meal Items');
    expect(mealItemsElements.length).toBeGreaterThan(0);
  });

  test('renders meal context section', () => {
    renderWithRouter(<MealBuilder />);
    
    // Use getAllByText since Card title and component both have this text
    const mealContextElements = screen.getAllByText('Meal Context');
    expect(mealContextElements.length).toBeGreaterThan(0);
  });

  test('renders save meal button', () => {
    renderWithRouter(<MealBuilder />);
    
    expect(screen.getByText('Save Meal')).toBeInTheDocument();
  });
});
