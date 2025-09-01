import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RoomType, CreateRoomType } from '@/lib/types';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';
import { Input } from '@/components/ui/Input';

// Esquema de validación para editar un tipo de habitación
const editRoomTypeSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
});

type EditRoomTypeFormData = z.infer<typeof editRoomTypeSchema>;

interface EditRoomTypeFormProps {
    roomType: RoomType;
    onClose: () => void;
    onSuccess: () => void;
}

export function EditRoomTypeForm({ roomType, onClose, onSuccess }: EditRoomTypeFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    
    const apiClient = createApiClient(config.apiUrl);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<EditRoomTypeFormData>({
        resolver: zodResolver(editRoomTypeSchema),
        defaultValues: {
            name: roomType.name,
        },
    });

    const onSubmit = async (data: EditRoomTypeFormData) => {
        setIsSubmitting(true);
        setSubmitMessage(null);

        try {
            // Preparar datos para la API
            const apiData: Partial<CreateRoomType> = {
                name: data.name,
            };

            // Llamada real a la API
            const response = await apiClient.updateRoomType(roomType.id, apiData);

            if (response.success) {
                setSubmitMessage({
                    type: 'success',
                    message: 'Tipo de habitación actualizado exitosamente!'
                });
                
                // Limpiar formulario y cerrar modal después de un breve delay
                setTimeout(() => {
                    onSuccess();
                }, 1500);
            } else {
                setSubmitMessage({
                    type: 'error',
                    message: 'Error al actualizar el tipo de habitación en el servidor'
                });
            }

        } catch (error) {
            console.error('Error al actualizar tipo de habitación:', error);
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
                label="Nombre del Tipo"
                register={register('name')}
                error={errors.name?.message}
                placeholder="Ej: Dormitorio, Cocina, Baño, Salón..."
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
                    {isSubmitting ? 'Actualizando...' : 'Actualizar Tipo'}
                </button>
            </div>
        </form>
    );
}
