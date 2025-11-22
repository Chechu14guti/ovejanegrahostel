import React, { useState, useMemo } from 'react';
import { Expense } from '../types';
import { saveExpense, deleteExpense } from '../services/storageService';
import { format, endOfMonth, isWithinInterval, subMonths, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Trash2, ShoppingCart } from 'lucide-react';

interface ExpensesViewProps {
  expenses: Expense[];
  onUpdate: () => void;
}

// Helper functions
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

const generateId = () => Math.random().toString(36).substr(2, 9);

export const ExpensesView: React.FC<ExpensesViewProps> = ({ expenses, onUpdate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const monthlyExpenses = useMemo(() => {
    const start = getStartOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return expenses.filter(e => {
      const expenseDate = parseLocalISO(e.date);
      return isWithinInterval(expenseDate, { start, end });
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, currentMonth]);

  const totalMonthly = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !date) return;

    const newExpense: Expense = {
      id: generateId(),
      date,
      description,
      amount: parseFloat(amount),
      createdAt: Date.now()
    };

    saveExpense(newExpense);
    onUpdate();
    
    // Reset form but keep date
    setDescription('');
    setAmount('');
  };

  const handleDelete = (id: string) => {
    if(confirm('¿Eliminar este gasto?')) {
        deleteExpense(id);
        onUpdate();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 w-full">
      
      {/* Header with Date Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart className="text-orange-500" />
            Control de Compras
        </h2>
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-medium capitalize w-40 text-center">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </span>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm h-fit">
            <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">Nueva Compra</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Fecha</label>
                    <input 
                        type="date" 
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Producto / Concepto</label>
                    <input 
                        type="text" 
                        placeholder="Ej. Productos de limpieza"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Costo ($)</label>
                    <input 
                        type="number" 
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none font-bold text-gray-800"
                        required
                    />
                </div>
                <button 
                    type="submit"
                    className="w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition flex items-center justify-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Agregar Gasto
                </button>
            </form>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                <span className="font-semibold text-gray-600">Historial del Mes</span>
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
                    Total: ${totalMonthly.toLocaleString()}
                </span>
            </div>
            
            <div className="overflow-y-auto max-h-[500px] p-0">
                {monthlyExpenses.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        No hay compras registradas este mes.
                    </div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-4 py-3">Fecha</th>
                                <th className="px-4 py-3">Concepto</th>
                                <th className="px-4 py-3 text-right">Monto</th>
                                <th className="px-4 py-3 text-center">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthlyExpenses.map(expense => (
                                <tr key={expense.id} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                                        {format(parseLocalISO(expense.date), 'dd/MM')}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-800">
                                        {expense.description}
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-gray-700">
                                        ${expense.amount.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button 
                                            onClick={() => handleDelete(expense.id)}
                                            className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};