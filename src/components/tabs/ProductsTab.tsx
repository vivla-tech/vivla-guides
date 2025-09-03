'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Amenity, CreateAmenity, Brand, Category } from '@/lib/types';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';

const createAmenitySchema = z.object({
    name: z.string().min(1, 'El nombre del producto es requerido'),
    category_id: z.string().min(1, 'La categoría es requerida'),
    brand_id: z.string().optional(),
    reference: z.string().optional(),
    model: z.string().optional(),
    description: z.string().optional(),
    base_price: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
});

type CreateAmenityFormData = z.infer<typeof createAmenitySchema>;

interface ProductsTabProps {
    submitMessage: { type: 'success' | 'error'; message: string } | null;
    setSubmitMessage: (message: { type: 'success' | 'error'; message: string } | null) => void;
}

export default function ProductsTab({ submitMessage, setSubmitMessage }: ProductsTabProps) {
    const [amenities, setAmenities] = useState<Amenity[]>([]);
    const [loadingAmenities, setLoadingAmenities] = useState(false);
    const [editingAmenity, setEditingAmenity] = useState<Amenity | null>(null);
    const [deletingAmenity, setDeletingAmenity] = useState<Amenity | null>(null);
    const [showAmenityForm, setShowAmenityForm] = useState(false);

    // Estados para paginación
    const [amenitiesPage, setAmenitiesPage] = useState(1);
    const [amenitiesPageSize] = useState(20);
    const [amenitiesTotal, setAmenitiesTotal] = useState(0);
    const [amenitiesTotalPages, setAmenitiesTotalPages] = useState(0);

    // Estados para categorías y marcas (para los selects)
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);

    const apiClient = createApiClient(config.apiUrl);

    const amenityForm = useForm<CreateAmenityFormData>({
        resolver: zodResolver(createAmenitySchema),
        defaultValues: {
            name: '',
            category_id: '',
            brand_id: '',
            reference: '',
            model: '',
            description: '',
            base_price: 0,
        }
    });

    // Funciones para gestión de productos
    const loadAmenities = async (page: number = amenitiesPage) => {
        setLoadingAmenities(true);
        try {
            const response = await apiClient.listAmenities({ page, pageSize: amenitiesPageSize });
            if (response.success) {
                setAmenities(response.data);
                setAmenitiesTotal(response.meta.total);
                setAmenitiesTotalPages(response.meta.totalPages);
                setAmenitiesPage(page);
            }
        } catch (error) {
            console.error('Error loading amenities:', error);
        } finally {
            setLoadingAmenities(false);
        }
    };

    const loadCategories = async () => {
        try {
            // Cargar hasta 100 categorías para los selects (suficiente para la mayoría de casos)
            const response = await apiClient.listCategories({ page: 1, pageSize: 100 });
            if (response.success) {
                setCategories(response.data);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    const loadBrands = async () => {
        try {
            // Cargar hasta 100 marcas para los selects (suficiente para la mayoría de casos)
            const response = await apiClient.listBrands({ page: 1, pageSize: 100 });
            if (response.success) {
                setBrands(response.data);
            }
        } catch (error) {
            console.error('Error loading brands:', error);
        }
    };

    const handleCreateAmenity = async (data: CreateAmenityFormData) => {
        try {
            const amenityData: CreateAmenity = {
                name: data.name,
                category_id: data.category_id,
                brand_id: data.brand_id || '',
                reference: data.reference || '',
                model: data.model || '',
                description: data.description || '',
                base_price: data.base_price,
                images: [],
            };

            const response = await apiClient.createAmenity(amenityData);
            if (response.success) {
                await loadAmenities(); // Recargar productos
                amenityForm.reset();
                setShowAmenityForm(false);
                setSubmitMessage({
                    type: 'success',
                    message: '¡Producto creado exitosamente!'
                });
                setTimeout(() => setSubmitMessage(null), 3000);
            }
        } catch (error) {
            console.error('Error creating amenity:', error);
            setSubmitMessage({
                type: 'error',
                message: 'Error al crear el producto'
            });
        }
    };

    const handleEditAmenity = async (data: CreateAmenityFormData) => {
        if (!editingAmenity) return;

        try {
            const amenityData: CreateAmenity = {
                name: data.name,
                category_id: data.category_id,
                brand_id: data.brand_id || '',
                reference: data.reference || '',
                model: data.model || '',
                description: data.description || '',
                base_price: data.base_price,
                images: [],
            };

            const response = await apiClient.updateAmenity(editingAmenity.id, amenityData);
            if (response.success) {
                await loadAmenities(); // Recargar productos
                amenityForm.reset();
                setEditingAmenity(null);
                setShowAmenityForm(false);
                setSubmitMessage({
                    type: 'success',
                    message: '¡Producto actualizado exitosamente!'
                });
                setTimeout(() => setSubmitMessage(null), 3000);
            }
        } catch (error) {
            console.error('Error updating amenity:', error);
            setSubmitMessage({
                type: 'error',
                message: 'Error al actualizar el producto'
            });
        }
    };

    const handleDeleteAmenity = async () => {
        if (!deletingAmenity) return;

        try {
            await apiClient.deleteAmenity(deletingAmenity.id);
            await loadAmenities(); // Recargar productos
            setDeletingAmenity(null);
            setSubmitMessage({
                type: 'success',
                message: '¡Producto eliminado exitosamente!'
            });
            setTimeout(() => setSubmitMessage(null), 3000);
        } catch (error) {
            console.error('Error deleting amenity:', error);
            setSubmitMessage({
                type: 'error',
                message: 'Error al eliminar el producto'
            });
        }
    };

    const openEditAmenity = (amenity: Amenity) => {
        setEditingAmenity(amenity);
        amenityForm.setValue('name', amenity.name);
        amenityForm.setValue('category_id', amenity.category_id);
        amenityForm.setValue('brand_id', amenity.brand_id || '');
        amenityForm.setValue('reference', amenity.reference || '');
        amenityForm.setValue('model', amenity.model || '');
        amenityForm.setValue('description', amenity.description || '');
        amenityForm.setValue('base_price', amenity.base_price || 0);
        setShowAmenityForm(true);
    };

    // Cargar datos al montar el componente
    useEffect(() => {
        loadAmenities();
        loadCategories();
        loadBrands();
    }, []);

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                    Gestionar Productos
                </h2>
                {!showAmenityForm && (
                    <button
                        onClick={() => setShowAmenityForm(true)}
                        className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100"
                    >
                        ➕ Nuevo Producto
                    </button>
                )}
            </div>

            {/* Mensaje de estado */}
            {submitMessage && (
                <div className={`p-4 rounded-md mb-6 ${submitMessage.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                    {submitMessage.message}
                </div>
            )}

            <div className="space-y-6">
                {/* Formulario para crear/editar producto */}
                <div className="space-y-4 max-w-2xl">
                    <h3 className="font-medium text-gray-900">
                        {editingAmenity ? 'Editar Producto' : 'Crear Nuevo Producto'}
                    </h3>

                    {showAmenityForm && (
                        <form onSubmit={amenityForm.handleSubmit(editingAmenity ? handleEditAmenity : handleCreateAmenity)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre del Producto *
                                </label>
                                <input
                                    type="text"
                                    {...amenityForm.register('name')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400"
                                    placeholder="Ej: Sofá cama, Lámpara LED, Nevera..."
                                />
                                {amenityForm.formState.errors.name && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {amenityForm.formState.errors.name.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Categoría *
                                </label>
                                <select
                                    {...amenityForm.register('category_id')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                                >
                                    <option value="">Selecciona una categoría</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                {amenityForm.formState.errors.category_id && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {amenityForm.formState.errors.category_id.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Marca (opcional)
                                </label>
                                <select
                                    {...amenityForm.register('brand_id')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                                >
                                    <option value="">Selecciona una marca (opcional)</option>
                                    {brands.map((brand) => (
                                        <option key={brand.id} value={brand.id}>
                                            {brand.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Referencia (opcional)
                                    </label>
                                    <input
                                        type="text"
                                        {...amenityForm.register('reference')}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400"
                                        placeholder="Código de referencia..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Modelo (opcional)
                                    </label>
                                    <input
                                        type="text"
                                        {...amenityForm.register('model')}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400"
                                        placeholder="Modelo del producto..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descripción (opcional)
                                </label>
                                <textarea
                                    {...amenityForm.register('description')}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400"
                                    placeholder="Describe las características del producto..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Precio Base *
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    {...amenityForm.register('base_price', { valueAsNumber: true })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400"
                                    placeholder="0.00"
                                />
                                {amenityForm.formState.errors.base_price && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {amenityForm.formState.errors.base_price.message}
                                    </p>
                                )}
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAmenityForm(false);
                                        setEditingAmenity(null);
                                        amenityForm.reset();
                                    }}
                                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                                >
                                    {editingAmenity ? 'Actualizar' : 'Crear'} Producto
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Lista de productos existentes */}
                <div className="space-y-4 w-full">
                    <h3 className="font-medium text-gray-900">
                        Productos Existentes ({amenitiesTotal})
                    </h3>

                    {loadingAmenities ? (
                        <div className="text-center py-8">
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <p className="text-blue-600 text-sm">Cargando productos...</p>
                        </div>
                    ) : amenities.length > 0 ? (
                        <div className="space-y-4">
                            <div className="max-h-96 overflow-y-auto space-y-2">
                                {amenities.map((amenity) => (
                                    <div key={amenity.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">{amenity.name}</div>
                                            <div className="text-sm text-gray-500 mt-1">
                                                {categories.find(c => c.id === amenity.category_id)?.name || 'Sin categoría'}
                                                {amenity.brand_id && brands.find(b => b.id === amenity.brand_id) && (
                                                    <> • {brands.find(b => b.id === amenity.brand_id)?.name}</>
                                                )}
                                                {amenity.reference && <> • Ref: {amenity.reference}</>}
                                                {amenity.model && <> • Modelo: {amenity.model}</>}
                                            </div>
                                            {amenity.description && (
                                                <div className="text-sm text-gray-600 mt-1">
                                                    {amenity.description}
                                                </div>
                                            )}
                                            <div className="text-sm text-green-600 font-medium mt-1">
                                                €{(amenity.base_price || 0).toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="flex space-x-2 ml-3">
                                            <button
                                                onClick={() => openEditAmenity(amenity)}
                                                className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
                                            >
                                                ✏️ Editar
                                            </button>
                                            <button
                                                onClick={() => setDeletingAmenity(amenity)}
                                                className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100"
                                            >
                                                🗑️ Eliminar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Controles de paginación */}
                            {amenitiesTotalPages > 1 && (
                                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                    <div className="text-sm text-gray-500">
                                        Mostrando {((amenitiesPage - 1) * amenitiesPageSize) + 1} a {Math.min(amenitiesPage * amenitiesPageSize, amenitiesTotal)} de {amenitiesTotal} productos
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => loadAmenities(amenitiesPage - 1)}
                                            disabled={amenitiesPage <= 1}
                                            className={`px-3 py-1 text-sm font-medium rounded-md ${amenitiesPage <= 1
                                                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            Anterior
                                        </button>
                                        <div className="flex space-x-1">
                                            {Array.from({ length: Math.min(5, amenitiesTotalPages) }, (_, i) => {
                                                const pageNum = i + 1;
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => loadAmenities(pageNum)}
                                                        className={`px-3 py-1 text-sm font-medium rounded-md ${amenitiesPage === pageNum
                                                            ? 'text-white bg-blue-600'
                                                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                            {amenitiesTotalPages > 5 && (
                                                <span className="px-3 py-1 text-sm text-gray-500">...</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => loadAmenities(amenitiesPage + 1)}
                                            disabled={amenitiesPage >= amenitiesTotalPages}
                                            className={`px-3 py-1 text-sm font-medium rounded-md ${amenitiesPage >= amenitiesTotalPages
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
                                <span className="text-gray-400 text-xl">📦</span>
                            </div>
                            <p className="text-gray-500 mb-2">No hay productos registrados</p>
                            <p className="text-sm text-gray-400">Crea el primer producto</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de confirmación para eliminar producto */}
            {deletingAmenity && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black opacity-30" onClick={() => setDeletingAmenity(null)}></div>
                        <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                            <div className="mb-4">
                                <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                                    ¿Eliminar producto?
                                </h3>
                                <p className="text-gray-600 text-center">
                                    ¿Estás seguro de que quieres eliminar el producto <strong>{deletingAmenity.name}</strong>? Esta acción no se puede deshacer.
                                </p>
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setDeletingAmenity(null)}
                                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDeleteAmenity}
                                    className="flex-1 px-4 py-2 text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
