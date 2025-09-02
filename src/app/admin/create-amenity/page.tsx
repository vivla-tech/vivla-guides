'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreateAmenity, Amenity, Category, Brand } from '@/lib/types';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';
import { Input } from '@/components/ui/Input';
import { FileUpload } from '@/components/ui/FileUpload';
import { useApiData } from '@/hooks/useApiData';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { EditAmenityForm } from '@/components/ui/EditAmenityForm';
import { DeleteAmenityConfirmation } from '@/components/ui/DeleteAmenityConfirmation';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';

// Esquema de validación para crear un amenity
const createAmenitySchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    description: z.string().min(1, 'La descripción es requerida'),
    category_id: z.string().min(1, 'La categoría es requerida'),
    brand_id: z.string().min(1, 'La marca es requerida'),
    base_price: z.string().min(1, 'El precio base es requerido'),
    supplier_id: z.string().min(1, 'El proveedor es requerido'),
});

type CreateAmenityFormData = z.infer<typeof createAmenitySchema>;

export default function CreateAmenityPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [imageUrls, setImageUrls] = useState<string[]>([]);

    // Estados para paginación del servidor
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Estados para edición
    const [isEditing, setIsEditing] = useState(false);
    const [editingAmenity, setEditingAmenity] = useState<Amenity | null>(null);
    const [editImageUrls, setEditImageUrls] = useState<string[]>([]);

    // Estados para eliminación
    const [isDeleting, setIsDeleting] = useState(false);
    const [deletingAmenity, setDeletingAmenity] = useState<Amenity | null>(null);

    const apiClient = createApiClient(config.apiUrl);

    // Cargar datos necesarios
    const amenitiesParams = useMemo(() => ({
        page: currentPage,
        pageSize: pageSize
    }), [currentPage, pageSize]);

    const { data: amenities, meta: amenitiesMeta, isLoading: isLoadingAmenities, error: amenitiesError } = useApiData<Amenity>('amenities', amenitiesParams);
    const { data: categories } = useApiData<Category>('categories');
    const { data: brands } = useApiData<Brand>('brands');

    // Función para manejar la edición de un amenity
    const handleEditAmenity = (amenity: Amenity) => {
        setEditingAmenity(amenity);
        setEditImageUrls(amenity.images || []);
        setIsEditing(true);
    };

    // Función para manejar la eliminación de un amenity
    const handleDeleteAmenity = (amenity: Amenity) => {
        setDeletingAmenity(amenity);
        setIsDeleting(true);
    };

    // Definir columnas para la tabla de amenities
    const columns: ColumnDef<Amenity>[] = [
        {
            accessorKey: 'images',
            header: 'Imágenes',
            size: 120,
            cell: ({ row }) => {
                const images = row.getValue('images') as string[];
                return images && images.length > 0 ? (
                    <div className="flex items-center justify-center">
                        <img
                            src={images[0]}
                            alt={row.getValue('name') as string}
                            className="w-16 h-16 object-cover rounded-lg shadow-sm"
                        />
                    </div>
                ) : (
                    <div className="flex items-center justify-center">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400 text-xs">Sin imagen</span>
                        </div>
                    </div>
                );
            },
        },
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
            accessorKey: 'base_price',
            header: 'Precio Base',
            size: 120,
            cell: ({ row }) => {
                const price = row.getValue('base_price');
                const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
                return (
                    <div className="text-sm text-gray-600">
                        {numericPrice ? `€${numericPrice.toFixed(2)}` : 'N/A'}
                    </div>
                );
            },
        },
        {
            accessorKey: 'category_id',
            header: 'Categoría',
            size: 150,
            cell: ({ row }) => {
                const categoryId = row.getValue('category_id') as string;
                const category = categories?.find(c => c.id === categoryId);
                return (
                    <div className="text-sm text-gray-600">
                        {category?.name || 'N/A'}
                    </div>
                );
            },
        },
        {
            accessorKey: 'brand_id',
            header: 'Marca',
            size: 150,
            cell: ({ row }) => {
                const brandId = row.getValue('brand_id') as string;
                const brand = brands?.find(b => b.id === brandId);
                return (
                    <div className="text-sm text-gray-600">
                        {brand?.name || 'N/A'}
                    </div>
                );
            },
        },
        {
            id: 'actions',
            header: 'Acciones',
            size: 150,
            cell: ({ row }) => {
                const amenity = row.original;
                return (
                    <div className="flex space-x-2">
                        <button
                            onClick={() => handleEditAmenity(amenity)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            Editar
                        </button>
                        <button
                            onClick={() => handleDeleteAmenity(amenity)}
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
    } = useForm<CreateAmenityFormData>({
        resolver: zodResolver(createAmenitySchema),
    });

    const onSubmit = async (data: CreateAmenityFormData) => {
        setIsSubmitting(true);
        setSubmitMessage(null);

        try {
            // Crear objeto con los datos del formulario y las URLs de imagen
            const amenityData: CreateAmenity = {
                ...data,
                base_price: parseFloat(data.base_price),
                images: imageUrls,
            };

            const response = await apiClient.createAmenity(amenityData);

            if (response.success) {
                setSubmitMessage({
                    type: 'success',
                    message: 'Amenity creado exitosamente!'
                });
                reset();
                setImageUrls([]);
                window.location.reload();
            } else {
                setSubmitMessage({
                    type: 'error',
                    message: response.message || 'Error al crear el amenity'
                });
            }
        } catch (error) {
            console.error('Error al crear amenity:', error);
            setSubmitMessage({
                type: 'error',
                message: 'Error al crear el amenity. Por favor, intenta de nuevo.'
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
                    <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Producto</h1>
                    <p className="text-gray-600 mt-2">Añade un nuevo producto al catálogo</p>
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
                            label="Nombre del Producto"
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

                        {/* Categoría */}
                        <Input
                            label="Categoría"
                            type="select"
                            {...register('category_id')}
                            error={errors.category_id?.message}
                            required
                            options={[
                                { value: '', label: 'Seleccionar categoría' },
                                ...(categories?.map(cat => ({ value: cat.id, label: cat.name })) || [])
                            ]}
                        />

                        {/* Marca */}
                        <Input
                            label="Marca"
                            type="select"
                            {...register('brand_id')}
                            error={errors.brand_id?.message}
                            required
                            options={[
                                { value: '', label: 'Seleccionar marca' },
                                ...(brands?.map(brand => ({ value: brand.id, label: brand.name })) || [])
                            ]}
                        />

                        {/* Precio Base */}
                        <Input
                            label="Precio Base (€)"
                            type="text"
                            {...register('base_price')}
                            error={errors.base_price?.message}
                            required
                        />

                        {/* Proveedor */}
                        <Input
                            label="Proveedor"
                            type="text"
                            {...register('supplier_id')}
                            error={errors.supplier_id?.message}
                            required
                        />

                        {/* Imágenes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Imágenes del Producto
                            </label>
                            <FileUpload
                                onUrlsChange={setImageUrls}
                                acceptedFileTypes={['image/*']}
                                maxFiles={5}
                                maxFileSize={5 * 1024 * 1024} // 5MB
                            />
                        </div>

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
                                {isSubmitting ? 'Creando...' : 'Crear Producto'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Tabla de productos existentes */}
                <DataTable
                    title="Productos Existentes"
                    columns={columns}
                    data={amenities}
                    isLoading={isLoadingAmenities}
                    error={amenitiesError}
                    emptyMessage="No hay productos creados aún."
                    serverSidePagination={true}
                    totalCount={amenitiesMeta?.total || 0}
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
                        setEditingAmenity(null);
                        setEditImageUrls([]);
                    }}
                    title="Editar Producto"
                >
                    {editingAmenity && (
                        <EditAmenityForm
                            amenity={editingAmenity}
                            imageUrls={editImageUrls}
                            onImageUrlsChange={setEditImageUrls}
                            onClose={() => {
                                setIsEditing(false);
                                setEditingAmenity(null);
                                setEditImageUrls([]);
                            }}
                            onSuccess={() => {
                                setIsEditing(false);
                                setEditingAmenity(null);
                                setEditImageUrls([]);
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
                        setDeletingAmenity(null);
                    }}
                    title="Confirmar Eliminación"
                >
                    {deletingAmenity && (
                        <DeleteAmenityConfirmation
                            amenity={deletingAmenity}
                            onClose={() => {
                                setIsDeleting(false);
                                setDeletingAmenity(null);
                            }}
                            onSuccess={() => {
                                setIsDeleting(false);
                                setDeletingAmenity(null);
                                window.location.reload();
                            }}
                        />
                    )}
                </Modal>
            </div>
        </div>
    );
}
