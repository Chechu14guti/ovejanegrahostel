import React, { useState, useMemo } from 'react';
import { Expense } from '../types';
import { saveExpense, deleteExpense } from '../services/storageService';
import { format, endOfMonth, isWithinInterval, subMonths, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

let globalExpenseDate: string | null = null;

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
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [date, setDate] = useState(globalExpenseDate || format(new Date(), 'yyyy-MM-dd'));
  const [formError, setFormError] = useState<string | null>(null);
  const [successAnim, setSuccessAnim] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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
    if (!date) {
      setFormError('La fecha es obligatoria.');
      return;
    }
    if (!description) {
      setFormError('El concepto es obligatorio.');
      return;
    }
    if (!amount) {
      setFormError('El costo es obligatorio.');
      return;
    }
    setFormError(null);

    const newExpense: Expense = {
      id: generateId(),
      date,
      description,
      amount: parseFloat(amount),
      paymentMethod,
      createdAt: Date.now()
    };

    saveExpense(newExpense);
    onUpdate();

    // Reset form but keep date
    setDescription('');
    setAmount('');

    setSuccessAnim(true);
    setTimeout(() => setSuccessAnim(false), 1500);
  };

  const handleDeleteSubmit = () => {
    if (deleteConfirmId) {
      deleteExpense(deleteConfirmId);
      onUpdate();
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 w-full pb-20 md:pb-6">

      {deleteConfirmId && (
        <ConfirmModal
          isOpen={!!deleteConfirmId}
          title="Eliminar gasto"
          message="¿Seguro que quieres eliminar este gasto?"
          messageSecondary="Esta acción no se puede deshacer."
          confirmText="Eliminar"
          onConfirm={handleDeleteSubmit}
          onCancel={() => setDeleteConfirmId(null)}
        />
      )}

      {/* Header with Date Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-6 gap-4 transition-colors duration-200">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <ShoppingCart className="text-orange-500" />
          Control de Compras
        </h2>
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-medium capitalize w-40 text-center text-gray-900 dark:text-white">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </span>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Form Section */}
        <div className={`relative bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm h-fit transition-all duration-300 ${successAnim ? 'border-2 border-green-500 ring-2 ring-green-200 dark:ring-green-900 scale-[1.01]' : 'border border-transparent'}`}>
          {successAnim && (
            <div className="absolute -top-3 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-md animate-bounce flex items-center gap-1">
              <span className="text-xl leading-none">✓</span> Guardado
            </div>
          )}
          <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 border-b dark:border-gray-700 pb-2">Nueva Compra</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm border border-red-200 dark:border-red-800">
                {formError}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  globalExpenseDate = e.target.value;
                }}
                className="w-full p-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Producto / Concepto</label>
              <input
                type="text"
                placeholder="Ej. Productos de limpieza"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Costo ($)</label>
              <input
                type="number"
                placeholder="0.00"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none font-bold text-gray-800 dark:text-white bg-white dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Método de Pago</label>
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition ${paymentMethod === 'cash' ? 'bg-white dark:bg-gray-600 shadow text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  Efectivo
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('transfer')}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition ${paymentMethod === 'transfer' ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  Transferencia
                </button>
              </div>
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
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden flex flex-col transition-colors duration-200">
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700 flex justify-between items-center">
            <span className="font-semibold text-gray-600 dark:text-gray-300">Historial del Mes</span>
            <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-3 py-1 rounded-full text-sm font-bold">
              Total: ${totalMonthly.toLocaleString()}
            </span>
          </div>

          <div className="overflow-y-auto max-h-[500px] p-0">
            {monthlyExpenses.length === 0 ? (
              <div className="p-8 text-center text-gray-400 dark:text-gray-500">
                No hay compras registradas este mes.
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Concepto</th>
                    <th className="px-4 py-3 text-right">Monto</th>
                    <th className="px-4 py-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {monthlyExpenses.map(expense => (
                    <tr key={expense.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {format(parseLocalISO(expense.date), 'dd/MM')}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                        {expense.description}
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${expense.paymentMethod === 'transfer' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'}`}>
                          {expense.paymentMethod === 'transfer' ? 'Transf.' : 'Efectivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-700 dark:text-gray-300">
                        ${expense.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setDeleteConfirmId(expense.id)}
                          className="text-red-400 hover:text-red-600 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition"
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