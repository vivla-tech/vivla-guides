'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ApplianceGuide, Brand, CreateApplianceGuide, Home } from '@/lib/types';
import { Input } from '@/components/ui/Input';
import { FileUpload } from '@/components/ui/FileUpload';
import { useApiData } from '@/hooks/useApiData';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { EditApplianceGuideForm } from '@/components/ui/EditApplianceGuideForm';
import { DeleteApplianceGuideConfirmation } from '@/components/ui/DeleteApplianceGuideConfirmation';


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
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [pdfUrls, setPdfUrls] = useState<string[]>([]);
    const [videoUrls, setVideoUrls] = useState<string[]>([]);

    const { data: brands } = useApiData<Brand>('brands');
    const { data: homes } = useApiData<Home>('homes', { page: 1, pageSize: 100 });

    const apiClient = useMemo(() => createApiClient(config.apiUrl), []);

    // Listado y paginación
    const [guides, setGuides] = useState<ApplianceGuide[]>([]);
    const [meta, setMeta] = useState<{ page: number; pageSize: number; total: number; totalPages: number } | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Edición / Eliminación
    const [editingGuide, setEditingGuide] = useState<ApplianceGuide | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [deletingGuide, setDeletingGuide] = useState<ApplianceGuide | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedHomeByGuide, setSelectedHomeByGuide] = useState<Record<string, string>>({});

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<CreateApplianceGuideFormData>({
        resolver: zodResolver(createApplianceGuideSchema),
    });

    const loadGuides = useMemo(() => (
        async () => {
            try {
                setIsLoading(true);
                setError(null);
                const res = await apiClient.listApplianceGuides({ page: currentPage, pageSize });
                if (res.success) {
                    setGuides(res.data);
                    setMeta(res.meta);
                } else {
                    setError('Error al cargar guías');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error desconocido');
            } finally {
                setIsLoading(false);
            }
        }
    ), [apiClient, currentPage, pageSize]);

    useEffect(() => { loadGuides(); }, [loadGuides]);

    const onSubmit = async (data: CreateApplianceGuideFormData) => {
        setIsSubmitting(true);
        setSubmitMessage(null);

        try {
            const apiData: CreateApplianceGuide = {
                equipment_name: data.equipment_name,
                brand_id: data.brand_id,
                model: data.model,
                brief_description: data.brief_description,
                image_urls: imageUrls,
                pdf_url: pdfUrls.length > 0 ? pdfUrls[0] : undefined,
                video_url: videoUrls.length > 0 ? videoUrls[0] : undefined,
                quick_use_bullets: data.quick_use_bullets,
                maintenance_bullets: data.maintenance_bullets,
            };

            const response = await apiClient.createApplianceGuide(apiData);

            if (response.success) {
                setSubmitMessage({ type: 'success', message: 'Guía de electrodoméstico creada exitosamente!' });
                reset();
                setImageUrls([]);
                setPdfUrls([]);
                setVideoUrls([]);
                setCurrentPage(1);
                loadGuides();
            } else {
                setSubmitMessage({ type: 'error', message: 'Error al crear la guía de electrodoméstico en el servidor' });
            }
        } catch (error) {
            console.error('Error al crear guía de electrodoméstico:', error);
            setSubmitMessage({ type: 'error', message: error instanceof Error ? error.message : 'Error de conexión con el servidor' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const columns: ColumnDef<ApplianceGuide>[] = [
        {
            id: 'thumbnail',
            header: 'Imagen',
            size: 100,
            cell: ({ row }) => {
                const g = row.original as ApplianceGuide;
                const url = g.image_urls && g.image_urls[0];
                return url ? (
                    <div className="flex items-center justify-center">
                        <img src={url} alt="ref" className="w-16 h-16 object-cover rounded-lg shadow-sm" />
                    </div>
                ) : (
                    <div className="flex items-center justify-center">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400 text-xs">Sin imagen</span>
                        </div>
                    </div>
                );
            },
        },
        {
            id: 'link_home',
            header: 'Vincular a casa',
            size: 260,
            cell: ({ row }) => {
                const guide = row.original;
                const sel = selectedHomeByGuide[guide.id] || '';
                return (
                    <div className="flex items-center gap-2">
                        <select
                            className="border border-gray-300 rounded-md px-2 py-1 text-sm text-gray-700"
                            value={sel}
                            onChange={(e) => setSelectedHomeByGuide((prev) => ({ ...prev, [guide.id]: e.target.value }))}
                        >
                            <option value="">Selecciona casa</option>
                            {homes.map((h) => (
                                <option key={h.id} value={h.id}>{h.name}</option>
                            ))}
                        </select>
                        <button
                            className="px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            disabled={!sel}
                            onClick={async () => {
                                try {
                                    await apiClient.linkApplianceGuide(sel, guide.id);
                                    alert('Guía vinculada a la casa');
                                } catch (e) {
                                    alert('Error al vincular');
                                }
                            }}
                        >
                            Enlazar
                        </button>
                        <button
                            className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300 rounded hover:bg-gray-200"
                            onClick={async () => {
                                try {
                                    if (!sel) return alert('Selecciona casa para desvincular');
                                    await apiClient.unlinkApplianceGuide(sel, guide.id);
                                    alert('Guía desvinculada de la casa');
                                } catch (e) {
                                    alert('Error al desvincular');
                                }
                            }}
                        >
                            Desvincular
                        </button>
                    </div>
                );
            },
        },
        {
            accessorKey: 'equipment_name',
            header: 'Equipo',
            size: 220,
            cell: ({ row }) => (
                <div className="font-semibold text-gray-900 text-base line-clamp-2" title={row.getValue('equipment_name') as string}>
                    {row.getValue('equipment_name') as string}
                </div>
            ),
        },
        {
            accessorKey: 'model',
            header: 'Modelo',
            size: 150,
            cell: ({ row }) => <div className="text-gray-700">{row.getValue('model') as string}</div>,
        },
        {
            accessorKey: 'brand_id',
            header: 'Marca',
            size: 160,
            cell: ({ row }) => {
                const brandId = row.getValue('brand_id') as string;
                const brand = brands.find(b => b.id === brandId)?.name || '—';
                return <div className="text-gray-700">{brand}</div>;
            },
        },
        {
            id: 'actions',
            header: 'Acciones',
            size: 200,
            cell: ({ row }) => {
                const guide = row.original;
                return (
                    <div className="flex items-center space-x-2">
                        <button onClick={() => { setEditingGuide(guide); setIsEditing(true); }} className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100">Editar</button>
                        <button onClick={() => { setDeletingGuide(guide); setIsDeleting(true); }} className="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100">Eliminar</button>
                    </div>
                );
            },
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="space-y-8">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h1 className="text-2xl font-bold text-gray-900 mb-6">Crear Nueva Guía de Electrodoméstico</h1>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <Input label="Nombre del Equipo" register={register('equipment_name')} error={errors.equipment_name?.message} placeholder="Ej: Lavadora Samsung, Nevera LG..." required />

                            <Input type="select" label="Marca" register={register('brand_id')} error={errors.brand_id?.message} placeholder="Selecciona una marca" required>
                                {brands.map((brand) => (
                                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                                ))}
                            </Input>

                            <Input label="Modelo" register={register('model')} error={errors.model?.message} placeholder="Ej: WF-1000XM4, Galaxy S21..." required />

                            <Input type="textarea" label="Descripción Breve" register={register('brief_description')} error={errors.brief_description?.message} placeholder="Descripción general del equipo..." rows={3} required />

                            <FileUpload label="Imágenes del Electrodoméstico" onUrlsChange={setImageUrls} accept="image/*" maxFiles={10} maxSize={5} basePath="appliance-guides" />
                            <p className="mt-1 text-sm text-gray-500">Imágenes del equipo, controles, pantallas, etc. Máximo 10 imágenes.</p>

                            <FileUpload label="PDF del Manual" onUrlsChange={setPdfUrls} accept=".pdf" maxFiles={1} maxSize={10} basePath="appliance-guides/manuals" />
                            <p className="mt-1 text-sm text-gray-500">Manual en PDF. Máximo 10MB.</p>

                            <FileUpload label="Video Tutorial" onUrlsChange={setVideoUrls} accept="video/*" maxFiles={1} maxSize={50} basePath="appliance-guides/videos" />
                            <p className="mt-1 text-sm text-gray-500">Video tutorial. Máximo 50MB.</p>

                            <Input type="textarea" label="Puntos de Uso Rápido" register={register('quick_use_bullets')} error={errors.quick_use_bullets?.message} placeholder="• Encender..." rows={3} required />
                            <Input type="textarea" label="Puntos de Mantenimiento" register={register('maintenance_bullets')} error={errors.maintenance_bullets?.message} placeholder="• Limpiar filtros..." rows={3} required />

                            {submitMessage && (
                                <div className={`p-4 rounded-md ${submitMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>{submitMessage.message}</div>
                            )}

                            <div className="flex justify-end space-x-4">
                                <button type="button" onClick={() => reset()} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Limpiar</button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">{isSubmitting ? 'Creando...' : 'Crear Guía de Electrodoméstico'}</button>
                            </div>
                        </form>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Guías de electrodomésticos existentes {meta ? `(${meta.total})` : ''}</h2>
                        <DataTable
                            data={guides}
                            columns={columns}
                            totalCount={meta ? meta.total : 0}
                            currentPage={currentPage}
                            pageSize={pageSize}
                            onPageChange={(p) => setCurrentPage(Math.max(1, p))}
                            onPageSizeChange={(sz) => { setPageSize(sz); setCurrentPage(1); }}
                            serverSidePagination={true}
                            isLoading={isLoading}
                            error={error}
                            useContainer={false}
                        />
                    </div>

                    {isEditing && editingGuide && (
                        <EditApplianceGuideForm
                            guide={editingGuide}
                            onClose={() => { setIsEditing(false); setEditingGuide(null); }}
                            onSuccess={() => { setIsEditing(false); setEditingGuide(null); setCurrentPage(1); loadGuides(); }}
                        />
                    )}

                    {isDeleting && deletingGuide && (
                        <DeleteApplianceGuideConfirmation
                            guide={deletingGuide}
                            onClose={() => { setIsDeleting(false); setDeletingGuide(null); }}
                            onSuccess={() => { setIsDeleting(false); setDeletingGuide(null); setCurrentPage(1); loadGuides(); }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
