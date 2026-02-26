import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { Room, Booking } from '../types';
import { format } from 'date-fns';
import { ConfirmModal } from './ConfirmModal';

// Creating a simple ID generator since we can't easily import uuid in this specific constraints setup without import map complexity for uuid
const generateId = () => Math.random().toString(36).substr(2, 9);

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  selectedRoom: Room;
  existingBooking?: Booking;
  onSave: (booking: Booking) => void;
  onDelete: (id: string) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  selectedRoom,
  existingBooking,
  onSave,
  onDelete,
}) => {
  const [formData, setFormData] = useState<Partial<Booking>>({
    guestName: '',
    guestCount: 1 as number | undefined,
    quantity: 1 as number | undefined,
    guestDoc: '',
    deposit: 0,
    remaining: 0,
    total: 0,
    notes: '',
    checkIn: format(selectedDate, 'yyyy-MM-dd'),
    checkOut: format(selectedDate, 'yyyy-MM-dd'),
  });

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (existingBooking) {
        setFormData(existingBooking);
      } else {
        setFormData({
          guestName: '',
          guestCount: 1,
          quantity: 1,
          guestDoc: '',
          deposit: 0,
          remaining: 0,
          total: 0,
          notes: '',
          checkIn: format(selectedDate, 'yyyy-MM-dd'),
          checkOut: format(new Date(selectedDate.getTime() + 86400000), 'yyyy-MM-dd'), // Default checkout next day
        });
      }
    }
  }, [isOpen, existingBooking, selectedDate]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.checkIn || !formData.checkOut || !formData.remaining?.toString() || !formData.total?.toString()) {
      alert("Por favor complete los campos obligatorios de pago y fechas.");
      return;
    }

    const booking: Booking = {
      id: existingBooking ? existingBooking.id : generateId(),
      roomId: selectedRoom.id,
      checkIn: formData.checkIn!,
      checkOut: formData.checkOut!,
      guestName: formData.guestName || 'Anónimo',
      guestCount: Number(formData.guestCount) || 1,
      quantity: Number(formData.quantity) || 1,
      guestDoc: formData.guestDoc || '',
      deposit: Number(formData.deposit),
      remaining: Number(formData.remaining),
      total: Number(formData.total),
      notes: formData.notes || '',
      createdAt: existingBooking ? existingBooking.createdAt : Date.now(),
    };
    onSave(booking);
  };

  const handleTotalChange = (val: number) => {
    const deposit = formData.deposit || 0;
    setFormData(prev => ({ ...prev, total: val, remaining: val - deposit }));
  };

  const handleDepositChange = (val: number) => {
    const total = formData.total || 0;
    setFormData(prev => ({ ...prev, deposit: val, remaining: total - val }));
  };

  const isCamping = selectedRoom.type === 'tent' || selectedRoom.type === 'motorhome';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-slide-up transition-colors duration-200">

        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex justify-between items-center z-10 transition-colors duration-200">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {existingBooking ? 'Editar Reserva' : 'Nueva Reserva'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{selectedRoom.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-6">

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Entrada (Check-in)</label>
              <input
                type="date"
                required
                value={formData.checkIn}
                onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                className="w-full p-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Salida (Check-out)</label>
              <input
                type="date"
                required
                value={formData.checkOut}
                min={formData.checkIn}
                onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                className="w-full p-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
              />
            </div>
          </div>

          {/* Guest Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Huésped Principal</label>
              <input
                type="text"
                placeholder="Nombre completo"
                value={formData.guestName}
                onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                className="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">DNI / Pasaporte</label>
                <input
                  type="text"
                  placeholder="Opcional"
                  value={formData.guestDoc}
                  onChange={(e) => setFormData({ ...formData, guestDoc: e.target.value })}
                  className="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cantidad Personas</label>
                <input
                  type="number"
                  min="1"
                  value={formData.guestCount ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, guestCount: val === '' ? undefined : parseInt(val) });
                  }}
                  className="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                />
              </div>
            </div>

            {/* Extra field for Camping types */}
            {isCamping && (
              <div>
                <label className="block text-sm font-bold text-blue-800 dark:text-blue-400 mb-1">
                  {selectedRoom.type === 'tent' ? 'Cantidad de Carpas' : 'Cantidad de Motorhomes'}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.quantity ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, quantity: val === '' ? undefined : parseInt(val) });
                  }}
                  className="w-full p-2 border-2 border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-white transition-colors"
                />
              </div>
            )}
          </div>

          {/* Financials */}
          <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-600 space-y-4 transition-colors">
            <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              Detalles de Pago
            </h4>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Total ($)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.total || ''}
                  onChange={(e) => handleTotalChange(parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 font-bold text-gray-900 dark:text-white transition-colors"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Seña ($)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.deposit || ''}
                  onChange={(e) => handleDepositChange(parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                  placeholder="0"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1 h-5">
                  {formData.remaining !== 0 && (
                    <>
                      <label className="block text-xs text-red-600 dark:text-red-400 font-bold">Falta ($)</label>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, remaining: 0 })}
                        className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded hover:bg-green-200 dark:hover:bg-green-900/50 font-semibold transition-colors"
                      >
                        Pagado
                      </button>
                    </>
                  )}
                </div>
                <input
                  type="number"
                  disabled
                  value={formData.remaining === 0 ? (formData.total || 0) : formData.remaining}
                  className={`w-full p-2 border rounded font-bold transition-colors ${formData.remaining === 0
                    ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    }`}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-2 border dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
              placeholder="Detalles adicionales..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {existingBooking && (
              <>
                <ConfirmModal
                  isOpen={deleteConfirmOpen}
                  title="Eliminar reserva"
                  message="¿Estás seguro de eliminar esta reserva?"
                  messageSecondary="Esta acción no se puede deshacer."
                  confirmText="Eliminar"
                  onConfirm={() => {
                    onDelete(existingBooking.id);
                    setDeleteConfirmOpen(false);
                  }}
                  onCancel={() => setDeleteConfirmOpen(false)}
                />
                <button
                  type="button"
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="flex-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 py-3 rounded-lg font-semibold hover:bg-red-200 dark:hover:bg-red-900/50 flex items-center justify-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Eliminar
                </button>
              </>
            )}
            <button
              type="submit"
              className={`flex-[2] py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-colors ${existingBooking ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600' : 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600'}`}
            >
              <Save className="w-4 h-4" /> {existingBooking ? 'Guardar Cambios' : 'Crear Reserva'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};