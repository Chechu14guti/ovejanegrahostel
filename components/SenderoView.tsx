import React, { useState } from 'react';
import { SenderoRecord } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Trash2, Footprints } from 'lucide-react';

interface SenderoViewProps {
    records: SenderoRecord[];
    onAddRecord: (record: SenderoRecord) => void;
    onDeleteRecord: (id: string) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const SenderoView: React.FC<SenderoViewProps> = ({ records, onAddRecord, onDeleteRecord }) => {
    const [empleado, setEmpleado] = useState('');
    const [cantidadPersonas, setCantidadPersonas] = useState('');
    const [precioPorPersona, setPrecioPorPersona] = useState('');
    const [horas, setHoras] = useState('');
    const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [errors, setErrors] = useState<string[]>([]);

    const validateForm = (): boolean => {
        const newErrors: string[] = [];

        if (!empleado.trim()) {
            newErrors.push('El campo "Empleado" es obligatorio');
        }
        if (!cantidadPersonas || parseInt(cantidadPersonas) < 1) {
            newErrors.push('El campo "Cantidad de Personas" es obligatorio y debe ser mayor a 0');
        }
        if (!precioPorPersona || parseFloat(precioPorPersona) < 0) {
            newErrors.push('El campo "Precio por Persona" es obligatorio y debe ser mayor o igual a 0');
        }
        if (!horas || parseFloat(horas) < 0) {
            newErrors.push('El campo "Horas" es obligatorio y debe ser mayor o igual a 0');
        }

        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const newRecord: SenderoRecord = {
            id: generateId(),
            empleado: empleado.trim(),
            cantidadPersonas: parseInt(cantidadPersonas),
            precioPorPersona: parseFloat(precioPorPersona),
            horas: parseFloat(horas),
            fecha,
            createdAt: Date.now(),
        };

        onAddRecord(newRecord);

        // Reset form
        setEmpleado('');
        setCantidadPersonas('');
        setPrecioPorPersona('');
        setHoras('');
        setFecha(format(new Date(), 'yyyy-MM-dd'));
        setErrors([]);
    };

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 w-full pb-20 md:pb-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Footprints className="w-8 h-8 text-green-600 dark:text-green-400" />
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Sendero - Registro de Actividades</h2>
            </div>

            {/* Form */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-6 transition-colors duration-200">
                <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 border-b dark:border-gray-700 pb-2">Añadir Registro</h3>

                {/* Validation Errors */}
                {errors.length > 0 && (
                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="font-semibold text-red-800 dark:text-red-300 mb-2">Por favor, corrija los siguientes errores:</p>
                        <ul className="list-disc list-inside text-red-700 dark:text-red-400 text-sm space-y-1">
                            {errors.map((error, idx) => (
                                <li key={idx}>{error}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Empleado */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Empleado <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={empleado}
                                onChange={(e) => setEmpleado(e.target.value)}
                                className="w-full p-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="Nombre del empleado"
                            />
                        </div>

                        {/* Fecha */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Fecha <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                                className="w-full p-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>

                        {/* Cantidad de Personas */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Cantidad de Personas <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={cantidadPersonas}
                                onChange={(e) => setCantidadPersonas(e.target.value)}
                                className="w-full p-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="0"
                            />
                        </div>

                        {/* Precio por Persona */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Precio por Persona ($) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={precioPorPersona}
                                onChange={(e) => setPrecioPorPersona(e.target.value)}
                                className="w-full p-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="0.00"
                            />
                        </div>

                        {/* Horas */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Horas Trabajadas <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={horas}
                                onChange={(e) => setHoras(e.target.value)}
                                className="w-full p-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="0.0"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                    >
                        <Plus className="w-5 h-5" />
                        Añadir Registro
                    </button>
                </form>
            </div>

            {/* Records List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden transition-colors duration-200">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
                    <h3 className="font-bold text-gray-700 dark:text-gray-200">Registros</h3>
                </div>

                {records.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 dark:text-gray-500">
                        No hay registros aún. Añade el primer registro usando el formulario de arriba.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-4 py-3">Fecha</th>
                                    <th className="px-4 py-3">Empleado</th>
                                    <th className="px-4 py-3 text-center">Personas</th>
                                    <th className="px-4 py-3 text-right">Precio/Persona</th>
                                    <th className="px-4 py-3 text-center">Horas</th>
                                    <th className="px-4 py-3 text-right">Total</th>
                                    <th className="px-4 py-3 text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {records.map((record) => (
                                    <tr key={record.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400">
                                            {format(new Date(record.fecha), 'dd/MM/yyyy', { locale: es })}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                                            {record.empleado}
                                        </td>
                                        <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                                            {record.cantidadPersonas}
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                                            ${record.precioPorPersona.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                                            {record.horas}h
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-green-600 dark:text-green-400">
                                            ${(record.cantidadPersonas * record.precioPorPersona).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => {
                                                    if (confirm('¿Estás seguro de eliminar este registro?')) {
                                                        onDeleteRecord(record.id);
                                                    }
                                                }}
                                                className="text-red-400 hover:text-red-600 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
