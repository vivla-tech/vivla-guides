'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreateSupplier, Supplier } from '@/lib/types';
import { Input } from '@/components/ui/Input';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { EditSupplierForm } from '@/components/ui/EditSupplierForm';
import { DeleteSupplierConfirmation } from '@/components/ui/DeleteSupplierConfirmation';
import { ColumnDef } from '@tanstack/react-table';
import { useApiData } from '@/hooks/useApiData';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';

// Esquema de validación para crear un proveedor
const createSupplierSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    website: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
    contact_email: z.string().email('Debe ser un email válido'),
    phone: z.string().min(1, 'El teléfono es requerido'),
});

type CreateSupplierFormData = z.infer<typeof createSupplierSchema>;

export default function CreateSupplierPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Estados para paginación del servidor
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    // Estados para edición
    const [isEditing, setIsEditing] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

    // Estados para eliminación
    const [isDeleting, setIsDeleting] = useState(false);
    const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);

    const apiClient = createApiClient(config.apiUrl);

    // Funciones para manejar edición y eliminación
    const handleEditSupplier = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setIsEditing(true);
    };

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
                <div className="font-semibold text-gray-900 text-base">
                    {row.getValue('name')}
                </div>
            ),
        },
        {
            accessorKey: 'website',
            header: 'Sitio Web',
            size: 250,
            cell: ({ row }) => {
                const website = row.getValue('website') as string;
                return website ? (
                    <a
                        href={website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                        {website}
                    </a>
                ) : (
                    <span className="text-gray-400">No disponible</span>
                );
            },
        },
        {
            accessorKey: 'contact_email',
            header: 'Email',
            size: 200,
            cell: ({ row }) => (
                <div className="text-gray-700">
                    {row.getValue('contact_email')}
                </div>
            ),
        },
        {
            accessorKey: 'phone',
            header: 'Teléfono',
            size: 150,
            cell: ({ row }) => (
                <div className="text-gray-700">
                    {row.getValue('phone')}
                </div>
            ),
        },
        {
            id: 'actions',
            header: 'Acciones',
            size: 200,
            cell: ({ row }) => {
                const supplier = row.original;
                return (
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => handleEditSupplier(supplier)}
                            className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Editar
                        </button>
                        <button
                            onClick={() => handleDeleteSupplier(supplier)}
                            className="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            Eliminar
                        </button>
                    </div>
                );
            },
        },
    ];

    // Cargar proveedores con paginación del servidor
    const suppliersParams = useMemo(() => ({
        page: currentPage,
        pageSize: pageSize
    }), [currentPage, pageSize]);

    const { data: suppliers, meta: suppliersMeta, isLoading: isLoadingSuppliers, error: suppliersError } = useApiData<Supplier>('suppliers', suppliersParams);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<CreateSupplierFormData>({
        resolver: zodResolver(createSupplierSchema),
    });

    const onSubmit = async (data: CreateSupplierFormData) => {
        setIsSubmitting(true);
        setSubmitMessage(null);

        try {
            const apiData: CreateSupplier = {
                name: data.name,
                website: data.website || '',
                contact_email: data.contact_email,
                phone: data.phone,
            };

            const response = await apiClient.createSupplier(apiData);

            if (response.success) {
                setSubmitMessage({
                    type: 'success',
                    message: 'Proveedor creado exitosamente!'
                });

                // Limpiar formulario
                reset();
            } else {
                setSubmitMessage({
                    type: 'error',
                    message: 'Error al crear el proveedor en el servidor'
                });
            }
        } catch (error) {
            console.error('Error al crear proveedor:', error);
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
                        Crear Nuevo Proveedor
                    </h1>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Nombre del proveedor */}
                        <Input
                            label="Nombre del Proveedor"
                            register={register('name')}
                            error={errors.name?.message}
                            placeholder="Ej: Proveedor ABC, Distribuidora XYZ..."
                            required
                        />

                        {/* Sitio web */}
                        <Input
                            type="url"
                            label="Sitio Web"
                            register={register('website')}
                            error={errors.website?.message}
                            placeholder="https://www.proveedor.com"
                        />

                        {/* Email de contacto */}
                        <Input
                            type="email"
                            label="Email de Contacto"
                            register={register('contact_email')}
                            error={errors.contact_email?.message}
                            placeholder="contacto@proveedor.com"
                            required
                        />

                        {/* Teléfono */}
                        <Input
                            type="tel"
                            label="Teléfono"
                            register={register('phone')}
                            error={errors.phone?.message}
                            placeholder="+34 600 000 000"
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
                                {isSubmitting ? 'Creando...' : 'Crear Proveedor'}
                            </button>
                        </div>
                    </form>

                </div>

                {/* Tabla de proveedores existentes */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <DataTable
                        title="Proveedores Existentes"
                        columns={columns}
                        data={suppliers}
                        isLoading={isLoadingSuppliers}
                        error={suppliersError}
                        emptyMessage="No hay proveedores creados aún."
                        // Paginación del servidor
                        serverSidePagination={true}
                        totalCount={suppliersMeta?.total || 0}
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
