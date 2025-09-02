import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { TechnicalPlan, CreateTechnicalPlan, Home } from '@/lib/types';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';
import { useApiData } from '@/hooks/useApiData';
import { Input } from '@/components/ui/Input';
import { FileUpload } from '@/components/ui/FileUpload';
import { Modal } from '@/components/ui/Modal';

const editTechnicalPlanSchema = z.object({
    home_id: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
});

type EditTechnicalPlanFormData = z.infer<typeof editTechnicalPlanSchema>;

interface EditTechnicalPlanFormProps {
    plan: TechnicalPlan;
    onClose: () => void;
    onSuccess: () => void;
}

export function EditTechnicalPlanForm({ plan, onClose, onSuccess }: EditTechnicalPlanFormProps) {
    const apiClient = createApiClient(config.apiUrl);
    const { data: homes } = useApiData<Home>('homes');

    const [fileUrls, setFileUrls] = useState<string[]>(plan.plan_file_url ? [plan.plan_file_url] : []);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const { register, handleSubmit, formState: { errors }, reset } = useForm<EditTechnicalPlanFormData>({
        resolver: zodResolver(editTechnicalPlanSchema),
        defaultValues: {
            home_id: plan.home_id,
            title: plan.title,
            description: plan.description,
        }
    });

    useEffect(() => {
        reset({ home_id: plan.home_id, title: plan.title, description: plan.description });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [plan, reset, (homes ? homes.length : 0)]);

    const onSubmit = async (data: EditTechnicalPlanFormData) => {
        setIsSubmitting(true);
        setSubmitMessage(null);
        try {
            const payload: Partial<CreateTechnicalPlan> = {
                home_id: data.home_id,
                title: data.title,
                description: data.description,
                plan_file_url: fileUrls[0] || undefined,
            };
            const res = await apiClient.updateTechnicalPlan(plan.id, payload);
            if (res.success) {
                setSubmitMessage({ type: 'success', message: 'Plano actualizado correctamente' });
                setTimeout(() => onSuccess(), 1200);
            } else {
                setSubmitMessage({ type: 'error', message: 'No fue posible actualizar el plano' });
            }
        } catch (err) {
            setSubmitMessage({ type: 'error', message: err instanceof Error ? err.message : 'Error de conexión' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Editar Plano Técnico">
            <div className="p-6 max-h-[75vh] overflow-y-auto">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <Input type="select" label="Casa" register={register('home_id')} error={errors.home_id?.message} required defaultValue={plan.home_id}>
                        <option value="">Selecciona una casa</option>
                        {(!homes || !homes.find(h => h.id === plan.home_id)) && (
                            <option value={plan.home_id}>Casa actual</option>
                        )}
                        {homes?.map((home) => (
                            <option key={home.id} value={home.id}>{home.name}</option>
                        ))}
                    </Input>

                    <Input label="Título" register={register('title')} error={errors.title?.message} required defaultValue={plan.title} />

                    <Input type="textarea" label="Descripción" register={register('description')} error={errors.description?.message} rows={3} required defaultValue={plan.description} />

                    <FileUpload label="Archivo del Plano" onUrlsChange={setFileUrls} existingUrls={fileUrls} accept=".pdf,.dwg,.jpg,.jpeg,.png" maxFiles={1} maxSize={10} basePath="technical-plans" />

                    {submitMessage && (
                        <div className={`p-4 rounded-md ${submitMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>{submitMessage.message}</div>
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
