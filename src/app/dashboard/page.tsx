'use client';

import Link from 'next/link';

export default function AdminDashboardPage() {
    const adminModules = [
        {
            title: 'Gestión de Estructura',
            description: 'Administrar casas y habitaciones',
            items: [
                { name: 'Crear Casa', href: '/admin/create-home', color: 'bg-blue-500' },
                { name: 'Crear Tipo de Habitación', href: '/admin/create-room-type', color: 'bg-green-500' },
                { name: 'Crear Habitación', href: '/admin/create-room', color: 'bg-purple-500' },
            ]
        },
        {
            title: 'Gestión de Productos',
            description: 'Administrar categorías, marcas y amenities',
            items: [
                { name: 'Crear Categoría', href: '/admin/create-category', color: 'bg-orange-500' },
                { name: 'Crear Marca', href: '/admin/create-brand', color: 'bg-red-500' },
                { name: 'Crear Amenity', href: '/admin/create-amenity', color: 'bg-indigo-500' },
            ]
        },
        {
            title: 'Gestión de Proveedores',
            description: 'Administrar proveedores y suministros',
            items: [
                { name: 'Crear Proveedor', href: '/admin/create-supplier', color: 'bg-teal-500' },
            ]
        },
        {
            title: 'Gestión de Inventario',
            description: 'Conectar productos con casas y gestionar stock',
            items: [
                { name: 'Crear Inventario', href: '/admin/create-inventory', color: 'bg-yellow-500' },
            ]
        },
        {
            title: 'Guías y Documentación',
            description: 'Crear guías de estilo, procedimientos y planos técnicos',
            items: [
                { name: 'Crear Guía de Estilo', href: '/admin/create-styling-guide', color: 'bg-pink-500' },
                { name: 'Crear Playbook', href: '/admin/create-playbook', color: 'bg-rose-500' },
                { name: 'Crear Guía de Electrodoméstico', href: '/admin/create-appliance-guide', color: 'bg-violet-500' },
                { name: 'Crear Plano Técnico', href: '/admin/create-technical-plan', color: 'bg-cyan-500' },
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        🛠️ Panel de Administración
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Gestiona todos los aspectos de VIVLA Guides
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        ← Volver al Dashboard
                    </Link>
                </div>

                {/* Módulos */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {adminModules.map((module, moduleIndex) => (
                        <div key={moduleIndex} className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                {module.title}
                            </h2>
                            <p className="text-gray-600 mb-6">
                                {module.description}
                            </p>

                            <div className="space-y-3">
                                {module.items.map((item, itemIndex) => (
                                    <Link
                                        key={itemIndex}
                                        href={item.href}
                                        className={`block w-full px-4 py-3 text-white font-medium rounded-md transition-colors duration-200 hover:opacity-90 ${item.color}`}
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
