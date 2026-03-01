import { create } from 'zustand';
import { Booking, Expense, SenderoRecord, BarTransaction, BarInventoryItem } from '../types';
import * as storage from '../services/storageService';

interface AppState {
    bookings: Booking[];
    expenses: Expense[];
    senderoRecords: SenderoRecord[];
    barTransactions: BarTransaction[];
    barInventoryItems: BarInventoryItem[];

    initializeSubscriptions: () => () => void;

    addBooking: (booking: Booking) => void;
    updateBooking: (booking: Booking) => void;
    deleteBooking: (id: string) => void;

    addExpense: (expense: Expense) => void;
    deleteExpense: (id: string) => void;

    addSenderoRecord: (record: SenderoRecord) => void;
    deleteSenderoRecord: (id: string) => void;

    addBarTransaction: (transaction: BarTransaction) => void;
    updateBarTransaction: (transaction: BarTransaction) => void;
    deleteBarTransaction: (id: string) => void;

    addBarInventoryItem: (item: BarInventoryItem) => void;
    updateBarInventoryItem: (item: BarInventoryItem) => void;
    deleteBarInventoryItem: (id: string) => void;
}

export const useStore = create<AppState>((set) => ({
    bookings: [],
    expenses: [],
    senderoRecords: [],
    barTransactions: [],
    barInventoryItems: [],

    initializeSubscriptions: () => {
        const unsubBookings = storage.subscribeToBookings((data) => set({ bookings: data }));
        const unsubExpenses = storage.subscribeToExpenses((data) => set({ expenses: data }));
        const unsubSendero = storage.subscribeToSenderoRecords((data) => set({ senderoRecords: data }));
        const unsubBarTrans = storage.subscribeToBarTransactions((data) => set({ barTransactions: data }));
        const unsubBarInv = storage.subscribeToBarInventoryItems((data) => set({ barInventoryItems: data }));

        return () => {
            unsubBookings();
            unsubExpenses();
            unsubSendero();
            unsubBarTrans();
            unsubBarInv();
        };
    },

    addBooking: (booking: Booking) => {
        storage.saveBooking(booking);
    },
    updateBooking: (booking: Booking) => {
        storage.updateBooking(booking);
    },
    deleteBooking: (id: string) => {
        storage.deleteBooking(id);
    },

    addExpense: (expense: Expense) => {
        storage.saveExpense(expense);
    },
    deleteExpense: (id: string) => {
        storage.deleteExpense(id);
    },

    addSenderoRecord: (record: SenderoRecord) => {
        storage.saveSenderoRecord(record);
    },
    deleteSenderoRecord: (id: string) => {
        storage.deleteSenderoRecord(id);
    },

    addBarTransaction: (transaction: BarTransaction) => {
        storage.saveBarTransaction(transaction);
    },
    updateBarTransaction: (transaction: BarTransaction) => {
        storage.updateBarTransaction(transaction);
    },
    deleteBarTransaction: (id: string) => {
        storage.deleteBarTransaction(id);
    },

    addBarInventoryItem: (item: BarInventoryItem) => {
        storage.saveBarInventoryItem(item);
    },
    updateBarInventoryItem: (item: BarInventoryItem) => {
        storage.updateBarInventoryItem(item);
    },
    deleteBarInventoryItem: (id: string) => {
        storage.deleteBarInventoryItem(id);
    },
}));
