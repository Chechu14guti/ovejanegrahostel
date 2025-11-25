import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, endOfMonth, endOfWeek, eachDayOfInterval, isSameMonth, isToday, addWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, DollarSign, LogOut, Tent, Bike, BedDouble, Home, ShoppingCart, BarChart3, Moon, Sun, Footprints } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { ROOMS } from '../constants';
import { Booking, Room, Expense, SenderoRecord } from '../types';
import {
  getBookings,
  saveBooking,
  updateBooking,
  deleteBooking,
  getExpenses,
  saveExpense,
  deleteExpense,
  getSenderoRecords,
  saveSenderoRecord,
  deleteSenderoRecord,
  syncFromFirestore,
} from "../services/storageService";


import { RoomListModal } from './RoomListModal';
import { BookingModal } from './BookingModal';
import { FinanceView } from './FinanceView';
import { ExpensesView } from './ExpensesView';
import { StatsView } from './StatsView';
import { SenderoView } from './SenderoView';

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

type ViewType = 'calendar' | 'finance' | 'expenses' | 'stats' | 'sendero';

export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const { theme, toggleTheme } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [senderoRecords, setSenderoRecords] = useState<SenderoRecord[]>([]);
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
      setSenderoRecords(getSenderoRecords());
    };

    loadData();
  }, []);


  const refreshData = () => {
    setBookings(getBookings());
    setExpenses(getExpenses());
    setSenderoRecords(getSenderoRecords());
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

  const handleSenderoAdd = (record: SenderoRecord) => {
    saveSenderoRecord(record);
    refreshData();
  };

  const handleSenderoDelete = (id: string) => {
    deleteSenderoRecord(id);
    refreshData();
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
        return <FinanceView bookings={bookings} expenses={expenses} senderoRecords={senderoRecords} />;
      case 'expenses':
        return <ExpensesView expenses={expenses} onUpdate={refreshData} />;
      case 'stats':
        return <StatsView bookings={bookings} expenses={expenses} />;
      case 'sendero':
        return <SenderoView records={senderoRecords} onAddRecord={handleSenderoAdd} onDeleteRecord={handleSenderoDelete} />;
      default:
        return (
          <>
            {/* Calendar Controls */}
            <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 transition-colors duration-200">
              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white capitalize w-40">
                  {format(currentDate, 'MMMM yyyy', { locale: es })}
                </h2>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('month')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition ${viewMode === 'month' ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
                  >
                    Mes
                  </button>
                  <button
                    onClick={() => setViewMode('week')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition ${viewMode === 'week' ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
                  >
                    Semana
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button onClick={prevPeriod} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={goToday} className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  Hoy
                </button>
                <button onClick={nextPeriod} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 p-2 sm:p-4 overflow-auto pb-20 md:pb-4">
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                  <div key={day} className="text-center text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase py-2">
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
                        calendar-day relative flex flex-col items-start justify-start p-2 rounded-xl border transition hover:shadow-md active:scale-95 min-h-[110px] sm:min-h-[130px]
                        ${!isSameMonth(day, currentDate) && viewMode === 'month' ? 'opacity-40 bg-gray-50 dark:bg-gray-900/50' : 'bg-white dark:bg-gray-800'}
                        ${isToday(day) ? 'border-blue-500 ring-1 ring-blue-500 dark:border-blue-400 dark:ring-blue-400' : 'border-gray-200 dark:border-gray-700'}
                      `}
                    >
                      <span className={`
                        text-sm font-semibold mb-1 w-7 h-7 flex items-center justify-center rounded-full
                        ${isToday(day) ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300'}
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-200">
      {/* Header - Desktop shows all nav, Mobile shows only title and theme/logout */}
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-3 flex justify-between items-center sticky top-0 z-30 shadow-sm transition-colors duration-200">
        <div className="flex items-center gap-4">
          <CalIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Oveja Negra Hostel</h1>
        </div>

        {/* Desktop Navigation - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => setActiveView('calendar')}
            className={`p-2 rounded-lg flex items-center gap-2 transition ${activeView === 'calendar'
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            <CalIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Calendario</span>
          </button>

          <button
            onClick={() => setActiveView('sendero')}
            className={`p-2 rounded-lg flex items-center gap-2 transition ${activeView === 'sendero'
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            <Footprints className="w-5 h-5" />
            <span className="text-sm font-medium">Sendero</span>
          </button>

          <button
            onClick={() => setActiveView('expenses')}
            className={`p-2 rounded-lg flex items-center gap-2 transition ${activeView === 'expenses'
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="text-sm font-medium">Compras</span>
          </button>

          <button
            onClick={() => setActiveView('finance')}
            className={`p-2 rounded-lg flex items-center gap-2 transition ${activeView === 'finance'
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            <DollarSign className="w-5 h-5" />
            <span className="text-sm font-medium">Facturación</span>
          </button>

          <button
            onClick={() => setActiveView('stats')}
            className={`p-2 rounded-lg flex items-center gap-2 transition ${activeView === 'stats'
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-sm font-medium">Stats</span>
          </button>

          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

          <button
            onClick={toggleTheme}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <button
            onClick={onLogout}
            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
            title="Cerrar Sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile - Only theme and logout */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <button
            onClick={onLogout}
            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
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

      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 px-4 py-2 z-40 shadow-lg transition-colors duration-200">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <button
            onClick={() => setActiveView('calendar')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition ${activeView === 'calendar'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400'
              }`}
          >
            <CalIcon className="w-6 h-6" />
            <span className="text-xs font-medium">Calendario</span>
          </button>

          <button
            onClick={() => setActiveView('sendero')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition ${activeView === 'sendero'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400'
              }`}
          >
            <Footprints className="w-6 h-6" />
            <span className="text-xs font-medium">Sendero</span>
          </button>

          <button
            onClick={() => setActiveView('expenses')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition ${activeView === 'expenses'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400'
              }`}
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="text-xs font-medium">Compras</span>
          </button>

          <button
            onClick={() => setActiveView('finance')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition ${activeView === 'finance'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400'
              }`}
          >
            <DollarSign className="w-6 h-6" />
            <span className="text-xs font-medium">Facturación</span>
          </button>

          <button
            onClick={() => setActiveView('stats')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition ${activeView === 'stats'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400'
              }`}
          >
            <BarChart3 className="w-6 h-6" />
            <span className="text-xs font-medium">Stats</span>
          </button>
        </div>
      </nav>
    </div>
  );
};