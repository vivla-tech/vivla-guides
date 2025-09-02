import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { StylingGuide, CreateStylingGuide, Room } from '@/lib/types';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';
import { useApiData } from '@/hooks/useApiData';
import { Input } from '@/components/ui/Input';
import { FileUpload } from '@/components/ui/FileUpload';
import { Modal } from '@/components/ui/Modal';

const editStylingGuideSchema = z.object({
    room_id: z.string().min(1, 'Debes seleccionar una habitación'),
    title: z.string().min(1, 'El título es requerido'),
    reference_photo_url: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
    qr_code_url: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
    image_urls: z.array(z.string().url()).optional(),
});

type EditStylingGuideFormData = z.infer<typeof editStylingGuideSchema>;

interface EditStylingGuideFormProps {
    guide: StylingGuide;
    onClose: () => void;
    onSuccess: () => void;
}

export function EditStylingGuideForm({ guide, onClose, onSuccess }: EditStylingGuideFormProps) {
    const apiClient = createApiClient(config.apiUrl);
    const { data: rooms } = useApiData<Room>('rooms');

    const [imageUrls, setImageUrls] = useState<string[]>(guide.image_urls || []);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const { register, handleSubmit, formState: { errors }, reset } = useForm<EditStylingGuideFormData>({
        resolver: zodResolver(editStylingGuideSchema),
        defaultValues: {
            room_id: guide.room_id,
            title: guide.title,
            reference_photo_url: guide.reference_photo_url || '',
            qr_code_url: guide.qr_code_url || '',
            image_urls: guide.image_urls || [],
        }
    });

    useEffect(() => {
        reset({
            room_id: guide.room_id,
            title: guide.title,
            reference_photo_url: guide.reference_photo_url || '',
            qr_code_url: guide.qr_code_url || '',
            image_urls: guide.image_urls || [],
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [guide, reset, (rooms ? rooms.length : 0)]);

    const onSubmit = async (data: EditStylingGuideFormData) => {
        setIsSubmitting(true);
        setSubmitMessage(null);
        try {
            const payload: Partial<CreateStylingGuide> = {
                room_id: data.room_id,
                title: data.title,
                reference_photo_url: data.reference_photo_url || undefined,
                qr_code_url: data.qr_code_url || undefined,
                image_urls: imageUrls,
            };
            const res = await apiClient.updateStylingGuide(guide.id, payload);
            if (res.success) {
                setSubmitMessage({ type: 'success', message: 'Guía actualizada correctamente' });
                setTimeout(() => onSuccess(), 1200);
            } else {
                setSubmitMessage({ type: 'error', message: 'No fue posible actualizar la guía' });
            }
        } catch (err) {
            setSubmitMessage({ type: 'error', message: err instanceof Error ? err.message : 'Error de conexión' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Editar Guía de Estilo">
            <div className="p-6 max-h-[75vh] overflow-y-auto">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <Input
                        type="select"
                        label="Habitación"
                        register={register('room_id')}
                        error={errors.room_id?.message}
                        placeholder="Selecciona una habitación"
                        required
                        defaultValue={guide.room_id}
                    >
                        <option value="">Selecciona una habitación</option>
                        {(!rooms || !rooms.find(r => r.id === guide.room_id)) && (
                            <option value={guide.room_id}>Habitación actual</option>
                        )}
                        {rooms?.map((room) => (
                            <option key={room.id} value={room.id}>{room.name}</option>
                        ))}
                    </Input>

                    <Input
                        label="Título"
                        register={register('title')}
                        error={errors.title?.message}
                        placeholder="Título de la guía"
                        required
                        defaultValue={guide.title}
                    />

                    <Input
                        type="url"
                        label="URL de la Foto de Referencia"
                        register={register('reference_photo_url')}
                        error={errors.reference_photo_url?.message}
                        placeholder="https://..."
                        defaultValue={guide.reference_photo_url || ''}
                    />

                    <Input
                        type="url"
                        label="URL del Código QR"
                        register={register('qr_code_url')}
                        error={errors.qr_code_url?.message}
                        placeholder="https://..."
                        defaultValue={guide.qr_code_url || ''}
                    />

                    <FileUpload
                        label="Imágenes"
                        onUrlsChange={setImageUrls}
                        existingUrls={imageUrls}
                        accept="image/*"
                        maxFiles={10}
                        maxSize={5}
                        basePath="styling-guides"
                    />

                    {submitMessage && (
                        <div className={`p-4 rounded-md ${submitMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                            {submitMessage.message}
                        </div>
                    )}

                    <div className="flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
                            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
