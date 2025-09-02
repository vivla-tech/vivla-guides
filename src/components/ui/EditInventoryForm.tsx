import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HomeInventoryWithRelations, CreateInventory, Home, Room, Supplier, Amenity } from '@/lib/types';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';
import { Input } from '@/components/ui/Input';
import { useApiData } from '@/hooks/useApiData';
import { Modal } from '@/components/ui/Modal';

// Esquema de validación para editar inventario
const editInventorySchema = z.object({
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

type EditInventoryFormData = z.infer<typeof editInventorySchema>;

interface EditInventoryFormProps {
    inventory: HomeInventoryWithRelations;
    onClose: () => void;
    onSuccess: () => void;
}

export function EditInventoryForm({ inventory, onClose, onSuccess }: EditInventoryFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const apiClient = createApiClient(config.apiUrl);

    // Cargar datos necesarios
    const { data: homes } = useApiData<Home>('homes');
    const { data: amenities } = useApiData<Amenity>('amenities');
    const { data: rooms } = useApiData<Room>('rooms');
    const { data: suppliers } = useApiData<Supplier>('suppliers');

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<EditInventoryFormData>({
        resolver: zodResolver(editInventorySchema),
        defaultValues: {
            home_id: inventory.home_id,
            amenity_id: inventory.amenity_id,
            room_id: inventory.room_id || '',
            quantity: inventory.quantity,
            location_details: inventory.location_details,
            minimum_threshold: inventory.minimum_threshold,
            supplier_id: inventory.supplier_id,
            purchase_link: inventory.purchase_link || '',
            purchase_price: inventory.purchase_price,
            last_restocked_date: inventory.last_restocked_date ? new Date(inventory.last_restocked_date).toISOString().split('T')[0] : '',
            notes: inventory.notes || '',
        },
    });

    // Asegurar que los selects muestren el valor cuando las opciones carguen
    useEffect(() => {
        reset({
            home_id: inventory.home_id,
            amenity_id: inventory.amenity_id,
            room_id: inventory.room_id || '',
            quantity: inventory.quantity,
            location_details: inventory.location_details,
            minimum_threshold: inventory.minimum_threshold,
            supplier_id: inventory.supplier_id,
            purchase_link: inventory.purchase_link || '',
            purchase_price: inventory.purchase_price,
            last_restocked_date: inventory.last_restocked_date ? new Date(inventory.last_restocked_date).toISOString().split('T')[0] : '',
            notes: inventory.notes || '',
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inventory, reset, (homes ? homes.length : 0), (amenities ? amenities.length : 0), (rooms ? rooms.length : 0), (suppliers ? suppliers.length : 0)]);

    const onSubmit = async (data: EditInventoryFormData) => {
        setIsSubmitting(true);
        setSubmitMessage(null);

        try {
            const apiData: Partial<CreateInventory> = {
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

            const response = await apiClient.updateInventory(inventory.id, apiData);

            if (response.success) {
                setSubmitMessage({
                    type: 'success',
                    message: 'Inventario actualizado exitosamente!'
                });

                setTimeout(() => {
                    onSuccess();
                }, 1500);
            } else {
                setSubmitMessage({
                    type: 'error',
                    message: 'Error al actualizar el inventario en el servidor'
                });
            }

        } catch (error) {
            console.error('Error al actualizar inventario:', error);
            setSubmitMessage({
                type: 'error',
                message: error instanceof Error ? error.message : 'Error de conexión con el servidor'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Editar Inventario"
        >
            <div className="p-6 max-h-[70vh] overflow-y-auto overscroll-contain">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Casa */}
                    <Input
                        type="select"
                        label="Casa"
                        register={register('home_id')}
                        error={errors.home_id?.message}
                        placeholder="Selecciona una casa"
                        required
                        defaultValue={inventory.home_id}
                    >
                        <option value="">Selecciona una casa</option>
                        {/* Fallback si la casa no está en la lista aún */}
                        {(!homes || !homes.find(h => h.id === inventory.home_id)) && (
                            <option value={inventory.home_id}>
                                {homes?.find(h => h.id === inventory.home_id)?.name || 'Casa actual'}
                            </option>
                        )}
                        {homes?.map((home) => (
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
                        defaultValue={inventory.amenity_id}
                    >
                        <option value="">Selecciona un producto</option>
                        {/* Fallback si el producto no está en la lista aún */}
                        {(!amenities || !amenities.find(a => a.id === inventory.amenity_id)) && (
                            <option value={inventory.amenity_id}>
                                {(inventory.amenity?.name || 'Producto actual') + (inventory.amenity?.reference ? ` - ${inventory.amenity.reference}` : '')}
                            </option>
                        )}
                        {amenities?.map((amenity) => (
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
                        defaultValue={inventory.room_id || ''}
                    >
                        <option value="">Sin asignar</option>
                        {/* Fallback si la habitación no está en la lista aún */}
                        {inventory.room_id && (!rooms || !rooms.find(r => r.id === inventory.room_id)) && (
                            <option value={inventory.room_id}>
                                {inventory.room?.name || 'Habitación actual'}
                            </option>
                        )}
                        {rooms?.map((room) => (
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
                        defaultValue={inventory.quantity}
                    />

                    {/* Detalles de ubicación */}
                    <Input
                        type="text"
                        label="Detalles de Ubicación"
                        register={register('location_details')}
                        error={errors.location_details?.message}
                        placeholder="Ej: Estante superior, cajón izquierdo..."
                        required
                        defaultValue={inventory.location_details}
                    />

                    {/* Umbral mínimo */}
                    <Input
                        type="number"
                        label="Umbral Mínimo de Stock"
                        register={register('minimum_threshold', { valueAsNumber: true })}
                        error={errors.minimum_threshold?.message}
                        placeholder="0"
                        min={0}
                        defaultValue={inventory.minimum_threshold}
                    />

                    {/* Proveedor */}
                    <Input
                        type="select"
                        label="Proveedor"
                        register={register('supplier_id')}
                        error={errors.supplier_id?.message}
                        placeholder="Selecciona un proveedor"
                        required
                        defaultValue={inventory.supplier_id}
                    >
                        <option value="">Selecciona un proveedor</option>
                        {/* Fallback si el proveedor no está en la lista aún */}
                        {(!suppliers || !suppliers.find(s => s.id === inventory.supplier_id)) && (
                            <option value={inventory.supplier_id}>
                                {inventory.supplier?.name || 'Proveedor actual'}
                            </option>
                        )}
                        {suppliers?.map((supplier) => (
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
                        defaultValue={inventory.purchase_link || ''}
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
                        defaultValue={inventory.purchase_price}
                    />

                    {/* Fecha de último reabastecimiento */}
                    <Input
                        type="date"
                        label="Fecha del Último Reabastecimiento"
                        register={register('last_restocked_date')}
                        error={errors.last_restocked_date?.message}
                        defaultValue={inventory.last_restocked_date ? new Date(inventory.last_restocked_date).toISOString().split('T')[0] : ''}
                    />

                    {/* Notas */}
                    <Input
                        type="textarea"
                        label="Notas Adicionales"
                        register={register('notes')}
                        error={errors.notes?.message}
                        placeholder="Notas adicionales sobre el inventario..."
                        rows={3}
                        defaultValue={inventory.notes || ''}
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
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Actualizando...' : 'Actualizar Inventario'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
