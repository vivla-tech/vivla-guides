'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Home, HomeInventoryWithRelations, Room } from '@/lib/types';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';
import Link from 'next/link';

interface InventoryDetails {
    home: Home;
    inventory: HomeInventoryWithRelations[];
    rooms: Room[];
}

export default function HomeInventoryPage() {
    const params = useParams();
    const homeId = params.homeId as string;

    const [inventoryDetails, setInventoryDetails] = useState<InventoryDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [roomFilter, setRoomFilter] = useState<string>('');

    const apiClient = useMemo(() => createApiClient(config.apiUrl), []);

    useEffect(() => {
        const loadInventoryDetails = async () => {
            console.log('🔄 Cargando inventario para casa:', homeId);
            try {
                setIsLoading(true);
                setError(null);

                // Cargar datos en paralelo
                const [homeResponse, inventoryResponse, roomsResponse] = await Promise.all([
                    apiClient.getHomeById(homeId),
                    apiClient.listInventory({ home_id: homeId }),
                    apiClient.listRoomsByHome(homeId)
                ]);

                console.log('📊 Datos cargados:', {
                    home: homeResponse.data?.name,
                    inventoryCount: inventoryResponse.data?.length || 0,
                    roomsCount: roomsResponse.data?.length || 0,
                    inventory: inventoryResponse.data,
                    rooms: roomsResponse.data
                });

                // Debug específico del inventario
                if (inventoryResponse.data && inventoryResponse.data.length > 0) {
                    console.log('🔍 Primer item del inventario:', inventoryResponse.data[0]);
                    console.log('🔍 ¿Tiene amenity?', !!inventoryResponse.data[0].amenity);
                    console.log('🔍 ¿Tiene room?', !!inventoryResponse.data[0].room);
                    console.log('🔍 purchase_price:', inventoryResponse.data[0].purchase_price, 'tipo:', typeof inventoryResponse.data[0].purchase_price);
                    console.log('🔍 quantity:', inventoryResponse.data[0].quantity, 'tipo:', typeof inventoryResponse.data[0].quantity);
                }

                setInventoryDetails({
                    home: homeResponse.data,
                    inventory: inventoryResponse.data,
                    rooms: roomsResponse.data
                });

            } catch (err) {
                console.error('Error al cargar inventario:', err);
                setError(err instanceof Error ? err.message : 'Error al cargar los datos');
            } finally {
                setIsLoading(false);
            }
        };

        if (homeId) {
            loadInventoryDetails();
        }
    }, [homeId, apiClient]);

    // Filtrar inventario por habitación
    const filteredInventory = inventoryDetails?.inventory.filter(item =>
        roomFilter === '' || item.room_id === roomFilter
    ) || [];

    // Agrupar inventario por habitación
    const inventoryByRoom = filteredInventory.reduce((acc, item) => {
        const roomId = item.room_id || 'sin-habitacion';
        if (!acc[roomId]) {
            acc[roomId] = [];
        }
        acc[roomId].push(item);
        return acc;
    }, {} as Record<string, HomeInventoryWithRelations[]>);

    if (isLoading) {
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

    if (error || !inventoryDetails) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <p className="text-red-800">Error al cargar los datos: {error}</p>
                        <Link href={`/dashboard/${homeId}`} className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
                            ← Volver a la casa
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const { home, inventory, rooms } = inventoryDetails;

    console.log('🎯 Renderizando inventario:', {
        homeName: home?.name,
        inventoryLength: inventory?.length || 0,
        roomsLength: rooms?.length || 0,
        filteredInventoryLength: filteredInventory.length,
        inventoryByRoomKeys: Object.keys(inventoryByRoom)
    });

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <Link href={`/dashboard/${homeId}`} className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Volver a {home.name}
                    </Link>

                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                            {home.main_image ? (
                                <img
                                    src={home.main_image}
                                    alt={home.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Inventario de {home.name}</h1>
                            <p className="text-gray-600">{inventory.length} items en total</p>
                        </div>
                    </div>
                </div>

                {/* Información sobre datos */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <h3 className="text-sm font-medium text-blue-800">Información sobre los datos</h3>
                            <p className="text-sm text-blue-700 mt-1">
                                Se muestran {inventory.length} items de inventario. Los nombres de productos se muestran como IDs porque el backend no incluye las relaciones completas.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filtros */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="md:w-64">
                            <label htmlFor="room-filter" className="block text-sm font-medium text-gray-700 mb-2">
                                Filtrar por habitación
                            </label>
                            <select
                                id="room-filter"
                                value={roomFilter}
                                onChange={(e) => setRoomFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Todas las habitaciones</option>
                                {rooms.map((room) => (
                                    <option key={room.id} value={room.id}>
                                        {room.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <div className="text-sm text-gray-600">
                                Mostrando {filteredInventory.length} de {inventory.length} items
                            </div>
                        </div>
                    </div>
                </div>

                {/* Inventario por Habitación */}
                {Object.keys(inventoryByRoom).length > 0 ? (
                    <div className="space-y-8">
                        {Object.entries(inventoryByRoom).map(([roomId, items]) => {
                            const room = rooms.find(r => r.id === roomId);
                            return (
                                <div key={roomId} className="bg-white rounded-lg shadow-md overflow-hidden">
                                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            {roomId === 'sin-habitacion' ? 'Sin Habitación Asignada' : (room?.name || 'Habitación no especificada')}
                                        </h2>
                                        <p className="text-sm text-gray-600">
                                            {items.length} {items.length === 1 ? 'item' : 'items'}
                                        </p>
                                    </div>

                                    <div className="divide-y divide-gray-200">
                                        {items.map((item) => (
                                            <div key={item.id} className="p-6">
                                                <div className="flex items-start space-x-4">
                                                    {/* Imagen del producto */}
                                                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                                        {item.amenity?.images && item.amenity.images.length > 0 ? (
                                                            <img
                                                                src={item.amenity.images[0]}
                                                                alt={item.amenity.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Información del producto */}
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-lg font-medium text-gray-900">
                                                            {item.amenity?.name || `Producto ID: ${item.amenity_id}`}
                                                        </h3>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {item.amenity?.reference || 'Sin referencia'} - {item.amenity?.model || 'Sin modelo'}
                                                        </p>
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            {item.amenity?.description || 'Sin descripción'}
                                                        </p>
                                                        <p className="text-sm text-blue-600 mt-1">
                                                            {item.room_id ? (rooms.find(r => r.id === item.room_id)?.name || 'Habitación no encontrada') : 'Sin habitación asignada'}
                                                        </p>

                                                        {/* Detalles adicionales */}
                                                        <div className="mt-3 flex flex-wrap gap-4 text-sm">
                                                            <div className="flex items-center space-x-1">
                                                                <span className="text-gray-500">Cantidad:</span>
                                                                <span className="font-medium text-gray-900">
                                                                    {item.quantity || 0} {(item.quantity || 0) > 1 ? 'unidades' : 'unidad'}
                                                                </span>
                                                            </div>

                                                            {item.amenity?.base_price && (
                                                                <div className="flex items-center space-x-1">
                                                                    <span className="text-gray-500">Precio:</span>
                                                                    <span className="font-medium text-green-600">
                                                                        €{item.amenity.base_price.toFixed(2)}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {item.amenity?.category_id && (
                                                                <div className="flex items-center space-x-1">
                                                                    <span className="text-gray-500">Categoría:</span>
                                                                    <span className="font-medium text-gray-900">
                                                                        {item.amenity.category_id}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {item.amenity?.brand_id && (
                                                                <div className="flex items-center space-x-1">
                                                                    <span className="text-gray-500">Marca:</span>
                                                                    <span className="font-medium text-gray-900">
                                                                        {item.amenity.brand_id}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {item.purchase_price && (
                                                                <div className="flex items-center space-x-1">
                                                                    <span className="text-gray-500">Precio compra:</span>
                                                                    <span className="font-medium text-green-600">
                                                                        €{item.purchase_price.toFixed(2)}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {item.location_details && (
                                                                <div className="flex items-center space-x-1">
                                                                    <span className="text-gray-500">Ubicación:</span>
                                                                    <span className="font-medium text-gray-900">
                                                                        {item.location_details}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {item.minimum_threshold && (
                                                                <div className="flex items-center space-x-1">
                                                                    <span className="text-gray-500">Stock mínimo:</span>
                                                                    <span className="font-medium text-gray-900">
                                                                        {item.minimum_threshold}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Acciones */}
                                                    <div className="flex flex-col space-y-2">
                                                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                                            Ver detalles
                                                        </button>
                                                        <button className="text-gray-600 hover:text-gray-800 text-sm">
                                                            Editar
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay inventario</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {roomFilter ? 'No hay items en la habitación seleccionada.' : 'Aún no se ha registrado inventario para esta casa.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
