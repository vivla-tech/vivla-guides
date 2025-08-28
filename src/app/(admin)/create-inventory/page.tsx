'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HomeInventory } from '@/lib/types';

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
            // Por ahora simulamos la llamada a la API
            // TODO: Conectar con el backend real
            console.log('Datos a enviar:', data);

            // Simular delay de API
            await new Promise(resolve => setTimeout(resolve, 1000));

            setSubmitMessage({
                type: 'success',
                message: 'Inventario creado exitosamente!'
            });

            // Limpiar formulario
            reset();

        } catch (error) {
            setSubmitMessage({
                type: 'error',
                message: error instanceof Error ? error.message : 'Error al crear el inventario'
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
                        <div>
                            <label htmlFor="home_id" className="block text-sm font-medium text-gray-700 mb-2">
                                Casa *
                            </label>
                            <select
                                {...register('home_id')}
                                id="home_id"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.home_id ? 'border-red-300' : 'border-gray-300'
                                    }`}
                            >
                                <option value="">Selecciona una casa</option>
                                <option value="home-1">Villa Mediterránea</option>
                                <option value="home-2">Apartamento Centro</option>
                                <option value="home-3">Casa de Montaña</option>
                                <option value="home-4">Loft Industrial</option>
                            </select>
                            {errors.home_id && (
                                <p className="mt-1 text-sm text-red-600">{errors.home_id.message}</p>
                            )}
                        </div>

                        {/* Amenity */}
                        <div>
                            <label htmlFor="amenity_id" className="block text-sm font-medium text-gray-700 mb-2">
                                Producto/Amenity *
                            </label>
                            <select
                                {...register('amenity_id')}
                                id="amenity_id"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.amenity_id ? 'border-red-300' : 'border-gray-300'
                                    }`}
                            >
                                <option value="">Selecciona un producto</option>
                                <option value="amenity-1">Nevera Samsung Family Hub</option>
                                <option value="amenity-2">Sofá IKEA EKENÄSET</option>
                                <option value="amenity-3">Lámpara Philips Hue</option>
                                <option value="amenity-4">Cama King Size</option>
                                <option value="amenity-5">Televisor LG OLED</option>
                            </select>
                            {errors.amenity_id && (
                                <p className="mt-1 text-sm text-red-600">{errors.amenity_id.message}</p>
                            )}
                        </div>

                        {/* Habitación (opcional) */}
                        <div>
                            <label htmlFor="room_id" className="block text-sm font-medium text-gray-700 mb-2">
                                Habitación (opcional)
                            </label>
                            <select
                                {...register('room_id')}
                                id="room_id"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Sin asignar a habitación específica</option>
                                <option value="room-1">Dormitorio Principal</option>
                                <option value="room-2">Salón</option>
                                <option value="room-3">Cocina</option>
                                <option value="room-4">Baño</option>
                            </select>
                        </div>

                        {/* Cantidad */}
                        <div>
                            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                                Cantidad *
                            </label>
                            <input
                                {...register('quantity', { valueAsNumber: true })}
                                type="number"
                                min="1"
                                id="quantity"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.quantity ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="1"
                            />
                            {errors.quantity && (
                                <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
                            )}
                        </div>

                        {/* Detalles de ubicación */}
                        <div>
                            <label htmlFor="location_details" className="block text-sm font-medium text-gray-700 mb-2">
                                Detalles de Ubicación *
                            </label>
                            <textarea
                                {...register('location_details')}
                                id="location_details"
                                rows={3}
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.location_details ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="Ej: Armario del dormitorio, estante de la cocina, garaje..."
                            />
                            {errors.location_details && (
                                <p className="mt-1 text-sm text-red-600">{errors.location_details.message}</p>
                            )}
                        </div>

                        {/* Umbral mínimo */}
                        <div>
                            <label htmlFor="minimum_threshold" className="block text-sm font-medium text-gray-700 mb-2">
                                Umbral Mínimo de Stock
                            </label>
                            <input
                                {...register('minimum_threshold', { valueAsNumber: true })}
                                type="number"
                                min="0"
                                id="minimum_threshold"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.minimum_threshold ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="0"
                            />
                            {errors.minimum_threshold && (
                                <p className="mt-1 text-sm text-red-600">{errors.minimum_threshold.message}</p>
                            )}
                        </div>

                        {/* Proveedor */}
                        <div>
                            <label htmlFor="supplier_id" className="block text-sm font-medium text-gray-700 mb-2">
                                Proveedor *
                            </label>
                            <select
                                {...register('supplier_id')}
                                id="supplier_id"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.supplier_id ? 'border-red-300' : 'border-gray-300'
                                    }`}
                            >
                                <option value="">Selecciona un proveedor</option>
                                <option value="supplier-1">Electrodomésticos García</option>
                                <option value="supplier-2">Muebles López</option>
                                <option value="supplier-3">Iluminación Martínez</option>
                                <option value="supplier-4">Tecnología Rodríguez</option>
                            </select>
                            {errors.supplier_id && (
                                <p className="mt-1 text-sm text-red-600">{errors.supplier_id.message}</p>
                            )}
                        </div>

                        {/* Enlace de compra */}
                        <div>
                            <label htmlFor="purchase_link" className="block text-sm font-medium text-gray-700 mb-2">
                                Enlace de Compra
                            </label>
                            <input
                                {...register('purchase_link')}
                                type="url"
                                id="purchase_link"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.purchase_link ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="https://www.proveedor.com/producto"
                            />
                            {errors.purchase_link && (
                                <p className="mt-1 text-sm text-red-600">{errors.purchase_link.message}</p>
                            )}
                        </div>

                        {/* Precio de compra */}
                        <div>
                            <label htmlFor="purchase_price" className="block text-sm font-medium text-gray-700 mb-2">
                                Precio de Compra (€)
                            </label>
                            <input
                                {...register('purchase_price', { valueAsNumber: true })}
                                type="number"
                                step="0.01"
                                min="0"
                                id="purchase_price"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.purchase_price ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="0.00"
                            />
                            {errors.purchase_price && (
                                <p className="mt-1 text-sm text-red-600">{errors.purchase_price.message}</p>
                            )}
                        </div>

                        {/* Fecha de último reabastecimiento */}
                        <div>
                            <label htmlFor="last_restocked_date" className="block text-sm font-medium text-gray-700 mb-2">
                                Fecha del Último Reabastecimiento
                            </label>
                            <input
                                {...register('last_restocked_date')}
                                type="date"
                                id="last_restocked_date"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Notas */}
                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                                Notas Adicionales
                            </label>
                            <textarea
                                {...register('notes')}
                                id="notes"
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Información adicional, instrucciones especiales..."
                            />
                        </div>

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
