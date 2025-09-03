'use client';

import { useState, useEffect } from 'react';

interface HomeSearchFiltersProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    destinationFilter: string;
    onDestinationChange: (value: string) => void;
    destinations: string[];
    isLoading?: boolean;
    hasLoadedOnce?: boolean;
    className?: string;
    showLoadingIndicator?: boolean;
}

export default function HomeSearchFilters({
    searchQuery,
    onSearchChange,
    destinationFilter,
    onDestinationChange,
    destinations,
    isLoading = false,
    hasLoadedOnce = false,
    className = "",
    showLoadingIndicator = true
}: HomeSearchFiltersProps) {
    return (
        <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                        Buscar casa
                    </label>
                    <input
                        type="text"
                        id="search"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Buscar por nombre o dirección..."
                        className="text-gray-700 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {showLoadingIndicator && hasLoadedOnce && isLoading && (
                        <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                            <span className="inline-block h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" aria-hidden="true"></span>
                            Actualizando resultados...
                        </div>
                    )}
                </div>
                <div className="md:w-48">
                    <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
                        Destino
                    </label>
                    <select
                        id="destination"
                        value={destinationFilter}
                        onChange={(e) => onDestinationChange(e.target.value)}
                        className="text-gray-700 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Todos los destinos</option>
                        {destinations && destinations.map((d) => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}
