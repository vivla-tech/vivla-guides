'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreateBrand, Brand } from '@/lib/types';
import { Input } from '@/components/ui/Input';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { EditBrandForm } from '@/components/ui/EditBrandForm';
import { DeleteBrandConfirmation } from '@/components/ui/DeleteBrandConfirmation';
import { ColumnDef } from '@tanstack/react-table';
import { useApiData } from '@/hooks/useApiData';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';

// Esquema de validación para crear una marca
const createBrandSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    website: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
    contact_info: z.string().min(1, 'La información de contacto es requerida'),
});

type CreateBrandFormData = z.infer<typeof createBrandSchema>;

export default function CreateBrandPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Estados para paginación del servidor
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    // Estados para edición
    const [isEditing, setIsEditing] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

    // Estados para eliminación
    const [isDeleting, setIsDeleting] = useState(false);
    const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null);

    const apiClient = createApiClient(config.apiUrl);

    // Funciones para manejar edición y eliminación
    const handleEditBrand = (brand: Brand) => {
        setEditingBrand(brand);
        setIsEditing(true);
    };

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
            accessorKey: 'contact_info',
            header: 'Contacto',
            size: 300,
            cell: ({ row }) => (
                <div className="text-gray-700 leading-relaxed">
                    {row.getValue('contact_info')}
                </div>
            ),
        },
        {
            id: 'actions',
            header: 'Acciones',
            size: 200,
            cell: ({ row }) => {
                const brand = row.original;
                return (
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => handleEditBrand(brand)}
                            className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Editar
                        </button>
                        <button
                            onClick={() => handleDeleteBrand(brand)}
                            className="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            Eliminar
                        </button>
                    </div>
                );
            },
        },
    ];

    // Cargar marcas con paginación del servidor
    const brandsParams = useMemo(() => ({
        page: currentPage,
        pageSize: pageSize
    }), [currentPage, pageSize]);

    const { data: brands, meta: brandsMeta, isLoading: isLoadingBrands, error: brandsError } = useApiData<Brand>('brands', brandsParams);


    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<CreateBrandFormData>({
        resolver: zodResolver(createBrandSchema),
    });

    const onSubmit = async (data: CreateBrandFormData) => {
        setIsSubmitting(true);
        setSubmitMessage(null);

        try {
            const apiData: CreateBrand = {
                name: data.name,
                website: data.website || '',
                contact_info: data.contact_info,
            };

            const response = await apiClient.createBrand(apiData);

            if (response.success) {
                setSubmitMessage({
                    type: 'success',
                    message: 'Marca creada exitosamente!'
                });

                // Limpiar formulario
                reset();
            } else {
                setSubmitMessage({
                    type: 'error',
                    message: 'Error al crear la marca en el servidor'
                });
            }
        } catch (error) {
            console.error('Error al crear marca:', error);
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
                        Crear Nueva Marca
                    </h1>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Nombre de la marca */}
                        <Input
                            label="Nombre de la Marca"
                            register={register('name')}
                            error={errors.name?.message}
                            placeholder="Ej: Samsung, Apple, IKEA..."
                            required
                        />

                        {/* Sitio web */}
                        <Input
                            type="url"
                            label="Sitio Web"
                            register={register('website')}
                            error={errors.website?.message}
                            placeholder="https://www.marca.com"
                        />

                        {/* Información de contacto */}
                        <Input
                            type="textarea"
                            label="Información de Contacto"
                            register={register('contact_info')}
                            error={errors.contact_info?.message}
                            placeholder="Email: contacto@marca.com\nTeléfono: +34 900 123 456\nDirección: Calle Principal 123..."
                            rows={3}
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
                                {isSubmitting ? 'Creando...' : 'Crear Marca'}
                            </button>
                        </div>
                    </form>

                </div>

                {/* Tabla de marcas existentes */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <DataTable
                        title="Marcas Existentes"
                        columns={columns}
                        data={brands}
                        isLoading={isLoadingBrands}
                        error={brandsError}
                        emptyMessage="No hay marcas creadas aún."
                        // Paginación del servidor
                        serverSidePagination={true}
                        totalCount={brandsMeta?.total || 0}
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
