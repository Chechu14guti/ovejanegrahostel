import React, { useState, useMemo } from 'react';
import { Booking, Expense, SenderoRecord } from '../types';
import { format, endOfMonth, isWithinInterval, subMonths, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { generateMonthlyReport } from '../services/pdfService';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  TrendingUp,
  AlertCircle,
  Wallet,
  ArrowDownCircle,
} from 'lucide-react';
import { ROOMS } from '../constants';

interface FinanceViewProps {
  bookings: Booking[];
  expenses: Expense[];
  senderoRecords: SenderoRecord[];
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

export const FinanceView: React.FC<FinanceViewProps> = ({ bookings, expenses, senderoRecords }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const monthlyBookings = useMemo(() => {
    const start = getStartOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return bookings
      .filter((b) => {
        // Include booking if CheckIn is in this month
        const checkIn = parseLocalISO(b.checkIn);
        return isWithinInterval(checkIn, { start, end });
      })
      .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());
  }, [bookings, currentMonth]);

  const monthlyExpenses = useMemo(() => {
    const start = getStartOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return expenses.filter((e) => {
      const d = parseLocalISO(e.date);
      return isWithinInterval(d, { start, end });
    });
  }, [expenses, currentMonth]);

  const monthlySendero = useMemo(() => {
    const start = getStartOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return senderoRecords.filter((s) => {
      const d = parseLocalISO(s.fecha);
      return isWithinInterval(d, { start, end });
    });
  }, [senderoRecords, currentMonth]);

  const stats = useMemo(() => {
    const income = monthlyBookings.reduce((acc, b) => acc + b.total, 0);
    const senderoIncome = monthlySendero.reduce((acc, s) => acc + (s.cantidadPersonas * s.precioPorPersona), 0);
    const totalIncome = income + senderoIncome;
    const pending = monthlyBookings.reduce((acc, b) => acc + b.remaining, 0);
    const totalExpenses = monthlyExpenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = totalIncome - totalExpenses;

    return { income, senderoIncome, totalIncome, pending, totalExpenses, netProfit };
  }, [monthlyBookings, monthlyExpenses, monthlySendero]);

  const handleDownloadPDF = () => {
    generateMonthlyReport(monthlyBookings, monthlyExpenses, currentMonth);
  };

  // Create unified movements list
  const allMovements = useMemo(() => {
    const movements: Array<{
      id: string;
      date: string;
      type: string;
      description: string;
      amount: number;
      timestamp: number;
    }> = [];

    // Add bookings as income
    monthlyBookings.forEach(b => {
      const roomName = ROOMS.find(r => r.id === b.roomId)?.name || 'Desconocido';
      movements.push({
        id: b.id,
        date: format(parseLocalISO(b.checkIn), 'dd/MM/yyyy', { locale: es }),
        type: 'Reserva',
        description: `${b.guestName} - ${roomName}`,
        amount: b.total,
        timestamp: parseLocalISO(b.checkIn).getTime(),
      });
    });

    // Add sendero as income
    monthlySendero.forEach(s => {
      movements.push({
        id: s.id,
        date: format(parseLocalISO(s.fecha), 'dd/MM/yyyy', { locale: es }),
        type: 'Sendero',
        description: `${s.empleado} - ${s.cantidadPersonas} personas`,
        amount: s.cantidadPersonas * s.precioPorPersona,
        timestamp: parseLocalISO(s.fecha).getTime(),
      });
    });

    // Add expenses as negative amounts
    monthlyExpenses.forEach(e => {
      movements.push({
        id: e.id,
        date: format(parseLocalISO(e.date), 'dd/MM/yyyy', { locale: es }),
        type: 'Gasto',
        description: e.description,
        amount: -e.amount,
        timestamp: parseLocalISO(e.date).getTime(),
      });
    });

    // Sort by date descending (most recent first)
    return movements.sort((a, b) => b.timestamp - a.timestamp);
  }, [monthlyBookings, monthlySendero, monthlyExpenses]);

  // Filter movements by search term
  const filteredMovements = useMemo(() => {
    if (!searchTerm.trim()) return allMovements;

    const term = searchTerm.toLowerCase();
    return allMovements.filter(m =>
      m.date.toLowerCase().includes(term) ||
      m.type.toLowerCase().includes(term) ||
      m.description.toLowerCase().includes(term) ||
      m.amount.toString().includes(term)
    );
  }, [allMovements, searchTerm]);

  // Paginate filtered movements
  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);
  const paginatedMovements = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMovements.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMovements, currentPage, itemsPerPage]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 w-full pb-20 md:pb-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-6 transition-colors duration-200">
        <div className="flex items-center gap-4 mb-4 sm:mb-0">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white capitalize w-48 text-center">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </h2>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300"
          >
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border-t-4 border-blue-500 transition-colors duration-200">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Ingresos Reservas</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ${stats.income.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border-t-4 border-green-500 transition-colors duration-200">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Ingresos Sendero</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ${stats.senderoIncome.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border-t-4 border-purple-500 transition-colors duration-200">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <Wallet className="w-4 h-4" />
            <span className="text-sm font-medium">Total Ingresos</span>
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            ${stats.totalIncome.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border-t-4 border-orange-500 transition-colors duration-200">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <ArrowDownCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Gastos / Compras</span>
          </div>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            -${stats.totalExpenses.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border-t-4 border-green-500 relative overflow-hidden transition-colors duration-200">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1 relative z-10">
            <Wallet className="w-4 h-4" />
            <span className="text-sm font-medium">Beneficio Real</span>
          </div>
          <p
            className={`text-2xl font-bold relative z-10 ${stats.netProfit >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}
          >
            ${stats.netProfit.toLocaleString()}
          </p>
          {/* Visual flourish */}
          <div
            className={`absolute right-[-10px] bottom-[-10px] w-20 h-20 rounded-full opacity-10 ${stats.netProfit >= 0 ? 'bg-green-500' : 'bg-red-500'
              }`}
          ></div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border-t-4 border-red-500 transition-colors duration-200">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Pendiente Cobro</span>
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            ${stats.pending.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden transition-colors duration-200">
        <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="font-bold text-gray-700 dark:text-gray-200">Movimientos</h3>
            <input
              type="text"
              placeholder="Buscar en movimientos..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-64 px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
            <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3">Tipo</th>
                <th className="px-6 py-3">Descripción</th>
                <th className="px-6 py-3 text-right">Importe</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMovements.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-gray-400 dark:text-gray-500"
                  >
                    {searchTerm ? 'No se encontraron movimientos' : 'No hay movimientos este mes'}
                  </td>
                </tr>
              ) : (
                paginatedMovements.map((movement, idx) => (
                  <tr key={`${movement.type}-${movement.id}-${idx}`} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 font-medium whitespace-nowrap">
                      {movement.date}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${movement.type === 'Reserva'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : movement.type === 'Sendero'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                      >
                        {movement.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      {movement.description}
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${movement.amount >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                      }`}>
                      {movement.amount >= 0 ? '+' : ''}${movement.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t dark:border-gray-700 flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredMovements.length)} de {filteredMovements.length} movimientos
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Anterior
              </button>
              <span className="px-3 py-1 text-gray-700 dark:text-gray-300">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
