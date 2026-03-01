import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStore } from './useStore';
import * as storage from '../services/storageService';
import { Booking } from '../types';

// Mock the storage service entirely
vi.mock('../services/storageService', () => ({
    subscribeToBookings: vi.fn(() => vi.fn()),
    subscribeToExpenses: vi.fn(() => vi.fn()),
    subscribeToSenderoRecords: vi.fn(() => vi.fn()),
    subscribeToBarTransactions: vi.fn(() => vi.fn()),
    subscribeToBarInventoryItems: vi.fn(() => vi.fn()),
    saveBooking: vi.fn(),
    updateBooking: vi.fn(),
    deleteBooking: vi.fn()
}));

describe('useStore global state', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('initializes subscriptions correctly and saves unsubscription callbacks', () => {
        const unsubscribe = useStore.getState().initializeSubscriptions();

        expect(storage.subscribeToBookings).toHaveBeenCalled();
        expect(storage.subscribeToExpenses).toHaveBeenCalled();
        expect(storage.subscribeToSenderoRecords).toHaveBeenCalled();
        expect(storage.subscribeToBarTransactions).toHaveBeenCalled();
        expect(storage.subscribeToBarInventoryItems).toHaveBeenCalled();

        // Check if returns a function to unsubscribe
        expect(typeof unsubscribe).toBe('function');
    });

    it('calls storageService correctly when adding a booking', () => {
        const mockBooking: Booking = {
            id: '123',
            roomId: 'room1',
            checkIn: '2025-01-01',
            checkOut: '2025-01-02',
            guestName: 'Jane Doe',
            guestCount: 2,
            quantity: 1,
            guestDoc: '111',
            deposit: 0,
            remaining: 50,
            total: 50,
            notes: '',
            createdAt: Date.now()
        };

        useStore.getState().addBooking(mockBooking);
        expect(storage.saveBooking).toHaveBeenCalledWith(mockBooking);
    });

    it('calls storageService correctly when deleting a booking', () => {
        useStore.getState().deleteBooking('123');
        expect(storage.deleteBooking).toHaveBeenCalledWith('123');
    });
});
