'use client';

import Link from 'next/link';

export default function Home() {
  const adminModules = [
    {
      title: 'Gestión de Estructura',
      description: 'Administrar casas y habitaciones',
      items: [
        { name: 'Crear Casa', href: '/create-home', color: 'bg-blue-500' },
        { name: 'Crear Tipo de Habitación', href: '/create-room-type', color: 'bg-green-500' },
        { name: 'Crear Habitación', href: '/create-room', color: 'bg-purple-500' },
      ]
    },
    {
      title: 'Gestión de Productos',
      description: 'Administrar categorías, marcas y amenities',
      items: [
        { name: 'Crear Categoría', href: '/create-category', color: 'bg-orange-500' },
        { name: 'Crear Marca', href: '/create-brand', color: 'bg-red-500' },
        { name: 'Crear Amenity', href: '/create-amenity', color: 'bg-indigo-500' },
      ]
    },
    {
      title: 'Gestión de Proveedores',
      description: 'Administrar proveedores y suministros',
      items: [
        { name: 'Crear Proveedor', href: '/create-supplier', color: 'bg-teal-500' },
      ]
    },
    {
      title: 'Gestión de Inventario',
      description: 'Conectar productos con casas y gestionar stock',
      items: [
        { name: 'Crear Inventario', href: '/create-inventory', color: 'bg-yellow-500' },
      ]
    },
    {
      title: 'Guías y Documentación',
      description: 'Crear guías de estilo, procedimientos y planos técnicos',
      items: [
        { name: 'Crear Guía de Estilo', href: '/create-styling-guide', color: 'bg-pink-500' },
        { name: 'Crear Playbook', href: '/create-playbook', color: 'bg-rose-500' },
        { name: 'Crear Guía de Electrodoméstico', href: '/create-appliance-guide', color: 'bg-violet-500' },
        { name: 'Crear Plano Técnico', href: '/create-technical-plan', color: 'bg-cyan-500' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🏠 VIVLA Guides - Panel de Administración
          </h1>
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
