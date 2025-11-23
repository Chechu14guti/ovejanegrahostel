import { render, screen } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import { vi, describe, it, expect } from 'vitest';

// Mock dependencies
vi.mock('../services/storageService', () => ({
    getBookings: vi.fn(() => []),
    getExpenses: vi.fn(() => []),
    syncFromFirestore: vi.fn(),
    saveBooking: vi.fn(),
    updateBooking: vi.fn(),
    deleteBooking: vi.fn(),
    saveExpense: vi.fn(),
    deleteExpense: vi.fn(),
}));

// Mock constants
vi.mock('../constants', () => ({
    ROOMS: [
        { id: '1', name: 'Room 1', type: 'bed' }
    ]
}));

describe('Dashboard Component', () => {
    it('renders calendar days with the animation class', () => {
        render(<Dashboard onLogout={() => { }} />);

        // Find all buttons that represent calendar days
        // We can identify them because they contain the day number
        const dayButtons = screen.getAllByRole('button').filter(button =>
            button.className.includes('calendar-day')
        );

        expect(dayButtons.length).toBeGreaterThan(0);

        // Check if the class is present
        dayButtons.forEach(button => {
            expect(button).toHaveClass('calendar-day');
        });
    });
});
