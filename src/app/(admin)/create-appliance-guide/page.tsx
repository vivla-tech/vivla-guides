'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ApplianceGuide, Brand, CreateApplianceGuide } from '@/lib/types';
import { Input } from '@/components/ui/Input';
import { FileUpload } from '@/components/ui/FileUpload';
import { useApiData } from '@/hooks/useApiData';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';

// Esquema de validación para crear una guía de electrodomésticos
const createApplianceGuideSchema = z.object({
    equipment_name: z.string().min(1, 'El nombre del equipo es requerido'),
    brand_id: z.string().min(1, 'Debes seleccionar una marca'),
    model: z.string().min(1, 'El modelo es requerido'),
    brief_description: z.string().min(1, 'La descripción breve es requerida'),
    // Removemos image_urls, pdf_url y video_url del esquema ya que se manejarán con FileUpload
    quick_use_bullets: z.string().min(1, 'Los puntos de uso rápido son requeridos'),
    maintenance_bullets: z.string().min(1, 'Los puntos de mantenimiento son requeridos'),
});

type CreateApplianceGuideFormData = z.infer<typeof createApplianceGuideSchema>;

export default function CreateApplianceGuidePage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [imageUrls, setImageUrls] = useState<string[]>([]); // Nuevo estado para las URLs de imagen
    const [pdfUrls, setPdfUrls] = useState<string[]>([]); // Nuevo estado para las URLs de PDF
    const [videoUrls, setVideoUrls] = useState<string[]>([]); // Nuevo estado para las URLs de video

    const { data: brands, isLoading: isLoadingBrands, error: brandsError } = useApiData<Brand>('brands');

    const apiClient = createApiClient(config.apiUrl);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<CreateApplianceGuideFormData>({
        resolver: zodResolver(createApplianceGuideSchema),
    });

    const onSubmit = async (data: CreateApplianceGuideFormData) => {
        setIsSubmitting(true);
        setSubmitMessage(null);

        try {
            // Preparar datos para la API
            const apiData: CreateApplianceGuide = {
                equipment_name: data.equipment_name,
                brand_id: data.brand_id,
                model: data.model,
                brief_description: data.brief_description,
                image_urls: imageUrls, // Usar las URLs de las imágenes subidas
                pdf_url: pdfUrls.length > 0 ? pdfUrls[0] : undefined, // Usar la primera URL del PDF subido
                video_url: videoUrls.length > 0 ? videoUrls[0] : undefined, // Usar la primera URL del video subido
                quick_use_bullets: data.quick_use_bullets,
                maintenance_bullets: data.maintenance_bullets,
            };

            // Llamada real a la API
            const response = await apiClient.createApplianceGuide(apiData);

            if (response.success) {
                setSubmitMessage({
                    type: 'success',
                    message: 'Guía de electrodoméstico creada exitosamente!'
                });

                // Limpiar formulario
                reset();
                setImageUrls([]); // Limpiar URLs de imagen
                setPdfUrls([]); // Limpiar URLs de PDF
                setVideoUrls([]); // Limpiar URLs de video
            } else {
                setSubmitMessage({
                    type: 'error',
                    message: 'Error al crear la guía de electrodoméstico en el servidor'
                });
            }

        } catch (error) {
            console.error('Error al crear guía de electrodoméstico:', error);
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
                        Crear Nueva Guía de Electrodoméstico
                    </h1>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Nombre del equipo */}
                        <Input
                            label="Nombre del Equipo"
                            register={register('equipment_name')}
                            error={errors.equipment_name?.message}
                            placeholder="Ej: Lavadora Samsung, Nevera LG..."
                            required
                        />

                        {/* Marca */}
                        <Input
                            type="select"
                            label="Marca"
                            register={register('brand_id')}
                            error={errors.brand_id?.message}
                            placeholder="Selecciona una marca"
                            required
                        >
                            {brands.map((brand) => (
                                <option key={brand.id} value={brand.id}>
                                    {brand.name}
                                </option>
                            ))}
                        </Input>

                        {/* Modelo */}
                        <Input
                            label="Modelo"
                            register={register('model')}
                            error={errors.model?.message}
                            placeholder="Ej: WF-1000XM4, Galaxy S21..."
                            required
                        />

                        {/* Descripción breve */}
                        <Input
                            type="textarea"
                            label="Descripción Breve"
                            register={register('brief_description')}
                            error={errors.brief_description?.message}
                            placeholder="Descripción general del equipo y sus características principales..."
                            rows={3}
                            required
                        />

                        {/* URLs de imágenes */}
                        <FileUpload
                            label="Imágenes del Electrodoméstico"
                            onUrlsChange={setImageUrls}
                            accept="image/*"
                            maxFiles={10}
                            maxSize={5}
                            basePath="appliance-guides"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                            Imágenes del equipo, controles, pantallas, etc. Máximo 10 imágenes.
                        </p>

                        {/* Archivo PDF del manual */}
                        <FileUpload
                            label="PDF del Manual del Electrodoméstico"
                            onUrlsChange={setPdfUrls}
                            accept=".pdf"
                            maxFiles={1}
                            maxSize={10}
                            basePath="appliance-guides/manuals"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                            Sube el manual del electrodoméstico en formato PDF. Máximo 10MB.
                        </p>

                        {/* Archivo de video tutorial */}
                        <FileUpload
                            label="Video Tutorial del Electrodoméstico"
                            onUrlsChange={setVideoUrls}
                            accept="video/*"
                            maxFiles={1}
                            maxSize={50}
                            basePath="appliance-guides/videos"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                            Sube un video tutorial del electrodoméstico. Máximo 50MB.
                        </p>

                        {/* Puntos de uso rápido */}
                        <Input
                            type="textarea"
                            label="Puntos de Uso Rápido"
                            register={register('quick_use_bullets')}
                            error={errors.quick_use_bullets?.message}
                            placeholder="• Encender el equipo\n• Seleccionar programa\n• Iniciar ciclo..."
                            rows={3}
                            required
                        />
                        <p className="mt-1 text-sm text-gray-500">
                            Puntos clave para uso básico del equipo.
                        </p>

                        {/* Puntos de mantenimiento */}
                        <Input
                            type="textarea"
                            label="Puntos de Mantenimiento"
                            register={register('maintenance_bullets')}
                            error={errors.maintenance_bullets?.message}
                            placeholder="• Limpiar filtros mensualmente\n• Revisar conexiones\n• Calibrar sensores..."
                            rows={3}
                            required
                        />
                        <p className="mt-1 text-sm text-gray-500">
                            Tareas de mantenimiento, limpieza y cuidado del equipo.
                        </p>

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
                                {isSubmitting ? 'Creando...' : 'Crear Guía de Electrodoméstico'}
                            </button>
                        </div>
                    </form>




                </div>
            </div>
        </div>
    );
}
