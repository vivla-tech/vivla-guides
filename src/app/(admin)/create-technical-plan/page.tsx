'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Home, CreateTechnicalPlan } from '@/lib/types';
import { Input } from '@/components/ui/Input';
import { useApiData } from '@/hooks/useApiData';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';

// Esquema de validación para crear un plano técnico
const createTechnicalPlanSchema = z.object({
    home_id: z.string().min(1, 'Debes seleccionar una casa'),
    title: z.string().min(1, 'El título es requerido'),
    description: z.string().min(1, 'La descripción es requerida'),
    plan_url: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
});

type CreateTechnicalPlanFormData = z.infer<typeof createTechnicalPlanSchema>;

export default function CreateTechnicalPlanPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const { data: homes, isLoading: isLoadingHomes, error: homesError } = useApiData<Home>('homes');

    const apiClient = createApiClient(config.apiUrl);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<CreateTechnicalPlanFormData>({
        resolver: zodResolver(createTechnicalPlanSchema),
    });

    const onSubmit = async (data: CreateTechnicalPlanFormData) => {
        console.log('🎯 onSubmit EJECUTÁNDOSE!');
        console.log('📝 Datos del formulario:', data);

        setIsSubmitting(true);
        setSubmitMessage(null);

        try {
            // Preparar datos para la API
            const apiData: CreateTechnicalPlan = {
                home_id: data.home_id,
                title: data.title,
                description: data.description,
                plan_file_url: data.plan_url || undefined,
            };

            const response = await apiClient.createTechnicalPlan(apiData);

            if (response.success) {
                setSubmitMessage({
                    type: 'success',
                    message: 'Plano técnico creado exitosamente!'
                });

                // Limpiar formulario
                reset();
            } else {
                setSubmitMessage({
                    type: 'error',
                    message: 'Error al crear el plano técnico en el servidor'
                });
            }

        } catch (error) {
            console.error('Error al crear plano técnico:', error);
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
                        Crear Nuevo Plano Técnico
                    </h1>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

                        {/* Título */}
                        <Input
                            label="Título del Plano"
                            register={register('title')}
                            error={errors.title?.message}
                            placeholder="Ej: Plano de Instalación Eléctrica, Plano de Fontanería..."
                            required
                        />

                        {/* Descripción */}
                        <Input
                            type="textarea"
                            label="Descripción del Plano"
                            register={register('description')}
                            error={errors.description?.message}
                            placeholder="Descripción detallada del plano técnico, qué incluye, escala, etc..."
                            rows={3}
                            required
                        />

                        {/* URL del plano */}
                        <Input
                            type="url"
                            label="URL del Plano (PDF, DWG, Imagen)"
                            register={register('plan_url')}
                            error={errors.plan_url?.message}
                            placeholder="https://www.dropbox.com/plano.pdf"
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
                                {isSubmitting ? 'Creando...' : 'Crear Plano Técnico'}
                            </button>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    );
}
