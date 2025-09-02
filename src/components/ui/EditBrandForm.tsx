import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Brand, CreateBrand } from '@/lib/types';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';
import { Input } from '@/components/ui/Input';

// Esquema de validación para editar una marca
const editBrandSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    website: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
    contact_info: z.string().min(1, 'La información de contacto es requerida'),
});

type EditBrandFormData = z.infer<typeof editBrandSchema>;

interface EditBrandFormProps {
    brand: Brand;
    onClose: () => void;
    onSuccess: () => void;
}

export function EditBrandForm({ brand, onClose, onSuccess }: EditBrandFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const apiClient = createApiClient(config.apiUrl);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<EditBrandFormData>({
        resolver: zodResolver(editBrandSchema),
        defaultValues: {
            name: brand.name,
            website: brand.website || '',
            contact_info: brand.contact_info,
        },
    });

    const onSubmit = async (data: EditBrandFormData) => {
        setIsSubmitting(true);
        setSubmitMessage(null);

        try {
            // Preparar datos para la API
            const apiData: Partial<CreateBrand> = {
                name: data.name,
                website: data.website || '',
                contact_info: data.contact_info,
            };

            // Llamada real a la API
            const response = await apiClient.updateBrand(brand.id, apiData);

            if (response.success) {
                setSubmitMessage({
                    type: 'success',
                    message: 'Marca actualizada exitosamente!'
                });

                // Limpiar formulario y cerrar modal después de un breve delay
                setTimeout(() => {
                    onSuccess();
                }, 1500);
            } else {
                setSubmitMessage({
                    type: 'error',
                    message: 'Error al actualizar la marca en el servidor'
                });
            }

        } catch (error) {
            console.error('Error al actualizar marca:', error);
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
                label="Nombre de la Marca"
                register={register('name')}
                error={errors.name?.message}
                placeholder="Ej: Samsung, Apple, IKEA..."
                required
            />

            {/* Sitio web */}
            <Input
                type="url"
                label="Sitio Web"
                register={register('website')}
                error={errors.website?.message}
                placeholder="https://www.marca.com"
            />

            {/* Información de contacto */}
            <Input
                type="textarea"
                label="Información de Contacto"
                register={register('contact_info')}
                error={errors.contact_info?.message}
                placeholder="Email, teléfono, dirección de la marca..."
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
                    {isSubmitting ? 'Actualizando...' : 'Actualizar Marca'}
                </button>
            </div>
        </form>
    );
}
