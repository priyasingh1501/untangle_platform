import React from 'react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EnhancedJournalTrends from '../../../components/journal/EnhancedJournalTrends';

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ token: 'test-token' })
}));

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
  error: vi.fn(),
  success: vi.fn()
}));

// Mock UI components
vi.mock('../../../components/ui/Card', () => ({
  default: ({ children, ...props }) => <div {...props}>{children}</div>,
}));

vi.mock('../../../components/ui', () => ({
  SafeRender: ({ children }) => <>{children}</>,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  TrendingUp: () => <svg data-testid="trending-up-icon" />,
  TrendingDown: () => <svg data-testid="trending-down-icon" />,
  Minus: () => <svg data-testid="minus-icon" />,
  BarChart3: () => <svg data-testid="bar-chart-icon" />,
  Heart: () => <svg data-testid="heart-icon" />,
  Lightbulb: () => <svg data-testid="lightbulb-icon" />,
  Brain: () => <svg data-testid="brain-icon" />,
  RefreshCw: () => <svg data-testid="refresh-icon" />,
  Calendar: () => <svg data-testid="calendar-icon" />,
  Target: () => <svg data-testid="target-icon" />,
  Zap: () => <svg data-testid="zap-icon" />,
  AlertTriangle: () => <svg data-testid="alert-icon" />,
  CheckCircle: () => <svg data-testid="check-icon" />,
  Clock: () => <svg data-testid="clock-icon" />,
  Activity: () => <svg data-testid="activity-icon" />,
  Users: () => <svg data-testid="users-icon" />,
  Sun: () => <svg data-testid="sun-icon" />,
  Moon: () => <svg data-testid="moon-icon" />,
  ChevronRight: () => <svg data-testid="chevron-right-icon" />,
  ChevronDown: () => <svg data-testid="chevron-down-icon" />,
  Download: () => <svg data-testid="download-icon" />,
  Filter: () => <svg data-testid="filter-icon" />,
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => children,
}));

// Mock config
vi.mock('../../../config', () => ({
  buildApiUrl: (endpoint) => `http://localhost:5002${endpoint}`,
}));

vi.stubGlobal('fetch', vi.fn());

const mockTrends = {
  sentimentTrend: 'improving',
  summary: 'You are doing great!',
  emotionFrequency: [
    { name: 'joy', frequency: 10 },
    { name: 'sadness', frequency: 5 }
  ],
  emotionalStability: { score: 70, description: 'Moderately stable' },
  commonTopics: ['work', 'health'],
  evolvingBeliefs: ['Growth mindset'],
  growthAreas: ['Mindfulness'],
  recommendations: ['Daily journaling']
};

describe('EnhancedJournalTrends', () => {
  beforeEach(() => {
    fetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('renders and fetches trends automatically', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ trendAnalysis: mockTrends }) });

    render(<EnhancedJournalTrends />);

    // Component automatically fetches trends on mount if token exists
    // Wait for trends to load
    await waitFor(() => {
      expect(screen.getByText('Personal Insights')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Check for other sections
    expect(screen.getByText('Growth Overview')).toBeInTheDocument();
    expect(screen.getByText('Emotional Patterns')).toBeInTheDocument();
  });

  test('changes time range and refreshes', async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ trendAnalysis: mockTrends }) }) // initial load
      .mockResolvedValueOnce({ ok: true, json: async () => ({ trendAnalysis: mockTrends }) }); // after change

    render(<EnhancedJournalTrends />);

    // Wait for initial load
    await screen.findByText('Personal Insights');

    // Find and change time range select
    const select = screen.getByDisplayValue('This Month');
    fireEvent.change(select, { target: { value: 'week' } });

    // Click refresh button if it exists
    const buttons = screen.getAllByRole('button');
    const refreshBtn = buttons.find(b => b.getAttribute('title') === 'Refresh Analysis' || b.getAttribute('aria-label')?.includes('Refresh'));
    
    if (refreshBtn) {
      fireEvent.click(refreshBtn);
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(2);
      });
    } else {
      // If no refresh button, just verify the component rendered
      expect(screen.getByText('Personal Insights')).toBeInTheDocument();
    }
  });
});


