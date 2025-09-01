'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreateHome } from '@/lib/types';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';
import { Input } from '@/components/ui/Input';

// Esquema de validación para crear una casa
const createHomeSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    destination: z.string().min(1, 'El destino es requerido'),
    address: z.string().min(1, 'La dirección es requerida'),
    main_image: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
});

type CreateHomeFormData = z.infer<typeof createHomeSchema>;

export default function CreateHomePage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const apiClient = createApiClient(config.apiUrl);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<CreateHomeFormData>({
        resolver: zodResolver(createHomeSchema),
    });

    const onSubmit = async (data: CreateHomeFormData) => {
        setIsSubmitting(true);
        setSubmitMessage(null);

        try {
            // Preparar datos para la API (main_image puede ser undefined)
            const apiData: CreateHome = {
                name: data.name,
                destination: data.destination,
                address: data.address,
                main_image: data.main_image || '', // Convertir undefined a string vacío
            };

            // Llamada real a la API
            const response = await apiClient.createHome(apiData);

            if (response.success) {
                setSubmitMessage({
                    type: 'success',
                    message: 'Casa creada exitosamente!'
                });

                // Limpiar formulario
                reset();
            } else {
                // Manejar error de la API
                setSubmitMessage({
                    type: 'error',
                    message: 'Error al crear la casa en el servidor'
                });
            }

        } catch (error) {
            console.error('Error al crear casa:', error);
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
                        Crear Nueva Casa
                    </h1>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Nombre de la casa */}
                        <Input
                            label="Nombre de la Casa"
                            register={register('name')}
                            error={errors.name?.message}
                            placeholder="Ej: Villa Mediterránea"
                            required
                        />

                        {/* Destino */}
                        <Input
                            type="select"
                            label="Destino"
                            register={register('destination')}
                            error={errors.destination?.message}
                            placeholder="Selecciona un destino"
                            required
                        >
                            <option value="vacacional">Vacacional</option>
                            <option value="residencial">Residencial</option>
                            <option value="comercial">Comercial</option>
                            <option value="mixto">Mixto</option>
                        </Input>

                        {/* Dirección */}
                        <Input
                            type="textarea"
                            label="Dirección"
                            register={register('address')}
                            error={errors.address?.message}
                            placeholder="Dirección completa de la casa"
                            rows={3}
                            required
                        />

                        {/* Imagen principal */}
                        <Input
                            type="url"
                            label="URL de la Imagen Principal"
                            register={register('main_image')}
                            error={errors.main_image?.message}
                            placeholder="https://ejemplo.com/imagen.jpg"
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
                                {isSubmitting ? 'Creando...' : 'Crear Casa'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
