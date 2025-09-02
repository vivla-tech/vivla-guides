import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApplianceGuide, Brand, CreateApplianceGuide } from '@/lib/types';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';
import { useApiData } from '@/hooks/useApiData';
import { Input } from '@/components/ui/Input';
import { FileUpload } from '@/components/ui/FileUpload';
import { Modal } from '@/components/ui/Modal';

const editApplianceGuideSchema = z.object({
    equipment_name: z.string().min(1),
    brand_id: z.string().min(1),
    model: z.string().min(1),
    brief_description: z.string().min(1),
    quick_use_bullets: z.string().min(1),
    maintenance_bullets: z.string().min(1),
});

type EditApplianceGuideFormData = z.infer<typeof editApplianceGuideSchema>;

interface EditApplianceGuideFormProps {
    guide: ApplianceGuide;
    onClose: () => void;
    onSuccess: () => void;
}

export function EditApplianceGuideForm({ guide, onClose, onSuccess }: EditApplianceGuideFormProps) {
    const apiClient = createApiClient(config.apiUrl);
    const { data: brands } = useApiData<Brand>('brands');

    const [imageUrls, setImageUrls] = useState<string[]>(guide.image_urls || []);
    const [pdfUrls, setPdfUrls] = useState<string[]>(guide.pdf_url ? [guide.pdf_url] : []);
    const [videoUrls, setVideoUrls] = useState<string[]>(guide.video_url ? [guide.video_url] : []);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const { register, handleSubmit, formState: { errors }, reset } = useForm<EditApplianceGuideFormData>({
        resolver: zodResolver(editApplianceGuideSchema),
        defaultValues: {
            equipment_name: guide.equipment_name,
            brand_id: guide.brand_id,
            model: guide.model,
            brief_description: guide.brief_description,
            quick_use_bullets: guide.quick_use_bullets,
            maintenance_bullets: guide.maintenance_bullets,
        }
    });

    useEffect(() => {
        reset({
            equipment_name: guide.equipment_name,
            brand_id: guide.brand_id,
            model: guide.model,
            brief_description: guide.brief_description,
            quick_use_bullets: guide.quick_use_bullets,
            maintenance_bullets: guide.maintenance_bullets,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [guide, reset, (brands ? brands.length : 0)]);

    const onSubmit = async (data: EditApplianceGuideFormData) => {
        setIsSubmitting(true);
        setSubmitMessage(null);
        try {
            const payload: Partial<CreateApplianceGuide> = {
                equipment_name: data.equipment_name,
                brand_id: data.brand_id,
                model: data.model,
                brief_description: data.brief_description,
                image_urls: imageUrls,
                pdf_url: pdfUrls[0] || undefined,
                video_url: videoUrls[0] || undefined,
                quick_use_bullets: data.quick_use_bullets,
                maintenance_bullets: data.maintenance_bullets,
            };
            const res = await apiClient.updateApplianceGuide(guide.id, payload);
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
        <Modal isOpen={true} onClose={onClose} title="Editar Guía de Electrodoméstico">
            <div className="p-6 max-h-[75vh] overflow-y-auto">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <Input label="Nombre del Equipo" register={register('equipment_name')} error={errors.equipment_name?.message} required defaultValue={guide.equipment_name} />

                    <Input type="select" label="Marca" register={register('brand_id')} error={errors.brand_id?.message} required defaultValue={guide.brand_id}>
                        <option value="">Selecciona una marca</option>
                        {(!brands || !brands.find(b => b.id === guide.brand_id)) && (
                            <option value={guide.brand_id}>Marca actual</option>
                        )}
                        {brands?.map((brand) => (
                            <option key={brand.id} value={brand.id}>{brand.name}</option>
                        ))}
                    </Input>

                    <Input label="Modelo" register={register('model')} error={errors.model?.message} required defaultValue={guide.model} />

                    <Input type="textarea" label="Descripción Breve" register={register('brief_description')} error={errors.brief_description?.message} rows={3} required defaultValue={guide.brief_description} />

                    <FileUpload label="Imágenes del Electrodoméstico" onUrlsChange={setImageUrls} existingUrls={imageUrls} accept="image/*" maxFiles={10} maxSize={5} basePath="appliance-guides" />

                    <FileUpload label="PDF del Manual" onUrlsChange={setPdfUrls} existingUrls={pdfUrls} accept=".pdf" maxFiles={1} maxSize={10} basePath="appliance-guides/manuals" />

                    <FileUpload label="Video Tutorial" onUrlsChange={setVideoUrls} existingUrls={videoUrls} accept="video/*" maxFiles={1} maxSize={50} basePath="appliance-guides/videos" />

                    <Input type="textarea" label="Puntos de Uso Rápido" register={register('quick_use_bullets')} error={errors.quick_use_bullets?.message} rows={3} required defaultValue={guide.quick_use_bullets} />

                    <Input type="textarea" label="Puntos de Mantenimiento" register={register('maintenance_bullets')} error={errors.maintenance_bullets?.message} rows={3} required defaultValue={guide.maintenance_bullets} />

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
