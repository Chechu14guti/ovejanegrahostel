import React, { useState, useMemo } from 'react';
import { Booking, Expense } from '../types';
import { format, endOfMonth, isWithinInterval, subMonths, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { generateMonthlyReport } from '../services/pdfService';
import { ChevronLeft, ChevronRight, FileText, TrendingUp, AlertCircle, Wallet, ArrowDownCircle } from 'lucide-react';
import { ROOMS } from '../constants';

interface FinanceViewProps {
  bookings: Booking[];
  expenses: Expense[];
}

// Helper functions to replace missing date-fns exports
const getStartOfMonth = (d: Date) => {
  const newDate = new Date(d);
  newDate.setDate(1);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

const parseLocalISO = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const FinanceView: React.FC<FinanceViewProps> = ({ bookings, expenses }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthlyBookings = useMemo(() => {
    const start = getStartOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return bookings.filter(b => {
      // Include booking if CheckIn is in this month
      const checkIn = parseLocalISO(b.checkIn);
      return isWithinInterval(checkIn, { start, end });
    }).sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());
  }, [bookings, currentMonth]);

  const monthlyExpenses = useMemo(() => {
    const start = getStartOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return expenses.filter(e => {
        const d = parseLocalISO(e.date);
        return isWithinInterval(d, { start, end });
    });
  }, [expenses, currentMonth]);

  const stats = useMemo(() => {
    const income = monthlyBookings.reduce((acc, b) => acc + b.total, 0);
    const pending = monthlyBookings.reduce((acc, b) => acc + b.remaining, 0);
    const totalExpenses = monthlyExpenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = income - totalExpenses;
    
    return { income, pending, totalExpenses, netProfit };
  }, [monthlyBookings, monthlyExpenses]);

  const handleDownloadPDF = () => {
    generateMonthlyReport(monthlyBookings, currentMonth);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 w-full">
      
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm mb-6">
        <div className="flex items-center gap-4 mb-4 sm:mb-0">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-gray-800 capitalize w-48 text-center">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </h2>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        <button 
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition font-medium shadow-md"
        >
          <FileText className="w-4 h-4" />
          Reporte PDF
        </button>
      </div>

      {/* Stats Cards - Real Billing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl shadow-sm border-t-4 border-blue-500">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Ingresos Reservas</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">${stats.income.toLocaleString()}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border-t-4 border-orange-500">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <ArrowDownCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Gastos / Compras</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">-${stats.totalExpenses.toLocaleString()}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border-t-4 border-green-500 relative overflow-hidden">
          <div className="flex items-center gap-2 text-gray-500 mb-1 relative z-10">
            <Wallet className="w-4 h-4" />
            <span className="text-sm font-medium">Beneficio Real</span>
          </div>
          <p className={`text-2xl font-bold relative z-10 ${stats.netProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
            ${stats.netProfit.toLocaleString()}
          </p>
          {/* Visual flourish */}
          <div className={`absolute right-[-10px] bottom-[-10px] w-20 h-20 rounded-full opacity-10 ${stats.netProfit >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border-t-4 border-red-500">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Pendiente Cobro</span>
          </div>
          <p className="text-2xl font-bold text-red-600">${stats.pending.toLocaleString()}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
            <h3 className="font-bold text-gray-700">Detalle de Reservas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3">Habitación</th>
                <th className="px-6 py-3">Huésped</th>
                <th className="px-6 py-3 text-right">Total</th>
                <th className="px-6 py-3 text-right">Falta</th>
                <th className="px-6 py-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {monthlyBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No hay reservas este mes
                  </td>
                </tr>
              ) : (
                monthlyBookings.map((b) => (
                  <tr key={b.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">
                      {format(parseLocalISO(b.checkIn), 'dd/MM')} - {format(parseLocalISO(b.checkOut), 'dd/MM')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${ROOMS.find(r => r.id === b.roomId)?.color}`}>
                        {ROOMS.find(r => r.id === b.roomId)?.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900">{b.guestName}</td>
                    <td className="px-6 py-4 text-right font-bold">${b.total}</td>
                    <td className={`px-6 py-4 text-right font-bold ${b.remaining > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                      ${b.remaining}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {b.remaining === 0 ? (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">Pagado</span>
                      ) : (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold">Debe</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};