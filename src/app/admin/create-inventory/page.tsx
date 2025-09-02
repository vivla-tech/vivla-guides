'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Amenity, CreateInventory, Home, Room, Supplier, HomeInventoryWithRelations } from '@/lib/types';
import { Input } from '@/components/ui/Input';
import { useApiData } from '@/hooks/useApiData';
import { DataTable } from '@/components/ui/DataTable';
import { EditInventoryForm } from '@/components/ui/EditInventoryForm';
import { DeleteInventoryConfirmation } from '@/components/ui/DeleteInventoryConfirmation';
import { ColumnDef } from '@tanstack/react-table';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';

// Esquema de validación para crear inventario
const createInventorySchema = z.object({
    home_id: z.string().min(1, 'Debes seleccionar una casa'),
    amenity_id: z.string().min(1, 'Debes seleccionar un amenity'),
    room_id: z.string().optional(),
    quantity: z.number().min(1, 'La cantidad debe ser mayor a 0'),
    location_details: z.string().min(1, 'Los detalles de ubicación son requeridos'),
    minimum_threshold: z.number().min(0, 'El umbral mínimo debe ser mayor o igual a 0'),
    supplier_id: z.string().min(1, 'Debes seleccionar un proveedor'),
    purchase_link: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
    purchase_price: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
    last_restocked_date: z.string().optional(),
    notes: z.string().optional(),
});

type CreateInventoryFormData = z.infer<typeof createInventorySchema>;

export default function CreateInventoryPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Estados para paginación del servidor
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Filtro por casa para el listado
    const [selectedHomeId, setSelectedHomeId] = useState<string>('');

    // Estados para edición
    const [isEditing, setIsEditing] = useState(false);
    const [editingInventory, setEditingInventory] = useState<HomeInventoryWithRelations | null>(null);

    // Estados para eliminación
    const [isDeleting, setIsDeleting] = useState(false);
    const [deletingInventory, setDeletingInventory] = useState<HomeInventoryWithRelations | null>(null);

    // Datos auxiliares
    const { data: homes } = useApiData<Home>('homes');
    const { data: amenities } = useApiData<Amenity>('amenities');
    const { data: rooms } = useApiData<Room>('rooms');
    const { data: suppliers } = useApiData<Supplier>('suppliers');

    // Estado y carga del inventario (API directa)
    const [inventory, setInventory] = useState<HomeInventoryWithRelations[]>([]);
    const [inventoryMeta, setInventoryMeta] = useState<{ page: number; pageSize: number; total: number; totalPages: number } | null>(null);
    const [isLoadingInventory, setIsLoadingInventory] = useState<boolean>(true);
    const [inventoryError, setInventoryError] = useState<string | null>(null);

    const apiClient = useMemo(() => createApiClient(config.apiUrl), []);

    useEffect(() => {
        let cancelled = false;
        async function loadInventory() {
            try {
                setIsLoadingInventory(true);
                setInventoryError(null);
                const res = await apiClient.listInventory({ page: currentPage, pageSize, home_id: selectedHomeId || undefined });
                if (cancelled) return;
                if (res.success) {
                    setInventory(res.data);
                    setInventoryMeta(res.meta);
                } else {
                    setInventoryError('Error al cargar inventario');
                }
            } catch (err) {
                if (!cancelled) setInventoryError(err instanceof Error ? err.message : 'Error desconocido');
            } finally {
                if (!cancelled) setIsLoadingInventory(false);
            }
        }
        loadInventory();
        return () => {
            cancelled = true;
        };
    }, [apiClient, currentPage, pageSize, selectedHomeId]);

    // Funciones para manejar edición y eliminación
    const handleEditInventory = (inventoryItem: HomeInventoryWithRelations) => {
        setEditingInventory(inventoryItem);
        setIsEditing(true);
    };

    const handleDeleteInventory = (inventoryItem: HomeInventoryWithRelations) => {
        setDeletingInventory(inventoryItem);
        setIsDeleting(true);
    };

    // Definir columnas para la tabla de inventario
    const columns: ColumnDef<HomeInventoryWithRelations>[] = [
        {
            accessorKey: 'amenity.images',
            header: 'Imagen',
            size: 100,
            cell: ({ row }) => {
                const amenity = row.original.amenity;
                const images = amenity?.images;
                return images && images.length > 0 ? (
                    <div className="flex items-center justify-center">
                        <img
                            src={images[0]}
                            alt={amenity?.name || 'Producto'}
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
            accessorKey: 'amenity.name',
            header: 'Producto',
            size: 200,
            cell: ({ row }) => (
                <div>
                    <div className="font-semibold text-gray-900 text-base">
                        {row.original.amenity?.name}
                    </div>
                    <div className="text-gray-500 text-sm">
                        {row.original.amenity?.reference} {row.original.amenity?.model && `· ${row.original.amenity.model}`}
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'home.name',
            header: 'Casa',
            size: 150,
            cell: ({ row }) => (
                <div className="text-gray-700">
                    {row.original.home?.name}
                </div>
            ),
        },
        {
            accessorKey: 'room.name',
            header: 'Habitación',
            size: 150,
            cell: ({ row }) => (
                <div className="text-gray-700">
                    {row.original.room?.name || 'Sin asignar'}
                </div>
            ),
        },
        {
            accessorKey: 'quantity',
            header: 'Cantidad',
            size: 100,
            cell: ({ row }) => (
                <div className="text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {row.getValue('quantity')}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: 'purchase_price',
            header: 'Precio',
            size: 120,
            cell: ({ row }) => {
                const price = row.getValue('purchase_price');
                const numericPrice = typeof price === 'number' ? price : parseFloat(price as string) || 0;
                return (
                    <div className="text-green-600 font-medium">
                        €{numericPrice.toFixed(2)}
                    </div>
                );
            },
        },
        {
            id: 'actions',
            header: 'Acciones',
            size: 200,
            cell: ({ row }) => {
                const inventoryItem = row.original;
                return (
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => handleEditInventory(inventoryItem)}
                            className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Editar
                        </button>
                        <button
                            onClick={() => handleDeleteInventory(inventoryItem)}
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
    } = useForm<CreateInventoryFormData>({
        resolver: zodResolver(createInventorySchema),
    });

    const onSubmit = async (data: CreateInventoryFormData) => {
        setIsSubmitting(true);
        setSubmitMessage(null);

        try {
            const apiData: CreateInventory = {
                home_id: data.home_id,
                amenity_id: data.amenity_id,
                room_id: data.room_id || undefined,
                quantity: data.quantity,
                location_details: data.location_details,
                minimum_threshold: data.minimum_threshold,
                supplier_id: data.supplier_id,
                purchase_link: data.purchase_link || undefined,
                purchase_price: data.purchase_price,
                last_restocked_date: data.last_restocked_date ? new Date(data.last_restocked_date) : undefined,
                notes: data.notes || undefined,
            };

            const response = await apiClient.createInventory(apiData);

            if (response.success) {
                setSubmitMessage({
                    type: 'success',
                    message: 'Inventario creado exitosamente!'
                });

                // Limpiar formulario
                reset();

                // Recargar datos de la tabla
                setCurrentPage(1);
            } else {
                setSubmitMessage({
                    type: 'error',
                    message: 'Error al crear el inventario en el servidor'
                });
            }

        } catch (error) {
            console.error('Error al crear inventario:', error);
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
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Crear Inventario</h1>
                    <p className="text-gray-600">Añade productos al inventario de las casas</p>
                </div>

                <div className="space-y-8">
                    {/* Formulario */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Nuevo Item de Inventario</h2>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {/* Casa */}
                            <Input
                                type="select"
                                label="Casa"
                                register={register('home_id')}
                                error={errors.home_id?.message}
                                placeholder="Selecciona una casa"
                                required
                            >
                                <option value="">Selecciona una casa</option>
                                {homes.map((home) => (
                                    <option key={home.id} value={home.id}>
                                        {home.name}
                                    </option>
                                ))}
                            </Input>

                            {/* Amenity */}
                            <Input
                                type="select"
                                label="Producto"
                                register={register('amenity_id')}
                                error={errors.amenity_id?.message}
                                placeholder="Selecciona un producto"
                                required
                            >
                                <option value="">Selecciona un producto</option>
                                {amenities.map((amenity) => (
                                    <option key={amenity.id} value={amenity.id}>
                                        {amenity.name} - {amenity.reference}
                                    </option>
                                ))}
                            </Input>

                            {/* Habitación */}
                            <Input
                                type="select"
                                label="Habitación (Opcional)"
                                register={register('room_id')}
                                error={errors.room_id?.message}
                                placeholder="Selecciona una habitación"
                            >
                                <option value="">Sin asignar</option>
                                {rooms.map((room) => (
                                    <option key={room.id} value={room.id}>
                                        {room.name}
                                    </option>
                                ))}
                            </Input>

                            {/* Cantidad */}
                            <Input
                                type="number"
                                label="Cantidad"
                                register={register('quantity', { valueAsNumber: true })}
                                error={errors.quantity?.message}
                                placeholder="1"
                                min={1}
                                required
                            />

                            {/* Detalles de ubicación */}
                            <Input
                                type="text"
                                label="Detalles de Ubicación"
                                register={register('location_details')}
                                error={errors.location_details?.message}
                                placeholder="Ej: Estante superior, cajón izquierdo..."
                                required
                            />

                            {/* Umbral mínimo */}
                            <Input
                                type="number"
                                label="Umbral Mínimo de Stock"
                                register={register('minimum_threshold', { valueAsNumber: true })}
                                error={errors.minimum_threshold?.message}
                                placeholder="0"
                                min={0}
                            />

                            {/* Proveedor */}
                            <Input
                                type="select"
                                label="Proveedor"
                                register={register('supplier_id')}
                                error={errors.supplier_id?.message}
                                placeholder="Selecciona un proveedor"
                                required
                            >
                                <option value="">Selecciona un proveedor</option>
                                {suppliers.map((supplier) => (
                                    <option key={supplier.id} value={supplier.id}>
                                        {supplier.name}
                                    </option>
                                ))}
                            </Input>

                            {/* Enlace de compra */}
                            <Input
                                type="url"
                                label="Enlace de Compra"
                                register={register('purchase_link')}
                                error={errors.purchase_link?.message}
                                placeholder="https://www.proveedor.com/producto"
                            />

                            {/* Precio de compra */}
                            <Input
                                type="number"
                                label="Precio de Compra (€)"
                                register={register('purchase_price', { valueAsNumber: true })}
                                error={errors.purchase_price?.message}
                                placeholder="0.00"
                                min={0}
                                step="0.01"
                            />

                            {/* Fecha de último reabastecimiento */}
                            <Input
                                type="date"
                                label="Fecha del Último Reabastecimiento"
                                register={register('last_restocked_date')}
                                error={errors.last_restocked_date?.message}
                            />

                            {/* Notas */}
                            <Input
                                type="textarea"
                                label="Notas Adicionales"
                                register={register('notes')}
                                error={errors.notes?.message}
                                placeholder="Notas adicionales sobre el inventario..."
                                rows={3}
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
                                    {isSubmitting ? 'Creando...' : 'Crear Inventario'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Tabla de inventario */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="text-xl font-semibold text-gray-900">Inventario existente {inventoryMeta ? `(${inventoryMeta.total})` : ''}</h2>
                            <div className="w-full sm:w-64">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por casa</label>
                                <select
                                    className="text-gray-700 w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300"
                                    value={selectedHomeId}
                                    onChange={(e) => { setSelectedHomeId(e.target.value); setCurrentPage(1); }}
                                >
                                    <option value="">Todas las casas</option>
                                    {homes.map((home) => (
                                        <option key={home.id} value={home.id}>{home.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {isLoadingInventory ? (
                            <div className="text-center py-8">
                                <div className="text-gray-500">Cargando inventario...</div>
                            </div>
                        ) : inventoryError ? (
                            <div className="text-center py-8">
                                <div className="text-red-500">Error al cargar el inventario: {inventoryError}</div>
                            </div>
                        ) : (
                            <DataTable
                                data={inventory || []}
                                columns={columns}
                                totalCount={inventoryMeta ? inventoryMeta.total : 0}
                                currentPage={currentPage}
                                pageSize={pageSize}
                                onPageChange={(p) => setCurrentPage(Math.max(1, p))}
                                onPageSizeChange={(sz) => { setPageSize(sz); setCurrentPage(1); }}
                                serverSidePagination={true}
                                useContainer={false}
                            />
                        )}
                    </div>
                </div>

                {/* Modal de edición */}
                {isEditing && editingInventory && (
                    <EditInventoryForm
                        inventory={editingInventory}
                        onClose={() => {
                            setIsEditing(false);
                            setEditingInventory(null);
                        }}
                        onSuccess={() => {
                            setIsEditing(false);
                            setEditingInventory(null);
                            setCurrentPage(1); // Recargar datos
                        }}
                    />
                )}

                {/* Modal de eliminación */}
                {isDeleting && deletingInventory && (
                    <DeleteInventoryConfirmation
                        inventory={deletingInventory}
                        onClose={() => {
                            setIsDeleting(false);
                            setDeletingInventory(null);
                        }}
                        onSuccess={() => {
                            setIsDeleting(false);
                            setDeletingInventory(null);
                            setCurrentPage(1); // Recargar datos
                        }}
                    />
                )}
            </div>
        </div>
    );
}
