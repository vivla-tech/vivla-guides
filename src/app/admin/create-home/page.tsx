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
                <div className="font-semibold text-gray-900 text-base">
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
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${destination === 'vacacional' ? 'bg-blue-100 text-blue-800' :
                        destination === 'residencial' ? 'bg-green-100 text-green-800' :
                            destination === 'comercial' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
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
                <div className="text-gray-700 leading-relaxed">
                    {row.getValue('address')}
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
                const home = row.original;
                return (
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => handleEditHome(home)}
                            className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Editar
                        </button>
                        <button
                            onClick={() => handleDeleteHome(home)}
                            className="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
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
        formState: { errors },
        reset,
    } = useForm<CreateHomeFormData>({
        resolver: zodResolver(createHomeSchema),
    });

    const onSubmit = async (data: CreateHomeFormData) => {
        setIsSubmitting(true);
        setSubmitMessage(null);

        try {
            // Preparar datos para la API
            const apiData: CreateHome = {
                name: data.name,
                destination: data.destination,
                address: data.address,
                main_image: imageUrls.length > 0 ? imageUrls[0] : '', // Usar la primera imagen subida
            };

            // Llamada real a la API
            const response = await apiClient.createHome(apiData);

            if (response.success) {
                setSubmitMessage({
                    type: 'success',
                    message: 'Casa creada exitosamente!'
                });

                // Limpiar formulario
                reset();
                setImageUrls([]); // Limpiar URLs de imagen
            } else {
                // Manejar error de la API
                setSubmitMessage({
                    type: 'error',
                    message: 'Error al crear la casa en el servidor'
                });
            }

        } catch (error) {
            console.error('Error al crear casa:', error);
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">
                        Crear Nueva Casa
                    </h1>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Nombre de la casa */}
                        <Input
                            label="Nombre de la Casa"
                            register={register('name')}
                            error={errors.name?.message}
                            placeholder="Ej: Villa Mediterránea"
                            required
                        />

                        {/* Destino */}
                        <Input
                            type="select"
                            label="Destino"
                            register={register('destination')}
                            error={errors.destination?.message}
                            placeholder="Selecciona un destino"
                            required
                        >
                            <option value="vacacional">Vacacional</option>
                            <option value="residencial">Residencial</option>
                            <option value="comercial">Comercial</option>
                            <option value="mixto">Mixto</option>
                        </Input>

                        {/* Dirección */}
                        <Input
                            type="textarea"
                            label="Dirección"
                            register={register('address')}
                            error={errors.address?.message}
                            placeholder="Dirección completa de la casa"
                            rows={3}
                            required
                        />

                        {/* Imagen principal */}
                        <FileUpload
                            label="Imagen Principal de la Casa"
                            onUrlsChange={setImageUrls}
                            accept="image/*"
                            maxFiles={1}
                            maxSize={5}
                            basePath="homes"
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
