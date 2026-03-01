// services/storageService.ts
import { Booking, Expense, SenderoRecord, BarTransaction, BarInventoryItem } from "../types";
import { db } from "../firebase";
import {
  collection,
  setDoc,
  deleteDoc,
  doc,
  onSnapshot
} from "firebase/firestore";

const BOOKINGS_COLLECTION = "bookings";
const EXPENSES_COLLECTION = "expenses";
const SENDERO_COLLECTION = "sendero";
const BAR_TRANSACTIONS_COLLECTION = "bar_transactions";
const BAR_INVENTORY_COLLECTION = "bar_inventory";

const sanitizeForFirestore = <T extends Record<string, any>>(obj: T): T => {
  const docData = { ...obj };
  Object.keys(docData).forEach(key => {
    if (docData[key] === undefined) {
      delete docData[key];
    }
  });
  return docData;
};

// ----------------- SUBSCRIPTIONS -----------------

export const subscribeToBookings = (callback: (data: Booking[]) => void) => {
  return onSnapshot(collection(db, BOOKINGS_COLLECTION), (snapshot) => {
    const data = snapshot.docs.map(doc => doc.data() as Booking);
    callback(data);
  }, (error) => console.error("Error subscribing to bookings", error));
};

export const subscribeToExpenses = (callback: (data: Expense[]) => void) => {
  return onSnapshot(collection(db, EXPENSES_COLLECTION), (snapshot) => {
    const data = snapshot.docs.map(doc => doc.data() as Expense);
    callback(data);
  }, (error) => console.error("Error subscribing to expenses", error));
};

export const subscribeToSenderoRecords = (callback: (data: SenderoRecord[]) => void) => {
  return onSnapshot(collection(db, SENDERO_COLLECTION), (snapshot) => {
    const data = snapshot.docs.map(doc => doc.data() as SenderoRecord);
    callback(data);
  }, (error) => console.error("Error subscribing to sendero records", error));
};

export const subscribeToBarTransactions = (callback: (data: BarTransaction[]) => void) => {
  return onSnapshot(collection(db, BAR_TRANSACTIONS_COLLECTION), (snapshot) => {
    const data = snapshot.docs.map(doc => doc.data() as BarTransaction);
    callback(data);
  }, (error) => console.error("Error subscribing to bar transactions", error));
};

export const subscribeToBarInventoryItems = (callback: (data: BarInventoryItem[]) => void) => {
  return onSnapshot(collection(db, BAR_INVENTORY_COLLECTION), (snapshot) => {
    const data = snapshot.docs.map(doc => doc.data() as BarInventoryItem);
    callback(data);
  }, (error) => console.error("Error subscribing to bar inventory", error));
};

// ----------------- MUTATIONS -----------------

export const saveBooking = (booking: Booking): Promise<void> => {
  return setDoc(doc(db, BOOKINGS_COLLECTION, booking.id), sanitizeForFirestore(booking));
};
export const updateBooking = (booking: Booking): Promise<void> => {
  return setDoc(doc(db, BOOKINGS_COLLECTION, booking.id), sanitizeForFirestore(booking));
};
export const deleteBooking = (id: string): Promise<void> => {
  return deleteDoc(doc(db, BOOKINGS_COLLECTION, id));
};

export const saveExpense = (expense: Expense): Promise<void> => {
  return setDoc(doc(db, EXPENSES_COLLECTION, expense.id), sanitizeForFirestore(expense));
};
export const deleteExpense = (id: string): Promise<void> => {
  return deleteDoc(doc(db, EXPENSES_COLLECTION, id));
};

export const saveSenderoRecord = (record: SenderoRecord): Promise<void> => {
  return setDoc(doc(db, SENDERO_COLLECTION, record.id), sanitizeForFirestore(record));
};
export const deleteSenderoRecord = (id: string): Promise<void> => {
  return deleteDoc(doc(db, SENDERO_COLLECTION, id));
};

export const saveBarTransaction = (transaction: BarTransaction): Promise<void> => {
  return setDoc(doc(db, BAR_TRANSACTIONS_COLLECTION, transaction.id), sanitizeForFirestore(transaction));
};
export const updateBarTransaction = (transaction: BarTransaction): Promise<void> => {
  return setDoc(doc(db, BAR_TRANSACTIONS_COLLECTION, transaction.id), sanitizeForFirestore(transaction));
};
export const deleteBarTransaction = (id: string): Promise<void> => {
  return deleteDoc(doc(db, BAR_TRANSACTIONS_COLLECTION, id));
};

export const saveBarInventoryItem = (item: BarInventoryItem): Promise<void> => {
  return setDoc(doc(db, BAR_INVENTORY_COLLECTION, item.id), sanitizeForFirestore(item));
};
export const updateBarInventoryItem = (item: BarInventoryItem): Promise<void> => {
  return setDoc(doc(db, BAR_INVENTORY_COLLECTION, item.id), sanitizeForFirestore(item));
};
export const deleteBarInventoryItem = (id: string): Promise<void> => {
  return deleteDoc(doc(db, BAR_INVENTORY_COLLECTION, id));
};
