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

  test('renders load button initially and fetches trends', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ trendAnalysis: mockTrends }) });

    render(<EnhancedJournalTrends />);

    // Initial state shows Load Trends button
    expect(screen.getByText('Load Trends')).toBeInTheDocument();

    // Click to fetch
    fireEvent.click(screen.getByText('Load Trends'));

    await waitFor(() => {
      expect(screen.getByText('Personal Insights')).toBeInTheDocument();
      expect(screen.getByText('Growth Overview')).toBeInTheDocument();
      expect(screen.getByText('Emotional Patterns')).toBeInTheDocument();
    });
  });

  test('changes time range and refreshes', async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ trendAnalysis: mockTrends }) }) // initial load
      .mockResolvedValueOnce({ ok: true, json: async () => ({ trendAnalysis: mockTrends }) }); // after change

    render(<EnhancedJournalTrends />);

    fireEvent.click(screen.getByText('Load Trends'));

    await screen.findByText('Personal Insights');

    const select = screen.getByDisplayValue('This Month');
    fireEvent.change(select, { target: { value: 'week' } });

    // Click refresh
    const buttons = screen.getAllByRole('button');
    const refreshBtn = buttons.find(b => b.getAttribute('title') === 'Refresh Analysis');
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });
});


