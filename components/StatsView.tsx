import React, { useMemo } from 'react';
import { Booking, Expense } from '../types';
import { format, subMonths, isWithinInterval, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsViewProps {
  bookings: Booking[];
  expenses: Expense[];
}

const parseLocalISO = (s: string) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
};

const getStartOfMonth = (d: Date) => {
  const newDate = new Date(d);
  newDate.setDate(1);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

export const StatsView: React.FC<StatsViewProps> = ({ bookings, expenses }) => {
  
  const monthlyData = useMemo(() => {
    const data = [];
    const today = new Date();
    
    // Generate last 12 months
    for (let i = 11; i >= 0; i--) {
        const d = subMonths(today, i);
        const start = getStartOfMonth(d);
        const end = endOfMonth(d);
        const monthKey = format(d, 'MMM yyyy', { locale: es });

        // Calculate Income
        const monthIncome = bookings.reduce((sum, b) => {
            const checkIn = parseLocalISO(b.checkIn);
            if (isWithinInterval(checkIn, { start, end })) {
                return sum + b.total;
            }
            return sum;
        }, 0);

        // Calculate Expenses
        const monthExpense = expenses.reduce((sum, e) => {
            const eDate = parseLocalISO(e.date);
            if (isWithinInterval(eDate, { start, end })) {
                return sum + e.amount;
            }
            return sum;
        }, 0);

        data.push({
            month: monthKey,
            income: monthIncome,
            expense: monthExpense,
            profit: monthIncome - monthExpense,
            date: d // kept for sorting if needed
        });
    }
    return data;
  }, [bookings, expenses]);

  const currentMonth = monthlyData[monthlyData.length - 1];
  const prevMonth = monthlyData[monthlyData.length - 2];

  const growth = prevMonth.income > 0 
    ? ((currentMonth.income - prevMonth.income) / prevMonth.income) * 100 
    : 0;

  const maxVal = Math.max(...monthlyData.map(d => Math.max(d.income, d.expense)));

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Estadísticas y Crecimiento</h2>

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
                <p className="text-sm text-gray-500 font-medium uppercase mb-1">Crecimiento Mensual</p>
                <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-gray-900">{Math.abs(growth).toFixed(1)}%</span>
                    {growth > 0 ? (
                        <TrendingUp className="text-green-500 mb-1" />
                    ) : growth < 0 ? (
                        <TrendingDown className="text-red-500 mb-1" />
                    ) : <Minus className="text-gray-400 mb-1" />}
                </div>
                <p className="text-xs text-gray-400 mt-2">Comparado con el mes anterior</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
                <p className="text-sm text-gray-500 font-medium uppercase mb-1">Beneficio Anual</p>
                <span className="text-3xl font-bold text-blue-600">
                    ${monthlyData.reduce((acc, curr) => acc + curr.profit, 0).toLocaleString()}
                </span>
                <p className="text-xs text-gray-400 mt-2">Últimos 12 meses</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
                 <p className="text-sm text-gray-500 font-medium uppercase mb-1">Promedio Mensual</p>
                 <span className="text-3xl font-bold text-purple-600">
                    ${(monthlyData.reduce((acc, curr) => acc + curr.income, 0) / 12).toFixed(0).toLocaleString()}
                </span>
                <p className="text-xs text-gray-400 mt-2">Ingresos promedio</p>
            </div>
        </div>

        {/* Charts */}
        <div className="bg-white p-6 rounded-xl shadow-sm overflow-x-auto">
            <h3 className="font-bold text-gray-700 mb-6">Evolución Anual (Ingresos vs Gastos)</h3>
            
            <div className="h-64 flex items-end gap-3 sm:gap-6 min-w-[600px]">
                {monthlyData.map((data, idx) => {
                    const heightIncome = maxVal > 0 ? (data.income / maxVal) * 100 : 0;
                    const heightExpense = maxVal > 0 ? (data.expense / maxVal) * 100 : 0;
                    
                    return (
                        <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs p-2 rounded z-10 w-32 text-center shadow-lg">
                                <div className="font-bold">{data.month}</div>
                                <div className="text-green-300">Ing: ${data.income}</div>
                                <div className="text-red-300">Gas: ${data.expense}</div>
                                <div className="border-t border-gray-600 mt-1 pt-1 font-bold">Net: ${data.profit}</div>
                            </div>

                            <div className="w-full flex gap-1 items-end h-full justify-center px-1">
                                {/* Income Bar */}
                                <div 
                                    style={{ height: `${Math.max(heightIncome, 1)}%` }} 
                                    className="w-full bg-blue-500 rounded-t opacity-80 hover:opacity-100 transition-all relative"
                                ></div>
                                {/* Expense Bar */}
                                <div 
                                    style={{ height: `${Math.max(heightExpense, 1)}%` }} 
                                    className="w-full bg-orange-400 rounded-t opacity-80 hover:opacity-100 transition-all relative"
                                ></div>
                            </div>
                            <span className="text-[10px] sm:text-xs text-gray-500 mt-2 font-medium rotate-0 whitespace-nowrap capitalize">
                                {data.month.split(' ')[0]}
                            </span>
                        </div>
                    );
                })}
            </div>
            <div className="flex justify-center gap-6 mt-6 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-gray-600">Ingresos</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-400 rounded"></div>
                    <span className="text-gray-600">Gastos</span>
                </div>
            </div>
        </div>

    </div>
  );
};