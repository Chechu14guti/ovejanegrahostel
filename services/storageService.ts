// services/storageService.ts
import { Booking, Expense, SenderoRecord, BarTransaction, BarInventoryItem } from "../types";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

const BOOKING_KEY = "hostel_bookings_v1";
const EXPENSE_KEY = "hostel_expenses_v1";
const SENDERO_KEY = "hostel_sendero_v1";
const BAR_TRANSACTIONS_KEY = "bar_transactions_v1";
const BAR_INVENTORY_KEY = "bar_inventory_v1";

const BOOKINGS_COLLECTION = "bookings";
const EXPENSES_COLLECTION = "expenses";
const SENDERO_COLLECTION = "sendero";
const BAR_TRANSACTIONS_COLLECTION = "bar_transactions";
const BAR_INVENTORY_COLLECTION = "bar_inventory";

// ----------------- Helpers de localStorage -----------------

const loadLocalArray = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? (JSON.parse(data) as T[]) : [];
  } catch (e) {
    console.error("Error loading from localStorage", key, e);
    return [];
  }
};

const saveLocalArray = <T>(key: string, value: T[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Error saving to localStorage", key, e);
  }
};

// ----------------- SYNC DESDE FIRESTORE -----------------

/**
 * Carga TODAS las reservas y gastos desde Firestore
 * y los guarda en localStorage. Se llama una vez al arrancar.
 */
export const syncFromFirestore = async (): Promise<void> => {
  try {
    // Bookings
    const bookingsSnap = await getDocs(collection(db, BOOKINGS_COLLECTION));
    const bookings: Booking[] = bookingsSnap.docs.map((d) => d.data() as Booking);
    saveLocalArray<Booking>(BOOKING_KEY, bookings);

    // Expenses
    const expensesSnap = await getDocs(collection(db, EXPENSES_COLLECTION));
    const expenses: Expense[] = expensesSnap.docs.map((d) => d.data() as Expense);
    saveLocalArray<Expense>(EXPENSE_KEY, expenses);

    // Sendero
    const senderoSnap = await getDocs(collection(db, SENDERO_COLLECTION));
    const senderoRecords: SenderoRecord[] = senderoSnap.docs.map((d) => d.data() as SenderoRecord);
    saveLocalArray<SenderoRecord>(SENDERO_KEY, senderoRecords);

    // Bar Transactions
    const barSnap = await getDocs(collection(db, BAR_TRANSACTIONS_COLLECTION));
    const barTransactions: BarTransaction[] = barSnap.docs.map((d) => d.data() as BarTransaction);
    saveLocalArray<BarTransaction>(BAR_TRANSACTIONS_KEY, barTransactions);

    // Bar Inventory
    const invSnap = await getDocs(collection(db, BAR_INVENTORY_COLLECTION));
    const inventoryItems: BarInventoryItem[] = invSnap.docs.map((d) => d.data() as BarInventoryItem);
    saveLocalArray<BarInventoryItem>(BAR_INVENTORY_KEY, inventoryItems);

    console.log("Sync desde Firestore completado");
  } catch (e) {
    console.error("Error sincronizando desde Firestore", e);
  }
};

// ----------------- BOOKINGS -----------------

export const getBookings = (): Booking[] => {
  return loadLocalArray<Booking>(BOOKING_KEY);
};

export const saveBooking = (booking: Booking): void => {
  const bookings = getBookings();
  bookings.push(booking);
  saveLocalArray<Booking>(BOOKING_KEY, bookings);

  // Guardar también en Firestore
  setDoc(doc(db, BOOKINGS_COLLECTION, booking.id), booking).catch((e) =>
    console.error("Error guardando booking en Firestore", e)
  );
};

export const updateBooking = (updated: Booking): void => {
  const bookings = getBookings().map((b) =>
    b.id === updated.id ? updated : b
  );
  saveLocalArray<Booking>(BOOKING_KEY, bookings);

  // Actualizar en Firestore
  setDoc(doc(db, BOOKINGS_COLLECTION, updated.id), updated).catch((e) =>
    console.error("Error actualizando booking en Firestore", e)
  );
};

export const deleteBooking = (id: string): void => {
  const bookings = getBookings().filter((b) => b.id !== id);
  saveLocalArray<Booking>(BOOKING_KEY, bookings);

  // Borrar en Firestore
  deleteDoc(doc(db, BOOKINGS_COLLECTION, id)).catch((e) =>
    console.error("Error borrando booking en Firestore", e)
  );
};

// ----------------- EXPENSES -----------------

export const getExpenses = (): Expense[] => {
  return loadLocalArray<Expense>(EXPENSE_KEY);
};

export const saveExpense = (expense: Expense): void => {
  const expenses = getExpenses();
  expenses.push(expense);
  saveLocalArray<Expense>(EXPENSE_KEY, expenses);

  // Guardar también en Firestore
  setDoc(doc(db, EXPENSES_COLLECTION, expense.id), expense).catch((e) =>
    console.error("Error guardando expense en Firestore", e)
  );
};

export const deleteExpense = (id: string): void => {
  const expenses = getExpenses().filter((e) => e.id !== id);
  saveLocalArray<Expense>(EXPENSE_KEY, expenses);

  // Borrar en Firestore
  deleteDoc(doc(db, EXPENSES_COLLECTION, id)).catch((e) =>
    console.error("Error borrando expense en Firestore", e)
  );
};

// ----------------- SENDERO -----------------

export const getSenderoRecords = (): SenderoRecord[] => {
  return loadLocalArray<SenderoRecord>(SENDERO_KEY);
};

export const saveSenderoRecord = (record: SenderoRecord): void => {
  const records = getSenderoRecords();
  records.push(record);
  saveLocalArray<SenderoRecord>(SENDERO_KEY, records);

  // Guardar también en Firestore
  setDoc(doc(db, SENDERO_COLLECTION, record.id), record).catch((e) =>
    console.error("Error guardando sendero record en Firestore", e)
  );
};

export const deleteSenderoRecord = (id: string): void => {
  const records = getSenderoRecords().filter((r) => r.id !== id);
  saveLocalArray<SenderoRecord>(SENDERO_KEY, records);

  // Borrar en Firestore
  deleteDoc(doc(db, SENDERO_COLLECTION, id)).catch((e) =>
    console.error("Error borrando sendero record en Firestore", e)
  );
};

// ----------------- BAR TRANSACTIONS -----------------

export const getBarTransactions = (): BarTransaction[] => {
  return loadLocalArray<BarTransaction>(BAR_TRANSACTIONS_KEY);
};

export const saveBarTransaction = (transaction: BarTransaction): void => {
  const transactions = getBarTransactions();
  transactions.push(transaction);
  saveLocalArray<BarTransaction>(BAR_TRANSACTIONS_KEY, transactions);

  // Guardar también en Firestore
  setDoc(doc(db, BAR_TRANSACTIONS_COLLECTION, transaction.id), transaction).catch((e) =>
    console.error("Error guardando bar transaction en Firestore", e)
  );
};

export const updateBarTransaction = (updated: BarTransaction): void => {
  const transactions = getBarTransactions().map((t) =>
    t.id === updated.id ? updated : t
  );
  saveLocalArray<BarTransaction>(BAR_TRANSACTIONS_KEY, transactions);

  // Actualizar en Firestore
  setDoc(doc(db, BAR_TRANSACTIONS_COLLECTION, updated.id), updated).catch((e) =>
    console.error("Error actualizando bar transaction en Firestore", e)
  );
};

export const deleteBarTransaction = (id: string): void => {
  const transactions = getBarTransactions().filter((t) => t.id !== id);
  saveLocalArray<BarTransaction>(BAR_TRANSACTIONS_KEY, transactions);

  // Borrar en Firestore
  deleteDoc(doc(db, BAR_TRANSACTIONS_COLLECTION, id)).catch((e) =>
    console.error("Error borrando bar transaction en Firestore", e)
  );
};

// ----------------- BAR INVENTORY -----------------

export const getBarInventoryItems = (): BarInventoryItem[] => {
  return loadLocalArray<BarInventoryItem>(BAR_INVENTORY_KEY);
};

export const saveBarInventoryItem = (item: BarInventoryItem): void => {
  const items = getBarInventoryItems();
  items.push(item);
  saveLocalArray<BarInventoryItem>(BAR_INVENTORY_KEY, items);

  setDoc(doc(db, BAR_INVENTORY_COLLECTION, item.id), item).catch((e) =>
    console.error("Error guardando bar inventory en Firestore", e)
  );
};

export const updateBarInventoryItem = (updated: BarInventoryItem): void => {
  const items = getBarInventoryItems().map((i) =>
    i.id === updated.id ? updated : i
  );
  saveLocalArray<BarInventoryItem>(BAR_INVENTORY_KEY, items);

  setDoc(doc(db, BAR_INVENTORY_COLLECTION, updated.id), updated).catch((e) =>
    console.error("Error actualizando bar inventory en Firestore", e)
  );
};

export const deleteBarInventoryItem = (id: string): void => {
  const items = getBarInventoryItems().filter((i) => i.id !== id);
  saveLocalArray<BarInventoryItem>(BAR_INVENTORY_KEY, items);

  deleteDoc(doc(db, BAR_INVENTORY_COLLECTION, id)).catch((e) =>
    console.error("Error borrando bar inventory en Firestore", e)
  );
};
