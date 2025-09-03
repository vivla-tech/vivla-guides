'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Home, Room, RoomType, Category, Brand, Supplier, Amenity, HomeInventoryWithRelations, HomeWithCompleteness } from '@/lib/types';
import { Input } from '@/components/ui/Input';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';
import { useApiData } from '@/hooks/useApiData';
import Link from 'next/link';

// Esquemas de validación para cada paso
const homeSchema = z.object({
    name: z.string().min(1, 'El nombre de la casa es requerido'),
    destination: z.string().min(1, 'El destino es requerido'),
    address: z.string().min(1, 'La dirección es requerida'),
});

const addInventorySchema = z.object({
    quantity: z.number().min(1, 'La cantidad debe ser mayor a 0'),
    purchase_price: z.number().min(0, 'El precio debe ser mayor o igual a 0').optional(),
    location_in_room: z.string().optional(),
});

const createAmenitySchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    category_id: z.string().min(1, 'Selecciona una categoría'),
    brand_id: z.string().optional(),
    reference: z.string().optional(),
    model: z.string().optional(),
    description: z.string().optional(),
    base_price: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
});

type HomeFormData = z.infer<typeof homeSchema>;
type AddInventoryFormData = z.infer<typeof addInventorySchema>;
type CreateAmenityFormData = z.infer<typeof createAmenitySchema>;

interface WizardState {
    currentStep: number;
    home: HomeWithCompleteness | null;
}

const STEPS = [
    { id: 1, title: 'Seleccionar Casa', description: 'Elige la casa para completar su inventario' },
    { id: 2, title: 'Inventario', description: '¿Qué hay en mi casa?' },
];

export default function InventoryWizardPage() {
    const [wizardState, setWizardState] = useState<WizardState>({
        currentStep: 1,
        home: null,
    });

    const [homeInventory, setHomeInventory] = useState<HomeInventoryWithRelations[]>([]);
    const [loadingInventory, setLoadingInventory] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [allAmenities, setAllAmenities] = useState<Amenity[]>([]);
    const [loadingAmenities, setLoadingAmenities] = useState(false);
    const [showAllAmenities, setShowAllAmenities] = useState(false);
    const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);
    const [selectedAmenityToAdd, setSelectedAmenityToAdd] = useState<Amenity | null>(null);
    const [showCreateAmenityModal, setShowCreateAmenityModal] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const apiClient = useMemo(() => createApiClient(config.apiUrl), []);

    // Cargar datos de soporte
    const { data: homesWithCompleteness, isLoading: loadingHomes } = useApiData<HomeWithCompleteness>('homes/with-completeness', { pageSize: 100 });
    const { data: categories } = useApiData<Category>('categories');
    const { data: brands } = useApiData<Brand>('brands');

    // Formularios
    const addInventoryForm = useForm<AddInventoryFormData>({
        resolver: zodResolver(addInventorySchema),
        defaultValues: {
            quantity: 1,
            purchase_price: 0,
        }
    });

    const createAmenityForm = useForm<CreateAmenityFormData>({
        resolver: zodResolver(createAmenitySchema),
        defaultValues: {
            base_price: 0,
        }
    });

    const handleNextStep = () => {
        if (wizardState.currentStep < STEPS.length) {
            setWizardState(prev => ({
                ...prev,
                currentStep: prev.currentStep + 1
            }));
        }
    };

    const handlePrevStep = () => {
        if (wizardState.currentStep > 1) {
            setSubmitMessage(null); // Limpiar mensaje al navegar
            setWizardState(prev => ({
                ...prev,
                currentStep: prev.currentStep - 1
            }));
        }
    };

    // Cargar inventario de una casa específica
    const loadHomeInventory = useCallback(async (homeId: string) => {
        if (!homeId) return;
        setLoadingInventory(true);
        try {
            const response = await apiClient.listInventory({
                page: 1,
                pageSize: 10,
                home_id: homeId
            });
            if (response.success) {
                setHomeInventory(response.data);
            }
        } catch (error) {
            console.error('Error loading inventory:', error);
        } finally {
            setLoadingInventory(false);
        }
    }, [apiClient]);

    // Cargar todos los amenities haciendo múltiples llamadas paginadas
    const loadAllAmenities = useCallback(async () => {
        setLoadingAmenities(true);
        try {
            let allAmenitiesData: Amenity[] = [];
            let page = 1;
            let hasMore = true;

            while (hasMore) {
                const response = await apiClient.listAmenities({ page, pageSize: 100 });

                if (response.success) {
                    allAmenitiesData = [...allAmenitiesData, ...response.data];

                    // Si recibimos menos de 100 elementos, ya no hay más páginas
                    hasMore = response.data.length === 100;
                    page++;
                } else {
                    break;
                }
            }

            setAllAmenities(allAmenitiesData);
        } catch (error) {
            console.error('Error loading all amenities:', error);
        } finally {
            setLoadingAmenities(false);
        }
    }, [apiClient]);

    // Filtrar amenities basado en el término de búsqueda
    const filteredAmenities = useMemo(() => {
        if (!allAmenities) return [];

        const trimmedTerm = searchTerm.trim();

        // Solo buscar si hay al menos 3 caracteres
        if (trimmedTerm.length < 3) return allAmenities;

        const term = trimmedTerm.toLowerCase();
        return allAmenities.filter(amenity =>
            (amenity.name && amenity.name.toLowerCase().includes(term)) ||
            (amenity.category?.name && amenity.category.name.toLowerCase().includes(term)) ||
            (amenity.brand?.name && amenity.brand.name.toLowerCase().includes(term)) ||
            (amenity.model && amenity.model.toLowerCase().includes(term))
        );
    }, [allAmenities, searchTerm]);

    // Cargar todos los amenities al montar el componente
    useEffect(() => {
        loadAllAmenities();
    }, [loadAllAmenities]);

    // Función para añadir amenity al inventario
    const handleAddAmenityToInventory = (amenity: Amenity) => {
        setSelectedAmenityToAdd(amenity);
        setShowAddInventoryModal(true);

        addInventoryForm.reset({
            quantity: 1,
            purchase_price: 0,
            location_in_room: '',
        });
    };

    // Función para enviar el formulario de inventario
    const handleSubmitInventory = async (data: AddInventoryFormData) => {
        if (!wizardState.home || !selectedAmenityToAdd) return;

        try {
            // Necesitamos un supplier_id válido - vamos a obtener el primero disponible
            const suppliers = await apiClient.listSuppliers({ page: 1, pageSize: 1 });
            let supplierId = '';

            if (suppliers.success && suppliers.data.length > 0) {
                supplierId = suppliers.data[0].id;
            } else {
                alert('Error: No hay proveedores disponibles en el sistema. Por favor, crea un proveedor primero.');
                return;
            }

            // Crear objeto base con campos requeridos
            const inventoryData = {
                home_id: wizardState.home.id,
                amenity_id: selectedAmenityToAdd.id,
                quantity: data.quantity,
                location_details: data.location_in_room || 'Sin ubicación específica',
                minimum_threshold: 1,
                supplier_id: supplierId,
                purchase_price: data.purchase_price || 0,
            };

            const response = await apiClient.createInventory(inventoryData);

            if (response.success) {
                // Recargar el inventario de la casa
                await loadHomeInventory(wizardState.home.id);

                // Cerrar modal y limpiar estado
                setShowAddInventoryModal(false);
                setSelectedAmenityToAdd(null);
                setSubmitMessage(null); // Limpiar cualquier mensaje anterior
                addInventoryForm.reset({
                    quantity: 1,
                    purchase_price: 0,
                    location_in_room: '',
                });
            }
        } catch (error) {
            console.error('❌ Error adding to inventory:', error);
        }
    };

    // Función para crear un nuevo amenity
    const handleCreateAmenity = async (data: CreateAmenityFormData) => {
        try {
            const amenityData = {
                name: data.name,
                category_id: data.category_id,
                brand_id: data.brand_id || '', // String vacío si no se proporciona
                reference: data.reference || '', // String vacío si no se proporciona
                model: data.model || '', // String vacío si no se proporciona
                description: data.description || '', // String vacío si no se proporciona
                base_price: data.base_price,
                images: [] // Array vacío por defecto
            };

            const response = await apiClient.createAmenity(amenityData);

            if (response.success) {
                // Recargar todos los amenities para incluir el nuevo
                await loadAllAmenities();

                // Cerrar modal y limpiar formulario
                setShowCreateAmenityModal(false);
                createAmenityForm.reset({
                    name: '',
                    category_id: '',
                    brand_id: '',
                    reference: '',
                    model: '',
                    description: '',
                    base_price: 0,
                });

                // Seleccionar automáticamente el amenity recién creado para añadirlo al inventario
                const newAmenity = response.data;
                handleAddAmenityToInventory(newAmenity);
            }
        } catch (error) {
            console.error('Error creating amenity:', error);
        }
    };

    const renderStepContent = () => {
        switch (wizardState.currentStep) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Seleccionar Casa
                            </h2>
                            <p className="text-gray-600">
                                Elige la casa para la que quieres completar su inventario
                            </p>
                            {!loadingHomes && homesWithCompleteness && homesWithCompleteness.length > 0 && (
                                <p className="text-sm text-gray-500 mt-2">
                                    Mostrando {homesWithCompleteness.length} casa{homesWithCompleteness.length !== 1 ? 's' : ''} (ordenadas por completitud)
                                </p>
                            )}
                        </div>

                        {loadingHomes ? (
                            <div className="text-center py-12">
                                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-gray-500">Cargando casas...</p>
                            </div>
                        ) : homesWithCompleteness && homesWithCompleteness.length > 0 ? (
                            <div className="space-y-4">
                                {homesWithCompleteness
                                    .sort((a, b) => a.completeness - b.completeness)
                                    .map((home) => (
                                        <div key={home.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                                                        {home.main_image ? (
                                                            <img src={home.main_image} alt={home.name} className="w-full h-full object-cover rounded-lg" />
                                                        ) : (
                                                            <span className="text-blue-600 text-xl">🏠</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900">{home.name}</h3>
                                                        <p className="text-sm text-gray-500">{home.destination}</p>
                                                        <p className="text-sm text-gray-500">{home.address}</p>

                                                        {/* Progress bar de completitud */}
                                                        <div className="mt-2">
                                                            <div className="flex items-center space-x-2">
                                                                <div className="flex-1">
                                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                                        <div
                                                                            className={`h-2 rounded-full transition-all duration-300 $${home.completeness >= 75 ? 'bg-green-500' :
                                                                                home.completeness >= 50 ? 'bg-yellow-500' :
                                                                                    home.completeness >= 25 ? 'bg-orange-500' : 'bg-red-500'
                                                                                }`}
                                                                            style={{ width: `${home.completeness}%` }}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                                <span className="text-sm text-gray-600">{home.completeness}%</span>
                                                            </div>
                                                        </div>

                                                        {/* Contadores */}
                                                        <div className="flex space-x-4 mt-2 text-xs text-gray-500">
                                                            <span>📦 {home.counts.inventory} productos</span>
                                                            <span>🎨 {home.counts.styling_guides} guías</span>
                                                            <span>⚡ {home.counts.appliance_guides} electrodomésticos</span>
                                                            <span>📋 {home.counts.technical_plans} planos</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setWizardState(prev => ({ ...prev, home }));
                                                        loadHomeInventory(home.id);
                                                        handleNextStep();
                                                    }}
                                                    className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                                                >
                                                    Completar Inventario
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-gray-400 text-xl">🏠</span>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay casas disponibles</h3>
                                <p className="text-gray-500">Crea una casa primero desde el panel de administración.</p>
                            </div>
                        )}
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Inventario
                            </h2>
                            <p className="text-gray-600">
                                ¿Qué hay en mi casa? Revisa y completa el inventario de <strong>{wizardState.home?.name}</strong>
                            </p>
                        </div>

                        {/* Productos actuales */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                            <h3 className="font-semibold text-blue-900 mb-4">Productos Actuales</h3>
                            <p className="text-sm text-blue-700 mb-4">
                                {wizardState.home?.counts.inventory || 0} productos registrados en esta casa
                            </p>

                            {loadingInventory ? (
                                <div className="text-center py-8">
                                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                    <p className="text-blue-600 text-sm">Cargando inventario...</p>
                                </div>
                            ) : homeInventory.length > 0 ? (
                                <div className="space-y-3">
                                    {homeInventory.slice(0, 3).map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-blue-200 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <span className="text-blue-600 text-sm">📦</span>
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{item.amenity?.name}</div>
                                                    <div className="text-sm text-gray-500">
                                                        {item.amenity?.category?.name} • {item.room?.name} • Cantidad: {item.quantity}
                                                    </div>
                                                </div>
                                            </div>
                                            <button className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors">
                                                Editar
                                            </button>
                                        </div>
                                    ))}
                                    {homeInventory.length > 3 && (
                                        <div className="text-center">
                                            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                                Ver todos los productos ({homeInventory.length})
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <span className="text-blue-600 text-xl">📦</span>
                                    </div>
                                    <p className="text-blue-600 mb-2">No hay productos registrados</p>
                                    <p className="text-sm text-blue-500">Empieza añadiendo productos al inventario</p>
                                </div>
                            )}
                        </div>

                        {/* Añadir nuevos productos */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                            <h3 className="font-semibold text-blue-900 mb-4">Añadir Productos</h3>

                            {/* Buscador de amenities */}
                            <div className="mb-6">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setShowAllAmenities(false);
                                        }}
                                        placeholder="Buscar productos existentes (mínimo 3 letras, ej: sofá, nevera, lámpara...)"
                                        className="w-full pl-10 pr-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400"
                                    />
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Lista de amenities */}
                            <div className="mb-6">
                                <h4 className="font-medium text-blue-900 mb-3">
                                    {loadingAmenities ? 'Cargando productos...' :
                                        searchTerm.trim().length >= 3 ? `Resultados de búsqueda (${filteredAmenities.length})` :
                                            `Productos Disponibles (${allAmenities.length || 0})`}
                                </h4>

                                {loadingAmenities ? (
                                    <div className="text-center py-8">
                                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                        <p className="text-gray-500">Cargando todos los productos disponibles...</p>
                                    </div>
                                ) : searchTerm.trim().length > 0 && searchTerm.trim().length < 3 ? (
                                    <div className="text-center py-8">
                                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <span className="text-yellow-600 text-xl">⌨️</span>
                                        </div>
                                        <p className="text-gray-500 mb-2">Escribe al menos 3 caracteres para buscar</p>
                                        <p className="text-sm text-gray-400">Faltan {3 - searchTerm.trim().length} caracteres más</p>
                                    </div>
                                ) : searchTerm.trim().length >= 3 && filteredAmenities.length === 0 ? (
                                    <div className="text-center py-8">
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <span className="text-gray-400 text-xl">🔍</span>
                                        </div>
                                        <p className="text-gray-500 mb-2">No se encontraron productos</p>
                                        <p className="text-sm text-gray-400">Prueba con otros términos o crea un nuevo producto</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {(searchTerm.trim().length >= 3 ? filteredAmenities : allAmenities)
                                                .slice(0, searchTerm.trim().length >= 3 ? 12 : (showAllAmenities ? allAmenities.length : 6))
                                                .map((amenity) => (
                                                    <div key={amenity.id} className="flex items-center justify-between p-3 bg-white border border-blue-200 rounded-lg hover:shadow-sm transition-shadow">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                                <span className="text-blue-600 text-sm">📦</span>
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-gray-900 text-sm">{amenity.name}</div>
                                                                <div className="text-xs text-gray-500">{amenity.category?.name} • {amenity.brand?.name}</div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleAddAmenityToInventory(amenity)}
                                                            className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                                                        >
                                                            Añadir
                                                        </button>
                                                    </div>
                                                ))}
                                        </div>

                                        {searchTerm.trim().length < 3 && allAmenities && allAmenities.length > 6 && !showAllAmenities && (
                                            <div className="text-center mt-3">
                                                <button
                                                    onClick={() => setShowAllAmenities(true)}
                                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                >
                                                    Ver todos los productos ({allAmenities.length})
                                                </button>
                                            </div>
                                        )}

                                        {searchTerm.trim().length < 3 && showAllAmenities && (
                                            <div className="text-center mt-3">
                                                <button
                                                    onClick={() => setShowAllAmenities(false)}
                                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                >
                                                    Mostrar menos productos
                                                </button>
                                            </div>
                                        )}

                                        {searchTerm.trim().length >= 3 && filteredAmenities.length > 12 && (
                                            <div className="text-center mt-3">
                                                <p className="text-sm text-gray-500">
                                                    Mostrando 12 de {filteredAmenities.length} resultados
                                                </p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Crear nuevo producto */}
                            <div className="border-t border-blue-200 pt-4">
                                <div className="flex items-center justify-between p-4 bg-white border border-dashed border-blue-300 rounded-lg hover:border-blue-400 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                            <span className="text-green-600 text-sm">➕</span>
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">¿No encuentras el producto?</div>
                                            <div className="text-sm text-gray-500">Crea un nuevo amenity para esta casa</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowCreateAmenityModal(true)}
                                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 transition-colors"
                                    >
                                        Crear Nuevo
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Mensaje de estado */}
                        {submitMessage && (
                            <div className={`p-4 rounded-md ${submitMessage.type === 'success'
                                ? 'bg-green-50 text-green-800 border border-green-200'
                                : 'bg-red-50 text-red-800 border border-red-200'
                                }`}>
                                {submitMessage.message}
                            </div>
                        )}

                        <div className="flex justify-between">
                            <button
                                onClick={handlePrevStep}
                                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                Anterior
                            </button>
                            <button
                                onClick={() => {
                                    setSubmitMessage({
                                        type: 'success',
                                        message: '¡Inventario completado exitosamente! Redirigiendo al dashboard...'
                                    });
                                    setTimeout(() => {
                                        window.location.href = '/';
                                    }, 2000);
                                }}
                                className="px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                            >
                                <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Finalizar Inventario
                            </button>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium mb-4"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Volver al Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Completar Inventario de Casa
                    </h1>
                    <p className="text-lg text-gray-600 mb-4">
                        Asistente paso a paso para añadir productos al inventario de una casa
                    </p>

                    {/* Help Section */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="text-sm text-blue-800">
                                <p className="font-medium mb-1">¿Por qué usar este asistente?</p>
                                <p className="text-blue-700">
                                    Este asistente te guía paso a paso para añadir productos al inventario de una casa de manera rápida y sencilla.
                                    Podrás buscar productos existentes o crear nuevos según necesites.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                            Paso {wizardState.currentStep} de {STEPS.length}
                        </span>
                        <span className="text-sm text-gray-500">
                            {Math.round((wizardState.currentStep / STEPS.length) * 100)}% completado
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(wizardState.currentStep / STEPS.length) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Steps Indicator */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        {STEPS.map((step, index) => (
                            <div key={step.id} className="flex items-center">
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${index + 1 < wizardState.currentStep
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : index + 1 === wizardState.currentStep
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-gray-300 text-gray-400'
                                    }`}>
                                    {index + 1 < wizardState.currentStep ? (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        step.id
                                    )}
                                </div>
                                <div className="ml-3">
                                    <div className={`text-sm font-medium ${index + 1 <= wizardState.currentStep ? 'text-blue-600' : 'text-gray-500'
                                        }`}>
                                        {step.title}
                                    </div>
                                    <div className="text-xs text-gray-500">{step.description}</div>
                                </div>
                                {index < STEPS.length - 1 && (
                                    <div className={`hidden sm:block mx-4 w-12 h-0.5 ${index + 1 < wizardState.currentStep ? 'bg-blue-600' : 'bg-gray-300'
                                        }`}></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step Content */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    {renderStepContent()}
                </div>
            </div>

            {/* Modal para añadir inventario */}
            {showAddInventoryModal && selectedAmenityToAdd && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Añadir a Inventario
                            </h3>
                            <button
                                onClick={() => setShowAddInventoryModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Información del producto */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600">📦</span>
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900">{selectedAmenityToAdd.name}</h4>
                                    <p className="text-sm text-gray-500">
                                        {selectedAmenityToAdd.category?.name} • {selectedAmenityToAdd.brand?.name}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Formulario */}
                        <form onSubmit={addInventoryForm.handleSubmit(handleSubmitInventory)} className="space-y-4">
                            {/* Cantidad */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cantidad *
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    {...addInventoryForm.register('quantity', { valueAsNumber: true })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400"
                                />
                                {addInventoryForm.formState.errors.quantity && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {addInventoryForm.formState.errors.quantity.message}
                                    </p>
                                )}
                            </div>

                            {/* Precio de compra */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Precio de compra (opcional)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    {...addInventoryForm.register('purchase_price', { valueAsNumber: true })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400"
                                    placeholder="0.00"
                                />
                            </div>

                            {/* Ubicación en la habitación */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ubicación específica (opcional)
                                </label>
                                <input
                                    type="text"
                                    {...addInventoryForm.register('location_in_room')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400"
                                    placeholder="Ej: Armario, Mesa de noche, etc."
                                />
                            </div>

                            {/* Botones */}
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddInventoryModal(false)}
                                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    Añadir al Inventario
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal para crear amenity */}
            {showCreateAmenityModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Crear Nuevo Producto
                            </h3>
                            <button
                                onClick={() => setShowCreateAmenityModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Formulario */}
                        <form onSubmit={createAmenityForm.handleSubmit(handleCreateAmenity)} className="space-y-4">
                            {/* Nombre */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre del producto *
                                </label>
                                <input
                                    type="text"
                                    {...createAmenityForm.register('name')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white placeholder-gray-400"
                                    placeholder="Ej: Sofá cama, Lámpara LED, etc."
                                />
                                {createAmenityForm.formState.errors.name && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {createAmenityForm.formState.errors.name.message}
                                    </p>
                                )}
                            </div>

                            {/* Categoría */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Categoría *
                                </label>
                                <select
                                    {...createAmenityForm.register('category_id')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                                >
                                    <option value="">Selecciona una categoría</option>
                                    {categories?.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                {createAmenityForm.formState.errors.category_id && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {createAmenityForm.formState.errors.category_id.message}
                                    </p>
                                )}
                            </div>

                            {/* Marca */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Marca
                                </label>
                                <select
                                    {...createAmenityForm.register('brand_id')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                                >
                                    <option value="">Selecciona una marca (opcional)</option>
                                    {brands?.map((brand) => (
                                        <option key={brand.id} value={brand.id}>
                                            {brand.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Precio base */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Precio base *
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    {...createAmenityForm.register('base_price', { valueAsNumber: true })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white placeholder-gray-400"
                                    placeholder="0.00"
                                />
                                {createAmenityForm.formState.errors.base_price && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {createAmenityForm.formState.errors.base_price.message}
                                    </p>
                                )}
                            </div>

                            {/* Botones */}
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateAmenityModal(false)}
                                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                    Crear y Añadir
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}