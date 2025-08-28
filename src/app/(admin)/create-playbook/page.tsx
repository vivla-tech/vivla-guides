'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Playbook, Room } from '@/lib/types';
import { useApiData } from '@/hooks/useApiData';

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
            // Por ahora simulamos la llamada a la API
            // TODO: Conectar con el backend real
            console.log('Datos a enviar:', data);

            // Simular delay de API
            await new Promise(resolve => setTimeout(resolve, 1000));

            setSubmitMessage({
                type: 'success',
                message: 'Playbook creado exitosamente!'
            });

            // Limpiar formulario
            reset();

        } catch (error) {
            setSubmitMessage({
                type: 'error',
                message: error instanceof Error ? error.message : 'Error al crear el playbook'
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
                                {rooms.map((room) => (
                                    <option key={room.id} value={room.id}>
                                        {room.name}
                                    </option>
                                ))}
                            </select>
                            {errors.room_id && (
                                <p className="mt-1 text-sm text-red-600">{errors.room_id.message}</p>
                            )}
                        </div>

                        {/* Tipo de procedimiento */}
                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                                Tipo de Procedimiento *
                            </label>
                            <select
                                {...register('type')}
                                id="type"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.type ? 'border-red-300' : 'border-gray-300'
                                    }`}
                            >
                                <option value="">Selecciona un tipo</option>
                                <option value="limpieza">Limpieza</option>
                                <option value="mantenimiento">Mantenimiento</option>
                                <option value="decoracion">Decoración</option>
                                <option value="reparacion">Reparación</option>
                                <option value="instalacion">Instalación</option>
                                <option value="revision">Revisión</option>
                                <option value="preparacion">Preparación</option>
                                <option value="organizacion">Organización</option>
                            </select>
                            {errors.type && (
                                <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                            )}
                        </div>

                        {/* Título */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                                Título del Procedimiento *
                            </label>
                            <input
                                {...register('title')}
                                type="text"
                                id="title"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.title ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="Ej: Limpieza semanal del dormitorio, Mantenimiento de la cocina..."
                            />
                            {errors.title && (
                                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                            )}
                        </div>

                        {/* Tiempo estimado */}
                        <div>
                            <label htmlFor="estimated_time" className="block text-sm font-medium text-gray-700 mb-2">
                                Tiempo Estimado *
                            </label>
                            <select
                                {...register('estimated_time')}
                                id="estimated_time"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.estimated_time ? 'border-red-300' : 'border-gray-300'
                                    }`}
                            >
                                <option value="">Selecciona el tiempo estimado</option>
                                <option value="15 min">15 minutos</option>
                                <option value="30 min">30 minutos</option>
                                <option value="1 hora">1 hora</option>
                                <option value="2 horas">2 horas</option>
                                <option value="4 horas">4 horas</option>
                                <option value="1 día">1 día</option>
                                <option value="2-3 días">2-3 días</option>
                                <option value="1 semana">1 semana</option>
                            </select>
                            {errors.estimated_time && (
                                <p className="mt-1 text-sm text-red-600">{errors.estimated_time.message}</p>
                            )}
                        </div>

                        {/* Tareas */}
                        <div>
                            <label htmlFor="tasks" className="block text-sm font-medium text-gray-700 mb-2">
                                Tareas a Realizar *
                            </label>
                            <textarea
                                {...register('tasks')}
                                id="tasks"
                                rows={6}
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.tasks ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="Describe paso a paso las tareas a realizar..."
                            />
                            {errors.tasks && (
                                <p className="mt-1 text-sm text-red-600">{errors.tasks.message}</p>
                            )}
                            <p className="mt-1 text-sm text-gray-500">
                                Describe cada tarea en una línea separada o en párrafos organizados.
                            </p>
                        </div>

                        {/* Materiales */}
                        <div>
                            <label htmlFor="materials" className="block text-sm font-medium text-gray-700 mb-2">
                                Materiales Necesarios *
                            </label>
                            <textarea
                                {...register('materials')}
                                id="materials"
                                rows={4}
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.materials ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="Lista de materiales, herramientas y productos necesarios..."
                            />
                            {errors.materials && (
                                <p className="mt-1 text-sm text-red-600">{errors.materials.message}</p>
                            )}
                            <p className="mt-1 text-sm text-gray-500">
                                Incluye herramientas, productos de limpieza, repuestos, etc.
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
                                {isSubmitting ? 'Creando...' : 'Crear Playbook'}
                            </button>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    );
}
