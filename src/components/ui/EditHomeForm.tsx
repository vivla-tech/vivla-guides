import React, { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Home, CreateHome } from '@/lib/types';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';
import { Input } from '@/components/ui/Input';
import { FileUpload } from '@/components/ui/FileUpload';
import { useApiData } from '@/hooks/useApiData';

// Esquema de validación para editar una casa
const editHomeSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    destination: z.string().min(1, 'El destino es requerido'),
    address: z.string().min(1, 'La dirección es requerida'),
});

type EditHomeFormData = z.infer<typeof editHomeSchema>;

interface EditHomeFormProps {
    home: Home;
    imageUrls: string[];
    onImageUrlsChange: (urls: string[]) => void;
    onClose: () => void;
    onSuccess: () => void;
}

export function EditHomeForm({ home, imageUrls, onImageUrlsChange, onClose, onSuccess }: EditHomeFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const apiClient = createApiClient(config.apiUrl);
    const { data: destinations } = useApiData<string>('homes/destinations');


    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<EditHomeFormData>({
        resolver: zodResolver(editHomeSchema),
        defaultValues: {
            name: home.name,
            destination: home.destination,
            address: home.address,
        },
    });

    // Reset form when destinations are loaded to ensure destination select shows correct value
    useEffect(() => {
        if (destinations && destinations.length > 0) {
            reset({
                name: home.name,
                destination: home.destination,
                address: home.address,
            });
        }
    }, [destinations, home, reset]);

    const onSubmit = async (data: EditHomeFormData) => {
        setIsSubmitting(true);
        setSubmitMessage(null);

        try {
            // Preparar datos para la API
            const apiData: Partial<CreateHome> = {
                name: data.name,
                destination: data.destination,
                address: data.address,
                main_image: imageUrls.length > 0 ? imageUrls[0] : '',
            };

            // Llamada real a la API
            const response = await apiClient.updateHome(home.id, apiData);

            if (response.success) {
                setSubmitMessage({
                    type: 'success',
                    message: 'Casa actualizada exitosamente!'
                });

                // Limpiar formulario y cerrar modal después de un breve delay
                setTimeout(() => {
                    onSuccess();
                }, 1500);
            } else {
                setSubmitMessage({
                    type: 'error',
                    message: 'Error al actualizar la casa en el servidor'
                });
            }

        } catch (error) {
            console.error('Error al actualizar casa:', error);
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
            {/* Nombre de la casa */}
            <Input
                label="Nombre de la Casa"
                register={register('name')}
                error={errors.name?.message}
                placeholder="Ej: Villa Mediterránea"
                required
            />

            {/* Destino */}
            <Input
                type="select"
                label="Destino"
                register={register('destination')}
                error={errors.destination?.message}
                placeholder="Selecciona un destino"
                required
            >
                <option value="">Selecciona un destino</option>
                {(destinations && destinations.length > 0
                    ? destinations
                    : ['vacacional', 'residencial', 'comercial', 'mixto']
                ).map((d) => (
                    <option key={d} value={d}>{d}</option>
                ))}
            </Input>

            {/* Dirección */}
            <Input
                type="textarea"
                label="Dirección"
                register={register('address')}
                error={errors.address?.message}
                placeholder="Dirección completa de la casa"
                rows={3}
                required
            />

            {/* Imagen principal */}
            <FileUpload
                label="Imagen Principal de la Casa"
                onUrlsChange={onImageUrlsChange}
                accept="image/*"
                maxFiles={1}
                maxSize={5}
                basePath="homes"
                existingUrls={useMemo(() => home.main_image ? [home.main_image] : [], [home.main_image])}
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
                    {isSubmitting ? 'Actualizando...' : 'Actualizar Casa'}
                </button>
            </div>
        </form>
    );
}
