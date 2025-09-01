import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Category, CreateCategory } from '@/lib/types';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';
import { Input } from '@/components/ui/Input';

// Esquema de validación para editar una categoría
const editCategorySchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    description: z.string().min(1, 'La descripción es requerida'),
});

type EditCategoryFormData = z.infer<typeof editCategorySchema>;

interface EditCategoryFormProps {
    category: Category;
    onClose: () => void;
    onSuccess: () => void;
}

export function EditCategoryForm({ category, onClose, onSuccess }: EditCategoryFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const apiClient = createApiClient(config.apiUrl);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<EditCategoryFormData>({
        resolver: zodResolver(editCategorySchema),
        defaultValues: {
            name: category.name,
            description: category.description,
        },
    });

    const onSubmit = async (data: EditCategoryFormData) => {
        setIsSubmitting(true);
        setSubmitMessage(null);

        try {
            // Preparar datos para la API
            const apiData: Partial<CreateCategory> = {
                name: data.name,
                description: data.description,
            };

            // Llamada real a la API
            const response = await apiClient.updateCategory(category.id, apiData);

            if (response.success) {
                setSubmitMessage({
                    type: 'success',
                    message: 'Categoría actualizada exitosamente!'
                });

                // Limpiar formulario y cerrar modal después de un breve delay
                setTimeout(() => {
                    onSuccess();
                }, 1500);
            } else {
                setSubmitMessage({
                    type: 'error',
                    message: 'Error al actualizar la categoría en el servidor'
                });
            }

        } catch (error) {
            console.error('Error al actualizar categoría:', error);
            setSubmitMessage({
                type: 'error',
                message: error instanceof Error ? error.message : 'Error de conexión con el servidor'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Nombre */}
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
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Actualizando...' : 'Actualizar Categoría'}
                </button>
            </div>
        </form>
    );
}
