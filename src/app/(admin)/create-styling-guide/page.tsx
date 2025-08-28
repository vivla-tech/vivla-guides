'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { StylingGuide } from '@/lib/types';

// Esquema de validación para crear una guía de estilo
const createStylingGuideSchema = z.object({
    room_id: z.string().min(1, 'Debes seleccionar una habitación'),
    title: z.string().min(1, 'El título es requerido'),
    reference_photo_url: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
    qr_code_url: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
    image_urls: z.string().optional(),
});

type CreateStylingGuideFormData = z.infer<typeof createStylingGuideSchema>;

export default function CreateStylingGuidePage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<CreateStylingGuideFormData>({
        resolver: zodResolver(createStylingGuideSchema),
    });

    const onSubmit = async (data: CreateStylingGuideFormData) => {
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
                message: 'Guía de estilo creada exitosamente!'
            });

            // Limpiar formulario
            reset();

        } catch (error) {
            setSubmitMessage({
                type: 'error',
                message: error instanceof Error ? error.message : 'Error al crear la guía de estilo'
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
                        Crear Nueva Guía de Estilo
                    </h1>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Habitación */}
                        <div>
                            <label htmlFor="room_id" className="block text-sm font-medium text-gray-700 mb-2">
                                Habitación *
                            </label>
                            <select
                                {...register('room_id')}
                                id="room_id"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.room_id ? 'border-red-300' : 'border-gray-300'
                                    }`}
                            >
                                <option value="">Selecciona una habitación</option>
                                <option value="room-1">Dormitorio Principal - Villa Mediterránea</option>
                                <option value="room-2">Salón - Villa Mediterránea</option>
                                <option value="room-3">Cocina - Villa Mediterránea</option>
                                <option value="room-4">Dormitorio Secundario - Villa Mediterránea</option>
                                <option value="room-5">Salón - Apartamento Centro</option>
                                <option value="room-6">Cocina - Apartamento Centro</option>
                            </select>
                            {errors.room_id && (
                                <p className="mt-1 text-sm text-red-600">{errors.room_id.message}</p>
                            )}
                        </div>

                        {/* Título */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                                Título de la Guía *
                            </label>
                            <input
                                {...register('title')}
                                type="text"
                                id="title"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.title ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="Ej: Estilo Mediterráneo, Minimalista Moderno, Rústico Elegante..."
                            />
                            {errors.title && (
                                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                            )}
                        </div>

                        {/* Foto de referencia */}
                        <div>
                            <label htmlFor="reference_photo_url" className="block text-sm font-medium text-gray-700 mb-2">
                                URL de la Foto de Referencia
                            </label>
                            <input
                                {...register('reference_photo_url')}
                                type="url"
                                id="reference_photo_url"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.reference_photo_url ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="https://ejemplo.com/foto-referencia.jpg"
                            />
                            {errors.reference_photo_url && (
                                <p className="mt-1 text-sm text-red-600">{errors.reference_photo_url.message}</p>
                            )}
                        </div>

                        {/* Código QR */}
                        <div>
                            <label htmlFor="qr_code_url" className="block text-sm font-medium text-gray-700 mb-2">
                                URL del Código QR
                            </label>
                            <input
                                {...register('qr_code_url')}
                                type="url"
                                id="qr_code_url"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.qr_code_url ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="https://ejemplo.com/qr-code.png"
                            />
                            {errors.qr_code_url && (
                                <p className="mt-1 text-sm text-red-600">{errors.qr_code_url.message}</p>
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
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="https://ejemplo.com/imagen1.jpg, https://ejemplo.com/imagen2.jpg, https://ejemplo.com/imagen3.jpg..."
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                Separa múltiples URLs con comas. Estas imágenes mostrarán el estilo de la habitación.
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
                                {isSubmitting ? 'Creando...' : 'Crear Guía de Estilo'}
                            </button>
                        </div>
                    </form>

                    {/* Información adicional */}
                    <div className="mt-8 p-4 bg-blue-50 rounded-md">
                        <h3 className="text-sm font-medium text-blue-800 mb-2">
                            💡 Las guías de estilo incluyen:
                        </h3>
                        <div className="text-sm text-blue-700 space-y-1">
                            <p>• <strong>Fotos de referencia:</strong> Imágenes del estilo deseado</p>
                            <p>• <strong>Códigos QR:</strong> Para acceso rápido a la guía</p>
                            <p>• <strong>Galería de imágenes:</strong> Múltiples vistas del estilo</p>
                            <p>• <strong>Vincular con habitaciones:</strong> Cada habitación puede tener su propio estilo</p>
                        </div>
                    </div>


                </div>
            </div>
        </div>
    );
}
