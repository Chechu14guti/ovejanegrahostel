import React, { useState } from 'react';
import { BarTransaction, BarInventoryItem } from '../types';
import { BarContabilidad } from './BarContabilidad';
import { BarResumen } from './BarResumen';
import { BarInventario } from './BarInventario';

type TabType = 'contabilidad' | 'resumen' | 'inventario';

export const BarView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('contabilidad');

    return (
        <div className="flex-1 p-4 overflow-auto pb-24 md:pb-4 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sección de Bar</h2>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('contabilidad')}
                        className={`flex-1 py-3 text-sm font-medium text-center transition-colors
              ${activeTab === 'contabilidad'
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                    >
                        Contabilidad
                    </button>
                    <button
                        onClick={() => setActiveTab('resumen')}
                        className={`flex-1 py-3 text-sm font-medium text-center transition-colors
              ${activeTab === 'resumen'
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                    >
                        Resumen
                    </button>
                    <button
                        onClick={() => setActiveTab('inventario')}
                        className={`flex-1 py-3 text-sm font-medium text-center transition-colors
              ${activeTab === 'inventario'
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                    >
                        Inventario
                    </button>
                </div>

                <div className="p-4">
                    {activeTab === 'contabilidad' && (
                        <BarContabilidad />
                    )}
                    {activeTab === 'resumen' && (
                        <BarResumen />
                    )}
                    {activeTab === 'inventario' && (
                        <BarInventario />
                    )}
                </div>
            </div>
        </div>
    );
};
