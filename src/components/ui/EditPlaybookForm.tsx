import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Playbook, CreatePlaybook, Room } from '@/lib/types';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';
import { useApiData } from '@/hooks/useApiData';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

const editPlaybookSchema = z.object({
    room_id: z.string().min(1),
    type: z.string().min(1),
    title: z.string().min(1),
    estimated_time: z.string().min(1),
    tasks: z.string().min(1),
    materials: z.string().min(1),
});

type EditPlaybookFormData = z.infer<typeof editPlaybookSchema>;

interface EditPlaybookFormProps {
    playbook: Playbook;
    onClose: () => void;
    onSuccess: () => void;
}

export function EditPlaybookForm({ playbook, onClose, onSuccess }: EditPlaybookFormProps) {
    const apiClient = createApiClient(config.apiUrl);
    const { data: rooms } = useApiData<Room>('rooms', { page: 1, pageSize: 100 });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const { register, handleSubmit, formState: { errors }, reset } = useForm<EditPlaybookFormData>({
        resolver: zodResolver(editPlaybookSchema),
        defaultValues: {
            room_id: playbook.room_id,
            type: playbook.type,
            title: playbook.title,
            estimated_time: playbook.estimated_time,
            tasks: playbook.tasks,
            materials: playbook.materials,
        }
    });

    useEffect(() => {
        reset({
            room_id: playbook.room_id,
            type: playbook.type,
            title: playbook.title,
            estimated_time: playbook.estimated_time,
            tasks: playbook.tasks,
            materials: playbook.materials,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playbook, reset, (rooms ? rooms.length : 0)]);

    const onSubmit = async (data: EditPlaybookFormData) => {
        setIsSubmitting(true);
        setSubmitMessage(null);
        try {
            const payload: Partial<CreatePlaybook> = {
                room_id: data.room_id,
                type: data.type,
                title: data.title,
                estimated_time: data.estimated_time,
                tasks: data.tasks,
                materials: data.materials,
            };
            const res = await apiClient.updatePlaybook(playbook.id, payload);
            if (res.success) {
                setSubmitMessage({ type: 'success', message: 'Playbook actualizado correctamente' });
                setTimeout(() => onSuccess(), 1200);
            } else {
                setSubmitMessage({ type: 'error', message: 'No fue posible actualizar el playbook' });
            }
        } catch (err) {
            setSubmitMessage({ type: 'error', message: err instanceof Error ? err.message : 'Error de conexión' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Editar Playbook">
            <div className="p-6 max-h-[75vh] overflow-y-auto">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <Input type="select" label="Habitación" register={register('room_id')} error={errors.room_id?.message} placeholder="Selecciona una habitación" required defaultValue={playbook.room_id}>
                        <option value="">Selecciona una habitación</option>
                        {(!rooms || !rooms.find(r => r.id === playbook.room_id)) && (
                            <option value={playbook.room_id}>Habitación actual</option>
                        )}
                        {rooms?.map((room) => (
                            <option key={room.id} value={room.id}>{room.name}</option>
                        ))}
                    </Input>

                    <Input type="select" label="Tipo de Procedimiento" register={register('type')} error={errors.type?.message} placeholder="Selecciona un tipo" required defaultValue={playbook.type}>
                        <option value="limpieza">Limpieza</option>
                        <option value="mantenimiento">Mantenimiento</option>
                        <option value="decoracion">Decoración</option>
                        <option value="reparacion">Reparación</option>
                        <option value="instalacion">Instalación</option>
                        <option value="revision">Revisión</option>
                        <option value="preparacion">Preparación</option>
                        <option value="organizacion">Organización</option>
                    </Input>

                    <Input label="Título del Procedimiento" register={register('title')} error={errors.title?.message} placeholder="Título" required defaultValue={playbook.title} />

                    <Input type="select" label="Tiempo Estimado" register={register('estimated_time')} error={errors.estimated_time?.message} placeholder="Tiempo" required defaultValue={playbook.estimated_time}>
                        <option value="15 min">15 minutos</option>
                        <option value="30 min">30 minutos</option>
                        <option value="1 hora">1 hora</option>
                        <option value="2 horas">2 horas</option>
                        <option value="4 horas">4 horas</option>
                        <option value="1 día">1 día</option>
                        <option value="2-3 días">2-3 días</option>
                        <option value="1 semana">1 semana</option>
                    </Input>

                    <Input type="textarea" label="Tareas" register={register('tasks')} error={errors.tasks?.message} placeholder="Tareas..." rows={3} required defaultValue={playbook.tasks} />

                    <Input type="textarea" label="Materiales" register={register('materials')} error={errors.materials?.message} placeholder="Materiales..." rows={3} required defaultValue={playbook.materials} />

                    {submitMessage && (
                        <div className={`p-4 rounded-md ${submitMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                            {submitMessage.message}
                        </div>
                    )}

                    <div className="flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">{isSubmitting ? 'Guardando...' : 'Guardar cambios'}</button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
