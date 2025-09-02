import React, { useState } from 'react';
import { HomeInventoryWithRelations } from '@/lib/types';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';
import { Modal } from '@/components/ui/Modal';

interface DeleteInventoryConfirmationProps {
    inventory: HomeInventoryWithRelations;
    onClose: () => void;
    onSuccess: () => void;
}

export function DeleteInventoryConfirmation({ inventory, onClose, onSuccess }: DeleteInventoryConfirmationProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const apiClient = createApiClient(config.apiUrl);

    const handleDelete = async () => {
        setIsDeleting(true);
        setError(null);

        try {
            const response = await apiClient.deleteInventory(inventory.id);

            if (response.success) {
                // Cerrar modal y recargar datos después de un breve delay
                setTimeout(() => {
                    onSuccess();
                }, 1000);
            } else {
                setError('Error al eliminar el inventario');
            }
        } catch (err) {
            console.error('Error al eliminar inventario:', err);
            setError(err instanceof Error ? err.message : 'Error de conexión');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Confirmar Eliminación"
        >
            <div className="p-6">
                <div className="mb-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">
                                Eliminar Item de Inventario
                            </h3>
                            <p className="text-sm text-gray-500">
                                Esta acción no se puede deshacer
                            </p>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Detalles del item:</h4>
                        <div className="space-y-2 text-sm text-gray-600">
                            <div>
                                <span className="font-medium">Producto:</span> {inventory.amenity?.name}
                            </div>
                            <div>
                                <span className="font-medium">Casa:</span> {inventory.home?.name}
                            </div>
                            <div>
                                <span className="font-medium">Cantidad:</span> {inventory.quantity}
                            </div>
                            <div>
                                <span className="font-medium">Ubicación:</span> {inventory.location_details}
                            </div>
                            {inventory.purchase_price && (
                                <div>
                                    <span className="font-medium">Precio:</span> €{inventory.purchase_price.toFixed(2)}
                                </div>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    <p className="text-sm text-gray-600">
                        ¿Estás seguro de que quieres eliminar este item del inventario?
                        Esta acción eliminará permanentemente todos los datos asociados.
                    </p>
                </div>

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
                        {isDeleting ? 'Eliminando...' : 'Eliminar'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
