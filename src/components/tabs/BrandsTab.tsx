'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Brand, CreateBrand } from '@/lib/types';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';

const createBrandSchema = z.object({
    name: z.string().min(1, 'El nombre de la marca es requerido'),
    website: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
    contact_info: z.string().min(1, 'La información de contacto es requerida'),
});

type CreateBrandFormData = z.infer<typeof createBrandSchema>;

interface BrandsTabProps {
    submitMessage: { type: 'success' | 'error'; message: string } | null;
    setSubmitMessage: (message: { type: 'success' | 'error'; message: string } | null) => void;
}

export default function BrandsTab({ submitMessage, setSubmitMessage }: BrandsTabProps) {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loadingBrands, setLoadingBrands] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null);
    const [showBrandForm, setShowBrandForm] = useState(false);

    // Estados para paginación
    const [brandsPage, setBrandsPage] = useState(1);
    const [brandsPageSize] = useState(20);
    const [brandsTotal, setBrandsTotal] = useState(0);
    const [brandsTotalPages, setBrandsTotalPages] = useState(0);

    const apiClient = createApiClient(config.apiUrl);

    const brandForm = useForm<CreateBrandFormData>({
        resolver: zodResolver(createBrandSchema),
        defaultValues: {
            name: '',
            website: '',
            contact_info: '',
        }
    });

    // Funciones para gestión de marcas
    const loadBrands = async (page: number = brandsPage) => {
        setLoadingBrands(true);
        try {
            const response = await apiClient.listBrands({ page, pageSize: brandsPageSize });
            if (response.success) {
                setBrands(response.data);
                setBrandsTotal(response.meta.total);
                setBrandsTotalPages(response.meta.totalPages);
                setBrandsPage(page);
            }
        } catch (error) {
            console.error('Error loading brands:', error);
        } finally {
            setLoadingBrands(false);
        }
    };

    const handleCreateBrand = async (data: CreateBrandFormData) => {
        try {
            const brandData: CreateBrand = {
                name: data.name,
                website: data.website || '',
                contact_info: data.contact_info,
            };

            const response = await apiClient.createBrand(brandData);
            if (response.success) {
                await loadBrands(); // Recargar marcas
                brandForm.reset();
                setShowBrandForm(false);
                setSubmitMessage({
                    type: 'success',
                    message: '¡Marca creada exitosamente!'
                });
                setTimeout(() => setSubmitMessage(null), 3000);
            }
        } catch (error) {
            console.error('Error creating brand:', error);
            setSubmitMessage({
                type: 'error',
                message: 'Error al crear la marca'
            });
        }
    };

    const handleEditBrand = async (data: CreateBrandFormData) => {
        if (!editingBrand) return;

        try {
            const brandData: CreateBrand = {
                name: data.name,
                website: data.website || '',
                contact_info: data.contact_info,
            };

            const response = await apiClient.updateBrand(editingBrand.id, brandData);
            if (response.success) {
                await loadBrands(); // Recargar marcas
                brandForm.reset();
                setEditingBrand(null);
                setShowBrandForm(false);
                setSubmitMessage({
                    type: 'success',
                    message: '¡Marca actualizada exitosamente!'
                });
                setTimeout(() => setSubmitMessage(null), 3000);
            }
        } catch (error) {
            console.error('Error updating brand:', error);
            setSubmitMessage({
                type: 'error',
                message: 'Error al actualizar la marca'
            });
        }
    };

    const handleDeleteBrand = async () => {
        if (!deletingBrand) return;

        try {
            await apiClient.deleteBrand(deletingBrand.id);
            await loadBrands(); // Recargar marcas
            setDeletingBrand(null);
            setSubmitMessage({
                type: 'success',
                message: '¡Marca eliminada exitosamente!'
            });
            setTimeout(() => setSubmitMessage(null), 3000);
        } catch (error) {
            console.error('Error deleting brand:', error);
            setSubmitMessage({
                type: 'error',
                message: 'Error al eliminar la marca'
            });
        }
    };

    const openEditBrand = (brand: Brand) => {
        setEditingBrand(brand);
        brandForm.setValue('name', brand.name);
        brandForm.setValue('website', brand.website || '');
        brandForm.setValue('contact_info', brand.contact_info);
        setShowBrandForm(true);
    };

    // Cargar marcas al montar el componente
    useEffect(() => {
        loadBrands();
    }, []);

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                    Gestionar Marcas
                </h2>
                {!showBrandForm && (
                    <button
                        onClick={() => setShowBrandForm(true)}
                        className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100"
                    >
                        ➕ Nueva Marca
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
                {/* Formulario para crear/editar marca */}
                <div className="space-y-4 max-w-2xl">
                    <h3 className="font-medium text-gray-900">
                        {editingBrand ? 'Editar Marca' : 'Crear Nueva Marca'}
                    </h3>

                    {showBrandForm && (
                        <form onSubmit={brandForm.handleSubmit(editingBrand ? handleEditBrand : handleCreateBrand)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre de la Marca *
                                </label>
                                <input
                                    type="text"
                                    {...brandForm.register('name')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400"
                                    placeholder="Ej: IKEA, Samsung, Apple..."
                                />
                                {brandForm.formState.errors.name && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {brandForm.formState.errors.name.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Sitio Web (opcional)
                                </label>
                                <input
                                    type="url"
                                    {...brandForm.register('website')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400"
                                    placeholder="https://www.ejemplo.com"
                                />
                                {brandForm.formState.errors.website && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {brandForm.formState.errors.website.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Información de Contacto *
                                </label>
                                <textarea
                                    {...brandForm.register('contact_info')}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400"
                                    placeholder="Email, teléfono, dirección..."
                                />
                                {brandForm.formState.errors.contact_info && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {brandForm.formState.errors.contact_info.message}
                                    </p>
                                )}
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowBrandForm(false);
                                        setEditingBrand(null);
                                        brandForm.reset();
                                    }}
                                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                                >
                                    {editingBrand ? 'Actualizar' : 'Crear'} Marca
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Lista de marcas existentes */}
                <div className="space-y-4 w-full">
                    <h3 className="font-medium text-gray-900">
                        Marcas Existentes ({brandsTotal})
                    </h3>

                    {loadingBrands ? (
                        <div className="text-center py-8">
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <p className="text-blue-600 text-sm">Cargando marcas...</p>
                        </div>
                    ) : brands.length > 0 ? (
                        <div className="space-y-4">
                            <div className="max-h-96 overflow-y-auto space-y-2">
                                {brands.map((brand) => (
                                    <div key={brand.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">{brand.name}</div>
                                            {brand.website && (
                                                <div className="text-sm text-blue-600 mt-1">
                                                    <a href={brand.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                        {brand.website}
                                                    </a>
                                                </div>
                                            )}
                                            <div className="text-sm text-gray-600 mt-1">
                                                {brand.contact_info}
                                            </div>
                                        </div>
                                        <div className="flex space-x-2 ml-3">
                                            <button
                                                onClick={() => openEditBrand(brand)}
                                                className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
                                            >
                                                ✏️ Editar
                                            </button>
                                            <button
                                                onClick={() => setDeletingBrand(brand)}
                                                className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100"
                                            >
                                                🗑️ Eliminar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Controles de paginación */}
                            {brandsTotalPages > 1 && (
                                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                    <div className="text-sm text-gray-500">
                                        Mostrando {((brandsPage - 1) * brandsPageSize) + 1} a {Math.min(brandsPage * brandsPageSize, brandsTotal)} de {brandsTotal} marcas
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => loadBrands(brandsPage - 1)}
                                            disabled={brandsPage <= 1}
                                            className={`px-3 py-1 text-sm font-medium rounded-md ${brandsPage <= 1
                                                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            Anterior
                                        </button>
                                        <div className="flex space-x-1">
                                            {Array.from({ length: Math.min(5, brandsTotalPages) }, (_, i) => {
                                                const pageNum = i + 1;
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => loadBrands(pageNum)}
                                                        className={`px-3 py-1 text-sm font-medium rounded-md ${brandsPage === pageNum
                                                            ? 'text-white bg-blue-600'
                                                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                            {brandsTotalPages > 5 && (
                                                <span className="px-3 py-1 text-sm text-gray-500">...</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => loadBrands(brandsPage + 1)}
                                            disabled={brandsPage >= brandsTotalPages}
                                            className={`px-3 py-1 text-sm font-medium rounded-md ${brandsPage >= brandsTotalPages
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
                                <span className="text-gray-400 text-xl">🏷️</span>
                            </div>
                            <p className="text-gray-500 mb-2">No hay marcas registradas</p>
                            <p className="text-sm text-gray-400">Crea la primera marca</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de confirmación para eliminar marca */}
            {deletingBrand && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black opacity-30" onClick={() => setDeletingBrand(null)}></div>
                        <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                            <div className="mb-4">
                                <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                                    ¿Eliminar marca?
                                </h3>
                                <p className="text-gray-600 text-center">
                                    ¿Estás seguro de que quieres eliminar la marca <strong>{deletingBrand.name}</strong>? Esta acción no se puede deshacer.
                                </p>
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setDeletingBrand(null)}
                                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDeleteBrand}
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
