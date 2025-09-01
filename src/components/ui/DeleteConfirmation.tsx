import React, { useState } from 'react';
import { Home } from '@/lib/types';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';

interface DeleteConfirmationProps {
    home: Home;
    onClose: () => void;
    onSuccess: () => void;
}

export function DeleteConfirmation({ home, onClose, onSuccess }: DeleteConfirmationProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const apiClient = createApiClient(config.apiUrl);

    const handleDelete = async () => {
        setIsDeleting(true);
        setError(null);

        try {
            // Eliminar la casa
            await apiClient.deleteHome(home.id);

            // Mostrar confirmación y cerrar modal
            onSuccess();
        } catch (err) {
            console.error('Error al eliminar casa:', err);
            setError(err instanceof Error ? err.message : 'Error al eliminar la casa');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Icono de advertencia */}
            <div className="flex justify-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
            </div>

            {/* Título y mensaje */}
            <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    ¿Eliminar casa?
                </h3>
                <p className="text-sm text-gray-600">
                    ¿Estás seguro de que quieres eliminar la casa <strong>"{home.name}"</strong>?
                    Esta acción no se puede deshacer.
                </p>
            </div>

            {/* Información de la casa */}
            <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                    {/* Imagen */}
                    {home.main_image ? (
                        <img
                            src={home.main_image}
                            alt={home.name}
                            className="w-16 h-16 object-cover rounded-lg"
                        />
                    ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400 text-xs">Sin imagen</span>
                        </div>
                    )}

                    {/* Información */}
                    <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{home.name}</h4>
                        <p className="text-sm text-gray-600">{home.destination}</p>
                        <p className="text-sm text-gray-600 truncate">{home.address}</p>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}

            {/* Botones */}
            <div className="flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isDeleting}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                    Cancelar
                </button>
                <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isDeleting ? 'Eliminando...' : 'Eliminar Casa'}
                </button>
            </div>
        </div>
    );
}
