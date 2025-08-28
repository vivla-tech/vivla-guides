'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TechnicalPlan } from '@/lib/types';

// Esquema de validación para crear un plano técnico
const createTechnicalPlanSchema = z.object({
    home_id: z.string().min(1, 'Debes seleccionar una casa'),
    room_id: z.string().optional(),
    plan_type: z.string().min(1, 'El tipo de plano es requerido'),
    title: z.string().min(1, 'El título es requerido'),
    description: z.string().min(1, 'La descripción es requerida'),
    plan_url: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
    measurements: z.string().min(1, 'Las medidas son requeridas'),
    materials_used: z.string().min(1, 'Los materiales son requeridos'),
    construction_notes: z.string().optional(),
});

type CreateTechnicalPlanFormData = z.infer<typeof createTechnicalPlanSchema>;

export default function CreateTechnicalPlanPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<CreateTechnicalPlanFormData>({
        resolver: zodResolver(createTechnicalPlanSchema),
    });

    const onSubmit = async (data: CreateTechnicalPlanFormData) => {
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
                message: 'Plano técnico creado exitosamente!'
            });

            // Limpiar formulario
            reset();

        } catch (error) {
            setSubmitMessage({
                type: 'error',
                message: error instanceof Error ? error.message : 'Error al crear el plano técnico'
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
                        Crear Nuevo Plano Técnico
                    </h1>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                                <option value="home-1">Villa Mediterránea</option>
                                <option value="home-2">Apartamento Centro</option>
                                <option value="home-3">Casa de Montaña</option>
                                <option value="home-4">Loft Industrial</option>
                            </select>
                            {errors.home_id && (
                                <p className="mt-1 text-sm text-red-600">{errors.home_id.message}</p>
                            )}
                        </div>

                        {/* Habitación (opcional) */}
                        <div>
                            <label htmlFor="room_id" className="block text-sm font-medium text-gray-700 mb-2">
                                Habitación (opcional)
                            </label>
                            <select
                                {...register('room_id')}
                                id="room_id"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Plano general de la casa</option>
                                <option value="room-1">Dormitorio Principal</option>
                                <option value="room-2">Salón</option>
                                <option value="room-3">Cocina</option>
                                <option value="room-4">Baño</option>
                                <option value="room-5">Garaje</option>
                                <option value="room-6">Terraza</option>
                            </select>
                            <p className="mt-1 text-sm text-gray-500">
                                Si es un plano específico de una habitación, selecciónala aquí.
                            </p>
                        </div>

                        {/* Tipo de plano */}
                        <div>
                            <label htmlFor="plan_type" className="block text-sm font-medium text-gray-700 mb-2">
                                Tipo de Plano *
                            </label>
                            <select
                                {...register('plan_type')}
                                id="plan_type"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.plan_type ? 'border-red-300' : 'border-gray-300'
                                    }`}
                            >
                                <option value="">Selecciona un tipo</option>
                                <option value="planta">Planta (Vista Superior)</option>
                                <option value="alzado">Alzado (Vista Frontal)</option>
                                <option value="seccion">Sección (Vista Transversal)</option>
                                <option value="detalle">Detalle Constructivo</option>
                                <option value="instalaciones">Instalaciones (Eléctricas, Fontanería)</option>
                                <option value="estructura">Estructura</option>
                                <option value="acabados">Acabados</option>
                                <option value="paisajismo">Paisajismo y Exteriores</option>
                            </select>
                            {errors.plan_type && (
                                <p className="mt-1 text-sm text-red-600">{errors.plan_type.message}</p>
                            )}
                        </div>

                        {/* Título */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                                Título del Plano *
                            </label>
                            <input
                                {...register('title')}
                                type="text"
                                id="title"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.title ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="Ej: Planta Principal, Alzado Norte, Detalle de Ventana..."
                            />
                            {errors.title && (
                                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                            )}
                        </div>

                        {/* Descripción */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                Descripción del Plano *
                            </label>
                            <textarea
                                {...register('description')}
                                id="description"
                                rows={3}
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.description ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="Describe qué muestra este plano, su escala, orientación..."
                            />
                            {errors.description && (
                                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                            )}
                        </div>

                        {/* URL del plano */}
                        <div>
                            <label htmlFor="plan_url" className="block text-sm font-medium text-gray-700 mb-2">
                                URL del Plano (PDF, DWG, Imagen)
                            </label>
                            <input
                                {...register('plan_url')}
                                type="url"
                                id="plan_url"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.plan_url ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="https://ejemplo.com/plano.pdf o https://ejemplo.com/plano.dwg"
                            />
                            {errors.plan_url && (
                                <p className="mt-1 text-sm text-red-600">{errors.plan_url.message}</p>
                            )}
                            <p className="mt-1 text-sm text-gray-500">
                                Puede ser un PDF, archivo DWG, imagen o enlace a plataforma de planos.
                            </p>
                        </div>

                        {/* Medidas */}
                        <div>
                            <label htmlFor="measurements" className="block text-sm font-medium text-gray-700 mb-2">
                                Medidas y Dimensiones *
                            </label>
                            <textarea
                                {...register('measurements')}
                                id="measurements"
                                rows={4}
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.measurements ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="Incluye medidas principales, alturas, anchos, profundidades..."
                            />
                            {errors.measurements && (
                                <p className="mt-1 text-sm text-red-600">{errors.measurements.message}</p>
                            )}
                            <p className="mt-1 text-sm text-gray-500">
                                Especifica medidas en metros, centímetros, etc.
                            </p>
                        </div>

                        {/* Materiales utilizados */}
                        <div>
                            <label htmlFor="materials_used" className="block text-sm font-medium text-gray-700 mb-2">
                                Materiales Utilizados *
                            </label>
                            <textarea
                                {...register('materials_used')}
                                id="materials_used"
                                rows={4}
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.materials_used ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="Lista de materiales de construcción, acabados, sistemas..."
                            />
                            {errors.materials_used && (
                                <p className="mt-1 text-sm text-red-600">{errors.materials_used.message}</p>
                            )}
                            <p className="mt-1 text-sm text-gray-500">
                                Incluye materiales estructurales, acabados, sistemas técnicos, etc.
                            </p>
                        </div>

                        {/* Notas de construcción */}
                        <div>
                            <label htmlFor="construction_notes" className="block text-sm font-medium text-gray-700 mb-2">
                                Notas de Construcción
                            </label>
                            <textarea
                                {...register('construction_notes')}
                                id="construction_notes"
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Notas especiales, consideraciones técnicas, estándares aplicados..."
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                Información técnica adicional, estándares, consideraciones especiales.
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
                                {isSubmitting ? 'Creando...' : 'Crear Plano Técnico'}
                            </button>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    );
}
