import React, { useState, useMemo } from 'react';
import { Booking, Expense, SenderoRecord, BarTransaction } from '../types';
import { format, subMonths, addMonths, isSameMonth, parseISO, isSameDay, isSameYear } from 'date-fns';
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

import { useStore } from '../store/useStore';

// Helper functions to replace missing date-fns exports
const getStartOfMonth = (d: Date) => {
  const newDate = new Date(d);
  newDate.setDate(1);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

import { parseLocalISO } from '../utils/dateUtils';

export const FinanceView: React.FC = () => {
  const { bookings, expenses, senderoRecords, barTransactions } = useStore();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filterType, setFilterType] = useState<'day' | 'month' | 'year'>('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Calculate stats based entirely on whatever is currently matched for the filter period
  const monthlyBookings = useMemo(() => {
    return bookings.filter(b => {
      if (!b.checkIn) return false;
      const date = parseLocalISO(b.checkIn);
      if (filterType === 'day') return isSameDay(date, currentMonth);
      if (filterType === 'year') return isSameYear(date, currentMonth);
      return isSameMonth(date, currentMonth);
    });
  }, [bookings, currentMonth, filterType]);

  const monthlyExpenses = useMemo(() => {
    return expenses.filter(e => {
      const date = parseLocalISO(e.date);
      if (filterType === 'day') return isSameDay(date, currentMonth);
      if (filterType === 'year') return isSameYear(date, currentMonth);
      return isSameMonth(date, currentMonth);
    });
  }, [expenses, currentMonth, filterType]);

  const monthlySendero = useMemo(() => {
    return senderoRecords.filter(s => {
      const date = parseLocalISO(s.fecha);
      if (filterType === 'day') return isSameDay(date, currentMonth);
      if (filterType === 'year') return isSameYear(date, currentMonth);
      return isSameMonth(date, currentMonth);
    });
  }, [senderoRecords, currentMonth, filterType]);

  const monthlyBar = useMemo(() => {
    return barTransactions.filter(t => {
      const date = parseLocalISO(t.date);
      if (filterType === 'day') return isSameDay(date, currentMonth);
      if (filterType === 'year') return isSameYear(date, currentMonth);
      return isSameMonth(date, currentMonth);
    });
  }, [barTransactions, currentMonth, filterType]);

  const stats = useMemo(() => {
    const income = monthlyBookings.reduce((acc, b) => acc + b.total, 0);
    const senderoIncome = monthlySendero.reduce((acc, s) => acc + (s.cantidadPersonas * s.precioPorPersona), 0);
    const barIncome = monthlyBar.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const barExpense = monthlyBar.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

    const totalIncome = income + senderoIncome + barIncome;
    const pending = monthlyBookings.reduce((acc, b) => acc + b.remaining, 0);
    const totalExpenses = monthlyExpenses.reduce((acc, e) => acc + e.amount, 0) + barExpense;
    const netProfit = totalIncome - totalExpenses;

    return { income, senderoIncome, barIncome, totalIncome, pending, totalExpenses, netProfit };
  }, [monthlyBookings, monthlyExpenses, monthlySendero, monthlyBar]);

  // moved handleDownloadPDF down

  // Create unified movements list
  const allMovements = useMemo(() => {
    const movements: Array<{
      id: string;
      date: string;
      type: string;
      description: string;
      amount: number;
      paymentMethod?: 'cash' | 'transfer';
      timestamp: number;
      createdAt: number;
      isPending?: boolean;
    }> = [];

    // Add bookings as income
    monthlyBookings.forEach(b => {
      const roomName = ROOMS.find(r => r.id === b.roomId)?.name || 'Desconocido';
      movements.push({
        id: b.id,
        date: format(parseLocalISO(b.checkIn), 'dd/MM/yyyy', { locale: es }),
        type: 'Reserva',
        description: `${b.guestName} - ${roomName}`,
        amount: b.total, // For the log, we show the total cost of the booking.
        timestamp: parseLocalISO(b.checkIn).getTime(),
        createdAt: b.createdAt || 0,
        isPending: b.remaining > 0
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
        createdAt: s.createdAt || 0,
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
        paymentMethod: e.paymentMethod,
        timestamp: parseLocalISO(e.date).getTime(),
        createdAt: e.createdAt || 0,
      });
    });

    // Add bar transactions
    monthlyBar.forEach(t => {
      movements.push({
        id: t.id,
        date: format(parseLocalISO(t.date), 'dd/MM/yyyy', { locale: es }),
        type: 'Bar',
        description: t.description,
        amount: t.type === 'income' ? t.amount : -t.amount,
        paymentMethod: t.paymentMethod,
        timestamp: parseLocalISO(t.date).getTime(),
        createdAt: t.createdAt || 0,
      });
    });

    // Sort by date descending (most recent first), then by creation time
    return movements.sort((a, b) => {
      const timeDiff = b.timestamp - a.timestamp;
      if (timeDiff !== 0) return timeDiff;
      return b.createdAt - a.createdAt;
    });
  }, [monthlyBookings, monthlySendero, monthlyExpenses, monthlyBar]);

  // Filter movements by search term AND active stat card
  const filteredMovements = useMemo(() => {
    let result = allMovements;

    // First apply stat card filter
    if (activeFilter) {
      switch (activeFilter) {
        case 'income-reservas':
          result = result.filter(m => m.type === 'Reserva');
          break;
        case 'income-sendero':
          result = result.filter(m => m.type === 'Sendero');
          break;
        case 'income-bar':
          result = result.filter(m => m.type === 'Bar' && m.amount > 0);
          break;
        case 'total-income':
          result = result.filter(m => m.amount > 0);
          break;
        case 'expenses':
          result = result.filter(m => m.amount < 0 || (m.type === 'Gasto') || (m.type === 'Bar' && m.amount < 0));
          break;
        case 'pending':
          result = result.filter(m => m.isPending);
          break;
        case 'profit':
          // Profit shows everything to view the actual balance
          break;
      }
    }

    if (!searchTerm.trim()) return result;

    const term = searchTerm.toLowerCase();
    return result.filter(m =>
      m.date.toLowerCase().includes(term) ||
      m.type.toLowerCase().includes(term) ||
      m.description.toLowerCase().includes(term) ||
      m.amount.toString().includes(term)
    );
  }, [allMovements, searchTerm, activeFilter]);

  // Paginate filtered movements
  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);
  const paginatedMovements = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMovements.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMovements, currentPage, itemsPerPage]);

  const toggleFilter = (filterType: string) => {
    setActiveFilter(prev => prev === filterType ? null : filterType);
    setCurrentPage(1);
  };

  const handleDownloadPDF = () => {
    generateMonthlyReport(
      stats.income,
      stats.totalExpenses,
      stats.totalIncome,
      stats.netProfit,
      monthlyExpenses,
      currentMonth,
      monthlyBookings,
      monthlySendero,
      monthlyBar,
      stats.senderoIncome,
      filterType,
      activeFilter,
      filteredMovements
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 w-full pb-20 md:pb-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-6 transition-colors duration-200">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setFilterType('day')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${filterType === 'day' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
            >
              Día
            </button>
            <button
              onClick={() => setFilterType('month')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${filterType === 'month' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
            >
              Mes
            </button>
            <button
              onClick={() => setFilterType('year')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${filterType === 'year' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
            >
              Año
            </button>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm">
            <button
              onClick={() => {
                const newDate = new Date(currentMonth);
                if (filterType === 'day') newDate.setDate(newDate.getDate() - 1);
                else if (filterType === 'year') newDate.setFullYear(newDate.getFullYear() - 1);
                else newDate.setMonth(newDate.getMonth() - 1);
                setCurrentMonth(newDate);
              }}
              className="p-1 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>

            {filterType === 'day' ? (
              <input
                type="date"
                value={format(currentMonth, 'yyyy-MM-dd')}
                onChange={(e) => setCurrentMonth(parseISO(e.target.value))}
                className="font-bold text-gray-800 dark:text-white bg-transparent border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:border-blue-500 text-base sm:text-lg min-w-[130px] sm:min-w-[150px] text-center"
              />
            ) : (
              <h2 className="text-base sm:text-xl font-bold text-gray-800 dark:text-white min-w-[120px] sm:min-w-[150px] text-center capitalize">
                {filterType === 'year'
                  ? format(currentMonth, 'yyyy', { locale: es })
                  : format(currentMonth, 'MMMM yyyy', { locale: es })}
              </h2>
            )}

            <button
              onClick={() => {
                const newDate = new Date(currentMonth);
                if (filterType === 'day') newDate.setDate(newDate.getDate() + 1);
                else if (filterType === 'year') newDate.setFullYear(newDate.getFullYear() + 1);
                else newDate.setMonth(newDate.getMonth() + 1);
                setCurrentMonth(newDate);
              }}
              className="p-1 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <button
          onClick={() => toggleFilter('income-reservas')}
          className={`relative text-left p-3 sm:p-5 rounded-xl shadow-sm border-t-4 border-blue-500 transition-all duration-300 cursor-pointer overflow-hidden
            ${activeFilter === 'income-reservas'
              ? 'bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500 transform scale-[1.02] z-10'
              : activeFilter
                ? 'bg-white dark:bg-gray-800 opacity-60 hover:opacity-100 grayscale-[0.3]'
                : 'bg-white dark:bg-gray-800 hover:scale-[1.02]'
            }`}
        >
          {activeFilter === 'income-reservas' && (
            <span className="absolute top-2 right-2 flex min-w-2 h-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
          )}
          <div className="flex items-center gap-1 sm:gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium leading-tight">Ingresos Reservas</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
            ${stats.income.toLocaleString()}
          </p>
        </button>

        <button
          onClick={() => toggleFilter('income-sendero')}
          className={`relative text-left p-3 sm:p-5 rounded-xl shadow-sm border-t-4 border-green-500 transition-all duration-300 cursor-pointer overflow-hidden
            ${activeFilter === 'income-sendero'
              ? 'bg-green-50 dark:bg-green-900/30 ring-2 ring-green-500 transform scale-[1.02] z-10'
              : activeFilter
                ? 'bg-white dark:bg-gray-800 opacity-60 hover:opacity-100 grayscale-[0.3]'
                : 'bg-white dark:bg-gray-800 hover:scale-[1.02]'
            }`}
        >
          {activeFilter === 'income-sendero' && (
            <span className="absolute top-2 right-2 flex min-w-2 h-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          )}
          <div className="flex items-center gap-1 sm:gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium leading-tight">Ingresos Sendero</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
            ${stats.senderoIncome.toLocaleString()}
          </p>
        </button>

        <button
          onClick={() => toggleFilter('income-bar')}
          className={`relative text-left p-3 sm:p-5 rounded-xl shadow-sm border-t-4 border-emerald-500 transition-all duration-300 cursor-pointer overflow-hidden
            ${activeFilter === 'income-bar'
              ? 'bg-emerald-50 dark:bg-emerald-900/30 ring-2 ring-emerald-500 transform scale-[1.02] z-10'
              : activeFilter
                ? 'bg-white dark:bg-gray-800 opacity-60 hover:opacity-100 grayscale-[0.3]'
                : 'bg-white dark:bg-gray-800 hover:scale-[1.02]'
            }`}
        >
          {activeFilter === 'income-bar' && (
            <span className="absolute top-2 right-2 flex min-w-2 h-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}
          <div className="flex items-center gap-1 sm:gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium leading-tight">Ingresos Bar</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
            ${stats.barIncome.toLocaleString()}
          </p>
        </button>

        <button
          onClick={() => toggleFilter('total-income')}
          className={`relative text-left p-3 sm:p-5 rounded-xl shadow-sm border-t-4 border-purple-500 transition-all duration-300 cursor-pointer overflow-hidden
            ${activeFilter === 'total-income'
              ? 'bg-purple-50 dark:bg-purple-900/30 ring-2 ring-purple-500 transform scale-[1.02] z-10'
              : activeFilter
                ? 'bg-white dark:bg-gray-800 opacity-60 hover:opacity-100 grayscale-[0.3]'
                : 'bg-white dark:bg-gray-800 hover:scale-[1.02]'
            }`}
        >
          {activeFilter === 'total-income' && (
            <span className="absolute top-2 right-2 flex min-w-2 h-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
          )}
          <div className="flex items-center gap-1 sm:gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <Wallet className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium leading-tight">Total Ingresos</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400 truncate">
            ${stats.totalIncome.toLocaleString()}
          </p>
        </button>

        <button
          onClick={() => toggleFilter('expenses')}
          className={`relative text-left p-3 sm:p-5 rounded-xl shadow-sm border-t-4 border-orange-500 transition-all duration-300 cursor-pointer overflow-hidden
            ${activeFilter === 'expenses'
              ? 'bg-orange-50 dark:bg-orange-900/30 ring-2 ring-orange-500 transform scale-[1.02] z-10'
              : activeFilter
                ? 'bg-white dark:bg-gray-800 opacity-60 hover:opacity-100 grayscale-[0.3]'
                : 'bg-white dark:bg-gray-800 hover:scale-[1.02]'
            }`}
        >
          {activeFilter === 'expenses' && (
            <span className="absolute top-2 right-2 flex min-w-2 h-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
          )}
          <div className="flex items-center gap-1 sm:gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <ArrowDownCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium leading-tight">Gastos / Compras</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-orange-600 dark:text-orange-400 truncate">
            -${stats.totalExpenses.toLocaleString()}
          </p>
        </button>

        <button
          onClick={() => toggleFilter('profit')}
          className={`relative text-left p-3 sm:p-5 rounded-xl shadow-sm border-t-4 border-green-500 transition-all duration-300 cursor-pointer overflow-hidden
            ${activeFilter === 'profit'
              ? 'bg-green-50 dark:bg-green-900/30 ring-2 ring-green-500 transform scale-[1.02] z-10'
              : activeFilter
                ? 'bg-white dark:bg-gray-800 opacity-60 hover:opacity-100 grayscale-[0.3]'
                : 'bg-white dark:bg-gray-800 hover:scale-[1.02]'
            }`}
        >
          {activeFilter === 'profit' && (
            <span className="absolute top-2 right-2 flex min-w-2 h-2 z-20">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          )}
          <div className="flex items-center gap-1 sm:gap-2 text-gray-500 dark:text-gray-400 mb-1 relative z-10">
            <Wallet className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium leading-tight">Beneficio Real</span>
          </div>
          <p
            className={`text-lg sm:text-2xl font-bold relative z-10 truncate ${stats.netProfit >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}
          >
            ${stats.netProfit.toLocaleString()}
          </p>
          {/* Visual flourish */}
          <div
            className={`absolute right-[-10px] bottom-[-10px] w-16 h-16 sm:w-20 sm:h-20 rounded-full opacity-10 ${stats.netProfit >= 0 ? 'bg-green-500' : 'bg-red-500'
              }`}
          ></div>
        </button>

        <button
          onClick={() => toggleFilter('pending')}
          className={`relative text-left p-3 sm:p-5 rounded-xl shadow-sm border-t-4 border-red-500 transition-all duration-300 cursor-pointer overflow-hidden
             ${activeFilter === 'pending'
              ? 'bg-red-50 dark:bg-red-900/30 ring-2 ring-red-500 transform scale-[1.02] z-10'
              : activeFilter
                ? 'bg-white dark:bg-gray-800 opacity-60 hover:opacity-100 grayscale-[0.3]'
                : 'bg-white dark:bg-gray-800 hover:scale-[1.02]'
            }`}
        >
          {activeFilter === 'pending' && (
            <span className="absolute top-2 right-2 flex min-w-2 h-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}
          <div className="flex items-center gap-1 sm:gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium leading-tight">Pendiente Cobro</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400 truncate">
            ${stats.pending.toLocaleString()}
          </p>
        </button>
      </div>

      {/* Movements Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden transition-colors duration-200">
        <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="font-bold text-gray-700 dark:text-gray-200">
              Movimientos {activeFilter && `(Filtrado)`}
            </h3>
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
                      {movement.paymentMethod && (
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${movement.paymentMethod === 'transfer' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'}`}>
                          {movement.paymentMethod === 'transfer' ? 'Transf.' : 'Efectivo'}
                        </span>
                      )}
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
