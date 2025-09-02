'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreateBrand, Brand } from '@/lib/types';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';
import { Input } from '@/components/ui/Input';
import { useApiData } from '@/hooks/useApiData';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { EditBrandForm } from '@/components/ui/EditBrandForm';
import { DeleteBrandConfirmation } from '@/components/ui/DeleteBrandConfirmation';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';

// Esquema de validación para crear una marca
const createBrandSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    description: z.string().min(1, 'La descripción es requerida'),
});

type CreateBrandFormData = z.infer<typeof createBrandSchema>;

export default function CreateBrandPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Estados para paginación del servidor
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Estados para edición
    const [isEditing, setIsEditing] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

    // Estados para eliminación
    const [isDeleting, setIsDeleting] = useState(false);
    const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null);

    const apiClient = createApiClient(config.apiUrl);

    // Cargar marcas existentes con paginación del servidor
    const brandsParams = useMemo(() => ({
        page: currentPage,
        pageSize: pageSize
    }), [currentPage, pageSize]);

    const { data: brands, meta: brandsMeta, isLoading: isLoadingBrands, error: brandsError } = useApiData<Brand>('brands', brandsParams);

    // Función para manejar la edición de una marca
    const handleEditBrand = (brand: Brand) => {
        setEditingBrand(brand);
        setIsEditing(true);
    };

    // Función para manejar la eliminación de una marca
    const handleDeleteBrand = (brand: Brand) => {
        setDeletingBrand(brand);
        setIsDeleting(true);
    };

    // Definir columnas para la tabla de marcas
    const columns: ColumnDef<Brand>[] = [
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
                const brand = row.original;
                return (
                    <div className="flex space-x-2">
                        <button
                            onClick={() => handleEditBrand(brand)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            Editar
                        </button>
                        <button
                            onClick={() => handleDeleteBrand(brand)}
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
    } = useForm<CreateBrandFormData>({
        resolver: zodResolver(createBrandSchema),
    });

    const onSubmit = async (data: CreateBrandFormData) => {
        setIsSubmitting(true);
        setSubmitMessage(null);

        try {
            const brandData: CreateBrand = {
                ...data,
            };

            const response = await apiClient.createBrand(brandData);

            if (response.success) {
                setSubmitMessage({
                    type: 'success',
                    message: 'Marca creada exitosamente!'
                });
                reset();
                window.location.reload();
            } else {
                setSubmitMessage({
                    type: 'error',
                    message: response.message || 'Error al crear la marca'
                });
            }
        } catch (error) {
            console.error('Error al crear marca:', error);
            setSubmitMessage({
                type: 'error',
                message: 'Error al crear la marca. Por favor, intenta de nuevo.'
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
                    <h1 className="text-3xl font-bold text-gray-900">Crear Nueva Marca</h1>
                    <p className="text-gray-600 mt-2">Añade una nueva marca de productos</p>
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
                            label="Nombre de la Marca"
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
                                {isSubmitting ? 'Creando...' : 'Crear Marca'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Tabla de marcas existentes */}
                <DataTable
                    title="Marcas Existentes"
                    columns={columns}
                    data={brands}
                    isLoading={isLoadingBrands}
                    error={brandsError}
                    emptyMessage="No hay marcas creadas aún."
                    serverSidePagination={true}
                    totalCount={brandsMeta?.total || 0}
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
                        setEditingBrand(null);
                    }}
                    title="Editar Marca"
                >
                    {editingBrand && (
                        <EditBrandForm
                            brand={editingBrand}
                            onClose={() => {
                                setIsEditing(false);
                                setEditingBrand(null);
                            }}
                            onSuccess={() => {
                                setIsEditing(false);
                                setEditingBrand(null);
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
                        setDeletingBrand(null);
                    }}
                    title="Confirmar Eliminación"
                >
                    {deletingBrand && (
                        <DeleteBrandConfirmation
                            brand={deletingBrand}
                            onClose={() => {
                                setIsDeleting(false);
                                setDeletingBrand(null);
                            }}
                            onSuccess={() => {
                                setIsDeleting(false);
                                setDeletingBrand(null);
                                window.location.reload();
                            }}
                        />
                    )}
                </Modal>
            </div>
        </div>
    );
}
