'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Category, CreateCategory } from '@/lib/types';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';

const createCategorySchema = z.object({
    name: z.string().min(1, 'El nombre de la categoría es requerido'),
    description: z.string().min(1, 'La descripción es requerida'),
});

type CreateCategoryFormData = z.infer<typeof createCategorySchema>;

interface CategoriesTabProps {
    submitMessage: { type: 'success' | 'error'; message: string } | null;
    setSubmitMessage: (message: { type: 'success' | 'error'; message: string } | null) => void;
}

export default function CategoriesTab({ submitMessage, setSubmitMessage }: CategoriesTabProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
    const [showCategoryForm, setShowCategoryForm] = useState(false);

    // Estados para paginación
    const [categoriesPage, setCategoriesPage] = useState(1);
    const [categoriesPageSize] = useState(20);
    const [categoriesTotal, setCategoriesTotal] = useState(0);
    const [categoriesTotalPages, setCategoriesTotalPages] = useState(0);

    const apiClient = createApiClient(config.apiUrl);

    const categoryForm = useForm<CreateCategoryFormData>({
        resolver: zodResolver(createCategorySchema),
        defaultValues: {
            name: '',
            description: '',
        }
    });

    // Funciones para gestión de categorías
    const loadCategories = async (page: number = categoriesPage) => {
        setLoadingCategories(true);
        try {
            const response = await apiClient.listCategories({ page, pageSize: categoriesPageSize });
            if (response.success) {
                setCategories(response.data);
                setCategoriesTotal(response.meta.total);
                setCategoriesTotalPages(response.meta.totalPages);
                setCategoriesPage(page);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        } finally {
            setLoadingCategories(false);
        }
    };

    const handleCreateCategory = async (data: CreateCategoryFormData) => {
        try {
            const categoryData: CreateCategory = {
                name: data.name,
                description: data.description,
            };

            const response = await apiClient.createCategory(categoryData);
            if (response.success) {
                await loadCategories(); // Recargar categorías
                categoryForm.reset();
                setShowCategoryForm(false);
                setSubmitMessage({
                    type: 'success',
                    message: '¡Categoría creada exitosamente!'
                });
                setTimeout(() => setSubmitMessage(null), 3000);
            }
        } catch (error) {
            console.error('Error creating category:', error);
            setSubmitMessage({
                type: 'error',
                message: 'Error al crear la categoría'
            });
        }
    };

    const handleEditCategory = async (data: CreateCategoryFormData) => {
        if (!editingCategory) return;

        try {
            const categoryData: CreateCategory = {
                name: data.name,
                description: data.description,
            };

            const response = await apiClient.updateCategory(editingCategory.id, categoryData);
            if (response.success) {
                await loadCategories(); // Recargar categorías
                categoryForm.reset();
                setEditingCategory(null);
                setShowCategoryForm(false);
                setSubmitMessage({
                    type: 'success',
                    message: '¡Categoría actualizada exitosamente!'
                });
                setTimeout(() => setSubmitMessage(null), 3000);
            }
        } catch (error) {
            console.error('Error updating category:', error);
            setSubmitMessage({
                type: 'error',
                message: 'Error al actualizar la categoría'
            });
        }
    };

    const handleDeleteCategory = async () => {
        if (!deletingCategory) return;

        try {
            await apiClient.deleteCategory(deletingCategory.id);
            await loadCategories(); // Recargar categorías
            setDeletingCategory(null);
            setSubmitMessage({
                type: 'success',
                message: '¡Categoría eliminada exitosamente!'
            });
            setTimeout(() => setSubmitMessage(null), 3000);
        } catch (error) {
            console.error('Error deleting category:', error);
            setSubmitMessage({
                type: 'error',
                message: 'Error al eliminar la categoría'
            });
        }
    };

    const openEditCategory = (category: Category) => {
        setEditingCategory(category);
        categoryForm.setValue('name', category.name);
        categoryForm.setValue('description', category.description);
        setShowCategoryForm(true);
    };

    // Cargar categorías al montar el componente
    useEffect(() => {
        loadCategories();
    }, []);

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                    Gestionar Categorías
                </h2>
                {!showCategoryForm && (
                    <button
                        onClick={() => setShowCategoryForm(true)}
                        className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100"
                    >
                        ➕ Nueva Categoría
                    </button>
                )}
            </div>

            {/* Mensaje de estado */}
            {submitMessage && (
                <div className={`p-4 rounded-md mb-6 ${submitMessage.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                    {submitMessage.message}
                </div>
            )}

            <div className="space-y-6">
                {/* Formulario para crear/editar categoría */}
                <div className="space-y-4 max-w-2xl">
                    <h3 className="font-medium text-gray-900">
                        {editingCategory ? 'Editar Categoría' : 'Crear Nueva Categoría'}
                    </h3>

                    {showCategoryForm && (
                        <form onSubmit={categoryForm.handleSubmit(editingCategory ? handleEditCategory : handleCreateCategory)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre de la Categoría *
                                </label>
                                <input
                                    type="text"
                                    {...categoryForm.register('name')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400"
                                    placeholder="Ej: Muebles, Electrodomésticos, Decoración..."
                                />
                                {categoryForm.formState.errors.name && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {categoryForm.formState.errors.name.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descripción *
                                </label>
                                <textarea
                                    {...categoryForm.register('description')}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400"
                                    placeholder="Describe qué tipo de productos incluye esta categoría..."
                                />
                                {categoryForm.formState.errors.description && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {categoryForm.formState.errors.description.message}
                                    </p>
                                )}
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCategoryForm(false);
                                        setEditingCategory(null);
                                        categoryForm.reset();
                                    }}
                                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                                >
                                    {editingCategory ? 'Actualizar' : 'Crear'} Categoría
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Lista de categorías existentes */}
                <div className="space-y-4 w-full">
                    <h3 className="font-medium text-gray-900">
                        Categorías Existentes ({categoriesTotal})
                    </h3>

                    {loadingCategories ? (
                        <div className="text-center py-8">
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <p className="text-blue-600 text-sm">Cargando categorías...</p>
                        </div>
                    ) : categories.length > 0 ? (
                        <div className="space-y-4">
                            <div className="max-h-96 overflow-y-auto space-y-2">
                                {categories.map((category) => (
                                    <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">{category.name}</div>
                                            <div className="text-sm text-gray-600 mt-1">
                                                {category.description}
                                            </div>
                                        </div>
                                        <div className="flex space-x-2 ml-3">
                                            <button
                                                onClick={() => openEditCategory(category)}
                                                className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
                                            >
                                                ✏️ Editar
                                            </button>
                                            <button
                                                onClick={() => setDeletingCategory(category)}
                                                className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100"
                                            >
                                                🗑️ Eliminar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Controles de paginación */}
                            {categoriesTotalPages > 1 && (
                                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                    <div className="text-sm text-gray-500">
                                        Mostrando {((categoriesPage - 1) * categoriesPageSize) + 1} a {Math.min(categoriesPage * categoriesPageSize, categoriesTotal)} de {categoriesTotal} categorías
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => loadCategories(categoriesPage - 1)}
                                            disabled={categoriesPage <= 1}
                                            className={`px-3 py-1 text-sm font-medium rounded-md ${categoriesPage <= 1
                                                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            Anterior
                                        </button>
                                        <div className="flex space-x-1">
                                            {Array.from({ length: Math.min(5, categoriesTotalPages) }, (_, i) => {
                                                const pageNum = i + 1;
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => loadCategories(pageNum)}
                                                        className={`px-3 py-1 text-sm font-medium rounded-md ${categoriesPage === pageNum
                                                            ? 'text-white bg-blue-600'
                                                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                            {categoriesTotalPages > 5 && (
                                                <span className="px-3 py-1 text-sm text-gray-500">...</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => loadCategories(categoriesPage + 1)}
                                            disabled={categoriesPage >= categoriesTotalPages}
                                            className={`px-3 py-1 text-sm font-medium rounded-md ${categoriesPage >= categoriesTotalPages
                                                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            Siguiente
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="text-gray-400 text-xl">📂</span>
                            </div>
                            <p className="text-gray-500 mb-2">No hay categorías registradas</p>
                            <p className="text-sm text-gray-400">Crea la primera categoría</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de confirmación para eliminar categoría */}
            {deletingCategory && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black opacity-30" onClick={() => setDeletingCategory(null)}></div>
                        <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                            <div className="mb-4">
                                <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                                    ¿Eliminar categoría?
                                </h3>
                                <p className="text-gray-600 text-center">
                                    ¿Estás seguro de que quieres eliminar la categoría <strong>{deletingCategory.name}</strong>? Esta acción no se puede deshacer.
                                </p>
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setDeletingCategory(null)}
                                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDeleteCategory}
                                    className="flex-1 px-4 py-2 text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
