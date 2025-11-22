// services/storageService.ts
import { Booking, Expense } from "../types";
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

const BOOKINGS_COLLECTION = "bookings";
const EXPENSES_COLLECTION = "expenses";

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
