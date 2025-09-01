'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreateCategory } from '@/lib/types';
import { Input } from '@/components/ui/Input';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';

// Esquema de validación para crear una categoría
const createCategorySchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    description: z.string().min(1, 'La descripción es requerida'),
});

type CreateCategoryFormData = z.infer<typeof createCategorySchema>;

export default function CreateCategoryPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const apiClient = createApiClient(config.apiUrl);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<CreateCategoryFormData>({
        resolver: zodResolver(createCategorySchema),
    });

    const onSubmit = async (data: CreateCategoryFormData) => {
        setIsSubmitting(true);
        setSubmitMessage(null);

        try {

            const apiData: CreateCategory = {
                name: data.name,
                description: data.description,
            };

            const response = await apiClient.createCategory(apiData);

            if (response.success) {
                setSubmitMessage({
                    type: 'success',
                    message: 'Categoría creada exitosamente!'
                });

                // Limpiar formulario
                reset();
            } else {
                setSubmitMessage({
                    type: 'error',
                    message: 'Error al crear la categoría en el servidor'
                });
            }
        } catch (error) {
            setSubmitMessage({
                type: 'error',
                message: error instanceof Error ? error.message : 'Error al crear la categoría'
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
                        Crear Nueva Categoría
                    </h1>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Nombre de la categoría */}
                        <Input
                            label="Nombre de la Categoría"
                            register={register('name')}
                            error={errors.name?.message}
                            placeholder="Ej: Electrodomésticos, Muebles, Decoración..."
                            required
                        />

                        {/* Descripción */}
                        <Input
                            type="textarea"
                            label="Descripción"
                            register={register('description')}
                            error={errors.description?.message}
                            placeholder="Descripción detallada de la categoría y qué tipo de productos incluye..."
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
                                {isSubmitting ? 'Creando...' : 'Crear Categoría'}
                            </button>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    );
}
