'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreateRoom, Home, RoomType } from '@/lib/types';
import { useApiData } from '@/hooks/useApiData';

// Esquema de validación para crear una habitación
const createRoomSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    home_id: z.string().min(1, 'Debes seleccionar una casa'),
    room_type_id: z.string().min(1, 'Debes seleccionar un tipo de habitación'),
    description: z.string().min(1, 'La descripción es requerida'),
});

type CreateRoomFormData = z.infer<typeof createRoomSchema>;

export default function CreateRoomPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const { data: roomTypes, isLoading: isLoadingRoomTypes, error: roomTypesError } = useApiData<RoomType>('rooms-type');
    const { data: homes, isLoading: isLoadingHomes, error: homesError } = useApiData<Home>('homes');



    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<CreateRoomFormData>({
        resolver: zodResolver(createRoomSchema),
    });

    const onSubmit = async (data: CreateRoomFormData) => {
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
                message: 'Habitación creada exitosamente!'
            });

            // Limpiar formulario
            reset();

        } catch (error) {
            setSubmitMessage({
                type: 'error',
                message: error instanceof Error ? error.message : 'Error al crear la habitación'
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
                        Crear Nueva Habitación
                    </h1>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Nombre de la habitación */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre de la Habitación *
                            </label>
                            <input
                                {...register('name')}
                                type="text"
                                id="name"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.name ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="Ej: Dormitorio Principal, Baño de Invitados..."
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                            )}
                        </div>

                        {/* Casa */}
                        <div>
                            <label htmlFor="home_id" className="block text-sm font-medium text-gray-700 mb-2">
                                Casa *
                            </label>
                            <select
                                {...register('home_id')}
                                id="home_id"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.home_id ? 'border-red-300' : 'border-gray-300'
                                    }`}
                            >
                                <option value="">Selecciona una casa</option>
                                {homes.map((home) => (
                                    <option key={home.id} value={home.id}>
                                        {home.name}
                                    </option>
                                ))}
                            </select>
                            {errors.home_id && (
                                <p className="mt-1 text-sm text-red-600">{errors.home_id.message}</p>
                            )}
                        </div>

                        {/* Tipo de habitación */}
                        <div>
                            <label htmlFor="room_type_id" className="block text-sm font-medium text-gray-700 mb-2">
                                Tipo de Habitación *
                            </label>
                            <select
                                {...register('room_type_id')}
                                id="room_type_id"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.room_type_id ? 'border-red-300' : 'border-gray-300'
                                    }`}
                            >
                                <option value="">Selecciona un tipo</option>
                                {roomTypes.map((roomType) => (
                                    <option key={roomType.id} value={roomType.id}>
                                        {roomType.name}
                                    </option>
                                ))}
                            </select>
                            {errors.room_type_id && (
                                <p className="mt-1 text-sm text-red-600">{errors.room_type_id.message}</p>
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
                                placeholder="Describe la habitación, sus características, orientación..."
                            />
                            {errors.description && (
                                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
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
                                {isSubmitting ? 'Creando...' : 'Crear Habitación'}
                            </button>
                        </div>
                    </form>


                </div>
            </div>
        </div>
    );
}
