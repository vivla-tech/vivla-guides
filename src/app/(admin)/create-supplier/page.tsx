'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreateSupplier } from '@/lib/types';
import { Input } from '@/components/ui/Input';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';

// Esquema de validación para crear un proveedor
const createSupplierSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    website: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
    contact_email: z.string().email('Debe ser un email válido'),
    phone: z.string().min(1, 'El teléfono es requerido'),
});

type CreateSupplierFormData = z.infer<typeof createSupplierSchema>;

export default function CreateSupplierPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const apiClient = createApiClient(config.apiUrl);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<CreateSupplierFormData>({
        resolver: zodResolver(createSupplierSchema),
    });

    const onSubmit = async (data: CreateSupplierFormData) => {
        setIsSubmitting(true);
        setSubmitMessage(null);

        try {
            const apiData: CreateSupplier = {
                name: data.name,
                website: data.website || '',
                contact_email: data.contact_email,
                phone: data.phone,
            };

            const response = await apiClient.createSupplier(apiData);

            if (response.success) {
                setSubmitMessage({
                    type: 'success',
                    message: 'Proveedor creado exitosamente!'
                });

                // Limpiar formulario
                reset();
            } else {
                setSubmitMessage({
                    type: 'error',
                    message: 'Error al crear el proveedor en el servidor'
                });
            }
        } catch (error) {
            console.error('Error al crear proveedor:', error);
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
                        Crear Nuevo Proveedor
                    </h1>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Nombre del proveedor */}
                        <Input
                            label="Nombre del Proveedor"
                            register={register('name')}
                            error={errors.name?.message}
                            placeholder="Ej: Proveedor ABC, Distribuidora XYZ..."
                            required
                        />

                        {/* Sitio web */}
                        <Input
                            type="url"
                            label="Sitio Web"
                            register={register('website')}
                            error={errors.website?.message}
                            placeholder="https://www.proveedor.com"
                        />

                        {/* Email de contacto */}
                        <Input
                            type="email"
                            label="Email de Contacto"
                            register={register('contact_email')}
                            error={errors.contact_email?.message}
                            placeholder="contacto@proveedor.com"
                            required
                        />

                        {/* Teléfono */}
                        <Input
                            type="tel"
                            label="Teléfono"
                            register={register('phone')}
                            error={errors.phone?.message}
                            placeholder="+34 600 000 000"
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
                                {isSubmitting ? 'Creando...' : 'Crear Proveedor'}
                            </button>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    );
}
