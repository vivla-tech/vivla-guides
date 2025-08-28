'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ApplianceGuide, Brand } from '@/lib/types';
import { useApiData } from '@/hooks/useApiData';

// Esquema de validación para crear una guía de electrodomésticos
const createApplianceGuideSchema = z.object({
    equipment_name: z.string().min(1, 'El nombre del equipo es requerido'),
    brand_id: z.string().min(1, 'Debes seleccionar una marca'),
    model: z.string().min(1, 'El modelo es requerido'),
    brief_description: z.string().min(1, 'La descripción breve es requerida'),
    image_urls: z.string().optional(),
    pdf_url: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
    video_url: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
    quick_use_bullets: z.string().min(1, 'Los puntos de uso rápido son requeridos'),
    maintenance_bullets: z.string().min(1, 'Los puntos de mantenimiento son requeridos'),
});

type CreateApplianceGuideFormData = z.infer<typeof createApplianceGuideSchema>;

export default function CreateApplianceGuidePage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const { data: brands, isLoading: isLoadingBrands, error: brandsError } = useApiData<Brand>('brands');

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<CreateApplianceGuideFormData>({
        resolver: zodResolver(createApplianceGuideSchema),
    });

    const onSubmit = async (data: CreateApplianceGuideFormData) => {
        setIsSubmitting(true);
        setSubmitMessage(null);

        try {
            // Por ahora simulamos la llamada a la API
            // TODO: Conectar con el backend real
            console.log('Datos a enviar:', data);

            // Simular delay de API
            await new Promise(resolve => setTimeout(resolve, 1000));

            setSubmitMessage({
                type: 'success',
                message: 'Guía de electrodoméstico creada exitosamente!'
            });

            // Limpiar formulario
            reset();

        } catch (error) {
            setSubmitMessage({
                type: 'error',
                message: error instanceof Error ? error.message : 'Error al crear la guía de electrodoméstico'
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
                        Crear Nueva Guía de Electrodoméstico
                    </h1>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Nombre del equipo */}
                        <div>
                            <label htmlFor="equipment_name" className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre del Equipo *
                            </label>
                            <input
                                {...register('equipment_name')}
                                type="text"
                                id="equipment_name"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.equipment_name ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="Ej: Nevera Samsung, Lavavajillas Bosch, Horno Miele..."
                            />
                            {errors.equipment_name && (
                                <p className="mt-1 text-sm text-red-600">{errors.equipment_name.message}</p>
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
                            >
                                <option value="">Selecciona una marca</option>
                                {brands.map((brand) => (
                                    <option key={brand.id} value={brand.id}>
                                        {brand.name}
                                    </option>
                                ))}
                            </select>
                            {errors.brand_id && (
                                <p className="mt-1 text-sm text-red-600">{errors.brand_id.message}</p>
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
                                placeholder="Ej: RF23M8070SG, SMS2ITW01E, H 2265-1 B..."
                            />
                            {errors.model && (
                                <p className="mt-1 text-sm text-red-600">{errors.model.message}</p>
                            )}
                        </div>

                        {/* Descripción breve */}
                        <div>
                            <label htmlFor="brief_description" className="block text-sm font-medium text-gray-700 mb-2">
                                Descripción Breve *
                            </label>
                            <textarea
                                {...register('brief_description')}
                                id="brief_description"
                                rows={3}
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.brief_description ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="Descripción breve del equipo y sus características principales..."
                            />
                            {errors.brief_description && (
                                <p className="mt-1 text-sm text-red-600">{errors.brief_description.message}</p>
                            )}
                        </div>

                        {/* URLs de imágenes */}
                        <div>
                            <label htmlFor="image_urls" className="block text-sm font-medium text-gray-700 mb-2">
                                URLs de Imágenes (separadas por comas)
                            </label>
                            <textarea
                                {...register('image_urls')}
                                id="image_urls"
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="https://ejemplo.com/imagen1.jpg, https://ejemplo.com/imagen2.jpg..."
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                Imágenes del equipo, controles, pantallas, etc.
                            </p>
                        </div>

                        {/* URL del PDF del manual */}
                        <div>
                            <label htmlFor="pdf_url" className="block text-sm font-medium text-gray-700 mb-2">
                                URL del PDF del Manual
                            </label>
                            <input
                                {...register('pdf_url')}
                                type="url"
                                id="pdf_url"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.pdf_url ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="https://ejemplo.com/manual.pdf"
                            />
                            {errors.pdf_url && (
                                <p className="mt-1 text-sm text-red-600">{errors.pdf_url.message}</p>
                            )}
                        </div>

                        {/* URL del video tutorial */}
                        <div>
                            <label htmlFor="video_url" className="block text-sm font-medium text-gray-700 mb-2">
                                URL del Video Tutorial
                            </label>
                            <input
                                {...register('video_url')}
                                type="url"
                                id="video_url"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.video_url ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="https://www.youtube.com/watch?v=..."
                            />
                            {errors.video_url && (
                                <p className="mt-1 text-sm text-red-600">{errors.video_url.message}</p>
                            )}
                        </div>

                        {/* Puntos de uso rápido */}
                        <div>
                            <label htmlFor="quick_use_bullets" className="block text-sm font-medium text-gray-700 mb-2">
                                Puntos de Uso Rápido *
                            </label>
                            <textarea
                                {...register('quick_use_bullets')}
                                id="quick_use_bullets"
                                rows={5}
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.quick_use_bullets ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="Lista de puntos clave para usar el equipo rápidamente..."
                            />
                            {errors.quick_use_bullets && (
                                <p className="mt-1 text-sm text-red-600">{errors.quick_use_bullets.message}</p>
                            )}
                            <p className="mt-1 text-sm text-gray-500">
                                Puntos clave para uso básico del equipo.
                            </p>
                        </div>

                        {/* Puntos de mantenimiento */}
                        <div>
                            <label htmlFor="maintenance_bullets" className="block text-sm font-medium text-gray-700 mb-2">
                                Puntos de Mantenimiento *
                            </label>
                            <textarea
                                {...register('maintenance_bullets')}
                                id="maintenance_bullets"
                                rows={5}
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.maintenance_bullets ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="Lista de tareas de mantenimiento y limpieza..."
                            />
                            {errors.maintenance_bullets && (
                                <p className="mt-1 text-sm text-red-600">{errors.maintenance_bullets.message}</p>
                            )}
                            <p className="mt-1 text-sm text-gray-500">
                                Tareas de mantenimiento, limpieza y cuidado del equipo.
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
                                {isSubmitting ? 'Creando...' : 'Crear Guía de Electrodoméstico'}
                            </button>
                        </div>
                    </form>




                </div>
            </div>
        </div>
    );
}
