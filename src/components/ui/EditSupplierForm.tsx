import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Supplier, CreateSupplier } from '@/lib/types';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';
import { Input } from '@/components/ui/Input';

// Esquema de validación para editar un proveedor
const editSupplierSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    website: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
    contact_email: z.string().email('Debe ser un email válido'),
    phone: z.string().min(1, 'El teléfono es requerido'),
});

type EditSupplierFormData = z.infer<typeof editSupplierSchema>;

interface EditSupplierFormProps {
    supplier: Supplier;
    onClose: () => void;
    onSuccess: () => void;
}

export function EditSupplierForm({ supplier, onClose, onSuccess }: EditSupplierFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    
    const apiClient = createApiClient(config.apiUrl);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<EditSupplierFormData>({
        resolver: zodResolver(editSupplierSchema),
        defaultValues: {
            name: supplier.name,
            website: supplier.website || '',
            contact_email: supplier.contact_email,
            phone: supplier.phone,
        },
    });

    const onSubmit = async (data: EditSupplierFormData) => {
        setIsSubmitting(true);
        setSubmitMessage(null);

        try {
            // Preparar datos para la API
            const apiData: Partial<CreateSupplier> = {
                name: data.name,
                website: data.website || '',
                contact_email: data.contact_email,
                phone: data.phone,
            };

            // Llamada real a la API
            const response = await apiClient.updateSupplier(supplier.id, apiData);

            if (response.success) {
                setSubmitMessage({
                    type: 'success',
                    message: 'Proveedor actualizado exitosamente!'
                });
                
                // Limpiar formulario y cerrar modal después de un breve delay
                setTimeout(() => {
                    onSuccess();
                }, 1500);
            } else {
                setSubmitMessage({
                    type: 'error',
                    message: 'Error al actualizar el proveedor en el servidor'
                });
            }

        } catch (error) {
            console.error('Error al actualizar proveedor:', error);
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
                label="Teléfono"
                register={register('phone')}
                error={errors.phone?.message}
                placeholder="+34 900 123 456"
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
                    {isSubmitting ? 'Actualizando...' : 'Actualizar Proveedor'}
                </button>
            </div>
        </form>
    );
}
