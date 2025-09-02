'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreateRoom, Home, RoomType } from '@/lib/types';
import { Input } from '@/components/ui/Input';
import { useApiData } from '@/hooks/useApiData';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';

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
    const { data: homes, isLoading: isLoadingHomes, error: homesError } = useApiData<Home>('homes', { page: 1, pageSize: 100 });
    const apiClient = createApiClient(config.apiUrl);



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
            const apiData: CreateRoom = {
                name: data.name,
                home_id: data.home_id,
                room_type_id: data.room_type_id,
                description: data.description,
            };

            const response = await apiClient.createRoom(apiData);

            if (response.success) {
                setSubmitMessage({
                    type: 'success',
                    message: 'Habitación creada exitosamente!'
                });

                // Limpiar formulario
                reset();
            } else {
                setSubmitMessage({
                    type: 'error',
                    message: 'Error al crear la habitación en el servidor'
                });
            }
        } catch (error) {
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
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">
                        Crear Nueva Habitación
                    </h1>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Nombre de la habitación */}
                        <Input
                            label="Nombre de la Habitación"
                            register={register('name')}
                            error={errors.name?.message}
                            placeholder="Ej: Dormitorio Principal, Cocina, Baño..."
                            required
                        />

                        {/* Casa */}
                        <Input
                            type="select"
                            label="Casa"
                            register={register('home_id')}
                            error={errors.home_id?.message}
                            placeholder="Selecciona una casa"
                            required
                        >
                            {homes.map((home) => (
                                <option key={home.id} value={home.id}>
                                    {home.name}
                                </option>
                            ))}
                        </Input>

                        {/* Tipo de habitación */}
                        <Input
                            type="select"
                            label="Tipo de Habitación"
                            register={register('room_type_id')}
                            error={errors.room_type_id?.message}
                            placeholder="Selecciona un tipo"
                            required
                        >
                            {roomTypes.map((roomType) => (
                                <option key={roomType.id} value={roomType.id}>
                                    {roomType.name}
                                </option>
                            ))}
                        </Input>

                        {/* Descripción */}
                        <Input
                            type="textarea"
                            label="Descripción"
                            register={register('description')}
                            error={errors.description?.message}
                            placeholder="Descripción detallada de la habitación, características, dimensiones..."
                            rows={3}
                            required
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
                        <div className="flex flex-col sm:flex-row justify-end gap-4">
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
