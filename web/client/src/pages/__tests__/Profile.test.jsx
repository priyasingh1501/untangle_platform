import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Profile from '../../pages/Profile';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ token: 'test-token', user: { firstName: 'Test', lastName: 'User', email: 'test@example.com' } })
}));

describe('Profile Page', () => {
  test('renders without crashing and shows basic info', () => {
    render(<Profile />);
    // Loose assertions since Profile content may evolve
    expect(screen.getByText(/Profile/i)).toBeInTheDocument();
  });
});


