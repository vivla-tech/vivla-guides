'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreateAmenity, Category, Brand } from '@/lib/types';
import { Input } from '@/components/ui/Input';
import { FileUpload } from '@/components/ui/FileUpload';
import { useApiData } from '@/hooks/useApiData';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';

// Esquema de validación para crear un amenity
const createAmenitySchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    category_id: z.string().min(1, 'La categoría es requerida'),
    brand_id: z.string().min(1, 'La marca es requerida'),
    reference: z.string().min(1, 'La referencia es requerida'),
    model: z.string().min(1, 'El modelo es requerido'),
    description: z.string().min(1, 'La descripción es requerida'),
    base_price: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
    // Removemos images del esquema ya que se manejará con FileUpload
});

type CreateAmenityFormData = z.infer<typeof createAmenitySchema>;

export default function CreateAmenityPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [imageUrls, setImageUrls] = useState<string[]>([]);

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
                images: imageUrls, // Usar las URLs de las imágenes subidas
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
                setImageUrls([]);
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
                        <Input
                            label="Nombre del Producto"
                            register={register('name')}
                            error={errors.name?.message}
                            placeholder="Ej: Nevera Samsung, Sofá IKEA..."
                            required
                        />

                        {/* Categoría */}
                        <Input
                            type="select"
                            label="Categoría"
                            register={register('category_id')}
                            error={errors.category_id?.message}
                            placeholder="Selecciona una categoría"
                            disabled={isLoadingCategories}
                            required
                        >
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </Input>
                        {isLoadingCategories && (
                            <p className="mt-1 text-sm text-gray-500">Cargando categorías desde la base de datos...</p>
                        )}

                        {/* Marca */}
                        <Input
                            type="select"
                            label="Marca"
                            register={register('brand_id')}
                            error={errors.brand_id?.message}
                            placeholder="Selecciona una marca"
                            disabled={isLoadingBrands}
                            required
                        >
                            {brands.map((brand) => (
                                <option key={brand.id} value={brand.id}>
                                    {brand.name}
                                </option>
                            ))}
                        </Input>
                        {isLoadingBrands && (
                            <p className="mt-1 text-sm text-gray-500">Cargando marcas desde la base de datos...</p>
                        )}

                        {/* Referencia */}
                        <Input
                            label="Referencia del Producto"
                            register={register('reference')}
                            error={errors.reference?.message}
                            placeholder="Ej: RF23M8070SG, EKENÄSET..."
                            required
                        />

                        {/* Modelo */}
                        <Input
                            label="Modelo"
                            register={register('model')}
                            error={errors.model?.message}
                            placeholder="Ej: Family Hub, EKENÄSET..."
                            required
                        />

                        {/* Descripción */}
                        <Input
                            type="textarea"
                            label="Descripción"
                            register={register('description')}
                            error={errors.description?.message}
                            placeholder="Describe el producto, sus características, materiales..."
                            rows={4}
                            required
                        />

                        {/* Precio base */}
                        <Input
                            type="number"
                            label="Precio Base (€)"
                            register={register('base_price', { valueAsNumber: true })}
                            error={errors.base_price?.message}
                            placeholder="0.00"
                            min={0}
                            step="0.01"
                            required
                        />

                        {/* URLs de imágenes */}
                        <FileUpload
                            label="Imágenes del Producto"
                            onUrlsChange={setImageUrls}
                            accept="image/*"
                            maxFiles={5}
                            maxSize={2}
                            basePath="amenities"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                            Separa múltiples URLs con comas. Estas imágenes mostrarán el producto.
                        </p>

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
