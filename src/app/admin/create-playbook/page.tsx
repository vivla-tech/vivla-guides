'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreatePlaybook, Playbook, Room } from '@/lib/types';
import { Input } from '@/components/ui/Input';
import { useApiData } from '@/hooks/useApiData';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { EditPlaybookForm } from '@/components/ui/EditPlaybookForm';
import { DeletePlaybookConfirmation } from '@/components/ui/DeletePlaybookConfirmation';



// Esquema de validación para crear un playbook
const createPlaybookSchema = z.object({
    room_id: z.string().min(1, 'Debes seleccionar una habitación'),
    type: z.string().min(1, 'El tipo de procedimiento es requerido'),
    title: z.string().min(1, 'El título es requerido'),
    estimated_time: z.string().min(1, 'El tiempo estimado es requerido'),
    tasks: z.string().min(1, 'Las tareas son requeridas'),
    materials: z.string().min(1, 'Los materiales son requeridos'),
});

type CreatePlaybookFormData = z.infer<typeof createPlaybookSchema>;

export default function CreatePlaybookPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const { data: rooms } = useApiData<Room>('rooms', { page: 1, pageSize: 100 });

    const apiClient = useMemo(() => createApiClient(config.apiUrl), []);

    // Listado y paginación
    const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
    const [meta, setMeta] = useState<{ page: number; pageSize: number; total: number; totalPages: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Estados edición/eliminación
    const [editingPlaybook, setEditingPlaybook] = useState<Playbook | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [deletingPlaybook, setDeletingPlaybook] = useState<Playbook | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<CreatePlaybookFormData>({
        resolver: zodResolver(createPlaybookSchema),
    });

    const loadPlaybooks = useMemo(() => (
        async () => {
            try {
                setIsLoading(true);
                setError(null);
                const res = await apiClient.listPlaybooks({ page: currentPage, pageSize });
                if (res.success) {
                    setPlaybooks(res.data);
                    setMeta(res.meta);
                } else {
                    setError('Error al cargar playbooks');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error desconocido');
            } finally {
                setIsLoading(false);
            }
        }
    ), [apiClient, currentPage, pageSize]);

    useEffect(() => { loadPlaybooks(); }, [loadPlaybooks]);

    const onSubmit = async (data: CreatePlaybookFormData) => {
        setIsSubmitting(true);
        setSubmitMessage(null);

        try {
            const apiData: CreatePlaybook = {
                room_id: data.room_id,
                type: data.type,
                title: data.title,
                estimated_time: data.estimated_time,
                tasks: data.tasks,
                materials: data.materials,
            };

            const response = await apiClient.createPlaybook(apiData);

            if (response.success) {
                setSubmitMessage({ type: 'success', message: 'Playbook creado exitosamente!' });
                reset();
                setCurrentPage(1);
                loadPlaybooks();
            } else {
                setSubmitMessage({ type: 'error', message: 'Error al crear el playbook en el servidor' });
            }
        } catch (error) {
            console.error('Error al crear playbook:', error);
            setSubmitMessage({ type: 'error', message: error instanceof Error ? error.message : 'Error de conexión con el servidor' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const columns: ColumnDef<Playbook>[] = [
        {
            accessorKey: 'title',
            header: 'Título',
            size: 260,
            cell: ({ row }) => (
                <div className="font-semibold text-gray-900 text-base line-clamp-2" title={row.getValue('title') as string}>
                    {row.getValue('title') as string}
                </div>
            ),
        },
        {
            accessorKey: 'type',
            header: 'Tipo',
            size: 140,
            cell: ({ row }) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {row.getValue('type') as string}
                </span>
            ),
        },
        {
            accessorKey: 'estimated_time',
            header: 'Tiempo',
            size: 120,
            cell: ({ row }) => (
                <div className="text-gray-700">{row.getValue('estimated_time') as string}</div>
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
                const pb = row.original;
                return (
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => { setEditingPlaybook(pb); setIsEditing(true); }}
                            className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Editar
                        </button>
                        <button
                            onClick={() => { setDeletingPlaybook(pb); setIsDeleting(true); }}
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
                    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                        <h1 className="text-2xl font-bold text-gray-900 mb-6">Crear Nuevo Playbook</h1>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input type="select" label="Habitación" register={register('room_id')} error={errors.room_id?.message} placeholder="Selecciona una habitación" required>
                                    {rooms.map((room) => (
                                        <option key={room.id} value={room.id}>{room.name}</option>
                                    ))}
                                </Input>

                                <Input type="select" label="Tipo de Procedimiento" register={register('type')} error={errors.type?.message} placeholder="Selecciona un tipo" required>
                                    <option value="limpieza">Limpieza</option>
                                    <option value="mantenimiento">Mantenimiento</option>
                                    <option value="decoracion">Decoración</option>
                                    <option value="reparacion">Reparación</option>
                                    <option value="instalacion">Instalación</option>
                                    <option value="revision">Revisión</option>
                                    <option value="preparacion">Preparación</option>
                                    <option value="organizacion">Organización</option>
                                </Input>

                                <Input label="Título del Procedimiento" register={register('title')} error={errors.title?.message} placeholder="Ej: Limpieza de cocina, Mantenimiento de calefacción..." required />

                                <Input type="select" label="Tiempo Estimado" register={register('estimated_time')} error={errors.estimated_time?.message} placeholder="Selecciona el tiempo estimado" required>
                                    <option value="15 min">15 minutos</option>
                                    <option value="30 min">30 minutos</option>
                                    <option value="1 hora">1 hora</option>
                                    <option value="2 horas">2 horas</option>
                                    <option value="4 horas">4 horas</option>
                                    <option value="1 día">1 día</option>
                                    <option value="2-3 días">2-3 días</option>
                                    <option value="1 semana">1 semana</option>
                                </Input>
                            </div>

                            <div className="space-y-6">
                                <Input type="textarea" label="Tareas a Realizar" register={register('tasks')} error={errors.tasks?.message} placeholder="1. Preparar materiales necesarios\n2. Limpiar superficie\n3. Aplicar producto\n4. Secar y verificar..." rows={3} required />
                                <p className="mt-1 text-sm text-gray-500">Describe cada tarea en una línea separada o en párrafos organizados.</p>

                                <Input type="textarea" label="Materiales Necesarios" register={register('materials')} error={errors.materials?.message} placeholder="• Producto de limpieza\n• Trapos o paños\n• Guantes\n• Herramientas específicas..." rows={3} required />
                            </div>

                            {submitMessage && (
                                <div className={`p-4 rounded-md ${submitMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                                    {submitMessage.message}
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row justify-end gap-4">
                                <button type="button" onClick={() => reset()} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Limpiar</button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed">{isSubmitting ? 'Creando...' : 'Crear Playbook'}</button>
                            </div>
                        </form>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Playbooks existentes {meta ? `(${meta.total})` : ''}</h2>
                        <div className="overflow-x-auto">
                            <DataTable
                                data={playbooks}
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
                    </div>

                    {isEditing && editingPlaybook && (
                        <EditPlaybookForm
                            playbook={editingPlaybook}
                            onClose={() => { setIsEditing(false); setEditingPlaybook(null); }}
                            onSuccess={() => { setIsEditing(false); setEditingPlaybook(null); setCurrentPage(1); loadPlaybooks(); }}
                        />
                    )}

                    {isDeleting && deletingPlaybook && (
                        <DeletePlaybookConfirmation
                            playbook={deletingPlaybook}
                            onClose={() => { setIsDeleting(false); setDeletingPlaybook(null); }}
                            onSuccess={() => { setIsDeleting(false); setDeletingPlaybook(null); setCurrentPage(1); loadPlaybooks(); }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
