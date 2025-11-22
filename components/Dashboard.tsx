import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, endOfMonth, endOfWeek, eachDayOfInterval, isSameMonth, isToday, addWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, DollarSign, LogOut, Tent, Bike, BedDouble, Home, ShoppingCart, BarChart3 } from 'lucide-react';
import { ROOMS } from '../constants';
import { Booking, Room, Expense } from '../types';
import {
  getBookings,
  saveBooking,
  updateBooking,
  deleteBooking,
  getExpenses,
  saveExpense,
  deleteExpense,
  syncFromFirestore,
} from "../services/storageService";


import { RoomListModal } from './RoomListModal';
import { BookingModal } from './BookingModal';
import { FinanceView } from './FinanceView';
import { ExpensesView } from './ExpensesView';
import { StatsView } from './StatsView';

interface DashboardProps {
  onLogout: () => void;
}

// Helper functions to replace missing date-fns exports
const getStartOfDay = (d: Date) => {
  const newDate = new Date(d);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

const getStartOfMonth = (d: Date) => {
  const newDate = new Date(d);
  newDate.setDate(1);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

const getStartOfWeek = (d: Date) => {
  // For weekStartsOn: 1 (Monday)
  const newDate = new Date(d);
  newDate.setHours(0, 0, 0, 0);
  const day = newDate.getDay();
  const diff = newDate.getDate() - day + (day === 0 ? -6 : 1);
  newDate.setDate(diff);
  return newDate;
};

const subtractWeeks = (d: Date, amount: number) => {
  const newDate = new Date(d);
  newDate.setDate(newDate.getDate() - (7 * amount));
  return newDate;
};

const parseLocalISO = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

type ViewType = 'calendar' | 'finance' | 'expenses' | 'stats';

export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activeView, setActiveView] = useState<ViewType>('calendar');

  // Modal States
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isRoomListOpen, setIsRoomListOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | undefined>(undefined);

  useEffect(() => {
  const loadData = async () => {
    // 1) Traemos todo desde Firestore y lo metemos en localStorage
    await syncFromFirestore();

    // 2) Cargamos desde localStorage a estado de React
    setBookings(getBookings());
    setExpenses(getExpenses());
  };

  loadData();
}, []);


  const refreshData = () => {
    setBookings(getBookings());
    setExpenses(getExpenses());
  };

  // Calendar Navigation
  const nextPeriod = () => setCurrentDate(viewMode === 'month' ? addMonths(currentDate, 1) : addWeeks(currentDate, 1));
  const prevPeriod = () => setCurrentDate(viewMode === 'month' ? subMonths(currentDate, 1) : subtractWeeks(currentDate, 1));
  const goToday = () => setCurrentDate(new Date());

  // Calendar Grid Generation
  const calendarDays = () => {
    const start = viewMode === 'month' ? getStartOfWeek(getStartOfMonth(currentDate)) : getStartOfWeek(currentDate);
    const end = viewMode === 'month' ? endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 }) : endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  };

  // Interactions
  const handleDateClick = (day: Date) => {
    setSelectedDate(day);
    setIsRoomListOpen(true);
  };

  const handleRoomSelect = (room: Room, booking?: Booking) => {
    setSelectedRoom(room);
    setEditingBooking(booking);
    setIsRoomListOpen(false); // Close list
    setIsBookingModalOpen(true); // Open form
  };

  const handleBookingSave = (booking: Booking) => {
    if (editingBooking) {
      updateBooking(booking);
    } else {
      saveBooking(booking);
    }
    refreshData();
    setIsBookingModalOpen(false);
  };

  const handleBookingDelete = (id: string) => {
    deleteBooking(id);
    refreshData();
    setIsBookingModalOpen(false);
  };

  // Helper to check if a room is occupied on a date
  const checkRoomOccupancy = (date: Date, roomId: string) => {
    const dayStart = getStartOfDay(date);
    return bookings.some(b => {
       if (b.roomId !== roomId) return false;
       const bStart = getStartOfDay(parseLocalISO(b.checkIn));
       const bEnd = getStartOfDay(parseLocalISO(b.checkOut));
       // Occupied if start <= date < end (OR start == end == date)
       return (dayStart >= bStart && dayStart < bEnd) || (bStart.getTime() === bEnd.getTime() && bStart.getTime() === dayStart.getTime());
    });
  };

  const renderContent = () => {
    switch (activeView) {
      case 'finance':
        return <FinanceView bookings={bookings} expenses={expenses} />;
      case 'expenses':
        return <ExpensesView expenses={expenses} onUpdate={refreshData} />;
      case 'stats':
        return <StatsView bookings={bookings} expenses={expenses} />;
      default:
        return (
          <>
             {/* Calendar Controls */}
            <div className="bg-white border-b px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                <h2 className="text-lg font-bold text-gray-900 capitalize w-40">
                  {format(currentDate, 'MMMM yyyy', { locale: es })}
                </h2>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button 
                    onClick={() => setViewMode('month')} 
                    className={`px-3 py-1 rounded-md text-sm font-medium transition ${viewMode === 'month' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                  >
                    Mes
                  </button>
                  <button 
                    onClick={() => setViewMode('week')} 
                    className={`px-3 py-1 rounded-md text-sm font-medium transition ${viewMode === 'week' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                  >
                    Semana
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button onClick={prevPeriod} className="p-2 hover:bg-gray-100 rounded-full border border-gray-200">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={goToday} className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200">
                  Hoy
                </button>
                <button onClick={nextPeriod} className="p-2 hover:bg-gray-100 rounded-full border border-gray-200">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 p-2 sm:p-4 overflow-auto">
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                  <div key={day} className="text-center text-xs font-semibold text-gray-400 uppercase py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1 sm:gap-2 auto-rows-fr h-full min-h-[400px]">
                {calendarDays().map((day, idx) => {
                  const roomStatuses = ROOMS.map(room => {
                      const isOccupied = checkRoomOccupancy(day, room.id);
                      return { id: room.id, type: room.type, isOccupied, name: room.name };
                  });

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => handleDateClick(day)}
                      className={`
                        relative flex flex-col items-start justify-start p-2 rounded-xl border transition hover:shadow-md min-h-[90px] sm:min-h-[130px]
                        ${!isSameMonth(day, currentDate) && viewMode === 'month' ? 'opacity-40 bg-gray-50' : 'bg-white'}
                        ${isToday(day) ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'}
                      `}
                    >
                      <span className={`
                        text-sm font-semibold mb-1 w-7 h-7 flex items-center justify-center rounded-full
                        ${isToday(day) ? 'bg-blue-600 text-white' : 'text-gray-700'}
                      `}>
                        {format(day, 'd')}
                      </span>
                      
                      {/* Room Status Icons */}
                      <div className="w-full mt-auto pt-2 flex flex-wrap gap-1 content-end">
                        {roomStatuses.map((status) => {
                            let IconComponent = BedDouble; // Default room icon
                            
                            if (status.type === 'house') IconComponent = Home;
                            else if (status.type === 'tent') IconComponent = Tent;
                            else if (status.type === 'motorhome') IconComponent = Bike;

                            const colorClass = status.isOccupied 
                              ? 'text-red-500 fill-red-500' // Occupied: Red filled
                              : 'text-green-400'; // Available: Green outline

                            return (
                                <div key={status.id} title={`${status.name}: ${status.isOccupied ? 'Ocupado' : 'Libre'}`}>
                                    <IconComponent 
                                        className={`w-5 h-5 ${colorClass}`}
                                    />
                                </div>
                            );
                        })}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b px-4 py-3 flex justify-between items-center sticky top-0 z-30 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setActiveView('calendar')} className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <CalIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-xl text-gray-800 hidden sm:block">Gestión de Reservas</h1>
          </button>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => setActiveView('expenses')}
            className={`p-2 rounded-lg flex flex-col items-center gap-0.5 transition ${activeView === 'expenses' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="text-[10px] font-medium">Compras</span>
          </button>

          <button 
            onClick={() => setActiveView('finance')}
            className={`p-2 rounded-lg flex flex-col items-center gap-0.5 transition ${activeView === 'finance' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <DollarSign className="w-5 h-5" />
            <span className="text-[10px] font-medium">Finanzas</span>
          </button>

          <button 
            onClick={() => setActiveView('stats')}
            className={`p-2 rounded-lg flex flex-col items-center gap-0.5 transition ${activeView === 'stats' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] font-medium">Stats</span>
          </button>

          <div className="h-8 w-px bg-gray-200 mx-1"></div>

          <button 
            onClick={onLogout}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
            title="Cerrar Sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {renderContent()}

      {/* Modals */}
      <RoomListModal 
        isOpen={isRoomListOpen}
        onClose={() => setIsRoomListOpen(false)}
        selectedDate={selectedDate}
        rooms={ROOMS}
        bookings={bookings}
        onRoomSelect={handleRoomSelect}
      />
      
      {isBookingModalOpen && selectedRoom && selectedDate && (
        <BookingModal 
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          selectedDate={selectedDate}
          selectedRoom={selectedRoom}
          existingBooking={editingBooking}
          onSave={handleBookingSave}
          onDelete={handleBookingDelete}
        />
      )}
    </div>
  );
};