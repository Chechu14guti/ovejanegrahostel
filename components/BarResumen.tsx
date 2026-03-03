import React, { useState } from 'react';
import { format, subMonths, addMonths, subDays, addDays, subYears, addYears } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, DollarSign, Download, TrendingDown, TrendingUp, Calendar, CalendarDays, CalendarCheck } from 'lucide-react';
import { BarTransaction } from '../types';
import { generateBarMonthlyReport } from '../services/pdfService';

import { useStore } from '../store/useStore';

export const BarResumen: React.FC = () => {
    const { barTransactions: transactions } = useStore();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [filterType, setFilterType] = useState<'day' | 'month' | 'year'>('month');
    const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'transfer'>('all');

    const filteredTransactions = transactions.filter(t => {
        // Use parseLocalISO trick or just string matching to avoid timezone shifts if t.date is YYYY-MM-DD
        const tDate = new Date(t.date + 'T00:00:00'); // Force local midnight

        let matchDate = false;
        if (filterType === 'day') {
            matchDate = tDate.getDate() === selectedDate.getDate() &&
                tDate.getMonth() === selectedDate.getMonth() &&
                tDate.getFullYear() === selectedDate.getFullYear();
        } else if (filterType === 'month') {
            matchDate = tDate.getMonth() === selectedDate.getMonth() &&
                tDate.getFullYear() === selectedDate.getFullYear();
        } else { // year
            matchDate = tDate.getFullYear() === selectedDate.getFullYear();
        }

        if (!matchDate) return false;

        if (paymentFilter !== 'all') {
            // Include backward compatibility if some old transactions don't have a paymentMethod 
            // but the user filters by cash/transfer, we assume they only want those that explicitly match.
            return t.paymentMethod === paymentFilter;
        }

        return true;
    });

    const totalIncome = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    const handlePrev = () => {
        if (filterType === 'day') setSelectedDate(subDays(selectedDate, 1));
        else if (filterType === 'month') setSelectedDate(subMonths(selectedDate, 1));
        else setSelectedDate(subYears(selectedDate, 1));
    };

    const handleNext = () => {
        if (filterType === 'day') setSelectedDate(addDays(selectedDate, 1));
        else if (filterType === 'month') setSelectedDate(addMonths(selectedDate, 1));
        else setSelectedDate(addYears(selectedDate, 1));
    };

    const handleDownloadPDF = () => {
        // PDF defaults to "Monthly" logic currently, but passing filtered works depending on pdfService.
        generateBarMonthlyReport(filteredTransactions, selectedDate, filterType, paymentFilter);
    };

    return (
        <div className="space-y-6">
            {/* Filter Type Toggle */}
            <div className="flex flex-col md:flex-row gap-4 justify-center mb-6">
                <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl inline-flex shadow-sm border border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setFilterType('day')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${filterType === 'day' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                    >
                        <CalendarDays className="w-4 h-4" /> Día
                    </button>
                    <button
                        onClick={() => setFilterType('month')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${filterType === 'month' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                    >
                        <Calendar className="w-4 h-4" /> Mes
                    </button>
                    <button
                        onClick={() => setFilterType('year')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${filterType === 'year' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                    >
                        <CalendarCheck className="w-4 h-4" /> Año
                    </button>
                </div>

                <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl inline-flex shadow-sm border border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setPaymentFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${paymentFilter === 'all' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setPaymentFilter('cash')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${paymentFilter === 'cash' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                    >
                        Efectivo
                    </button>
                    <button
                        onClick={() => setPaymentFilter('transfer')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${paymentFilter === 'transfer' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                    >
                        Transferencia
                    </button>
                </div>
            </div>

            {/* Date Selector */}
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <button onClick={handlePrev} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
                    <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">
                        {filterType === 'day' ? 'Viendo por Día' : filterType === 'month' ? 'Viendo por Mes' : 'Viendo por Año'}
                    </span>
                    <span className="text-xl font-bold text-gray-900 dark:text-white capitalize">
                        {filterType === 'day' && format(selectedDate, 'dd MMMM yyyy', { locale: es })}
                        {filterType === 'month' && format(selectedDate, 'MMMM yyyy', { locale: es })}
                        {filterType === 'year' && format(selectedDate, 'yyyy', { locale: es })}
                    </span>
                </div>
                <button onClick={handleNext} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
                    <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Income Card */}
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-xl border border-emerald-100 dark:border-emerald-800/30 flex items-center gap-4">
                    <div className="bg-emerald-100 dark:bg-emerald-800/50 p-3 rounded-lg text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Ingresos Totales</p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            ${totalIncome.toFixed(2)}
                        </p>
                    </div>
                </div>

                {/* Expense Card */}
                <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-100 dark:border-red-800/30 flex items-center gap-4">
                    <div className="bg-red-100 dark:bg-red-800/50 p-3 rounded-lg text-red-600 dark:text-red-400">
                        <TrendingDown className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-red-800 dark:text-red-300">Gastos Totales</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                            ${totalExpense.toFixed(2)}
                        </p>
                    </div>
                </div>

                {/* Balance Card */}
                <div className={`${balance >= 0 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/30' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800/30'} p-6 rounded-xl border flex items-center gap-4`}>
                    <div className={`${balance >= 0 ? 'bg-blue-100 dark:bg-blue-800/50 text-blue-600 dark:text-blue-400' : 'bg-orange-100 dark:bg-orange-800/50 text-orange-600 dark:text-orange-400'} p-3 rounded-lg`}>
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                        <p className={`text-sm font-medium ${balance >= 0 ? 'text-blue-800 dark:text-blue-300' : 'text-orange-800 dark:text-orange-300'}`}>
                            Balance Neto
                        </p>
                        <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                            ${balance.toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    onClick={handleDownloadPDF}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                    <Download className="w-5 h-5" />
                    <span>Descargar PDF</span>
                </button>
            </div>

        </div>
    );
};
