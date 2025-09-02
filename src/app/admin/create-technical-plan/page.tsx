'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Home, CreateTechnicalPlan, TechnicalPlan } from '@/lib/types';
import { Input } from '@/components/ui/Input';
import { FileUpload } from '@/components/ui/FileUpload';
import { useApiData } from '@/hooks/useApiData';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { EditTechnicalPlanForm } from '@/components/ui/EditTechnicalPlanForm';
import { DeleteTechnicalPlanConfirmation } from '@/components/ui/DeleteTechnicalPlanConfirmation';

const createTechnicalPlanSchema = z.object({
    home_id: z.string().min(1, 'Debes seleccionar una casa'),
    title: z.string().min(1, 'El título es requerido'),
    description: z.string().min(1, 'La descripción es requerida'),
});

type CreateTechnicalPlanFormData = z.infer<typeof createTechnicalPlanSchema>;

export default function CreateTechnicalPlanPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [planUrls, setPlanUrls] = useState<string[]>([]);

    const { data: homes } = useApiData<Home>('homes');

    const apiClient = useMemo(() => createApiClient(config.apiUrl), []);

    // Listado y paginación
    const [plans, setPlans] = useState<TechnicalPlan[]>([]);
    const [meta, setMeta] = useState<{ page: number; pageSize: number; total: number; totalPages: number } | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Edición / Eliminación
    const [editingPlan, setEditingPlan] = useState<TechnicalPlan | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [deletingPlan, setDeletingPlan] = useState<TechnicalPlan | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateTechnicalPlanFormData>({
        resolver: zodResolver(createTechnicalPlanSchema),
    });

    const loadPlans = useMemo(() => (
        async () => {
            try {
                setIsLoading(true);
                setError(null);
                const res = await apiClient.listTechnicalPlans({ page: currentPage, pageSize });
                if (res.success) {
                    setPlans(res.data);
                    setMeta(res.meta);
                } else {
                    setError('Error al cargar planos');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error desconocido');
            } finally {
                setIsLoading(false);
            }
        }
    ), [apiClient, currentPage, pageSize]);

    useEffect(() => { loadPlans(); }, [loadPlans]);

    const onSubmit = async (data: CreateTechnicalPlanFormData) => {
        setIsSubmitting(true);
        setSubmitMessage(null);
        try {
            const apiData: CreateTechnicalPlan = {
                home_id: data.home_id,
                title: data.title,
                description: data.description,
                plan_file_url: planUrls[0] || undefined,
            };
            const response = await apiClient.createTechnicalPlan(apiData);
            if (response.success) {
                setSubmitMessage({ type: 'success', message: 'Plano técnico creado exitosamente!' });
                reset();
                setPlanUrls([]);
                setCurrentPage(1);
                loadPlans();
            } else {
                setSubmitMessage({ type: 'error', message: 'Error al crear el plano técnico en el servidor' });
            }
        } catch (error) {
            console.error('Error al crear plano técnico:', error);
            setSubmitMessage({ type: 'error', message: error instanceof Error ? error.message : 'Error de conexión' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const columns: ColumnDef<TechnicalPlan>[] = [
        {
            accessorKey: 'title',
            header: 'Título',
            size: 240,
            cell: ({ row }) => <div className="font-semibold text-gray-900 text-base line-clamp-2" title={row.getValue('title') as string}>{row.getValue('title') as string}</div>,
        },
        {
            accessorKey: 'description',
            header: 'Descripción',
            size: 300,
            cell: ({ row }) => <div className="text-gray-700 line-clamp-2" title={row.getValue('description') as string}>{row.getValue('description') as string}</div>,
        },
        {
            accessorKey: 'home_id',
            header: 'Casa',
            size: 160,
            cell: ({ row }) => {
                const id = row.getValue('home_id') as string;
                const name = homes.find(h => h.id === id)?.name || '—';
                return <div className="text-gray-700">{name}</div>;
            },
        },
        {
            id: 'actions',
            header: 'Acciones',
            size: 200,
            cell: ({ row }) => {
                const plan = row.original;
                return (
                    <div className="flex items-center space-x-2">
                        <button onClick={() => { setEditingPlan(plan); setIsEditing(true); }} className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100">Editar</button>
                        <button onClick={() => { setDeletingPlan(plan); setIsDeleting(true); }} className="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100">Eliminar</button>
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
                        <h1 className="text-2xl font-bold text-gray-900 mb-6">Crear Nuevo Plano Técnico</h1>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <Input type="select" label="Casa" register={register('home_id')} error={errors.home_id?.message} placeholder="Selecciona una casa" required>
                                {homes.map((home) => (<option key={home.id} value={home.id}>{home.name}</option>))}
                            </Input>

                            <Input label="Título del Plano" register={register('title')} error={errors.title?.message} placeholder="Ej: Plano de Instalación Eléctrica..." required />

                            <Input type="textarea" label="Descripción del Plano" register={register('description')} error={errors.description?.message} placeholder="Descripción detallada..." rows={3} required />

                            <FileUpload label="Archivo del Plano Técnico" onUrlsChange={setPlanUrls} accept=".pdf,.dwg,.jpg,.jpeg,.png" maxFiles={1} maxSize={10} basePath="technical-plans" />
                            <p className="mt-1 text-sm text-gray-500">Sube el archivo del plano técnico (PDF, DWG, imagen). Máximo 10MB.</p>

                            {submitMessage && (<div className={`p-4 rounded-md ${submitMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>{submitMessage.message}</div>)}

                            <div className="flex justify-end space-x-4">
                                <button type="button" onClick={() => reset()} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Limpiar</button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">{isSubmitting ? 'Creando...' : 'Crear Plano Técnico'}</button>
                            </div>
                        </form>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Planos técnicos existentes {meta ? `(${meta.total})` : ''}</h2>
                        <DataTable
                            data={plans}
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

                    {isEditing && editingPlan && (
                        <EditTechnicalPlanForm
                            plan={editingPlan}
                            onClose={() => { setIsEditing(false); setEditingPlan(null); }}
                            onSuccess={() => { setIsEditing(false); setEditingPlan(null); setCurrentPage(1); loadPlans(); }}
                        />
                    )}

                    {isDeleting && deletingPlan && (
                        <DeleteTechnicalPlanConfirmation
                            plan={deletingPlan}
                            onClose={() => { setIsDeleting(false); setDeletingPlan(null); }}
                            onSuccess={() => { setIsDeleting(false); setDeletingPlan(null); setCurrentPage(1); loadPlans(); }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
