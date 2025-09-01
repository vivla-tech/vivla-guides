'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreatePlaybook, Playbook, Room } from '@/lib/types';
import { Input } from '@/components/ui/Input';
import { useApiData } from '@/hooks/useApiData';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';

// Esquema de validación para crear un playbook
const createPlaybookSchema = z.object({
    room_id: z.string().min(1, 'Debes seleccionar una habitación'),
    type: z.string().min(1, 'El tipo de procedimiento es requerido'),
    title: z.string().min(1, 'El título es requerido'),
    estimated_time: z.string().min(1, 'El tiempo estimado es requerido'),
    tasks: z.string().min(1, 'Las tareas son requeridas'),
    materials: z.string().min(1, 'Los materiales son requeridos'),
});

type CreatePlaybookFormData = z.infer<typeof createPlaybookSchema>;

export default function CreatePlaybookPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const { data: rooms, isLoading: isLoadingRooms, error: roomsError } = useApiData<Room>('rooms');

    const apiClient = createApiClient(config.apiUrl);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<CreatePlaybookFormData>({
        resolver: zodResolver(createPlaybookSchema),
    });

    const onSubmit = async (data: CreatePlaybookFormData) => {
        setIsSubmitting(true);
        setSubmitMessage(null);

        try {
            // Preparar datos para la API
            const apiData: CreatePlaybook = {
                room_id: data.room_id,
                type: data.type,
                title: data.title,
                estimated_time: data.estimated_time,
                tasks: data.tasks,
                materials: data.materials,
            };

            // Llamada real a la API
            const response = await apiClient.createPlaybook(apiData);

            if (response.success) {
                setSubmitMessage({
                    type: 'success',
                    message: 'Playbook creado exitosamente!'
                });

                // Limpiar formulario
                reset();
            } else {
                setSubmitMessage({
                    type: 'error',
                    message: 'Error al crear el playbook en el servidor'
                });
            }

        } catch (error) {
            console.error('Error al crear playbook:', error);
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
                        Crear Nuevo Playbook
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

                        {/* Tipo de procedimiento */}
                        <Input
                            type="select"
                            label="Tipo de Procedimiento"
                            register={register('type')}
                            error={errors.type?.message}
                            placeholder="Selecciona un tipo"
                            required
                        >
                            <option value="limpieza">Limpieza</option>
                            <option value="mantenimiento">Mantenimiento</option>
                            <option value="decoracion">Decoración</option>
                            <option value="reparacion">Reparación</option>
                            <option value="instalacion">Instalación</option>
                            <option value="revision">Revisión</option>
                            <option value="preparacion">Preparación</option>
                            <option value="organizacion">Organización</option>
                        </Input>

                        {/* Título */}
                        <Input
                            label="Título del Procedimiento"
                            register={register('title')}
                            error={errors.title?.message}
                            placeholder="Ej: Limpieza de cocina, Mantenimiento de calefacción..."
                            required
                        />

                        {/* Tiempo estimado */}
                        <Input
                            type="select"
                            label="Tiempo Estimado"
                            register={register('estimated_time')}
                            error={errors.estimated_time?.message}
                            placeholder="Selecciona el tiempo estimado"
                            required
                        >
                            <option value="15 min">15 minutos</option>
                            <option value="30 min">30 minutos</option>
                            <option value="1 hora">1 hora</option>
                            <option value="2 horas">2 horas</option>
                            <option value="4 horas">4 horas</option>
                            <option value="1 día">1 día</option>
                            <option value="2-3 días">2-3 días</option>
                            <option value="1 semana">1 semana</option>
                        </Input>

                        {/* Tareas */}
                        <Input
                            type="textarea"
                            label="Tareas a Realizar"
                            register={register('tasks')}
                            error={errors.tasks?.message}
                            placeholder="1. Preparar materiales necesarios\n2. Limpiar superficie\n3. Aplicar producto\n4. Secar y verificar..."
                            rows={3}
                            required
                        />
                        <p className="mt-1 text-sm text-gray-500">
                            Describe cada tarea en una línea separada o en párrafos organizados.
                        </p>

                        {/* Materiales */}
                        <Input
                            type="textarea"
                            label="Materiales Necesarios"
                            register={register('materials')}
                            error={errors.materials?.message}
                            placeholder="• Producto de limpieza\n• Trapos o paños\n• Guantes\n• Herramientas específicas..."
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
                                {isSubmitting ? 'Creando...' : 'Crear Playbook'}
                            </button>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    );
}
