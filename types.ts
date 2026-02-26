export interface Room {
  id: string;
  name: string;
  type: 'room' | 'house' | 'tent' | 'motorhome';
  color: string;
}

export interface Booking {
  id: string;
  roomId: string;
  checkIn: string; // ISO Date string YYYY-MM-DD
  checkOut: string; // ISO Date string YYYY-MM-DD
  guestName: string;
  guestCount: number;
  quantity?: number; // For tents and motorhomes
  guestDoc?: string;
  deposit: number;
  remaining: number;
  total: number;
  notes?: string;
  createdAt: number;
}

export interface Expense {
  id: string;
  date: string; // ISO Date string YYYY-MM-DD
  description: string;
  amount: number;
  createdAt: number;
}

export interface SenderoRecord {
  id: string;
  empleado: string;           // Employee name
  cantidadPersonas: number;   // Number of people
  precioPorPersona: number;   // Price per person
  horas: number;              // Hours worked
  fecha: string;              // Date (YYYY-MM-DD)
  createdAt: number;
}

export interface DailyStatus {
  date: Date;
  isToday: boolean;
  bookings: Booking[];
}

export interface BarTransaction {
  id: string;
  type: 'income' | 'expense';
  quantity?: number;
  amount: number;
  description: string;
  date: string; // ISO Date string YYYY-MM-DD
  createdAt: number;

  // Para conexión con inventario
  isFromInventory?: boolean;
  inventoryItemId?: string;
}

export interface BarInventoryItem {
  id: string;
  name: string;
  category: string;
  initialStock: number;
  currentStock: number;
  price: number;
  createdAt: number;
}