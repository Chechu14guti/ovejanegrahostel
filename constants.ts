import { Room } from './types';

export const ROOMS: Room[] = [
  { id: 'room-1', name: 'Habitación 1', type: 'room', color: 'bg-blue-100 text-blue-800' },
  { id: 'room-2', name: 'Habitación 2', type: 'room', color: 'bg-blue-100 text-blue-800' },
  { id: 'room-3', name: 'Habitación 3', type: 'room', color: 'bg-blue-100 text-blue-800' },
  { id: 'room-4', name: 'Habitación 4', type: 'room', color: 'bg-blue-100 text-blue-800' },
  { id: 'room-5', name: 'Habitación 5', type: 'room', color: 'bg-blue-100 text-blue-800' },
  { id: 'room-6', name: 'Habitación 6', type: 'room', color: 'bg-blue-100 text-blue-800' },
  { id: 'house-1', name: 'Casa Principal', type: 'house', color: 'bg-purple-100 text-purple-800' },
  { id: 'camping-1', name: 'Zona Carpas', type: 'tent', color: 'bg-amber-100 text-amber-800' },
  { id: 'motorhome-1', name: 'Zona Motorhome', type: 'motorhome', color: 'bg-orange-100 text-orange-800' },
];

export const ADMIN_USER = "admin";
export const ADMIN_PASS = "hostel123"; // In a real app, this would be secure.