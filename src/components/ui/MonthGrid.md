# MonthGrid Component

A calendar grid component that displays a month view with mindfulness scores for each day, styled like a GitHub contribution graph with small rounded squares and color intensity gradients.

## Features

- **GitHub-Style Grid**: Small, rounded squares arranged in a 7-column grid (days of week)
- **Mindfulness Score Visualization**: Each square shows color intensity based on the mindfulness score
- **Color-Coded System**: Uses GitHub-style green gradient from light gray to dark green
- **Compact Layout**: Weekday labels on the left, month label above the grid
- **Navigation**: Built-in previous/next month navigation
- **Date Selection**: Click on any square to select that date and switch to day view
- **Responsive Design**: Works on both desktop and mobile devices

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `selectedDate` | Date | Yes | The date to display the month for |
| `habits` | Array | No | Array of habit objects (not used in current implementation) |
| `goals` | Array | No | Array of goal objects (not used in current implementation) |
| `mindfulnessCheckins` | Array | Yes | Array of mindfulness check-in objects with dimensions and ratings |
| `onDateSelect` | Function | No | Callback when a date is clicked |
| `onMonthChange` | Function | No | Callback when month navigation is used |

## Usage

```jsx
import { MonthGrid } from '../components/ui';

<MonthGrid
  selectedDate={new Date()}
  habits={userHabits}
  goals={userGoals}
  mindfulnessCheckins={userMindfulnessCheckins}
  onDateSelect={(date) => console.log('Selected date:', date)}
  onMonthChange={(date) => setSelectedDate(date)}
/>
```

## Mindfulness Score Colors

The calendar uses a GitHub-style green gradient system:

| Score Range | Color | Hex Code | Description |
|-------------|-------|----------|-------------|
| 0 | Light Gray | `#ebedf0` | No mindfulness activity |
| 1-5 | Light Green | `#9be9a8` | Very low mindfulness |
| 6-10 | Medium Green | `#40c463` | Low mindfulness |
| 11-15 | Dark Green | `#30a14e` | Moderate mindfulness |
| 16-20 | Darker Green | `#216e39` | Good mindfulness |
| 21-25 | Darkest Green | `#0d1117` | Excellent mindfulness |

## Visual Features

- **Small Rounded Squares**: Each day is a 12x12px rounded square (w-3 h-3)
- **Color Intensity**: Color intensity increases with mindfulness score
- **Weekday Labels**: Only Mon, Wed, Fri are shown to save space
- **Month Label**: Short month name displayed above the grid
- **Today Highlighting**: Current day is highlighted with a blue ring
- **Hover Effects**: Squares scale up and show blue ring on hover
- **Tooltips**: Hover shows date and mindfulness score

## Layout Structure

```
[Month Name]                    [Navigation Arrows]
[Mon] [Wed] [Fri]              [Grid of Squares]
[  ]  [  ]  [  ]  ← Weekday labels
[  ]  [  ]  [  ]  ← Each row = one week
[  ]  [  ]  [  ]  ← Each column = one day of week
[  ]  [  ]  [  ]

[Less] [Color Gradient] [More] ← Legend
```

## Styling

The component uses Tailwind CSS classes for styling:

- **Grid**: `grid grid-cols-7 gap-1` for 7-column layout
- **Squares**: `w-3 h-3 rounded-sm` for small rounded squares
- **Hover**: `hover:scale-125 hover:ring-2 hover:ring-blue-400`
- **Today**: `ring-2 ring-blue-500 ring-offset-1` for current day
- **Transitions**: `transition-all duration-200` for smooth animations

## Integration with GoalAlignedDay

The MonthGrid is integrated into the GoalAlignedDay page's month view. When a user:

1. Clicks on the "Month" time period tab
2. Sees a GitHub-style contribution graph for the current month
3. Can navigate between months using arrow buttons
4. Can click on any square to switch to day view for that date
5. Sees visual representation of mindfulness progress with color intensity

## Data Structure

Expected data structure for mindfulness check-ins:

```javascript
{
  _id: 'checkin_id',
  date: '2024-01-15T00:00:00.000Z',
  dimensions: {
    presence: { rating: 5 },
    emotionAwareness: { rating: 4 },
    intentionality: { rating: 5 },
    attentionQuality: { rating: 3 },
    compassion: { rating: 4 }
  }
  // Total score: 21 (sum of all dimension ratings)
}
```

## Navigation

The component includes built-in month navigation:

- **Previous Month** (←): Goes to the previous month
- **Next Month** (→): Goes to the next month

Navigation automatically handles year transitions (e.g., January → December of previous year).

## Score Calculation

The mindfulness score for each day is calculated by summing the ratings from all five dimensions:
- Presence (1-5 rating)
- Emotion Awareness (1-5 rating)  
- Intentionality (1-5 rating)
- Attention Quality (1-5 rating)
- Compassion (1-5 rating)

**Maximum possible score: 25** (5 × 5 dimensions)

## GitHub Contribution Graph Similarity

This component is designed to look and feel like GitHub's contribution graph:
- **Small squares**: Similar size and spacing
- **Color gradients**: Green intensity based on activity level
- **Compact layout**: Efficient use of space
- **Hover interactions**: Tooltips and visual feedback
- **Legend**: "Less" to "More" color scale
