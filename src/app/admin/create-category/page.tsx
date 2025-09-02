'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreateCategory, Category } from '@/lib/types';
import { Input } from '@/components/ui/Input';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { EditCategoryForm } from '@/components/ui/EditCategoryForm';
import { DeleteCategoryConfirmation } from '@/components/ui/DeleteCategoryConfirmation';
import { ColumnDef } from '@tanstack/react-table';
import { useApiData } from '@/hooks/useApiData';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';

// Esquema de validación para crear una categoría
const createCategorySchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    description: z.string().min(1, 'La descripción es requerida'),
});

type CreateCategoryFormData = z.infer<typeof createCategorySchema>;

export default function CreateCategoryPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Estados para paginación del servidor
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    // Estados para edición
    const [isEditing, setIsEditing] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    // Estados para eliminación
    const [isDeleting, setIsDeleting] = useState(false);
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

    const apiClient = createApiClient(config.apiUrl);

    // Funciones para manejar edición y eliminación
    const handleEditCategory = (category: Category) => {
        setEditingCategory(category);
        setIsEditing(true);
    };

    const handleDeleteCategory = (category: Category) => {
        setDeletingCategory(category);
        setIsDeleting(true);
    };

    // Definir columnas para la tabla de categorías
    const columns: ColumnDef<Category>[] = [
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
            accessorKey: 'description',
            header: 'Descripción',
            size: 400,
            cell: ({ row }) => (
                <div className="text-gray-700 leading-relaxed">
                    {row.getValue('description')}
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
                const category = row.original;
                return (
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => handleEditCategory(category)}
                            className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Editar
                        </button>
                        <button
                            onClick={() => handleDeleteCategory(category)}
                            className="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            Eliminar
                        </button>
                    </div>
                );
            },
        },
    ];

    // Cargar categorías con paginación del servidor
    const categoriesParams = useMemo(() => ({
        page: currentPage,
        pageSize: pageSize
    }), [currentPage, pageSize]);

    const { data: categories, meta: categoriesMeta, isLoading: isLoadingCategories, error: categoriesError } = useApiData<Category>('categories', categoriesParams);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<CreateCategoryFormData>({
        resolver: zodResolver(createCategorySchema),
    });

    const onSubmit = async (data: CreateCategoryFormData) => {
        setIsSubmitting(true);
        setSubmitMessage(null);

        try {

            const apiData: CreateCategory = {
                name: data.name,
                description: data.description,
            };

            const response = await apiClient.createCategory(apiData);

            if (response.success) {
                setSubmitMessage({
                    type: 'success',
                    message: 'Categoría creada exitosamente!'
                });

                // Limpiar formulario
                reset();
            } else {
                setSubmitMessage({
                    type: 'error',
                    message: 'Error al crear la categoría en el servidor'
                });
            }
        } catch (error) {
            setSubmitMessage({
                type: 'error',
                message: error instanceof Error ? error.message : 'Error al crear la categoría'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="space-y-8">
                    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                        <h1 className="text-2xl font-bold text-gray-900 mb-6">
                            Crear Nueva Categoría
                        </h1>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {/* Nombre de la categoría */}
                            <Input
                                label="Nombre de la Categoría"
                                register={register('name')}
                                error={errors.name?.message}
                                placeholder="Ej: Electrodomésticos, Muebles, Decoración..."
                                required
                            />

                            {/* Descripción */}
                            <Input
                                type="textarea"
                                label="Descripción"
                                register={register('description')}
                                error={errors.description?.message}
                                placeholder="Descripción detallada de la categoría y qué tipo de productos incluye..."
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
                            <div className="flex flex-col sm:flex-row justify-end gap-4">
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
                                    {isSubmitting ? 'Creando...' : 'Crear Categoría'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Tabla de categorías existentes */}
                    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                        <div className="overflow-x-auto">
                            <DataTable
                                title="Categorías Existentes"
                                columns={columns}
                                data={categories}
                                isLoading={isLoadingCategories}
                                error={categoriesError}
                                emptyMessage="No hay categorías creadas aún."
                                // Paginación del servidor
                                serverSidePagination={true}
                                totalCount={categoriesMeta?.total || 0}
                                currentPage={currentPage}
                                pageSize={pageSize}
                                onPageChange={setCurrentPage}
                                onPageSizeChange={setPageSize}
                                useContainer={false}
                            />
                        </div>
                    </div>

                    {/* Modal de edición */}
                    <Modal
                        isOpen={isEditing}
                        onClose={() => {
                            setIsEditing(false);
                            setEditingCategory(null);
                        }}
                        title="Editar Categoría"
                    >
                        {editingCategory && (
                            <EditCategoryForm
                                category={editingCategory}
                                onClose={() => {
                                    setIsEditing(false);
                                    setEditingCategory(null);
                                }}
                                onSuccess={() => {
                                    setIsEditing(false);
                                    setEditingCategory(null);
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
                            setDeletingCategory(null);
                        }}
                        title="Confirmar Eliminación"
                    >
                        {deletingCategory && (
                            <DeleteCategoryConfirmation
                                category={deletingCategory}
                                onClose={() => {
                                    setIsDeleting(false);
                                    setDeletingCategory(null);
                                }}
                                onSuccess={() => {
                                    setIsDeleting(false);
                                    setDeletingCategory(null);
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
