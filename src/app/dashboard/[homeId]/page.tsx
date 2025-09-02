'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Home, Room, HomeInventoryWithRelations, StylingGuide, ApplianceGuide, TechnicalPlan, Category, Playbook } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
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
    playbooks: Playbook[];
    categories: Category[];
    stats: {
        rooms_count: number;
        inventory_count: number;
        styling_guides_count: number;
        appliance_guides_count: number;
        technical_plans_count: number;
        playbooks_count: number;
    };
}

export default function HomeDetailsPage() {
    const params = useParams();
    const homeId = params.homeId as string;

    const [homeDetails, setHomeDetails] = useState<HomeDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<string>('');
    const [isItemOpen, setIsItemOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<HomeInventoryWithRelations | null>(null);
    const [selectedStylingGuide, setSelectedStylingGuide] = useState<StylingGuide | null>(null);
    const [selectedApplianceGuide, setSelectedApplianceGuide] = useState<ApplianceGuide | null>(null);

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
                    playbooksResponse,
                    categoriesResponse
                ] = await Promise.all([
                    apiClient.getHomeById(homeId),
                    apiClient.listRoomsByHome(homeId),
                    apiClient.listInventory({ home_id: homeId, page: 1, pageSize: 50 }),
                    apiClient.listStylingGuidesByHome(homeId),
                    apiClient.listApplianceGuidesByHome(homeId),
                    apiClient.listTechnicalPlans({ home_id: homeId }),
                    apiClient.listPlaybooksByHome(homeId),
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
                    playbooks_count: playbooksResponse.data.length,
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
                    playbooks: playbooksResponse.data,
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
                                    {filteredInventory.slice(0, 5).map((item) => {
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
                                                            <div className="text-sm font-medium text-gray-900 max-w-[220px] truncate" title={item.amenity?.name || `ID: ${item.amenity_id}`}>{item.amenity?.name || `ID: ${item.amenity_id}`}</div>
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
                                                    <button
                                                        type="button"
                                                        onClick={() => { setSelectedItem(item); setIsItemOpen(true); }}
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        Ver
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <div className="text-center pt-3">
                                <Link href={`/dashboard/${homeId}/inventory`} className="inline-flex items-center px-3 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700">
                                    Ver más productos
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500">No hay inventario {categoryFilter ? 'para esta categoría' : ''}.</p>
                    )}
                </div>

                {/* Modal detalle de item */}
                <Modal
                    isOpen={isItemOpen}
                    onClose={() => { setIsItemOpen(false); setSelectedItem(null); }}
                    title={'Detalle de producto'}
                >
                    {selectedItem && (
                        <div className="space-y-4">
                            <div className="flex items-start space-x-4">
                                <div className="w-24 h-24 bg-gray-200 rounded overflow-hidden">
                                    {selectedItem.amenity?.images && selectedItem.amenity.images[0] ? (
                                        <img src={selectedItem.amenity.images[0]} alt={selectedItem.amenity.name} className="w-full h-full object-cover" />
                                    ) : null}
                                </div>
                                <div className="flex-1">
                                    <div className="text-base font-semibold text-gray-900 break-words line-clamp-2">
                                        {selectedItem.amenity?.name || `ID: ${selectedItem.amenity_id}`}
                                    </div>
                                    <div className="mt-1 flex items-center space-x-2">
                                        <span className="text-xs text-gray-500 uppercase">Categoría</span>
                                        <span className="text-sm font-medium text-gray-800">{selectedItem.amenity?.category?.name || '-'}</span>
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        {selectedItem.amenity?.reference} {selectedItem.amenity?.model && `· ${selectedItem.amenity.model}`}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="text-xs text-gray-500 uppercase">Marca</div>
                                    <div className="text-sm font-medium text-gray-800">{selectedItem.amenity?.brand?.name || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 uppercase">Espacio</div>
                                    <div className="text-sm font-medium text-gray-800">{rooms.find(r => r.id === selectedItem.room_id)?.name || 'Sin asignar'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 uppercase">Cantidad</div>
                                    <div className="text-sm font-medium text-gray-800">{selectedItem.quantity ?? 0}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 uppercase">Precio compra</div>
                                    <div className="text-sm font-medium text-gray-800">{typeof selectedItem.purchase_price === 'number' ? `€${selectedItem.purchase_price.toFixed(2)}` : '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 uppercase">Ubicación</div>
                                    <div className="text-sm font-medium text-gray-800">{selectedItem.location_details || '-'}</div>
                                </div>
                            </div>

                            {selectedItem.notes && (
                                <div>
                                    <div className="text-xs text-gray-500 uppercase">Notas</div>
                                    <div className="text-sm text-gray-800">{selectedItem.notes}</div>
                                </div>
                            )}

                            <div className="flex justify-end space-x-3 pt-2">
                                <Link href={`/dashboard/${homeId}/inventory`} className="text-sm text-blue-600 hover:text-blue-800">Ver en inventario completo</Link>
                                {/* Aquí podríamos añadir un botón Editar si procede */}
                            </div>
                        </div>
                    )}
                </Modal>

                {/* Guías Disponibles */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Guías de Estilo */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">🎨 Guías de Estilo</h2>
                        {stylingGuides.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {stylingGuides.map((guide) => {
                                    const refImage = (guide as unknown as { reference_photo_url?: string }).reference_photo_url || (guide.image_urls && guide.image_urls[0]) || '';
                                    return (
                                        <div key={guide.id} className="flex items-center space-x-4 border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                                            <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                                {refImage ? (
                                                    <img src={refImage} alt={guide.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">—</div>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-sm font-semibold text-gray-900 line-clamp-1" title={guide.title}>{guide.title}</div>
                                                <div className="text-xs text-gray-600 line-clamp-2">Guía de estilo para la habitación</div>
                                                <div className="mt-1 flex items-center space-x-2 text-[11px] text-gray-500">
                                                    {guide.image_urls && guide.image_urls.length > 0 && <span>🖼️ {guide.image_urls.length} imágenes</span>}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setSelectedStylingGuide(guide)}
                                                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex-shrink-0"
                                            >
                                                Ver guía
                                            </button>
                                        </div>
                                    );
                                })}
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
                                    <div key={guide.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-3">
                                        <div className="flex-1">
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
                                        <button
                                            onClick={() => setSelectedApplianceGuide(guide)}
                                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex-shrink-0 ml-3"
                                        >
                                            Ver guía
                                        </button>
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

            {selectedStylingGuide && (
                <Modal
                    isOpen={!!selectedStylingGuide}
                    onClose={() => setSelectedStylingGuide(null)}
                    title="Guía de Estilo"
                >
                    <div className="p-6 max-h-[80vh] overflow-y-auto">
                        <div className="space-y-6">
                            {/* Información de la habitación */}
                            <div className="border-b border-gray-200 pb-4">
                                <h4 className="font-medium text-gray-900 mb-2">{selectedStylingGuide.title}</h4>
                                <p className="text-sm text-gray-600">
                                    Habitación: {homeDetails.rooms.find(r => r.id === selectedStylingGuide.room_id)?.name || 'Sin asignar'}
                                </p>
                            </div>

                            {/* Imagen de referencia */}
                            {(selectedStylingGuide && selectedStylingGuide.reference_photo_url) && (
                                <div>
                                    <h5 className="font-medium text-gray-700 mb-2">Imagen de referencia</h5>
                                    <div className="flex justify-center">
                                        <img
                                            src={selectedStylingGuide.reference_photo_url as string}
                                            alt="Imagen de referencia"
                                            className="max-w-full max-h-64 object-contain rounded shadow-sm"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Galería de imágenes */}
                            {selectedStylingGuide.image_urls && selectedStylingGuide.image_urls.length > 0 && (
                                <div>
                                    <h5 className="font-medium text-gray-700 mb-2">Galería de imágenes ({selectedStylingGuide.image_urls.length})</h5>
                                    <div className="grid grid-cols-1 gap-3">
                                        {selectedStylingGuide.image_urls && selectedStylingGuide.image_urls.map((image: string, index: number) => (
                                            <div key={index} className="flex justify-center">
                                                <img
                                                    src={image}
                                                    alt={`Imagen ${index + 1}`}
                                                    className="max-w-full max-h-64 object-contain rounded shadow-sm"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Playbooks relacionados */}
                            {(() => {
                                const relatedPlaybooks = homeDetails.playbooks.filter(p => p.room_id === selectedStylingGuide.room_id);
                                return relatedPlaybooks.length > 0 ? (
                                    <div>
                                        <h5 className="font-medium text-gray-700 mb-3">📋 Playbooks relacionados ({relatedPlaybooks.length})</h5>
                                        <div className="space-y-3">
                                            {relatedPlaybooks.map((playbook) => (
                                                <div key={playbook.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h6 className="font-medium text-gray-900 text-sm">{playbook.title}</h6>
                                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-2 flex-shrink-0">
                                                            {playbook.type}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-600 mb-2">⏱️ {playbook.estimated_time}</p>
                                                    <div className="text-xs text-gray-500 space-y-1">
                                                        <div className="line-clamp-2">
                                                            <span className="font-medium">Tareas:</span> {playbook.tasks}
                                                        </div>
                                                        <div className="line-clamp-2">
                                                            <span className="font-medium">Materiales:</span> {playbook.materials}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <h5 className="font-medium text-gray-700 mb-2">📋 Playbooks relacionados</h5>
                                        <p className="text-sm text-gray-500">No hay playbooks disponibles para esta habitación.</p>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </Modal>
            )}

            {selectedApplianceGuide && (
                <Modal
                    isOpen={!!selectedApplianceGuide}
                    onClose={() => setSelectedApplianceGuide(null)}
                    title="Guía de Electrodoméstico"
                >
                    <div className="p-6 max-h-[80vh] overflow-y-auto">
                        <div className="space-y-6">
                            {/* Información del equipo */}
                            <div className="border-b border-gray-200 pb-4">
                                <h4 className="font-medium text-gray-900 mb-2">{selectedApplianceGuide.equipment_name}</h4>
                                <p className="text-sm text-gray-600 mb-2">{selectedApplianceGuide.brief_description}</p>
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                    <span>Modelo: {selectedApplianceGuide.model}</span>
                                    {selectedApplianceGuide.brand_id && (
                                        <span>Marca: {selectedApplianceGuide.brand_id}</span>
                                    )}
                                </div>
                            </div>

                            {/* Galería de imágenes */}
                            {selectedApplianceGuide.image_urls && selectedApplianceGuide.image_urls.length > 0 && (
                                <div>
                                    <h5 className="font-medium text-gray-700 mb-2">Galería de imágenes ({selectedApplianceGuide.image_urls.length})</h5>
                                    <div className="grid grid-cols-1 gap-3">
                                        {selectedApplianceGuide.image_urls.map((image, index) => (
                                            <div key={index} className="flex justify-center">
                                                <img
                                                    src={image}
                                                    alt={`Imagen ${index + 1}`}
                                                    className="max-w-full max-h-48 object-contain rounded shadow-sm"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Uso rápido */}
                            {selectedApplianceGuide.quick_use_bullets && (
                                <div>
                                    <h5 className="font-medium text-gray-700 mb-2">⚡ Uso rápido</h5>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <p className="text-sm text-gray-800 whitespace-pre-line">{selectedApplianceGuide.quick_use_bullets}</p>
                                    </div>
                                </div>
                            )}

                            {/* Mantenimiento */}
                            {selectedApplianceGuide.maintenance_bullets && (
                                <div>
                                    <h5 className="font-medium text-gray-700 mb-2">🔧 Mantenimiento</h5>
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                        <p className="text-sm text-gray-800 whitespace-pre-line">{selectedApplianceGuide.maintenance_bullets}</p>
                                    </div>
                                </div>
                            )}

                            {/* Enlaces */}
                            <div className="flex flex-wrap gap-2">
                                {selectedApplianceGuide.pdf_url && (
                                    <a
                                        href={selectedApplianceGuide.pdf_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                    >
                                        📄 Ver PDF
                                    </a>
                                )}
                                {selectedApplianceGuide.video_url && (
                                    <a
                                        href={selectedApplianceGuide.video_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-3 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                                    >
                                        🎥 Ver Video
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
