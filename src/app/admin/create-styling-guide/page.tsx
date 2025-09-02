'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreateStylingGuide, Room, StylingGuide } from '@/lib/types';
import { Input } from '@/components/ui/Input';
import { FileUpload } from '@/components/ui/FileUpload';
import { useApiData } from '@/hooks/useApiData';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { EditStylingGuideForm } from '@/components/ui/EditStylingGuideForm';
import { DeleteStylingGuideConfirmation } from '@/components/ui/DeleteStylingGuideConfirmation';

// Esquema de validación para crear una guía de estilo
const createStylingGuideSchema = z.object({
    room_id: z.string().min(1, 'Debes seleccionar una habitación'),
    title: z.string().min(1, 'El título es requerido'),
});

type CreateStylingGuideFormData = z.infer<typeof createStylingGuideSchema>;

export default function CreateStylingGuidePage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [imageUrls, setImageUrls] = useState<string[]>([]);

    const { data: rooms } = useApiData<Room>('rooms', { page: 1, pageSize: 100 });

    const apiClient = useMemo(() => createApiClient(config.apiUrl), []);

    // Estado listado + paginación
    const [guides, setGuides] = useState<StylingGuide[]>([]);
    const [meta, setMeta] = useState<{ page: number; pageSize: number; total: number; totalPages: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Estados edición/eliminación
    const [editingGuide, setEditingGuide] = useState<StylingGuide | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [deletingGuide, setDeletingGuide] = useState<StylingGuide | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<CreateStylingGuideFormData>({
        resolver: zodResolver(createStylingGuideSchema),
    });

    const loadGuides = useMemo(() => (
        async () => {
            try {
                setIsLoading(true);
                setError(null);
                const res = await apiClient.listStylingGuides({ page: currentPage, pageSize });
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

    useEffect(() => {
        loadGuides();
    }, [loadGuides]);

    const onSubmit = async (data: CreateStylingGuideFormData) => {
        setIsSubmitting(true);
        setSubmitMessage(null);

        try {
            const apiData: CreateStylingGuide = {
                room_id: data.room_id,
                title: data.title,
                image_urls: imageUrls,
            };

            const response = await apiClient.createStylingGuide(apiData);

            if (response.success) {
                setSubmitMessage({ type: 'success', message: 'Guía de estilo creada exitosamente!' });
                reset();
                setImageUrls([]);
                setCurrentPage(1);
                loadGuides();
            } else {
                setSubmitMessage({ type: 'error', message: 'Error al crear la guía de estilo en el servidor' });
            }
        } catch (error) {
            console.error('Error al crear guía de estilo:', error);
            setSubmitMessage({ type: 'error', message: error instanceof Error ? error.message : 'Error de conexión con el servidor' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const columns: ColumnDef<StylingGuide>[] = [
        {
            id: 'thumbnail',
            header: 'Imagen',
            size: 100,
            cell: ({ row }) => {
                const g = row.original as StylingGuide;
                const url = (g.image_urls && g.image_urls[0]) || g.reference_photo_url || '';
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
            accessorKey: 'title',
            header: 'Título',
            size: 240,
            cell: ({ row }) => (
                <div className="font-semibold text-gray-900 text-base line-clamp-2" title={row.getValue('title') as string}>
                    {row.getValue('title') as string}
                </div>
            ),
        },
        {
            accessorKey: 'room_id',
            header: 'Habitación',
            size: 160,
            cell: ({ row }) => {
                const id = row.getValue('room_id') as string;
                const roomName = rooms.find(r => r.id === id)?.name || '—';
                return <div className="text-gray-700">{roomName}</div>;
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
                        <button
                            onClick={() => { setEditingGuide(guide); setIsEditing(true); }}
                            className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Editar
                        </button>
                        <button
                            onClick={() => { setDeletingGuide(guide); setIsDeleting(true); }}
                            className="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            Eliminar
                        </button>
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
                        <h1 className="text-2xl font-bold text-gray-900 mb-6">Crear Nueva Guía de Estilo</h1>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <Input
                                type="select"
                                label="Habitación"
                                register={register('room_id')}
                                error={errors.room_id?.message}
                                placeholder="Selecciona una habitación"
                                required
                            >
                                {rooms.map((room) => (
                                    <option key={room.id} value={room.id}>
                                        {room.name}
                                    </option>
                                ))}
                            </Input>

                            <Input
                                label="Título de la Guía"
                                register={register('title')}
                                error={errors.title?.message}
                                placeholder="Ej: Estilo Nórdico, Decoración Minimalista, Estilo Industrial..."
                                required
                            />

                            <FileUpload
                                label="Imágenes de la Guía de Estilo"
                                onUrlsChange={setImageUrls}
                                accept="image/*"
                                maxFiles={10}
                                maxSize={5}
                                basePath="styling-guides"
                            />
                            <p className="mt-1 text-sm text-gray-500">Sube imágenes que muestren el estilo de la habitación. Máximo 10 imágenes.</p>

                            {submitMessage && (
                                <div className={`p-4 rounded-md ${submitMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                                    {submitMessage.message}
                                </div>
                            )}

                            <div className="flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={() => { reset(); setImageUrls([]); }}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                >
                                    Limpiar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Creando...' : 'Crear Guía de Estilo'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Guías de estilo existentes {meta ? `(${meta.total})` : ''}</h2>
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
                        <EditStylingGuideForm
                            guide={editingGuide}
                            onClose={() => { setIsEditing(false); setEditingGuide(null); }}
                            onSuccess={() => { setIsEditing(false); setEditingGuide(null); setCurrentPage(1); loadGuides(); }}
                        />
                    )}

                    {isDeleting && deletingGuide && (
                        <DeleteStylingGuideConfirmation
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
