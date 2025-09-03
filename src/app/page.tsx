'use client';

import { useState, useMemo, useEffect } from 'react';
import type { HomeWithCompleteness } from '@/lib/types';
import { useApiData } from '@/hooks/useApiData';
import Link from 'next/link';
import HomeSearchFilters from '@/components/ui/HomeSearchFilters';



export default function Home() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  // Debounce del término de búsqueda (300ms)
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearchQuery(searchQuery), 450);
    return () => clearTimeout(handle);
  }, [searchQuery]);
  // Solo activar búsqueda si hay 3+ caracteres
  const effectiveSearch = debouncedSearchQuery && debouncedSearchQuery.length >= 3 ? debouncedSearchQuery : '';
  const [destinationFilter, setDestinationFilter] = useState('');

  // Cargar casas con paginación
  const homesParams = useMemo(() => ({
    page: (effectiveSearch || destinationFilter) ? 1 : currentPage,
    pageSize: (effectiveSearch || destinationFilter) ? 100 : pageSize
  }), [currentPage, pageSize, effectiveSearch, destinationFilter]);

  const { data: homes, meta: homesMeta, isLoading: isLoadingHomes, error: homesError } = useApiData<HomeWithCompleteness>('homes/with-completeness', homesParams);
  const { data: destinations } = useApiData<string>('homes/destinations');

  // Filtrar casas en el frontend
  const filteredHomes = useMemo(() => {
    if (!homes) return [];

    return homes.filter(home => {
      const matchesSearch = effectiveSearch === '' ||
        home.name.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        home.address.toLowerCase().includes(effectiveSearch.toLowerCase());

      const matchesDestination = destinationFilter === '' ||
        home.destination === destinationFilter;

      return matchesSearch && matchesDestination;
    });
  }, [homes, effectiveSearch, destinationFilter]);

  // Bloque de estadísticas eliminado por no utilizarse

  // Paginación en cliente cuando hay búsqueda o filtro de destino
  const useClientPagination = Boolean(effectiveSearch || destinationFilter);
  const clientTotalPages = useMemo(() => {
    if (!useClientPagination) return 1;
    return Math.max(1, Math.ceil(filteredHomes.length / pageSize));
  }, [useClientPagination, filteredHomes.length, pageSize]);
  const visibleHomes = useMemo(() => {
    if (!useClientPagination) return filteredHomes;
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredHomes.slice(start, end);
  }, [useClientPagination, filteredHomes, currentPage, pageSize]);

  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  useEffect(() => {
    if (!isLoadingHomes) {
      setHasLoadedOnce(true);
    }
  }, [isLoadingHomes]);

  if (!hasLoadedOnce && isLoadingHomes) {
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🏠 VIVLA
              </h1>
              <p className="text-gray-600">
                Gestiona y visualiza todas las casas, su inventario y guías asociadas
              </p>
            </div>

          </div>
        </div>

        {/* Bloque de estadísticas eliminado */}

        {/* Filtros y Búsqueda */}
        <HomeSearchFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          destinationFilter={destinationFilter}
          onDestinationChange={(value) => { setDestinationFilter(value); setCurrentPage(1); }}
          destinations={destinations || []}
          isLoading={isLoadingHomes}
          hasLoadedOnce={hasLoadedOnce}
          className="mb-8"
        />

        {/* Grid de Casas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visibleHomes.map((home) => (
            <Link
              key={home.id}
              href={`/home/${home.id}`}
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
        {(useClientPagination ? clientTotalPages > 1 : (homesMeta && homesMeta.totalPages > 1)) && (
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
                Página {currentPage} de {useClientPagination ? clientTotalPages : homesMeta!.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= (useClientPagination ? clientTotalPages : homesMeta!.totalPages)}
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
                <p className="text-sm text-gray-500">
                  No hay casas disponibles. Contacta al administrador para crear la primera casa.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
