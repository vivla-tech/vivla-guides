'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { HomeWithCompleteness, Room, StylingGuide, Playbook, HomeInventoryWithRelations, TechnicalPlan, ApplianceGuide } from '@/lib/types';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';

export default function HomeDetailPage() {
    const params = useParams();
    const homeId = params.homeId as string;

    const [home, setHome] = useState<HomeWithCompleteness | null>(null);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [inventory, setInventory] = useState<HomeInventoryWithRelations[]>([]);
    const [technicalPlans, setTechnicalPlans] = useState<TechnicalPlan[]>([]);
    const [applianceGuides, setApplianceGuides] = useState<ApplianceGuide[]>([]);
    const [stylingGuides, setStylingGuides] = useState<StylingGuide[]>([]);
    const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const apiClient = createApiClient(config.apiUrl);

    useEffect(() => {
        if (homeId) {
            loadHomeData();
        }
    }, [homeId]);

    const loadHomeData = async () => {
        setLoading(true);
        try {
            // Cargar casa con completitud
            const homeResponse = await apiClient.listHomesWithCompleteness({ pageSize: 100 });
            if (homeResponse.success) {
                const foundHome = homeResponse.data.find(h => h.id === homeId);
                if (foundHome) {
                    setHome(foundHome);
                    await Promise.all([
                        loadRooms(homeId),
                        loadInventory(homeId),
                        loadTechnicalPlans(homeId),
                        loadApplianceGuides(homeId),
                        loadStylingGuides(),
                        loadPlaybooks()
                    ]);
                } else {
                    setError('Casa no encontrada');
                }
            }
        } catch (error) {
            console.error('Error loading home data:', error);
            setError('Error al cargar los datos de la casa');
        } finally {
            setLoading(false);
        }
    };

    const loadRooms = async (homeId: string) => {
        try {
            const response = await apiClient.listRooms({ home_id: homeId });
            if (response.success) {
                setRooms(response.data);
            }
        } catch (error) {
            console.error('Error loading rooms:', error);
        }
    };

    const loadInventory = async (homeId: string) => {
        try {
            const response = await apiClient.listInventory({ home_id: homeId });
            if (response.success) {
                setInventory(response.data);
            }
        } catch (error) {
            console.error('Error loading inventory:', error);
        }
    };

    const loadTechnicalPlans = async (homeId: string) => {
        try {
            const response = await apiClient.listTechnicalPlans({ home_id: homeId });
            if (response.success) {
                setTechnicalPlans(response.data);
            }
        } catch (error) {
            console.error('Error loading technical plans:', error);
        }
    };

    const loadApplianceGuides = async (homeId: string) => {
        try {
            const response = await apiClient.listApplianceGuidesByHome(homeId);
            if (response.success) {
                setApplianceGuides(response.data);
            }
        } catch (error) {
            console.error('Error loading appliance guides:', error);
        }
    };

    const loadStylingGuides = async () => {
        try {
            const response = await apiClient.listStylingGuides({ pageSize: 100 });
            if (response.success) {
                setStylingGuides(response.data);
            }
        } catch (error) {
            console.error('Error loading styling guides:', error);
        }
    };

    const loadPlaybooks = async () => {
        try {
            const response = await apiClient.listPlaybooks({ pageSize: 100 });
            if (response.success) {
                setPlaybooks(response.data);
            }
        } catch (error) {
            console.error('Error loading playbooks:', error);
        }
    };

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

    if (loading) {
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

    if (error || !home) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <p className="text-red-800">{error || 'Casa no encontrada'}</p>
                        <Link href="/" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
                            ← Volver al inicio
                        </Link>
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
                    <Link
                        href="/"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium mb-4"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Volver al Inicio
                    </Link>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-start space-x-6">
                            <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                {home.main_image ? (
                                    <img src={home.main_image} alt={home.name} className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                    <span className="text-gray-400 text-2xl">🏠</span>
                                )}
                            </div>
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">{home.name}</h1>
                                <p className="text-lg text-gray-600 mb-4">{home.address}</p>
                                <div className="flex items-center space-x-4">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getCompletenessColor(home.completeness)}`}>
                                        {getCompletenessLabel(home.completeness)} ({home.completeness}%)
                                    </span>
                                    <span className="text-gray-500">📍 {home.destination}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Acciones Rápidas */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Link
                            href={`/home/${homeId}/inventory`}
                            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span className="text-blue-600 text-lg">📦</span>
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900">Ver Inventario</h3>
                                <p className="text-sm text-gray-500">{inventory.length} items</p>
                            </div>
                        </Link>

                        <Link
                            href={`/wizard/styling-guides?homeId=${homeId}`}
                            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <span className="text-purple-600 text-lg">🎨</span>
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900">Guías de Estilo</h3>
                                <p className="text-sm text-gray-500">{stylingGuides.filter(g => rooms.some(r => r.id === g.room_id)).length} guías</p>
                            </div>
                        </Link>

                        <Link
                            href={`/wizard/technical-docs?homeId=${homeId}`}
                            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <span className="text-green-600 text-lg">📐</span>
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900">Documentación Técnica</h3>
                                <p className="text-sm text-gray-500">{technicalPlans.length + applianceGuides.length} documentos</p>
                            </div>
                        </Link>

                        <Link
                            href={`/wizard/catalog`}
                            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                <span className="text-orange-600 text-lg">🏷️</span>
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900">Gestionar Catálogo</h3>
                                <p className="text-sm text-gray-500">Marcas, categorías, productos</p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Secciones de la Guía */}
                <div className="space-y-8">
                    {/* Inventario */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Inventario</h2>
                            <span className="text-sm text-gray-500">{inventory.length} items</span>
                        </div>
                        {inventory.length > 0 ? (
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {inventory.slice(0, 5).map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <h4 className="font-medium text-gray-900">{item.amenity?.name || 'Item sin nombre'}</h4>
                                            <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                                        </div>
                                        <span className="text-sm text-gray-500">€{(item.amenity?.base_price || 0) * item.quantity}</span>
                                    </div>
                                ))}
                                {inventory.length > 5 && (
                                    <p className="text-sm text-gray-500 text-center">
                                        +{inventory.length - 5} items más
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-8">No hay items en el inventario</p>
                        )}
                        <div className="mt-4">
                            <Link
                                href={`/home/${homeId}/inventory`}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                                Ver inventario completo →
                            </Link>
                        </div>
                    </div>

                    {/* Documentación Técnica */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Documentación Técnica</h2>
                            <span className="text-sm text-gray-500">{technicalPlans.length + applianceGuides.length} documentos</span>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-medium text-gray-900 mb-2">Planos Técnicos ({technicalPlans.length})</h3>
                                {technicalPlans.length > 0 ? (
                                    <div className="space-y-2">
                                        {technicalPlans.map((plan) => (
                                            <div key={plan.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                                                <span className="text-blue-600">📐</span>
                                                <span className="text-sm text-gray-900">{plan.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">No hay planos técnicos</p>
                                )}
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900 mb-2">Guías de Electrodomésticos ({applianceGuides.length})</h3>
                                {applianceGuides.length > 0 ? (
                                    <div className="space-y-2">
                                        {applianceGuides.map((guide) => (
                                            <div key={guide.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                                                <span className="text-green-600">🔌</span>
                                                <span className="text-sm text-gray-900">{guide.equipment_name}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">No hay guías de electrodomésticos</p>
                                )}
                            </div>
                        </div>
                        <div className="mt-4">
                            <Link
                                href={`/wizard/technical-docs?homeId=${homeId}`}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                                Gestionar documentación →
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Habitaciones */}
                <div className="mt-8">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Habitaciones</h2>
                            <span className="text-sm text-gray-500">{rooms.length} habitaciones</span>
                        </div>

                        {rooms.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {rooms.map((room) => {
                                    const roomStylingGuides = stylingGuides.filter(g => g.room_id === room.id);
                                    const roomPlaybooks = playbooks.filter(p => p.room_id === room.id);

                                    return (
                                        <div key={room.id} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center space-x-3 mb-3">
                                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                                    <span className="text-purple-600 text-sm">🚪</span>
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-gray-900">{room.name}</h3>
                                                    <p className="text-sm text-gray-500">{room.description || 'Sin descripción'}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-700 mb-1">
                                                        Guías de Estilo ({roomStylingGuides.length})
                                                    </h4>
                                                    {roomStylingGuides.length > 0 ? (
                                                        <div className="space-y-1">
                                                            {roomStylingGuides.map((guide) => (
                                                                <div key={guide.id} className="flex items-center space-x-2 p-1 bg-purple-50 rounded text-xs">
                                                                    <span className="text-purple-600">🎨</span>
                                                                    <span className="text-gray-900">{guide.title}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-gray-500">No hay guías de estilo</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-700 mb-1">
                                                        Playbooks ({roomPlaybooks.length})
                                                    </h4>
                                                    {roomPlaybooks.length > 0 ? (
                                                        <div className="space-y-1">
                                                            {roomPlaybooks.map((playbook) => (
                                                                <div key={playbook.id} className="flex items-center space-x-2 p-1 bg-blue-50 rounded text-xs">
                                                                    <span className="text-blue-600">📋</span>
                                                                    <span className="text-gray-900">{playbook.title}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-gray-500">No hay playbooks</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-gray-100">
                                                <Link
                                                    href={`/wizard/styling-guides?homeId=${homeId}&roomId=${room.id}`}
                                                    className="text-purple-600 hover:text-purple-800 text-xs font-medium"
                                                >
                                                    Gestionar guías →
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-8">No hay habitaciones definidas</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
