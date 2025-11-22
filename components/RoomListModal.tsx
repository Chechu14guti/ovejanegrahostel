import React from 'react';
import { X, Home, BedDouble, Tent, Bike } from 'lucide-react';
import { Room, Booking } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Helper functions to replace missing date-fns exports
const parseLocalISO = (dateStr: string) => {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const getStartOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

interface RoomListModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  rooms: Room[];
  bookings: Booking[];
  onRoomSelect: (room: Room, existingBooking?: Booking) => void;
}

export const RoomListModal: React.FC<RoomListModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  rooms,
  bookings,
  onRoomSelect,
}) => {
  if (!isOpen || !selectedDate) return null;

  // Get all bookings for a specific room on the selected date
  const getBookingsForRoom = (roomId: string): Booking[] => {
    const checkDate = getStartOfDay(selectedDate);
    return bookings.filter(b => {
      if (b.roomId !== roomId) return false;

      const start = getStartOfDay(parseLocalISO(b.checkIn));
      const end = getStartOfDay(parseLocalISO(b.checkOut));
      
      // Occupied if Selected Date is >= CheckIn AND Selected Date < CheckOut
      // OR for single day bookings: CheckIn == CheckOut
      return (checkDate >= start && checkDate < end) || 
             (start.getTime() === end.getTime() && checkDate.getTime() === start.getTime());
    });
  };

  const formattedDate = format(selectedDate, "EEEE, d 'de' MMMM", { locale: es });

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
        
        <div className="bg-gray-900 text-white p-4 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold capitalize">{formattedDate}</h2>
            <p className="text-gray-400 text-sm">Selecciona una unidad para gestionar</p>
          </div>
          <button onClick={onClose} className="bg-gray-800 hover:bg-gray-700 p-2 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rooms.map(room => {
            const roomBookings = getBookingsForRoom(room.id);
            const isCamping = room.type === 'tent' || room.type === 'motorhome';
            const isOccupied = roomBookings.length > 0;
            
            // For normal rooms, we block if occupied. For camping, we allow multiple.
            const isAvailable = !isOccupied || isCamping;
            
            let Icon = BedDouble;
            if (room.type === 'house') Icon = Home;
            if (room.type === 'tent') Icon = Tent;
            if (room.type === 'motorhome') Icon = Bike;

            return (
              <div 
                key={room.id}
                className={`
                  relative p-4 rounded-xl border-2 text-left transition-all
                  ${isOccupied ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}
                `}
              >
                <button 
                    onClick={() => onRoomSelect(room)}
                    className="absolute inset-0 w-full h-full z-0"
                    disabled={!isAvailable && !isCamping}
                />

                {/* Header */}
                <div className="relative z-10 flex justify-between items-start mb-2 pointer-events-none">
                  <div className={`p-2 rounded-lg ${isOccupied ? 'bg-red-200' : 'bg-green-200'}`}>
                    <Icon className={`w-5 h-5 ${isOccupied ? 'text-red-700' : 'text-green-700'}`} />
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${isOccupied ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>
                    {isOccupied 
                        ? (isCamping ? `${roomBookings.reduce((acc, b) => acc + (b.quantity || 1), 0)} Ocupados` : 'Ocupado') 
                        : 'Disponible'}
                  </span>
                </div>
                
                <h3 className="relative z-10 text-lg font-bold text-gray-800 pointer-events-none">{room.name}</h3>
                
                {/* List of bookings for this room (useful for camping where multiple exist) */}
                {isOccupied ? (
                   <div className="relative z-20 mt-3 space-y-2">
                      {roomBookings.map((booking) => (
                          <div 
                            key={booking.id} 
                            onClick={(e) => { e.stopPropagation(); onRoomSelect(room, booking); }}
                            className="bg-white/80 p-2 rounded border border-gray-200 text-sm cursor-pointer hover:bg-white hover:shadow-sm"
                          >
                              <div className="flex justify-between items-center">
                                <p className="font-bold text-gray-800">{booking.guestName}</p>
                                {isCamping && <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">x{booking.quantity || 1}</span>}
                              </div>
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>Salida: {format(parseLocalISO(booking.checkOut), 'dd/MM')}</span>
                                {booking.remaining > 0 && <span className="text-red-600 font-bold">${booking.remaining}</span>}
                              </div>
                          </div>
                      ))}
                      {isCamping && (
                         <button 
                            onClick={() => onRoomSelect(room)}
                            className="w-full mt-2 py-1 text-xs font-semibold text-blue-600 bg-blue-50 rounded border border-blue-200 hover:bg-blue-100"
                         >
                            + Agregar otra reserva
                         </button>
                      )}
                   </div>
                ) : (
                    <p className="mt-2 text-sm text-gray-500 pointer-events-none">Tocar para reservar</p>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};