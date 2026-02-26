import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { BarTransaction, BarInventoryItem } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface BarContabilidadProps {
    transactions: BarTransaction[];
    inventoryItems: BarInventoryItem[];
    onAdd: (t: BarTransaction) => void;
    onUpdate: (t: BarTransaction) => void;
    onDelete: (id: string) => void;
    onChangeInventoryStock: (id: string, amountChange: number) => void;
}

export const BarContabilidad: React.FC<BarContabilidadProps> = ({
    transactions,
    inventoryItems,
    onAdd,
    onUpdate,
    onDelete,
    onChangeInventoryStock,
}) => {
    const [description, setDescription] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'income' | 'expense'>('income');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [formError, setFormError] = useState<string | null>(null);

    const [isFromInventory, setIsFromInventory] = useState(false);
    const [selectedInventoryId, setSelectedInventoryId] = useState('');

    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const [editForm, setEditForm] = useState<{
        description: string;
        quantity: string;
        amount: string;
        date: string;
        type: 'income' | 'expense';
    }>({ description: '', quantity: '1', amount: '', date: '', type: 'income' });

    const selectedItem = inventoryItems.find(i => i.id === selectedInventoryId);
    const maxQuantity = type === 'income' && isFromInventory && selectedItem ? selectedItem.currentStock : undefined;

    const editingTx = transactions.find(t => t.id === editingId);
    const editingItem = inventoryItems.find(i => i.id === editingTx?.inventoryItemId);
    const maxEditQuantity = editForm.type === 'income' && editingTx?.isFromInventory && editingItem
        ? editingItem.currentStock + (editingTx.quantity || 1)
        : undefined;

    const sortedTransactions = [...transactions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const handleInventoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setSelectedInventoryId(id);
        const item = inventoryItems.find(i => i.id === id);
        if (item) {
            setDescription(item.name);
            setAmount((item.price * parseInt(quantity || '1', 10)).toString());
        } else {
            setDescription('');
            setAmount('');
        }
    };

    const handleQuantityChange = (val: string) => {
        setQuantity(val);
        if (isFromInventory && selectedInventoryId) {
            const item = inventoryItems.find(i => i.id === selectedInventoryId);
            if (item) {
                setAmount((item.price * parseInt(val || '1', 10)).toString());
            }
        }
    };

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();

        let finalDescription = description;
        if (type === 'income' && isFromInventory) {
            if (!selectedInventoryId) return; // need an item
            const item = inventoryItems.find(i => i.id === selectedInventoryId);
            if (!item) return;
            finalDescription = item.name;
        }

        if (!finalDescription || !amount || !date) return;

        const initialQuant = parseInt(quantity, 10);

        if (type === 'income' && isFromInventory && selectedInventoryId) {
            const item = inventoryItems.find(i => i.id === selectedInventoryId);
            if (!item || initialQuant > item.currentStock) {
                setFormError(`Stock insuficiente para ${item?.name}. Máximo disponible: ${item?.currentStock || 0}`);
                return;
            }
        }
        setFormError(null);

        onAdd({
            id: crypto.randomUUID(),
            description: finalDescription,
            quantity: initialQuant,
            amount: parseFloat(amount),
            type,
            date,
            isFromInventory: type === 'income' ? isFromInventory : false,
            inventoryItemId: type === 'income' && isFromInventory ? selectedInventoryId : undefined,
            createdAt: Date.now(),
        });

        // Restar del inventario
        if (type === 'income' && isFromInventory && selectedInventoryId) {
            onChangeInventoryStock(selectedInventoryId, -initialQuant);
        }

        setDescription('');
        setQuantity('1');
        setAmount('');
        setSelectedInventoryId('');
        // keep date and type the same for convenience
    };

    const startEdit = (t: BarTransaction) => {
        setEditingId(t.id);
        setEditForm({
            description: t.description,
            quantity: t.quantity ? t.quantity.toString() : '1',
            amount: t.amount.toString(),
            date: t.date,
            type: t.type,
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    const saveEdit = (id: string) => {
        if (!editForm.description || !editForm.amount || !editForm.date) return;

        // Find the original timestamp and transaction
        const original = transactions.find(t => t.id === id);

        const newQuant = editForm.quantity ? parseInt(editForm.quantity, 10) : 1;
        const oldQuant = original?.quantity || 1;

        if (original?.isFromInventory && original?.inventoryItemId && editForm.type === 'income') {
            const item = inventoryItems.find(i => i.id === original.inventoryItemId);
            const available = (item?.currentStock || 0) + oldQuant;
            if (newQuant > available) {
                setFormError(`Stock insuficiente para editar. Máximo disponible: ${available}`);
                return;
            }
        }
        setFormError(null);

        if (original?.isFromInventory && original?.inventoryItemId) {
            let stockChange = 0;
            if (editForm.type === 'income') {
                stockChange = oldQuant - newQuant; // e.g. old:10, new:5 -> +5 stock (restore 5). old:10, new:15 -> -5 stock (deduct 5)
            } else {
                stockChange = oldQuant; // Restore all if changed to expense
            }
            if (stockChange !== 0) {
                onChangeInventoryStock(original.inventoryItemId, stockChange);
            }
        }

        onUpdate({
            id,
            description: editForm.description,
            quantity: newQuant,
            amount: parseFloat(editForm.amount),
            date: editForm.date,
            type: editForm.type,
            isFromInventory: editForm.type === 'income' ? original?.isFromInventory : false,
            inventoryItemId: editForm.type === 'income' ? original?.inventoryItemId : undefined,
            createdAt: original?.createdAt || Date.now(),
        });
        setEditingId(null);
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleAdd} className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-12 gap-4">
                {formError && (
                    <div className="col-span-1 md:col-span-12 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm border border-red-200 dark:border-red-800">
                        {formError}
                    </div>
                )}
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value as 'income' | 'expense')}
                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                        <option value="income">Ingreso (+)</option>
                        <option value="expense">Gasto (-)</option>
                    </select>
                </div>
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha</label>
                    <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
                <div className="col-span-1 md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Concepto</label>
                    {type === 'income' && isFromInventory ? (
                        <select
                            required
                            value={selectedInventoryId}
                            onChange={handleInventoryChange}
                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value="">Selecciona un producto...</option>
                            {inventoryItems.map(item => (
                                <option key={item.id} value={item.id}>{item.name} ({item.currentStock} disp)</option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type="text"
                            required
                            placeholder="Ej: Cervezas x10"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    )}
                    {type === 'income' && (
                        <div className="mt-2 flex items-center">
                            <input
                                type="checkbox"
                                id="isFromInventory"
                                checked={isFromInventory}
                                onChange={(e) => {
                                    setIsFromInventory(e.target.checked);
                                    if (!e.target.checked) {
                                        setSelectedInventoryId('');
                                        setDescription('');
                                    }
                                }}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <label htmlFor="isFromInventory" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                Es un producto del inventario?
                            </label>
                        </div>
                    )}
                </div>
                <div className="col-span-1 md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cant.</label>
                    <input
                        type="number"
                        min="1"
                        max={maxQuantity}
                        required
                        value={quantity}
                        onChange={(e) => handleQuantityChange(e.target.value)}
                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monto</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full pl-8 rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <div className="col-span-1 md:col-span-2 flex items-end">
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Añadir</span>
                    </button>
                </div>
            </form>

            {deleteConfirmId && (
                <ConfirmModal
                    isOpen={!!deleteConfirmId}
                    title="Eliminar movimiento"
                    message="¿Estás seguro de que deseas eliminar este movimiento?"
                    messageSecondary="Esta acción no se puede deshacer."
                    confirmText="Eliminar"
                    onConfirm={() => {
                        const t = transactions.find(tx => tx.id === deleteConfirmId);
                        if (t) {
                            if (t.isFromInventory && t.inventoryItemId) {
                                // Restaurar el stock
                                onChangeInventoryStock(t.inventoryItemId, t.quantity || 1);
                            }
                            onDelete(t.id);
                        }
                    }}
                    onCancel={() => setDeleteConfirmId(null)}
                />
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm whitespace-nowrap">
                            <th className="pb-3 font-medium pr-4">Fecha</th>
                            <th className="pb-3 font-medium pr-4">Concepto</th>
                            <th className="pb-3 font-medium text-right pr-4">Cant.</th>
                            <th className="pb-3 font-medium text-right pr-4">Monto</th>
                            <th className="pb-3 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {sortedTransactions.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-gray-400">
                                    No hay movimientos registrados.
                                </td>
                            </tr>
                        ) : (
                            sortedTransactions.map((t) => (
                                <tr key={t.id} className="text-gray-900 dark:text-white whitespace-nowrap">
                                    {editingId === t.id ? (
                                        // Editar modo
                                        <>
                                            <td className="py-3 pr-2">
                                                <input
                                                    type="date"
                                                    value={editForm.date}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                                                    className="w-full text-sm rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-1"
                                                />
                                            </td>
                                            <td className="py-3 px-2 flex gap-2">
                                                <select
                                                    value={editForm.type}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value as any }))}
                                                    className="w-24 text-sm rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-1"
                                                >
                                                    <option value="income">Ing (+)</option>
                                                    <option value="expense">Gas (-)</option>
                                                </select>
                                                <input
                                                    type="text"
                                                    value={editForm.description}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                                    className="w-full text-sm rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-1"
                                                />
                                            </td>
                                            <td className="py-3 px-2 text-right">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={maxEditQuantity}
                                                    value={editForm.quantity}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, quantity: e.target.value }))}
                                                    className="w-16 mx-auto text-sm rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-1 text-center"
                                                />
                                            </td>
                                            <td className="py-3 px-2">
                                                <input
                                                    type="number"
                                                    value={editForm.amount}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, amount: e.target.value }))}
                                                    className="w-full text-sm rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-1 text-right"
                                                />
                                            </td>
                                            <td className="py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => saveEdit(t.id)} className="p-1 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded">
                                                        <Check className="w-5 h-5" />
                                                    </button>
                                                    <button onClick={cancelEdit} className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        // Vista normal
                                        <>
                                            <td className="py-3 pr-4">{format(new Date(t.date), 'dd/MM/yyyy')}</td>
                                            <td className="py-3 font-medium pr-4">
                                                {t.description}
                                                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${t.type === 'income' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'}`}>
                                                    {t.type === 'income' ? 'Ingreso' : 'Gasto'}
                                                </span>
                                            </td>
                                            <td className="py-3 text-right pr-4">
                                                {t.quantity || 1}
                                            </td>
                                            <td className={`py-3 text-right font-semibold pr-4 ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {t.type === 'income' ? '+' : '-'}${t.amount}
                                            </td>
                                            <td className="py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => startEdit(t)}
                                                        className="p-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded transition"
                                                        title="Editar"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirmId(t.id)}
                                                        className="p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded transition"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
