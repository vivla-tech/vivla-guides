'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreateRoomType } from '@/lib/types';

// Esquema de validación para crear un tipo de habitación
const createRoomTypeSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
});

type CreateRoomTypeFormData = z.infer<typeof createRoomTypeSchema>;

export default function CreateRoomTypePage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<CreateRoomTypeFormData>({
        resolver: zodResolver(createRoomTypeSchema),
    });

    const onSubmit = async (data: CreateRoomTypeFormData) => {
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
                message: 'Tipo de habitación creado exitosamente!'
            });

            // Limpiar formulario
            reset();

        } catch (error) {
            setSubmitMessage({
                type: 'error',
                message: error instanceof Error ? error.message : 'Error al crear el tipo de habitación'
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
                        Crear Nuevo Tipo de Habitación
                    </h1>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Nombre del tipo de habitación */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre del Tipo *
                            </label>
                            <input
                                {...register('name')}
                                type="text"
                                id="name"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.name ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="Ej: Dormitorio, Baño, Cocina, Salón..."
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
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
                                {isSubmitting ? 'Creando...' : 'Crear Tipo de Habitación'}
                            </button>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    );
}
