'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';
import { HomeWithCompleteness, HomeInventoryWithRelations } from '@/lib/types';
import Link from 'next/link';

const apiClient = createApiClient(config.apiUrl);

export default function HomeInventoryPage() {
    const params = useParams();
    const homeId = params.homeId as string;

    const [home, setHome] = useState<HomeWithCompleteness | null>(null);
    const [inventory, setInventory] = useState<HomeInventoryWithRelations[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<HomeInventoryWithRelations | null>(null);
    const [deletingItem, setDeletingItem] = useState<HomeInventoryWithRelations | null>(null);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [editForm, setEditForm] = useState({
        quantity: '',
        notes: ''
    });

    useEffect(() => {
        const loadHomeData = async () => {
            try {
                setLoading(true);

                // Cargar información de la casa
                const homeResponse = await apiClient.listHomesWithCompleteness();
                const foundHome = homeResponse.data.find(h => h.id === homeId);

                if (!foundHome) {
                    setError('Casa no encontrada');
                    return;
                }

                setHome(foundHome);

                // Cargar inventario de la casa (filtrado en servidor)
                const inventoryResponse = await apiClient.listInventory({ home_id: homeId, pageSize: 100 });
                setInventory(inventoryResponse.data);

            } catch (err) {
                console.error('Error loading home data:', err);
                setError('Error al cargar los datos de la casa');
            } finally {
                setLoading(false);
            }
        };

        if (homeId) {
            loadHomeData();
        }
    }, [homeId]);

    // Funciones para manejar edición y eliminación
    const handleEditInventory = (item: HomeInventoryWithRelations) => {
        setEditingItem(item);
        setEditForm({
            quantity: item.quantity.toString(),
            notes: item.notes || ''
        });
    };

    const handleDeleteInventory = async (item: HomeInventoryWithRelations) => {
        try {
            await apiClient.deleteInventory(item.id);
            setSubmitMessage({ type: 'success', message: 'Producto eliminado exitosamente' });
            setDeletingItem(null);
            // Recargar el inventario
            const inventoryResponse = await apiClient.listInventory({ home_id: homeId, pageSize: 100 });
            setInventory(inventoryResponse.data);
        } catch (error) {
            console.error('Error deleting inventory:', error);
            setSubmitMessage({ type: 'error', message: 'Error al eliminar el producto' });
        }
    };

    const handleSaveEdit = async () => {
        if (!editingItem) return;

        try {
            await apiClient.updateInventory(editingItem.id, {
                quantity: parseInt(editForm.quantity),
                notes: editForm.notes
            });
            setSubmitMessage({ type: 'success', message: 'Producto actualizado exitosamente' });
            setEditingItem(null);
            // Recargar el inventario
            const inventoryResponse = await apiClient.listInventory({ home_id: homeId, pageSize: 100 });
            setInventory(inventoryResponse.data);
        } catch (error) {
            console.error('Error updating inventory:', error);
            setSubmitMessage({ type: 'error', message: 'Error al actualizar el producto' });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center py-12">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Cargando inventario...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !home) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-red-600 text-2xl">⚠️</span>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
                        <p className="text-gray-600 mb-4">{error || 'Casa no encontrada'}</p>
                        <Link
                            href="/"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                            Volver al Inicio
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Mensaje de estado */}
                {submitMessage && (
                    <div className={`p-4 rounded-md mb-6 ${submitMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                        {submitMessage.message}
                    </div>
                )}

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <Link
                                href={`/home/${homeId}`}
                                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-2"
                            >
                                ← Volver a {home.name}
                            </Link>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Inventario de {home.name}
                            </h1>
                            <p className="text-gray-600 mt-2">
                                Todos los productos y elementos incluidos en esta casa
                            </p>
                        </div>
                        <Link
                            href={`/wizard/inventory?homeId=${homeId}`}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-900"
                        >
                            ✏️ Gestionar Inventario
                        </Link>
                    </div>
                </div>



                {/* Lista de Inventario */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">
                            Productos del Inventario
                        </h2>
                    </div>

                    {inventory.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-gray-400 text-2xl">📦</span>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No hay productos en el inventario
                            </h3>
                            <p className="text-gray-500 mb-4">
                                Esta casa aún no tiene productos añadidos al inventario.
                            </p>
                            <Link
                                href={`/wizard/inventory?homeId=${homeId}`}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                + Añadir Productos
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {inventory.map((item) => (
                                <div key={item.id} className="px-6 py-4 hover:bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center">
                                                <h3 className="text-lg font-medium text-gray-900">
                                                    {item.amenity?.name}
                                                </h3>
                                                {item.quantity && item.quantity > 1 && (
                                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        x{item.quantity}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mt-1 flex items-center text-sm text-gray-500">
                                                {item.amenity?.category?.name && (
                                                    <span className="mr-4">
                                                        📂 {item.amenity.category.name}
                                                    </span>
                                                )}
                                                {item.amenity?.brand?.name && (
                                                    <span className="mr-4">
                                                        🏷️ {item.amenity.brand.name}
                                                    </span>
                                                )}
                                                {item.supplier?.name && (
                                                    <span>
                                                        🏢 {item.supplier.name}
                                                    </span>
                                                )}
                                            </div>

                                            {item.amenity?.description && (
                                                <p className="mt-2 text-sm text-gray-600">
                                                    {item.amenity.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className="ml-6 flex flex-col items-end">
                                            <div className="text-lg font-semibold text-green-600">
                                                €{Number(item.amenity?.base_price || 0).toFixed(2)}
                                            </div>
                                            {item.quantity && item.quantity > 1 && (
                                                <div className="text-sm text-gray-500">
                                                    Total: €{(Number(item.amenity?.base_price || 0) * item.quantity).toFixed(2)}
                                                </div>
                                            )}
                                            <div className="flex space-x-2 mt-2">
                                                <button
                                                    onClick={() => handleEditInventory(item)}
                                                    className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
                                                >
                                                    ✏️ Editar
                                                </button>
                                                <button
                                                    onClick={() => setDeletingItem(item)}
                                                    className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100"
                                                >
                                                    🗑️ Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de confirmación para eliminar */}
            {deletingItem && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black opacity-30" onClick={() => setDeletingItem(null)}></div>
                        <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                            <div className="mb-4">
                                <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                                    Eliminar Producto
                                </h3>
                                <p className="text-sm text-gray-500 text-center">
                                    ¿Estás seguro de que quieres eliminar <strong>{deletingItem.amenity?.name}</strong> del inventario?
                                </p>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setDeletingItem(null)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleDeleteInventory(deletingItem)}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de edición */}
            {editingItem && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black opacity-30" onClick={() => setEditingItem(null)}></div>
                        <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                            <div className="mb-6">
                                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-4">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                                    Editar Producto
                                </h3>
                                <p className="text-sm text-gray-500 text-center">
                                    {editingItem.amenity?.name}
                                </p>
                            </div>

                            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Cantidad
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={editForm.quantity}
                                        onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm"
                                        placeholder="Cantidad"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Notas (opcional)
                                    </label>
                                    <textarea
                                        value={editForm.notes}
                                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                        rows={3}
                                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm"
                                        placeholder="Notas adicionales sobre este producto..."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => setEditingItem(null)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                                >
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
