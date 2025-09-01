'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Amenity, CreateInventory, Home, HomeInventory, Room, Supplier } from '@/lib/types';
import { Input } from '@/components/ui/Input';
import { useApiData } from '@/hooks/useApiData';
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

    const { data: homes, isLoading: isLoadingHomes, error: homesError } = useApiData<Home>('homes');
    const { data: amenities, isLoading: isLoadingAmenities, error: amenitiesError } = useApiData<Amenity>('amenities');
    const { data: rooms, isLoading: isLoadingRooms, error: roomsError } = useApiData<Room>('rooms');
    const { data: suppliers, isLoading: isLoadingSuppliers, error: suppliersError } = useApiData<Supplier>('suppliers');

    const apiClient = createApiClient(config.apiUrl);

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
                room_id: data.room_id || undefined, // ✅ undefined en lugar de string vacío
                quantity: data.quantity,
                location_details: data.location_details,
                minimum_threshold: data.minimum_threshold,
                supplier_id: data.supplier_id,
                purchase_link: data.purchase_link || undefined, // ✅ undefined en lugar de string vacío
                purchase_price: data.purchase_price,
                last_restocked_date: data.last_restocked_date ? new Date(data.last_restocked_date) : undefined, // ✅ undefined en lugar de Date() por defecto
                notes: data.notes || undefined, // ✅ undefined en lugar de string vacío
            };
            // Llamada real a la API usando el método genérico
            const response = await apiClient.createInventory(apiData);

            if (response.success) {
                setSubmitMessage({
                    type: 'success',
                    message: 'Inventario creado exitosamente!'
                });

                // Limpiar formulario
                reset();
            } else {
                // Manejar error de la API
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
            <div className="max-w-2xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">
                        Crear Nuevo Inventario
                    </h1>

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
                            {homes.map((home) => (
                                <option key={home.id} value={home.id}>
                                    {home.name}
                                </option>
                            ))}
                        </Input>

                        {/* Amenity */}
                        <Input
                            type="select"
                            label="Producto/Amenity"
                            register={register('amenity_id')}
                            error={errors.amenity_id?.message}
                            placeholder="Selecciona un producto"
                            required
                        >
                            {amenities.map((amenity) => (
                                <option key={amenity.id} value={amenity.id}>
                                    {amenity.name}
                                </option>
                            ))}
                        </Input>

                        {/* Habitación (opcional) */}
                        <Input
                            type="select"
                            label="Habitación (opcional)"
                            register={register('room_id')}
                            error={errors.room_id?.message}
                            placeholder="Sin asignar a habitación específica"
                        >
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
                            type="textarea"
                            label="Detalles de Ubicación"
                            register={register('location_details')}
                            error={errors.location_details?.message}
                            placeholder="Ej: Armario del dormitorio, estante de la cocina, garaje..."
                            rows={3}
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
            </div>
        </div>
    );
}
