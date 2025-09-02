'use client';

import { useState, useMemo } from 'react';
import type { HomeWithCompleteness } from '@/lib/types';
import { useApiData } from '@/hooks/useApiData';
import Link from 'next/link';

interface HomeStats {
  rooms_count: number;
  inventory_count: number;
  styling_guides_count: number;
  appliance_guides_count: number;
  technical_plans_count: number;
}

export default function Home() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [searchQuery, setSearchQuery] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('');

  // Cargar casas con paginación
  const homesParams = useMemo(() => ({
    page: currentPage,
    pageSize: pageSize
  }), [currentPage, pageSize]);

  const { data: homes, meta: homesMeta, isLoading: isLoadingHomes, error: homesError } = useApiData<HomeWithCompleteness>('homes/with-completeness', homesParams);

  // Filtrar casas en el frontend
  const filteredHomes = useMemo(() => {
    if (!homes) return [];

    return homes.filter(home => {
      const matchesSearch = searchQuery === '' ||
        home.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        home.address.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDestination = destinationFilter === '' ||
        home.destination === destinationFilter;

      return matchesSearch && matchesDestination;
    });
  }, [homes, searchQuery, destinationFilter]);

  // Calcular estadísticas generales
  const totalStats = useMemo(() => {
    if (!homes) return { total_homes: 0, total_rooms: 0, total_inventory: 0, total_guides: 0 };

    return {
      total_homes: homesMeta?.total || homes.length,
      total_rooms: homes.length * 5, // Estimación
      total_inventory: homes.length * 10, // Estimación
      total_guides: homes.length * 3, // Estimación
    };
  }, [homes, homesMeta]);

  if (isLoadingHomes) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (homesError) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">Error al cargar las casas: {homesError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏠 VIVLA Guides - Dashboard
          </h1>
          <p className="text-gray-600">
            Gestiona y visualiza todas las casas, su inventario y guías asociadas
          </p>
        </div>

        {/* Estadísticas Generales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Casas</p>
                <p className="text-2xl font-bold text-gray-900">{totalStats.total_homes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Habitaciones</p>
                <p className="text-2xl font-bold text-gray-900">{totalStats.total_rooms}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Inventario</p>
                <p className="text-2xl font-bold text-gray-900">{totalStats.total_inventory}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Guías</p>
                <p className="text-2xl font-bold text-gray-900">{totalStats.total_guides}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Buscar casa
              </label>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o dirección..."
                className="text-gray-700 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:w-48">
              <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
                Destino
              </label>
              <select
                id="destination"
                value={destinationFilter}
                onChange={(e) => setDestinationFilter(e.target.value)}
                className="text-gray-700 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los destinos</option>
                <option value="vacacional">Vacacional</option>
                <option value="residencial">Residencial</option>
                <option value="comercial">Comercial</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grid de Casas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredHomes.map((home) => (
            <Link
              key={home.id}
              href={`/dashboard/${home.id}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
            >
              <div className="aspect-video bg-gray-200 relative">
                {home.main_image ? (
                  <img
                    src={home.main_image}
                    alt={home.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${home.destination === 'vacacional' ? 'bg-blue-100 text-blue-800' :
                    home.destination === 'residencial' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                    {home.destination}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {home.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {home.address}
                </p>

                <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
                  <div className="text-center">
                    <div className="font-medium">{home.counts?.rooms ?? 0}</div>
                    <div>Espacios</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{home.counts?.inventory ?? 0}</div>
                    <div>Items</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{(home.counts?.styling_guides ?? 0) + (home.counts?.appliance_guides ?? 0) + (home.counts?.playbooks ?? 0)}</div>
                    <div>Guías</div>
                  </div>
                </div>
                {/* Progreso de completitud */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Completitud</span>
                    <span className="font-medium text-gray-900">{home.completeness ?? 0}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: `${home.completeness ?? 0}%` }} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Paginación */}
        {homesMeta && homesMeta.totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-700">
                Página {currentPage} de {homesMeta.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= homesMeta.totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* Mensaje si no hay casas */}
        {filteredHomes.length === 0 && !isLoadingHomes && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay casas</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || destinationFilter ? 'No se encontraron casas con los filtros aplicados.' : 'Aún no se han creado casas.'}
            </p>
            {!searchQuery && !destinationFilter && (
              <div className="mt-6">
                <Link
                  href="/admin/create-home"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Crear primera casa
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
