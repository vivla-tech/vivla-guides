'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreateStylingGuide, Room, StylingGuide } from '@/lib/types';
import { Input } from '@/components/ui/Input';
import { useApiData } from '@/hooks/useApiData';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';

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

    const { data: rooms, isLoading: isLoadingRooms, error: roomsError } = useApiData<Room>('rooms');

    const apiClient = createApiClient(config.apiUrl);

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
            // Preparar datos para la API
            const apiData: CreateStylingGuide = {
                room_id: data.room_id,
                title: data.title,
                reference_photo_url: data.reference_photo_url || undefined,
                qr_code_url: data.qr_code_url || undefined,
                image_urls: data.image_urls ? data.image_urls.split(',').map(url => url.trim()).filter(url => url.length > 0) : [],
            };

            // Llamada real a la API
            const response = await apiClient.createStylingGuide(apiData);

            if (response.success) {
                setSubmitMessage({
                    type: 'success',
                    message: 'Guía de estilo creada exitosamente!'
                });

                // Limpiar formulario
                reset();
            } else {
                setSubmitMessage({
                    type: 'error',
                    message: 'Error al crear la guía de estilo en el servidor'
                });
            }

        } catch (error) {
            console.error('Error al crear guía de estilo:', error);
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
                        Crear Nueva Guía de Estilo
                    </h1>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Habitación */}
                        <Input
                            type="select"
                            label="Habitación"
                            register={register('room_id')}
                            error={errors.room_id?.message}
                            placeholder="Selecciona una habitación"
                            required
                        >
                            {rooms.map((room) => (
                                <option key={room.id} value={room.id}>
                                    {room.name}
                                </option>
                            ))}
                        </Input>

                        {/* Título */}
                        <Input
                            label="Título de la Guía"
                            register={register('title')}
                            error={errors.title?.message}
                            placeholder="Ej: Estilo Nórdico, Decoración Minimalista, Estilo Industrial..."
                            required
                        />

                        {/* Foto de referencia */}
                        <Input
                            type="url"
                            label="URL de la Foto de Referencia"
                            register={register('reference_photo_url')}
                            error={errors.reference_photo_url?.message}
                            placeholder="https://www.pinterest.com/pin/ejemplo.jpg"
                        />

                        {/* Código QR */}
                        <Input
                            type="url"
                            label="URL del Código QR"
                            register={register('qr_code_url')}
                            error={errors.qr_code_url?.message}
                            placeholder="https://qr-code-generator.com/ejemplo"
                        />

                        {/* URLs de imágenes */}
                        <Input
                            type="textarea"
                            label="URLs de Imágenes (separadas por comas)"
                            register={register('image_urls')}
                            error={errors.image_urls?.message}
                            placeholder="https://ejemplo1.com/imagen1.jpg, https://ejemplo2.com/imagen2.jpg"
                            rows={3}
                        />
                        <p className="mt-1 text-sm text-gray-500">
                            Separa múltiples URLs con comas. Estas imágenes mostrarán el estilo de la habitación.
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
                                {isSubmitting ? 'Creando...' : 'Crear Guía de Estilo'}
                            </button>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    );
}
