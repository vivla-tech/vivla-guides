'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreateHome } from '@/lib/types';

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
            // Por ahora simulamos la llamada a la API
            // TODO: Conectar con el backend real
            console.log('Datos a enviar:', data);

            // Simular delay de API
            await new Promise(resolve => setTimeout(resolve, 1000));

            setSubmitMessage({
                type: 'success',
                message: 'Casa creada exitosamente!'
            });

            // Limpiar formulario
            reset();

        } catch (error) {
            setSubmitMessage({
                type: 'error',
                message: error instanceof Error ? error.message : 'Error al crear la casa'
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
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre de la Casa *
                            </label>
                            <input
                                {...register('name')}
                                type="text"
                                id="name"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.name ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="Ej: Villa Mediterránea"
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                            )}
                        </div>

                        {/* Destino */}
                        <div>
                            <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
                                Destino *
                            </label>
                            <select
                                {...register('destination')}
                                id="destination"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.destination ? 'border-red-300' : 'border-gray-300'
                                    }`}
                            >
                                <option value="">Selecciona un destino</option>
                                <option value="vacacional">Vacacional</option>
                                <option value="residencial">Residencial</option>
                                <option value="comercial">Comercial</option>
                                <option value="mixto">Mixto</option>
                            </select>
                            {errors.destination && (
                                <p className="mt-1 text-sm text-red-600">{errors.destination.message}</p>
                            )}
                        </div>

                        {/* Dirección */}
                        <div>
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                                Dirección *
                            </label>
                            <textarea
                                {...register('address')}
                                id="address"
                                rows={3}
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.address ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="Dirección completa de la casa"
                            />
                            {errors.address && (
                                <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                            )}
                        </div>

                        {/* Imagen principal */}
                        <div>
                            <label htmlFor="main_image" className="block text-sm font-medium text-gray-700 mb-2">
                                URL de la Imagen Principal
                            </label>
                            <input
                                {...register('main_image')}
                                type="url"
                                id="main_image"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.main_image ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="https://ejemplo.com/imagen.jpg"
                            />
                            {errors.main_image && (
                                <p className="mt-1 text-sm text-red-600">{errors.main_image.message}</p>
                            )}
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
                                {isSubmitting ? 'Creando...' : 'Crear Casa'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
