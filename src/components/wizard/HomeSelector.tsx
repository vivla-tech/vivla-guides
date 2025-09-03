'use client';

import { useState, useEffect } from 'react';
import { HomeWithCompleteness } from '@/lib/types';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';

interface HomeSelectorProps {
    selectedHome: HomeWithCompleteness | null;
    onHomeSelect: (home: HomeWithCompleteness) => void;
    title?: string;
    description?: string;
    showCompleteness?: boolean;
    className?: string;
}

export default function HomeSelector({
    selectedHome,
    onHomeSelect,
    title = "Seleccionar Casa",
    description = "Elige la casa para la que quieres gestionar el contenido",
    showCompleteness = true,
    className = ""
}: HomeSelectorProps) {
    const [homes, setHomes] = useState<HomeWithCompleteness[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [destinationFilter, setDestinationFilter] = useState('');
    const [destinations, setDestinations] = useState<string[]>([]);

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalHomes, setTotalHomes] = useState(0);
    const [pageSize] = useState(20);

    const apiClient = createApiClient(config.apiUrl);

    // Cargar casas y destinos
    useEffect(() => {
        loadHomes();
        loadDestinations();
    }, []);

    // Recargar casas cuando cambien los filtros
    useEffect(() => {
        if ((searchTerm && searchTerm.length >= 3) || destinationFilter) {
            // Reset a la primera página cuando se aplican filtros
            loadHomes(1);
        }
    }, [searchTerm, destinationFilter]);

    const loadHomes = async (page: number = currentPage) => {
        setLoading(true);
        try {
            const response = await apiClient.listHomesWithCompleteness({
                page,
                pageSize
            });
            if (response.success) {
                setHomes(response.data);
                setTotalPages(response.meta.totalPages);
                setTotalHomes(response.meta.total);
                setCurrentPage(page);
            }
        } catch (error) {
            console.error('Error loading homes:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadDestinations = async () => {
        try {
            const response = await apiClient.listDestinations();
            if (response.success) {
                setDestinations(response.data);
            }
        } catch (error) {
            console.error('Error loading destinations:', error);
        }
    };

    // Filtrar casas basado en búsqueda y destino (filtrado en cliente para la página actual)
    const filteredHomes = homes.filter(home => {
        const matchesSearch = !searchTerm || searchTerm.length < 3 ||
            home.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            home.address.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDestination = !destinationFilter || home.destination === destinationFilter;
        return matchesSearch && matchesDestination;
    });

    const getCompletenessColor = (completeness: number) => {
        if (completeness >= 80) return 'text-green-600 bg-green-50 border-green-200';
        if (completeness >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        if (completeness >= 40) return 'text-orange-600 bg-orange-50 border-orange-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    const getCompletenessLabel = (completeness: number) => {
        if (completeness >= 80) return 'Completa';
        if (completeness >= 60) return 'Buena';
        if (completeness >= 40) return 'Regular';
        return 'Incompleta';
    };

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {title}
                </h2>
                <p className="text-gray-600">
                    {description}
                </p>
            </div>

            {/* Filtros */}
            <div className="space-y-4">
                {/* Búsqueda */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Buscar casa
                    </label>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por nombre o dirección (mínimo 3 letras)..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400"
                    />
                    {searchTerm && searchTerm.length < 3 && (
                        <p className="text-sm text-gray-500 mt-1">
                            Escribe al menos 3 letras para buscar
                        </p>
                    )}
                </div>

                {/* Filtro por destino */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Filtrar por destino
                    </label>
                    <select
                        value={destinationFilter}
                        onChange={(e) => setDestinationFilter(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    >
                        <option value="">Todos los destinos</option>
                        {destinations.map((destination) => (
                            <option key={destination} value={destination}>
                                {destination}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Lista de casas */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-8">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-blue-600 text-sm">Cargando casas...</p>
                    </div>
                ) : filteredHomes.length > 0 ? (
                    <div className="space-y-4">
                        <div className="grid gap-4 max-h-96 overflow-y-auto">
                            {filteredHomes.map((home) => (
                                <div
                                    key={home.id}
                                    onClick={() => onHomeSelect(home)}
                                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${selectedHome?.id === home.id
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 mb-1">
                                                {home.name}
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-2">
                                                {home.address}
                                            </p>
                                            <div className="flex items-center space-x-4 text-sm">
                                                <span className="text-gray-500">
                                                    📍 {home.destination}
                                                </span>
                                                {showCompleteness && (
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCompletenessColor(home.completeness)}`}>
                                                        {getCompletenessLabel(home.completeness)} ({home.completeness}%)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {selectedHome?.id === home.id && (
                                            <div className="ml-4">
                                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Controles de paginación */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                <div className="text-sm text-gray-500">
                                    Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, totalHomes)} de {totalHomes} casas
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => loadHomes(currentPage - 1)}
                                        disabled={currentPage <= 1}
                                        className={`px-3 py-1 text-sm font-medium rounded-md ${currentPage <= 1
                                            ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        Anterior
                                    </button>
                                    <div className="flex space-x-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            const pageNum = i + 1;
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => loadHomes(pageNum)}
                                                    className={`px-3 py-1 text-sm font-medium rounded-md ${currentPage === pageNum
                                                        ? 'text-white bg-blue-600'
                                                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                        {totalPages > 5 && (
                                            <span className="px-3 py-1 text-sm text-gray-500">...</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => loadHomes(currentPage + 1)}
                                        disabled={currentPage >= totalPages}
                                        className={`px-3 py-1 text-sm font-medium rounded-md ${currentPage >= totalPages
                                            ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-gray-400 text-xl">🏠</span>
                        </div>
                        <p className="text-gray-500 mb-2">
                            {searchTerm && searchTerm.length < 3
                                ? 'Escribe al menos 3 letras para buscar'
                                : searchTerm || destinationFilter
                                    ? 'No se encontraron casas con los filtros aplicados'
                                    : currentPage > 1
                                        ? 'No hay más casas en esta página'
                                        : 'No hay casas disponibles'
                            }
                        </p>
                        <p className="text-sm text-gray-400">
                            {searchTerm && searchTerm.length < 3
                                ? 'La búsqueda se activará automáticamente'
                                : searchTerm || destinationFilter
                                    ? 'Intenta ajustar los filtros de búsqueda'
                                    : currentPage > 1
                                        ? 'Navega a la página anterior'
                                        : 'Crea la primera casa'
                            }
                        </p>
                    </div>
                )}
            </div>

            {/* Información de la casa seleccionada */}
            {selectedHome && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium text-blue-900">
                                Casa seleccionada: {selectedHome.name}
                            </h4>
                            <p className="text-sm text-blue-700 mt-1">
                                {selectedHome.address} • {selectedHome.destination}
                            </p>
                        </div>
                        <button
                            onClick={() => onHomeSelect(null as any)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            Cambiar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
