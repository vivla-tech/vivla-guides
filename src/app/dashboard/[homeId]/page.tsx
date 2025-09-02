'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Home, Room, HomeInventoryWithRelations, StylingGuide, ApplianceGuide, TechnicalPlan, Category } from '@/lib/types';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';
import Link from 'next/link';

interface HomeDetails {
    home: Home;
    rooms: Room[];
    inventory: HomeInventoryWithRelations[];
    stylingGuides: StylingGuide[];
    applianceGuides: ApplianceGuide[];
    technicalPlans: TechnicalPlan[];
    categories: Category[];
    stats: {
        rooms_count: number;
        inventory_count: number;
        styling_guides_count: number;
        appliance_guides_count: number;
        technical_plans_count: number;
    };
}

export default function HomeDetailsPage() {
    const params = useParams();
    const homeId = params.homeId as string;

    const [homeDetails, setHomeDetails] = useState<HomeDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<string>('');

    const apiClient = useMemo(() => createApiClient(config.apiUrl), []);

    useEffect(() => {
        const loadHomeDetails = async () => {
            console.log('Cargando detalles de casa:', homeId);
            try {
                setIsLoading(true);
                setError(null);

                // Cargar datos en paralelo
                const [
                    homeResponse,
                    roomsResponse,
                    inventoryResponse,
                    stylingGuidesResponse,
                    applianceGuidesResponse,
                    technicalPlansResponse,
                    categoriesResponse
                ] = await Promise.all([
                    apiClient.getHomeById(homeId),
                    apiClient.listRoomsByHome(homeId),
                    apiClient.listInventory({ home_id: homeId, page: 1, pageSize: 50 }),
                    apiClient.listStylingGuidesByHome(homeId),
                    apiClient.listApplianceGuidesByHome(homeId),
                    apiClient.listTechnicalPlans({ home_id: homeId }),
                    apiClient.listCategories()
                ]);

                // Filtrar inventario por casa por si el backend devuelve items globales
                const inventoryByHome = (inventoryResponse.data || []).filter((item) => item.home_id === homeId);

                // Calcular estadísticas
                const stats = {
                    rooms_count: roomsResponse.data.length,
                    inventory_count: inventoryByHome.length,
                    styling_guides_count: stylingGuidesResponse.data.length,
                    appliance_guides_count: applianceGuidesResponse.data.length,
                    technical_plans_count: technicalPlansResponse.data.length,
                };

                console.log('Datos cargados exitosamente:', {
                    home: homeResponse.data,
                    rooms: roomsResponse.data.length,
                    inventory: inventoryResponse.data.length,
                    stylingGuides: stylingGuidesResponse.data.length,
                    applianceGuides: applianceGuidesResponse.data.length,
                    technicalPlans: technicalPlansResponse.data.length
                });

                setHomeDetails({
                    home: homeResponse.data,
                    rooms: roomsResponse.data,
                    inventory: inventoryByHome,
                    stylingGuides: stylingGuidesResponse.data,
                    applianceGuides: applianceGuidesResponse.data,
                    technicalPlans: technicalPlansResponse.data,
                    categories: categoriesResponse.data,
                    stats
                });

            } catch (err) {
                console.error('Error al cargar detalles de la casa:', err);
                setError(err instanceof Error ? err.message : 'Error al cargar los datos');
            } finally {
                setIsLoading(false);
            }
        };

        if (homeId) {
            loadHomeDetails();
        }
    }, [homeId, apiClient]);

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

    if (error || !homeDetails) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <p className="text-red-800">Error al cargar los datos: {error}</p>
                        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
                            ← Volver al dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const { home, rooms, inventory, stylingGuides, applianceGuides, technicalPlans, categories, stats } = homeDetails;

    const filteredInventory = categoryFilter
        ? inventory.filter(i => (i.amenity?.category?.id || i.amenity?.category_id) === categoryFilter)
        : inventory;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Volver al dashboard
                    </Link>

                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                            {home.main_image ? (
                                <img
                                    src={home.main_image}
                                    alt={home.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{home.name}</h1>
                            <p className="text-gray-600">{home.address}</p>
                            <div className="flex items-center space-x-2 mt-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${home.destination === 'vacacional' ? 'bg-blue-100 text-blue-800' :
                                    home.destination === 'residencial' ? 'bg-green-100 text-green-800' :
                                        'bg-purple-100 text-purple-800'
                                    }`}>
                                    {home.destination}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{stats.inventory_count}</div>
                            <div className="text-sm text-gray-600">Items</div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{stats.styling_guides_count}</div>
                            <div className="text-sm text-gray-600">Guías de Estilo</div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{stats.appliance_guides_count}</div>
                            <div className="text-sm text-gray-600">Guías de Electrodomésticos</div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{stats.technical_plans_count}</div>
                            <div className="text-sm text-gray-600">Planos Técnicos</div>
                        </div>
                    </div>
                </div>

                {/* Inventario (al inicio) */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">📋 Inventario</h2>
                        <div className="flex items-center space-x-3">
                            <label className="text-sm text-gray-700">Categoría</label>
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="text-gray-700 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Todas</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {filteredInventory.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Espacio</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio compra</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                                        <th className="px-4 py-2"></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredInventory.map((item) => {
                                        const roomName = rooms.find(r => r.id === item.room_id)?.name || 'Sin asignar';
                                        const categoryName = item.amenity?.category?.name
                                            ?? (item.amenity?.category_id
                                                ? (categories.find(c => c.id === item.amenity!.category_id)?.name || item.amenity!.category_id)
                                                : '-');
                                        const brandName = item.amenity?.brand?.name || '-';
                                        const qty = item.quantity ?? 0;
                                        const price = typeof item.purchase_price === 'number' ? item.purchase_price : null;
                                        return (
                                            <tr key={item.id}>
                                                <td className="px-4 py-2 whitespace-nowrap">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden">
                                                            {item.amenity?.images && item.amenity.images[0] ? (
                                                                <img src={item.amenity.images[0]} alt={item.amenity.name} className="w-full h-full object-cover" />
                                                            ) : null}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">{item.amenity?.name || `ID: ${item.amenity_id}`}</div>
                                                            <div className="text-xs text-gray-500">{item.amenity?.reference} {item.amenity?.model && `· ${item.amenity.model}`}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-700">{categoryName}</td>
                                                <td className="px-4 py-2 text-sm text-gray-700">{brandName}</td>
                                                <td className="px-4 py-2 text-sm text-gray-700">{roomName}</td>
                                                <td className="px-4 py-2 text-sm text-gray-700">{qty}</td>
                                                <td className="px-4 py-2 text-sm text-gray-700">{price !== null ? `€${price.toFixed(2)}` : '-'}</td>
                                                <td className="px-4 py-2 text-sm text-gray-700">{item.location_details || '-'}</td>
                                                <td className="px-4 py-2 text-right text-sm">
                                                    <Link href={`/dashboard/${homeId}/inventory`} className="text-blue-600 hover:text-blue-800">Ver</Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {filteredInventory.length > 10 && (
                                <div className="text-center pt-3">
                                    <Link href={`/dashboard/${homeId}/inventory`} className="text-blue-600 hover:text-blue-800 text-sm">
                                        Ver todos los {filteredInventory.length} items →
                                    </Link>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-gray-500">No hay inventario {categoryFilter ? 'para esta categoría' : ''}.</p>
                    )}
                </div>

                {/* Guías Disponibles */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Guías de Estilo */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">🎨 Guías de Estilo</h2>
                        {stylingGuides.length > 0 ? (
                            <div className="space-y-3">
                                {stylingGuides.map((guide) => (
                                    <div key={guide.id} className="border border-gray-200 rounded-lg p-3">
                                        <h4 className="font-medium text-gray-900">{guide.title}</h4>
                                        <p className="text-sm text-gray-600 line-clamp-2">Guía de estilo para la habitación</p>
                                        {guide.image_urls && guide.image_urls.length > 0 && (
                                            <div className="mt-2 flex space-x-2">
                                                {guide.image_urls.slice(0, 3).map((image: string, index: number) => (
                                                    <img
                                                        key={index}
                                                        src={image}
                                                        alt={`Imagen ${index + 1}`}
                                                        className="w-8 h-8 object-cover rounded"
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No hay guías de estilo disponibles.</p>
                        )}
                    </div>

                    {/* Guías de Electrodomésticos */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">🔧 Guías de Electrodomésticos</h2>
                        {applianceGuides.length > 0 ? (
                            <div className="space-y-3">
                                {applianceGuides.map((guide) => (
                                    <div key={guide.id} className="border border-gray-200 rounded-lg p-3">
                                        <h4 className="font-medium text-gray-900">{guide.equipment_name}</h4>
                                        <p className="text-sm text-gray-600 line-clamp-2">{guide.brief_description}</p>
                                        <div className="mt-2 flex space-x-2 text-xs text-gray-500">
                                            {guide.pdf_url && <span>📄 PDF</span>}
                                            {guide.video_url && <span>🎥 Video</span>}
                                            {guide.image_urls && guide.image_urls.length > 0 && (
                                                <span>🖼️ {guide.image_urls.length} imágenes</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No hay guías de electrodomésticos disponibles.</p>
                        )}
                    </div>
                </div>

                {/* Planos Técnicos */}
                <div className="bg-white rounded-lg shadow-md p-6 mt-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">📐 Planos Técnicos</h2>
                    {technicalPlans.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {technicalPlans.map((plan) => (
                                <div key={plan.id} className="border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900">{plan.title}</h4>
                                    <p className="text-sm text-gray-600 line-clamp-2">{plan.description}</p>
                                    <div className="mt-2 text-xs text-gray-500">
                                        {plan.plan_file_url && <span>📄 Plano disponible</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">No hay planos técnicos disponibles.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
