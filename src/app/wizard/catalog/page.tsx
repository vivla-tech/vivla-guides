'use client';

import { useState } from 'react';
import BrandsTab from '@/components/tabs/BrandsTab';
import CategoriesTab from '@/components/tabs/CategoriesTab';
import ProductsTab from '@/components/tabs/ProductsTab';

export default function CatalogPage() {
    const [activeTab, setActiveTab] = useState<'brands' | 'categories' | 'products'>('brands');
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const tabs = [
        { id: 'brands', label: 'Marcas', icon: '🏷️' },
        { id: 'categories', label: 'Categorías', icon: '📂' },
        { id: 'products', label: 'Productos', icon: '📦' },
    ] as const;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white shadow-sm border-b border-gray-200">
                    <div className="px-6 py-4">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Gestionar Catálogo
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Administra marcas, categorías y productos del catálogo
                        </p>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="bg-white border-b border-gray-200">
                    <div className="px-6">
                        <nav className="flex space-x-8">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <span className="mr-2">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="bg-white">
                    {activeTab === 'brands' && (
                        <BrandsTab submitMessage={submitMessage} setSubmitMessage={setSubmitMessage} />
                    )}
                    {activeTab === 'categories' && (
                        <CategoriesTab submitMessage={submitMessage} setSubmitMessage={setSubmitMessage} />
                    )}
                    {activeTab === 'products' && (
                        <ProductsTab submitMessage={submitMessage} setSubmitMessage={setSubmitMessage} />
                    )}
                </div>
            </div>
        </div>
    );
}
