import React, { useState } from 'react';
import { PackageOpen, Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { BarInventoryItem } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface BarInventarioProps {
    items: BarInventoryItem[];
    onAdd: (item: BarInventoryItem) => void;
    onUpdate: (item: BarInventoryItem) => void;
    onDelete: (id: string) => void;
}

export const BarInventario: React.FC<BarInventarioProps> = ({ items, onAdd, onUpdate, onDelete }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [stock, setStock] = useState('');
    const [price, setPrice] = useState('');

    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const [editForm, setEditForm] = useState<{
        name: string;
        category: string;
        currentStock: string;
        price: string;
    }>({ name: '', category: '', currentStock: '', price: '' });

    const sortedItems = [...items].sort((a, b) => a.name.localeCompare(b.name));

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !stock || !price) return;

        const initialQuant = parseInt(stock, 10);

        onAdd({
            id: crypto.randomUUID(),
            name,
            category: category || 'General',
            initialStock: initialQuant,
            currentStock: initialQuant,
            price: parseFloat(price),
            createdAt: Date.now(),
        });

        setName('');
        setCategory('');
        setStock('');
        setPrice('');
    };

    const startEdit = (item: BarInventoryItem) => {
        setEditingId(item.id);
        setEditForm({
            name: item.name,
            category: item.category,
            currentStock: item.currentStock.toString(),
            price: item.price.toString(),
        });
    };

    const cancelEdit = () => setEditingId(null);

    const saveEdit = (id: string, originalItem: BarInventoryItem) => {
        if (!editForm.name || !editForm.currentStock || !editForm.price) return;

        onUpdate({
            ...originalItem,
            name: editForm.name,
            category: editForm.category || 'General',
            currentStock: parseInt(editForm.currentStock, 10),
            price: parseFloat(editForm.price)
        });
        setEditingId(null);
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleAdd} className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="col-span-1 md:col-span-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Producto</label>
                    <input
                        type="text"
                        required
                        placeholder="Ej: Cerveza IPA"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
                    <input
                        type="text"
                        placeholder="Bebidas, Comida..."
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock Inicial</label>
                    <input
                        type="number"
                        required
                        min="0"
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Precio Unitario</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
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
                    title="Eliminar producto"
                    message="¿Seguro que quieres borrar este producto?"
                    messageSecondary="No afectará a las ventas ya realizadas contablemente."
                    confirmText="Eliminar"
                    onConfirm={() => onDelete(deleteConfirmId)}
                    onCancel={() => setDeleteConfirmId(null)}
                />
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm whitespace-nowrap">
                            <th className="pb-3 font-medium pr-4">Nombre</th>
                            <th className="pb-3 font-medium pr-4">Categoría</th>
                            <th className="pb-3 font-medium text-center pr-4">Stock Actual</th>
                            <th className="pb-3 font-medium text-right pr-4">Precio Ref.</th>
                            <th className="pb-3 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {sortedItems.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-12 text-center">
                                    <PackageOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-500 dark:text-gray-400 font-medium">Aún no hay productos en tu inventario</p>
                                </td>
                            </tr>
                        ) : (
                            sortedItems.map((item) => (
                                <tr key={item.id} className="text-gray-900 dark:text-white whitespace-nowrap">
                                    {editingId === item.id ? (
                                        <>
                                            <td className="py-3 pr-2">
                                                <input
                                                    type="text"
                                                    value={editForm.name}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                                    className="w-full text-sm rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-1"
                                                />
                                            </td>
                                            <td className="py-3 px-2">
                                                <input
                                                    type="text"
                                                    value={editForm.category}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                                                    className="w-full text-sm rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-1"
                                                />
                                            </td>
                                            <td className="py-3 px-2 text-center">
                                                <input
                                                    type="number"
                                                    value={editForm.currentStock}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, currentStock: e.target.value }))}
                                                    className="w-20 mx-auto text-sm rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-1 text-center"
                                                />
                                            </td>
                                            <td className="py-3 px-2">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={editForm.price}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                                                    className="w-full text-sm rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-1 text-right"
                                                />
                                            </td>
                                            <td className="py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => saveEdit(item.id, item)} className="p-1 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded">
                                                        <Check className="w-5 h-5" />
                                                    </button>
                                                    <button onClick={cancelEdit} className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="py-3 font-medium pr-4">{item.name}</td>
                                            <td className="py-3 text-gray-600 dark:text-gray-300 text-sm pr-4">{item.category}</td>
                                            <td className="py-3 text-center text-lg font-bold pr-4">
                                                <span className={`${item.currentStock <= 5 ? 'text-orange-500' : (item.currentStock === 0 ? 'text-red-500' : 'text-blue-600 dark:text-blue-400')}`}>
                                                    {item.currentStock}
                                                </span>
                                            </td>
                                            <td className="py-3 text-right text-gray-600 dark:text-gray-300 pr-4">${item.price.toFixed(2)}</td>
                                            <td className="py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => startEdit(item)}
                                                        className="p-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded transition"
                                                        title="Editar"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirmId(item.id)}
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
