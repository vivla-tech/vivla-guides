import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Amenity, CreateAmenity, Category, Brand } from '@/lib/types';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';
import { Input } from '@/components/ui/Input';
import { FileUpload } from '@/components/ui/FileUpload';
import { useApiData } from '@/hooks/useApiData';

// Esquema de validación para editar un amenity
const editAmenitySchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    category_id: z.string().min(1, 'La categoría es requerida'),
    brand_id: z.string().min(1, 'La marca es requerida'),
    reference: z.string().min(1, 'La referencia es requerida'),
    model: z.string().min(1, 'El modelo es requerido'),
    description: z.string().min(1, 'La descripción es requerida'),
    base_price: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
});

type EditAmenityFormData = z.infer<typeof editAmenitySchema>;

interface EditAmenityFormProps {
    amenity: Amenity;
    imageUrls: string[];
    onImageUrlsChange: (urls: string[]) => void;
    onClose: () => void;
    onSuccess: () => void;
}

export function EditAmenityForm({ amenity, imageUrls, onImageUrlsChange, onClose, onSuccess }: EditAmenityFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const apiClient = createApiClient(config.apiUrl);

    // Cargar categorías y marcas
    const { data: categories } = useApiData<Category>('categories');
    const { data: brands } = useApiData<Brand>('brands');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<EditAmenityFormData>({
        resolver: zodResolver(editAmenitySchema),
        defaultValues: {
            name: amenity.name,
            category_id: amenity.category_id,
            brand_id: amenity.brand_id,
            reference: amenity.reference,
            model: amenity.model,
            description: amenity.description,
            base_price: amenity.base_price,
        },
    });

    const onSubmit = async (data: EditAmenityFormData) => {
        setIsSubmitting(true);
        setSubmitMessage(null);

        try {
            // Preparar datos para la API
            const apiData: Partial<CreateAmenity> = {
                name: data.name,
                category_id: data.category_id,
                brand_id: data.brand_id,
                reference: data.reference,
                model: data.model,
                description: data.description,
                base_price: data.base_price,
                images: imageUrls,
            };

            // Llamada real a la API
            const response = await apiClient.updateAmenity(amenity.id, apiData);

            if (response.success) {
                setSubmitMessage({
                    type: 'success',
                    message: 'Amenity actualizado exitosamente!'
                });

                // Limpiar formulario y cerrar modal después de un breve delay
                setTimeout(() => {
                    onSuccess();
                }, 1500);
            } else {
                setSubmitMessage({
                    type: 'error',
                    message: 'Error al actualizar el amenity en el servidor'
                });
            }

        } catch (error) {
            console.error('Error al actualizar amenity:', error);
            setSubmitMessage({
                type: 'error',
                message: error instanceof Error ? error.message : 'Error de conexión con el servidor'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Nombre */}
            <Input
                label="Nombre del Producto"
                register={register('name')}
                error={errors.name?.message}
                placeholder="Ej: Sofá Chesterfield"
                required
            />

            {/* Categoría */}
            <Input
                type="select"
                label="Categoría"
                register={register('category_id')}
                error={errors.category_id?.message}
                placeholder="Selecciona una categoría"
                required
            >
                <option value="">Selecciona una categoría</option>
                {categories?.map((category) => (
                    <option key={category.id} value={category.id}>
                        {category.name}
                    </option>
                ))}
            </Input>

            {/* Marca */}
            <Input
                type="select"
                label="Marca"
                register={register('brand_id')}
                error={errors.brand_id?.message}
                placeholder="Selecciona una marca"
                required
            >
                <option value="">Selecciona una marca</option>
                {brands?.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                        {brand.name}
                    </option>
                ))}
            </Input>

            {/* Referencia */}
            <Input
                label="Referencia"
                register={register('reference')}
                error={errors.reference?.message}
                placeholder="Ej: CHEST-001"
                required
            />

            {/* Modelo */}
            <Input
                label="Modelo"
                register={register('model')}
                error={errors.model?.message}
                placeholder="Ej: Chesterfield Classic"
                required
            />

            {/* Descripción */}
            <Input
                type="textarea"
                label="Descripción"
                register={register('description')}
                error={errors.description?.message}
                placeholder="Descripción detallada del producto"
                rows={3}
                required
            />

            {/* Precio base */}
            <Input
                type="number"
                label="Precio Base"
                register={register('base_price', { valueAsNumber: true })}
                error={errors.base_price?.message}
                placeholder="0.00"
                required
            />

            {/* Imágenes */}
            <FileUpload
                label="Imágenes del Producto"
                onUrlsChange={onImageUrlsChange}
                accept="image/*"
                maxFiles={10}
                maxSize={2}
                basePath="amenities"
                existingUrls={useMemo(() => amenity.images || [], [amenity.images])}
            />

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
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Actualizando...' : 'Actualizar Producto'}
                </button>
            </div>
        </form>
    );
}
