'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreateSupplier, Supplier } from '@/lib/types';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';
import { Input } from '@/components/ui/Input';
import { useApiData } from '@/hooks/useApiData';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { EditSupplierForm } from '@/components/ui/EditSupplierForm';
import { DeleteSupplierConfirmation } from '@/components/ui/DeleteSupplierConfirmation';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';

// Esquema de validación para crear un proveedor
const createSupplierSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    contact_info: z.string().min(1, 'La información de contacto es requerida'),
});

type CreateSupplierFormData = z.infer<typeof createSupplierSchema>;

export default function CreateSupplierPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Estados para paginación del servidor
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Estados para edición
    const [isEditing, setIsEditing] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

    // Estados para eliminación
    const [isDeleting, setIsDeleting] = useState(false);
    const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);

    const apiClient = createApiClient(config.apiUrl);

    // Cargar proveedores existentes con paginación del servidor
    const suppliersParams = useMemo(() => ({
        page: currentPage,
        pageSize: pageSize
    }), [currentPage, pageSize]);

    const { data: suppliers, meta: suppliersMeta, isLoading: isLoadingSuppliers, error: suppliersError } = useApiData<Supplier>('suppliers', suppliersParams);

    // Función para manejar la edición de un proveedor
    const handleEditSupplier = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setIsEditing(true);
    };

    // Función para manejar la eliminación de un proveedor
    const handleDeleteSupplier = (supplier: Supplier) => {
        setDeletingSupplier(supplier);
        setIsDeleting(true);
    };

    // Definir columnas para la tabla de proveedores
    const columns: ColumnDef<Supplier>[] = [
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
            accessorKey: 'contact_info',
            header: 'Información de Contacto',
            size: 400,
            cell: ({ row }) => (
                <div className="text-sm text-gray-600">
                    {row.getValue('contact_info')}
                </div>
            ),
        },
        {
            id: 'actions',
            header: 'Acciones',
            size: 150,
            cell: ({ row }) => {
                const supplier = row.original;
                return (
                    <div className="flex space-x-2">
                        <button
                            onClick={() => handleEditSupplier(supplier)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            Editar
                        </button>
                        <button
                            onClick={() => handleDeleteSupplier(supplier)}
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
    } = useForm<CreateSupplierFormData>({
        resolver: zodResolver(createSupplierSchema),
    });

    const onSubmit = async (data: CreateSupplierFormData) => {
        setIsSubmitting(true);
        setSubmitMessage(null);

        try {
            const supplierData: CreateSupplier = {
                ...data,
            };

            const response = await apiClient.createSupplier(supplierData);

            if (response.success) {
                setSubmitMessage({
                    type: 'success',
                    message: 'Proveedor creado exitosamente!'
                });
                reset();
                window.location.reload();
            } else {
                setSubmitMessage({
                    type: 'error',
                    message: response.message || 'Error al crear el proveedor'
                });
            }
        } catch (error) {
            console.error('Error al crear proveedor:', error);
            setSubmitMessage({
                type: 'error',
                message: 'Error al crear el proveedor. Por favor, intenta de nuevo.'
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
                    <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Proveedor</h1>
                    <p className="text-gray-600 mt-2">Añade un nuevo proveedor al sistema</p>
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
                            label="Nombre del Proveedor"
                            type="text"
                            {...register('name')}
                            error={errors.name?.message}
                            required
                        />

                        {/* Información de Contacto */}
                        <Input
                            label="Información de Contacto"
                            type="textarea"
                            {...register('contact_info')}
                            error={errors.contact_info?.message}
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
                                {isSubmitting ? 'Creando...' : 'Crear Proveedor'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Tabla de proveedores existentes */}
                <DataTable
                    title="Proveedores Existentes"
                    columns={columns}
                    data={suppliers}
                    isLoading={isLoadingSuppliers}
                    error={suppliersError}
                    emptyMessage="No hay proveedores creados aún."
                    serverSidePagination={true}
                    totalCount={suppliersMeta?.total || 0}
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
                        setEditingSupplier(null);
                    }}
                    title="Editar Proveedor"
                >
                    {editingSupplier && (
                        <EditSupplierForm
                            supplier={editingSupplier}
                            onClose={() => {
                                setIsEditing(false);
                                setEditingSupplier(null);
                            }}
                            onSuccess={() => {
                                setIsEditing(false);
                                setEditingSupplier(null);
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
                        setDeletingSupplier(null);
                    }}
                    title="Confirmar Eliminación"
                >
                    {deletingSupplier && (
                        <DeleteSupplierConfirmation
                            supplier={deletingSupplier}
                            onClose={() => {
                                setIsDeleting(false);
                                setDeletingSupplier(null);
                            }}
                            onSuccess={() => {
                                setIsDeleting(false);
                                setDeletingSupplier(null);
                                window.location.reload();
                            }}
                        />
                    )}
                </Modal>
            </div>
        </div>
    );
}
