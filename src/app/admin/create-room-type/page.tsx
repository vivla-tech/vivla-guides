'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreateRoomType, RoomType } from '@/lib/types';
import { Input } from '@/components/ui/Input';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { EditRoomTypeForm } from '@/components/ui/EditRoomTypeForm';
import { DeleteRoomTypeConfirmation } from '@/components/ui/DeleteRoomTypeConfirmation';
import { ColumnDef } from '@tanstack/react-table';
import { useApiData } from '@/hooks/useApiData';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';

// Esquema de validación para crear un tipo de habitación
const createRoomTypeSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
});

type CreateRoomTypeFormData = z.infer<typeof createRoomTypeSchema>;

export default function CreateRoomTypePage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Estados para paginación del servidor
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    // Estados para edición
    const [isEditing, setIsEditing] = useState(false);
    const [editingRoomType, setEditingRoomType] = useState<RoomType | null>(null);

    // Estados para eliminación
    const [isDeleting, setIsDeleting] = useState(false);
    const [deletingRoomType, setDeletingRoomType] = useState<RoomType | null>(null);

    const apiClient = createApiClient(config.apiUrl);

    // Funciones para manejar edición y eliminación
    const handleEditRoomType = (roomType: RoomType) => {
        setEditingRoomType(roomType);
        setIsEditing(true);
    };

    const handleDeleteRoomType = (roomType: RoomType) => {
        setDeletingRoomType(roomType);
        setIsDeleting(true);
    };

    // Definir columnas para la tabla de tipos de habitación
    const columns: ColumnDef<RoomType>[] = [
        {
            accessorKey: 'name',
            header: 'Nombre',
            size: 300,
            cell: ({ row }) => (
                <div className="font-semibold text-gray-900 text-base">
                    {row.getValue('name')}
                </div>
            ),
        },
        {
            accessorKey: 'id',
            header: 'ID',
            size: 200,
            cell: ({ row }) => (
                <div className="text-xs text-gray-500 font-mono">
                    {row.getValue('id')}
                </div>
            ),
        },
        {
            id: 'actions',
            header: 'Acciones',
            size: 200,
            cell: ({ row }) => {
                const roomType = row.original;
                return (
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => handleEditRoomType(roomType)}
                            className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Editar
                        </button>
                        <button
                            onClick={() => handleDeleteRoomType(roomType)}
                            className="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            Eliminar
                        </button>
                    </div>
                );
            },
        },
    ];

    // Cargar tipos de habitación con paginación del servidor
    const roomTypesParams = useMemo(() => ({
        page: currentPage,
        pageSize: pageSize
    }), [currentPage, pageSize]);

    const { data: roomTypes, meta: roomTypesMeta, isLoading: isLoadingRoomTypes, error: roomTypesError } = useApiData<RoomType>('rooms-type', roomTypesParams);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<CreateRoomTypeFormData>({
        resolver: zodResolver(createRoomTypeSchema),
    });

    const onSubmit = async (data: CreateRoomTypeFormData) => {
        setIsSubmitting(true);
        setSubmitMessage(null);

        try {
            const apiData: CreateRoomType = {
                name: data.name,
            };

            const response = await apiClient.createRoomType(apiData);

            if (response.success) {
                setSubmitMessage({
                    type: 'success',
                    message: 'Tipo de habitación creado exitosamente!'
                });

                // Limpiar formulario
                reset();
            } else {
                setSubmitMessage({
                    type: 'error',
                    message: 'Error al crear el tipo de habitación en el servidor'
                });
            }
        } catch (error) {
            console.error('Error al crear tipo de habitación:', error);
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
            <div className="max-w-7xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">
                        Crear Nuevo Tipo de Habitación
                    </h1>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Nombre del tipo de habitación */}
                        <Input
                            label="Nombre del Tipo"
                            register={register('name')}
                            error={errors.name?.message}
                            placeholder="Ej: Dormitorio, Cocina, Baño, Salón..."
                            required
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
                                {isSubmitting ? 'Creando...' : 'Crear Tipo de Habitación'}
                            </button>
                        </div>
                    </form>

                </div>

                {/* Tabla de tipos de habitación existentes */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <DataTable
                        title="Tipos de Habitación Existentes"
                        columns={columns}
                        data={roomTypes}
                        isLoading={isLoadingRoomTypes}
                        error={roomTypesError}
                        emptyMessage="No hay tipos de habitación creados aún."
                        // Paginación del servidor
                        serverSidePagination={true}
                        totalCount={roomTypesMeta?.total || 0}
                        currentPage={currentPage}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                        useContainer={false}
                    />
                </div>

                {/* Modal de edición */}
                <Modal
                    isOpen={isEditing}
                    onClose={() => {
                        setIsEditing(false);
                        setEditingRoomType(null);
                    }}
                    title="Editar Tipo de Habitación"
                >
                    {editingRoomType && (
                        <EditRoomTypeForm
                            roomType={editingRoomType}
                            onClose={() => {
                                setIsEditing(false);
                                setEditingRoomType(null);
                            }}
                            onSuccess={() => {
                                setIsEditing(false);
                                setEditingRoomType(null);
                                // Recargar datos
                                window.location.reload();
                            }}
                        />
                    )}
                </Modal>

                {/* Modal de eliminación */}
                <Modal
                    isOpen={isDeleting}
                    onClose={() => {
                        setIsDeleting(false);
                        setDeletingRoomType(null);
                    }}
                    title="Confirmar Eliminación"
                >
                    {deletingRoomType && (
                        <DeleteRoomTypeConfirmation
                            roomType={deletingRoomType}
                            onClose={() => {
                                setIsDeleting(false);
                                setDeletingRoomType(null);
                            }}
                            onSuccess={() => {
                                setIsDeleting(false);
                                setDeletingRoomType(null);
                                // Recargar datos
                                window.location.reload();
                            }}
                        />
                    )}
                </Modal>
            </div>
        </div>
    );
}
