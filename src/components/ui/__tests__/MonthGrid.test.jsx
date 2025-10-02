import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MonthGrid from '../MonthGrid';

describe('MonthGrid', () => {
  const mockDate = new Date('2024-01-15');
  const mockMindfulnessCheckins = [
    {
      _id: '1',
      date: '2024-01-15T00:00:00.000Z',
      dimensions: {
        presence: { rating: 5 },
        emotionAwareness: { rating: 4 },
        intentionality: { rating: 5 },
        attentionQuality: { rating: 3 },
        compassion: { rating: 4 }
      }
      // Total score: 21
    },
    {
      _id: '2',
      date: '2024-01-20T00:00:00.000Z',
      dimensions: {
        presence: { rating: 3 },
        emotionAwareness: { rating: 2 },
        intentionality: { rating: 4 },
        attentionQuality: { rating: 3 },
        compassion: { rating: 2 }
      }
      // Total score: 14
    }
  ];

  it('renders month and year in header', () => {
    render(
      <MonthGrid
        selectedDate={mockDate}
        habits={[]}
        goals={[]}
        mindfulnessCheckins={mockMindfulnessCheckins}
        onDateSelect={() => {}}
        onMonthChange={() => {}}
      />
    );

    expect(screen.getByText('January 2024')).toBeInTheDocument();
  });

  it('renders weekday headers', () => {
    render(
      <MonthGrid
        selectedDate={mockDate}
        habits={[]}
        goals={[]}
        mindfulnessCheckins={mockMindfulnessCheckins}
        onDateSelect={() => {}}
        onMonthChange={() => {}}
      />
    );

    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('Thu')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
  });

  it('renders calendar days', () => {
    render(
      <MonthGrid
        selectedDate={mockDate}
        habits={[]}
        goals={[]}
        mindfulnessCheckins={mockMindfulnessCheckins}
        onDateSelect={() => {}}
        onMonthChange={() => {}}
      />
    );

    // January 2024 starts on Monday, so first day should be 1
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('31')).toBeInTheDocument(); // January has 31 days
  });

  it('shows mindfulness scores for days with check-ins', () => {
    render(
      <MonthGrid
        selectedDate={mockDate}
        habits={[]}
        goals={[]}
        mindfulnessCheckins={mockMindfulnessCheckins}
        onDateSelect={() => {}}
        onMonthChange={() => {}}
      />
    );

    // January 15th should have a mindfulness score of 21
    const day15 = screen.getByText('15');
    expect(day15).toBeInTheDocument();
    
    // The score should be displayed
    expect(screen.getByText('21')).toBeInTheDocument();
  });

  it('calls onDateSelect when a day is clicked', () => {
    const mockOnDateSelect = jest.fn();
    
    render(
      <MonthGrid
        selectedDate={mockDate}
        habits={[]}
        goals={[]}
        mindfulnessCheckins={mockMindfulnessCheckins}
        onDateSelect={mockOnDateSelect}
        onMonthChange={() => {}}
      />
    );

    const day15 = screen.getByText('15');
    day15.click();

    expect(mockOnDateSelect).toHaveBeenCalledWith(expect.any(Date));
  });

  it('calls onMonthChange when navigation buttons are clicked', () => {
    const mockOnMonthChange = jest.fn();
    
    render(
      <MonthGrid
        selectedDate={mockDate}
        habits={[]}
        goals={[]}
        mindfulnessCheckins={mockMindfulnessCheckins}
        onDateSelect={() => {}}
        onMonthChange={mockOnMonthChange}
      />
    );

    const prevButton = screen.getByTitle('Previous Month');
    const nextButton = screen.getByTitle('Next Month');

    prevButton.click();
    expect(mockOnMonthChange).toHaveBeenCalledWith(expect.any(Date));

    nextButton.click();
    expect(mockOnMonthChange).toHaveBeenCalledWith(expect.any(Date));
  });

  it('renders mindfulness score color legend', () => {
    render(
      <MonthGrid
        selectedDate={mockDate}
        habits={[]}
        goals={[]}
        mindfulnessCheckins={mockMindfulnessCheckins}
        onDateSelect={() => {}}
        onMonthChange={() => {}}
      />
    );

    expect(screen.getByText('Mindfulness Score Colors')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('1-2')).toBeInTheDocument();
    expect(screen.getByText('3-6')).toBeInTheDocument();
    expect(screen.getByText('7-10')).toBeInTheDocument();
    expect(screen.getByText('11-14')).toBeInTheDocument();
    expect(screen.getByText('15-18')).toBeInTheDocument();
    expect(screen.getByText('19-22')).toBeInTheDocument();
    expect(screen.getByText('23-24')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('handles days without mindfulness check-ins', () => {
    render(
      <MonthGrid
        selectedDate={mockDate}
        habits={[]}
        goals={[]}
        mindfulnessCheckins={mockMindfulnessCheckins}
        onDateSelect={() => {}}
        onMonthChange={() => {}}
      />
    );

    // Days without check-ins should still render but without scores
    const day16 = screen.getByText('16');
    expect(day16).toBeInTheDocument();
    
    // Should not show a score for day 16
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});
