import React, { useState } from 'react';
import { format, subMonths, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, DollarSign, Download, TrendingDown, TrendingUp } from 'lucide-react';
import { BarTransaction } from '../types';
import { generateBarMonthlyReport } from '../services/pdfService';

interface BarResumenProps {
    transactions: BarTransaction[];
}

export const BarResumen: React.FC<BarResumenProps> = ({ transactions }) => {
    const [selectedMonth, setSelectedMonth] = useState(new Date());

    const currentMonthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === selectedMonth.getMonth() &&
            tDate.getFullYear() === selectedMonth.getFullYear();
    });

    const totalIncome = currentMonthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = currentMonthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    const handlePrevMonth = () => setSelectedMonth(subMonths(selectedMonth, 1));
    const handleNextMonth = () => setSelectedMonth(addMonths(selectedMonth, 1));

    const handleDownloadPDF = () => {
        generateBarMonthlyReport(currentMonthTransactions, selectedMonth);
    };

    return (
        <div className="space-y-6">
            {/* Month Selector */}
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
                    <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <span className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                    {format(selectedMonth, 'MMMM yyyy', { locale: es })}
                </span>
                <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
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
                    <span>Descargar PDF del Mes</span>
                </button>
            </div>

        </div>
    );
};
