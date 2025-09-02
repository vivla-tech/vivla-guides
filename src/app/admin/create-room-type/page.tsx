'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreateRoomType, RoomType } from '@/lib/types';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';
import { Input } from '@/components/ui/Input';
import { useApiData } from '@/hooks/useApiData';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { EditRoomTypeForm } from '@/components/ui/EditRoomTypeForm';
import { DeleteRoomTypeConfirmation } from '@/components/ui/DeleteRoomTypeConfirmation';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';

// Esquema de validación para crear un tipo de habitación
const createRoomTypeSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    description: z.string().min(1, 'La descripción es requerida'),
});

type CreateRoomTypeFormData = z.infer<typeof createRoomTypeSchema>;

export default function CreateRoomTypePage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Estados para paginación del servidor
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Estados para edición
    const [isEditing, setIsEditing] = useState(false);
    const [editingRoomType, setEditingRoomType] = useState<RoomType | null>(null);

    // Estados para eliminación
    const [isDeleting, setIsDeleting] = useState(false);
    const [deletingRoomType, setDeletingRoomType] = useState<RoomType | null>(null);

    const apiClient = createApiClient(config.apiUrl);

    // Cargar tipos de habitación existentes con paginación del servidor
    const roomTypesParams = useMemo(() => ({
        page: currentPage,
        pageSize: pageSize
    }), [currentPage, pageSize]);

    const { data: roomTypes, meta: roomTypesMeta, isLoading: isLoadingRoomTypes, error: roomTypesError } = useApiData<RoomType>('room-types', roomTypesParams);

    // Función para manejar la edición de un tipo de habitación
    const handleEditRoomType = (roomType: RoomType) => {
        setEditingRoomType(roomType);
        setIsEditing(true);
    };

    // Función para manejar la eliminación de un tipo de habitación
    const handleDeleteRoomType = (roomType: RoomType) => {
        setDeletingRoomType(roomType);
        setIsDeleting(true);
    };

    // Definir columnas para la tabla de tipos de habitación
    const columns: ColumnDef<RoomType>[] = [
        {
            accessorKey: 'name',
            header: 'Nombre',
            size: 200,
            cell: ({ row }) => (
                <div className="font-medium text-gray-900">
                    {row.getValue('name')}
                </div>
            ),
        },
        {
            accessorKey: 'description',
            header: 'Descripción',
            size: 400,
            cell: ({ row }) => (
                <div className="text-sm text-gray-600">
                    {row.getValue('description')}
                </div>
            ),
        },
        {
            id: 'actions',
            header: 'Acciones',
            size: 150,
            cell: ({ row }) => {
                const roomType = row.original;
                return (
                    <div className="flex space-x-2">
                        <button
                            onClick={() => handleEditRoomType(roomType)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            Editar
                        </button>
                        <button
                            onClick={() => handleDeleteRoomType(roomType)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                            Eliminar
                        </button>
                    </div>
                );
            },
        },
    ];

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CreateRoomTypeFormData>({
        resolver: zodResolver(createRoomTypeSchema),
    });

    const onSubmit = async (data: CreateRoomTypeFormData) => {
        setIsSubmitting(true);
        setSubmitMessage(null);

        try {
            const roomTypeData: CreateRoomType = {
                ...data,
            };

            const response = await apiClient.createRoomType(roomTypeData);

            if (response.success) {
                setSubmitMessage({
                    type: 'success',
                    message: 'Tipo de habitación creado exitosamente!'
                });
                reset();
                window.location.reload();
            } else {
                setSubmitMessage({
                    type: 'error',
                    message: response.message || 'Error al crear el tipo de habitación'
                });
            }
        } catch (error) {
            console.error('Error al crear tipo de habitación:', error);
            setSubmitMessage({
                type: 'error',
                message: 'Error al crear el tipo de habitación. Por favor, intenta de nuevo.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Volver al Panel de Administración
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Tipo de Habitación</h1>
                    <p className="text-gray-600 mt-2">Añade un nuevo tipo de habitación al sistema</p>
                </div>

                {/* Formulario */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Mensaje de éxito/error */}
                        {submitMessage && (
                            <div className={`p-4 rounded-md ${submitMessage.type === 'success'
                                    ? 'bg-green-50 border border-green-200 text-green-800'
                                    : 'bg-red-50 border border-red-200 text-red-800'
                                }`}>
                                {submitMessage.message}
                            </div>
                        )}

                        {/* Nombre */}
                        <Input
                            label="Nombre del Tipo de Habitación"
                            type="text"
                            {...register('name')}
                            error={errors.name?.message}
                            required
                        />

                        {/* Descripción */}
                        <Input
                            label="Descripción"
                            type="textarea"
                            {...register('description')}
                            error={errors.description?.message}
                            required
                        />

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
                <DataTable
                    title="Tipos de Habitación Existentes"
                    columns={columns}
                    data={roomTypes}
                    isLoading={isLoadingRoomTypes}
                    error={roomTypesError}
                    emptyMessage="No hay tipos de habitación creados aún."
                    serverSidePagination={true}
                    totalCount={roomTypesMeta?.total || 0}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                />

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
                                window.location.reload();
                            }}
                        />
                    )}
                </Modal>
            </div>
        </div>
    );
}
