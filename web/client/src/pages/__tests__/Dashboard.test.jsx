import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { vi } from 'vitest';
import Dashboard from '../Dashboard';
import { AuthProvider } from '../../contexts/AuthContext';
import axios from 'axios';

// Mock axios
vi.mock('axios');

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => children,
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  success: vi.fn(),
  error: vi.fn(),
}));

// Mock dashboard components
vi.mock('../../components/dashboard', () => ({
  FinancialOverview: () => <div data-testid="financial-overview">Financial Overview</div>,
  QuickActions: () => <div data-testid="quick-actions">Quick Actions</div>,
  MindfulnessScore: () => <div data-testid="mindfulness-score">Mindfulness Score</div>,
  RecentActivity: () => <div data-testid="recent-activity">Recent Activity</div>,
  UpcomingReminders: () => <div data-testid="upcoming-reminders">Upcoming Reminders</div>,
}));

// Mock meal components
vi.mock('../../components/meal/DailyMealKPIs', () => ({
  default: () => <div data-testid="daily-meal-kpis">Daily Meal KPIs</div>,
}));

// Mock journal components
vi.mock('../../components/journal/JournalTrends', () => ({
  default: () => <div data-testid="journal-trends">Journal Trends</div>,
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

describe('Dashboard Component', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe'
  };

  const mockTasks = [
    {
      id: '1',
      title: 'Test Task 1',
      completedAt: new Date().toISOString(),
      goalIds: ['goal1'],
      mindfulRating: 4
    },
    {
      id: '2',
      title: 'Test Task 2',
      completedAt: new Date().toISOString(),
      goalIds: [],
      mindfulRating: 3
    }
  ];

  const mockQuotes = [
    {
      content: 'Test quote 1',
      bookAuthor: 'Test Author',
      bookTitle: 'Test Book'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock localStorage
    global.localStorage.setItem('token', 'mock-token');
    
    // Mock axios responses
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/tasks')) {
        return Promise.resolve({ data: { tasks: mockTasks } });
      }
      if (url.includes('/api/book-documents/quotes/all')) {
        return Promise.resolve({ data: mockQuotes });
      }
      return Promise.resolve({ data: {} });
    });
  });

  test('renders dashboard with all main sections', async () => {
    renderWithProviders(<Dashboard />);
    
    // Check for welcome message
    expect(screen.getByText(/Welcome back, John!/)).toBeInTheDocument();
    
    // Check for mission briefing section
    expect(screen.getByText('MISSION BRIEFING')).toBeInTheDocument();
    
    // Check for mission status section
    expect(screen.getByText('MISSION STATUS')).toBeInTheDocument();
    
    // Wait for components to load
    await waitFor(() => {
      expect(screen.getByTestId('financial-overview')).toBeInTheDocument();
      expect(screen.getByTestId('quick-actions')).toBeInTheDocument();
      expect(screen.getByTestId('mindfulness-score')).toBeInTheDocument();
      expect(screen.getByTestId('recent-activity')).toBeInTheDocument();
      expect(screen.getByTestId('upcoming-reminders')).toBeInTheDocument();
      expect(screen.getByTestId('daily-meal-kpis')).toBeInTheDocument();
      expect(screen.getByTestId('journal-trends')).toBeInTheDocument();
    });
  });

  test('displays quote of the day', async () => {
    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Test quote 1')).toBeInTheDocument();
      expect(screen.getByText('— Test Author')).toBeInTheDocument();
    });
  });

  test('shows task statistics correctly', async () => {
    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      // Check for task statistics
      expect(screen.getByText('GOAL + MINDFUL')).toBeInTheDocument();
      expect(screen.getByText('GOAL-ALIGNED')).toBeInTheDocument();
      expect(screen.getByText('MINDFUL')).toBeInTheDocument();
      expect(screen.getByText('NOT MINDFUL, NOT GOAL-ORIENTED')).toBeInTheDocument();
    });
  });

  test('handles image upload modal', async () => {
    renderWithProviders(<Dashboard />);
    
    // Find and click the welcome image
    const welcomeImage = screen.getByAltText('Welcome illustration');
    fireEvent.click(welcomeImage);
    
    // Check if modal opens
    await waitFor(() => {
      expect(screen.getByText('Update Welcome Image')).toBeInTheDocument();
    });
    
    // Check for upload button
    expect(screen.getByText('Choose Image')).toBeInTheDocument();
    
    // Check for cancel button
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  test('handles quote refresh', async () => {
    renderWithProviders(<Dashboard />);
    
    // Wait for quotes to load
    await waitFor(() => {
      expect(screen.getByText('Test quote 1')).toBeInTheDocument();
    });
    
    // Find and click refresh button
    const refreshButtons = screen.getAllByRole('button');
    const refreshButton = refreshButtons.find(button => 
      button.getAttribute('title') === 'Get a new quote'
    );
    
    if (refreshButton) {
      fireEvent.click(refreshButton);
    }
  });

  test('displays 24-hour activity strip', async () => {
    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      // Check for legend items
      expect(screen.getByText('Goal + Mindful')).toBeInTheDocument();
      expect(screen.getByText('Goal-aligned')).toBeInTheDocument();
      expect(screen.getByText('Mindful')).toBeInTheDocument();
      expect(screen.getByText('Not Mindful, Not Goal-Oriented')).toBeInTheDocument();
      expect(screen.getByText('No activity')).toBeInTheDocument();
    });
  });

  test('handles loading states', () => {
    // Mock loading state
    axios.get.mockImplementation(() => new Promise(() => {}));
    
    renderWithProviders(<Dashboard />);
    
    // Should show loading spinner
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });

  test('handles empty task state', async () => {
    // Mock empty tasks
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/tasks')) {
        return Promise.resolve({ data: { tasks: [] } });
      }
      return Promise.resolve({ data: {} });
    });
    
    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('No Tasks Today')).toBeInTheDocument();
      expect(screen.getByText('Complete some tasks to see your day breakdown')).toBeInTheDocument();
      expect(screen.getByText('ADD YOUR FIRST TASK')).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    // Mock API error
    axios.get.mockRejectedValue(new Error('API Error'));
    
    renderWithProviders(<Dashboard />);
    
    // Should still render the dashboard
    expect(screen.getByText(/Welcome back, John!/)).toBeInTheDocument();
  });

  test('displays correct user information', () => {
    renderWithProviders(<Dashboard />);
    
    expect(screen.getByText(/Welcome back, John!/)).toBeInTheDocument();
    expect(screen.getByText("Here's your day at a glance")).toBeInTheDocument();
  });

  test('has proper accessibility attributes', async () => {
    renderWithProviders(<Dashboard />);
    
    // Check for proper heading structure
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    
    // Check for proper button labels
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
    });
  });
});
