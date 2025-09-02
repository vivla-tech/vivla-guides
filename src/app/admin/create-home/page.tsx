'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreateHome, Home } from '@/lib/types';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';
import { Input } from '@/components/ui/Input';
import { FileUpload } from '@/components/ui/FileUpload';
import { useApiData } from '@/hooks/useApiData';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { EditHomeForm } from '@/components/ui/EditHomeForm';
import { DeleteConfirmation } from '@/components/ui/DeleteConfirmation';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';

// Esquema de validación para crear una casa
const createHomeSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    destination: z.string().min(1, 'El destino es requerido'),
    address: z.string().min(1, 'La dirección es requerida'),
    // Removemos main_image del esquema ya que se manejará con FileUpload
});

type CreateHomeFormData = z.infer<typeof createHomeSchema>;

export default function CreateHomePage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [imageUrls, setImageUrls] = useState<string[]>([]); // Nuevo estado para las URLs de imagen

    // Estados para paginación del servidor
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Estados para edición
    const [isEditing, setIsEditing] = useState(false);
    const [editingHome, setEditingHome] = useState<Home | null>(null);
    const [editImageUrls, setEditImageUrls] = useState<string[]>([]);

    // Estados para eliminación
    const [isDeleting, setIsDeleting] = useState(false);
    const [deletingHome, setDeletingHome] = useState<Home | null>(null);

    // Cargar casas existentes con paginación del servidor
    const homesParams = useMemo(() => ({
        page: currentPage,
        pageSize: pageSize
    }), [currentPage, pageSize]);

    const { data: homes, meta: homesMeta, isLoading: isLoadingHomes, error: homesError } = useApiData<Home>('homes', homesParams);

    const apiClient = createApiClient(config.apiUrl);

    // Función para manejar la edición de una casa
    const handleEditHome = (home: Home) => {
        setEditingHome(home);
        setEditImageUrls(home.main_image ? [home.main_image] : []);
        setIsEditing(true);
    };

    // Función para manejar la eliminación de una casa
    const handleDeleteHome = (home: Home) => {
        setDeletingHome(home);
        setIsDeleting(true);
    };

    // Definir columnas para la tabla de casas
    const columns: ColumnDef<Home>[] = [
        {
            accessorKey: 'main_image',
            header: 'Imagen',
            size: 100,
            cell: ({ row }) => {
                const image = row.getValue('main_image') as string;
                return image ? (
                    <div className="flex items-center justify-center">
                        <img
                            src={image}
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
            accessorKey: 'destination',
            header: 'Destino',
            size: 150,
            cell: ({ row }) => {
                const destination = row.getValue('destination') as string;
                return (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${destination === 'vacacional' ? 'bg-blue-100 text-blue-800' :
                            destination === 'residencial' ? 'bg-green-100 text-green-800' :
                                'bg-purple-100 text-purple-800'
                        }`}>
                        {destination}
                    </span>
                );
            },
        },
        {
            accessorKey: 'address',
            header: 'Dirección',
            size: 300,
            cell: ({ row }) => (
                <div className="text-sm text-gray-600">
                    {row.getValue('address')}
                </div>
            ),
        },
        {
            id: 'actions',
            header: 'Acciones',
            size: 150,
            cell: ({ row }) => {
                const home = row.original;
                return (
                    <div className="flex space-x-2">
                        <button
                            onClick={() => handleEditHome(home)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            Editar
                        </button>
                        <button
                            onClick={() => handleDeleteHome(home)}
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
    } = useForm<CreateHomeFormData>({
        resolver: zodResolver(createHomeSchema),
    });

    const onSubmit = async (data: CreateHomeFormData) => {
        setIsSubmitting(true);
        setSubmitMessage(null);

        try {
            // Crear objeto con los datos del formulario y las URLs de imagen
            const homeData: CreateHome = {
                ...data,
                main_image: imageUrls.length > 0 ? imageUrls[0] : null, // Tomar la primera imagen
            };

            const response = await apiClient.createHome(homeData);

            if (response.success) {
                setSubmitMessage({
                    type: 'success',
                    message: 'Casa creada exitosamente!'
                });
                reset();
                setImageUrls([]); // Limpiar las imágenes
                // Recargar la página para mostrar la nueva casa en la tabla
                window.location.reload();
            } else {
                setSubmitMessage({
                    type: 'error',
                    message: response.message || 'Error al crear la casa'
                });
            }
        } catch (error) {
            console.error('Error al crear casa:', error);
            setSubmitMessage({
                type: 'error',
                message: 'Error al crear la casa. Por favor, intenta de nuevo.'
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
                    <h1 className="text-3xl font-bold text-gray-900">Crear Nueva Casa</h1>
                    <p className="text-gray-600 mt-2">Añade una nueva casa al sistema</p>
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
                            label="Nombre de la Casa"
                            type="text"
                            {...register('name')}
                            error={errors.name?.message}
                            required
                        />

                        {/* Destino */}
                        <Input
                            label="Destino"
                            type="select"
                            {...register('destination')}
                            error={errors.destination?.message}
                            required
                            options={[
                                { value: '', label: 'Seleccionar destino' },
                                { value: 'vacacional', label: 'Vacacional' },
                                { value: 'residencial', label: 'Residencial' },
                                { value: 'comercial', label: 'Comercial' }
                            ]}
                        />

                        {/* Dirección */}
                        <Input
                            label="Dirección"
                            type="textarea"
                            {...register('address')}
                            error={errors.address?.message}
                            required
                        />

                        {/* Imagen Principal */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Imagen Principal
                            </label>
                            <FileUpload
                                onUrlsChange={setImageUrls}
                                acceptedFileTypes={['image/*']}
                                maxFiles={1}
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
                                {isSubmitting ? 'Creando...' : 'Crear Casa'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Tabla de casas existentes */}
                <DataTable
                    title="Casas Existentes"
                    columns={columns}
                    data={homes}
                    isLoading={isLoadingHomes}
                    error={homesError}
                    emptyMessage="No hay casas creadas aún."
                    // Paginación del servidor
                    serverSidePagination={true}
                    totalCount={homesMeta?.total || 0}
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
                        setEditingHome(null);
                        setEditImageUrls([]);
                    }}
                    title="Editar Casa"
                >
                    {editingHome && (
                        <EditHomeForm
                            home={editingHome}
                            imageUrls={editImageUrls}
                            onImageUrlsChange={setEditImageUrls}
                            onClose={() => {
                                setIsEditing(false);
                                setEditingHome(null);
                                setEditImageUrls([]);
                            }}
                            onSuccess={() => {
                                setIsEditing(false);
                                setEditingHome(null);
                                setEditImageUrls([]);
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
                        setDeletingHome(null);
                    }}
                    title="Confirmar Eliminación"
                >
                    {deletingHome && (
                        <DeleteConfirmation
                            home={deletingHome}
                            onClose={() => {
                                setIsDeleting(false);
                                setDeletingHome(null);
                            }}
                            onSuccess={() => {
                                setIsDeleting(false);
                                setDeletingHome(null);
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
