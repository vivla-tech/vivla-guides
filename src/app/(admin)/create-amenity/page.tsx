'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreateAmenity, Category, Brand } from '@/lib/types';
import { useApiData } from '@/hooks/useApiData';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';

// Esquema de validación para crear un amenity
const createAmenitySchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    category_id: z.string().min(1, 'La categoría es requerida'),
    brand_id: z.string().min(1, 'La marca es requerida'),
    reference: z.string().min(1, 'La referencia es requerida'),
    amenity_type: z.string().min(1, 'El tipo de amenity es requerido'),
    model: z.string().min(1, 'El modelo es requerido'),
    description: z.string().min(1, 'La descripción es requerida'),
    base_price: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
    images: z.string().optional(),
});

type CreateAmenityFormData = z.infer<typeof createAmenitySchema>;

export default function CreateAmenityPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Usar hooks personalizados para cargar datos
    const { data: categories, isLoading: isLoadingCategories, error: categoriesError } = useApiData<Category>('categories');
    const { data: brands, isLoading: isLoadingBrands, error: brandsError } = useApiData<Brand>('brands');

    const apiClient = createApiClient(config.apiUrl);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<CreateAmenityFormData>({
        resolver: zodResolver(createAmenitySchema),
    });

    const onSubmit = async (data: CreateAmenityFormData) => {
        setIsSubmitting(true);
        setSubmitMessage(null);

        try {
            // Preparar datos para la API
            const apiData: CreateAmenity = {
                name: data.name,
                category_id: data.category_id,
                brand_id: data.brand_id,
                reference: data.reference,
                model: data.model,
                description: data.description,
                base_price: data.base_price,
                images: data.images ? data.images.split(',').map(url => url.trim()) : [],
            };

            // Llamada real a la API
            const response = await apiClient.createAmenity(apiData);

            if (response.success) {
                setSubmitMessage({
                    type: 'success',
                    message: 'Amenity creado exitosamente!'
                });

                // Limpiar formulario
                reset();
            } else {
                // Manejar error de la API
                setSubmitMessage({
                    type: 'error',
                    message: 'Error al crear el amenity en el servidor'
                });
            }

        } catch (error) {
            console.error('Error al crear amenity:', error);
            setSubmitMessage({
                type: 'error',
                message: error instanceof Error ? error.message : 'Error de conexión con el servidor'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-2xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">
                        Crear Nuevo Amenity
                    </h1>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Nombre del amenity */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre del Producto *
                            </label>
                            <input
                                {...register('name')}
                                type="text"
                                id="name"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.name ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="Ej: Nevera Samsung, Sofá IKEA..."
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                            )}
                        </div>

                        {/* Categoría */}
                        <div>
                            <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-2">
                                Categoría *
                            </label>
                            <select
                                {...register('category_id')}
                                id="category_id"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.category_id ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                disabled={isLoadingCategories}
                            >
                                <option value="">
                                    {isLoadingCategories ? 'Cargando categorías...' : 'Selecciona una categoría'}
                                </option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                            {errors.category_id && (
                                <p className="mt-1 text-sm text-red-600">{errors.category_id.message}</p>
                            )}
                            {isLoadingCategories && (
                                <p className="mt-1 text-sm text-gray-500">Cargando categorías desde la base de datos...</p>
                            )}
                        </div>

                        {/* Marca */}
                        <div>
                            <label htmlFor="brand_id" className="block text-sm font-medium text-gray-700 mb-2">
                                Marca *
                            </label>
                            <select
                                {...register('brand_id')}
                                id="brand_id"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.brand_id ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                disabled={isLoadingBrands}
                            >
                                <option value="">
                                    {isLoadingBrands ? 'Cargando marcas...' : 'Selecciona una marca'}
                                </option>
                                {brands.map((brand) => (
                                    <option key={brand.id} value={brand.id}>
                                        {brand.name}
                                    </option>
                                ))}
                            </select>
                            {errors.brand_id && (
                                <p className="mt-1 text-sm text-red-600">{errors.brand_id.message}</p>
                            )}
                            {isLoadingBrands && (
                                <p className="mt-1 text-sm text-gray-500">Cargando marcas desde la base de datos...</p>
                            )}
                        </div>

                        {/* Referencia */}
                        <div>
                            <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-2">
                                Referencia del Producto *
                            </label>
                            <input
                                {...register('reference')}
                                type="text"
                                id="reference"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.reference ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="Ej: RF23M8070SG, EKENÄSET..."
                            />
                            {errors.reference && (
                                <p className="mt-1 text-sm text-red-600">{errors.reference.message}</p>
                            )}
                        </div>

                        {/* Modelo */}
                        <div>
                            <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
                                Modelo *
                            </label>
                            <input
                                {...register('model')}
                                type="text"
                                id="model"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.model ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="Ej: Family Hub, EKENÄSET..."
                            />
                            {errors.model && (
                                <p className="mt-1 text-sm text-red-600">{errors.model.message}</p>
                            )}
                        </div>

                        {/* Descripción */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                Descripción *
                            </label>
                            <textarea
                                {...register('description')}
                                id="description"
                                rows={4}
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.description ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="Describe el producto, sus características, materiales..."
                            />
                            {errors.description && (
                                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                            )}
                        </div>

                        {/* Precio base */}
                        <div>
                            <label htmlFor="base_price" className="block text-sm font-medium text-gray-700 mb-2">
                                Precio Base (€) *
                            </label>
                            <input
                                {...register('base_price', { valueAsNumber: true })}
                                type="number"
                                step="0.01"
                                min="0"
                                id="base_price"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.base_price ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="0.00"
                            />
                            {errors.base_price && (
                                <p className="mt-1 text-sm text-red-600">{errors.base_price.message}</p>
                            )}
                        </div>

                        {/* URLs de imágenes */}
                        <div>
                            <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-2">
                                URLs de Imágenes (separadas por comas)
                            </label>
                            <textarea
                                {...register('images')}
                                id="images"
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="https://ejemplo.com/imagen1.jpg, https://ejemplo.com/imagen2.jpg..."
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                Separa múltiples URLs con comas. Estas imágenes mostrarán el producto.
                            </p>
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

                        {/* Botones */}
                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={() => reset()}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                Limpiar
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Creando...' : 'Crear Amenity'}
                            </button>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    );
}
