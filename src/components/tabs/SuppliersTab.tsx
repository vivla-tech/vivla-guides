'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Supplier, CreateSupplier } from '@/lib/types';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';

import { Modal } from '@/components/ui/Modal';

// Esquema de validación
const createSupplierSchema = z.object({
    name: z.string().min(1, 'El nombre del proveedor es requerido'),
    website: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
    contact_email: z.string().email('Debe ser un email válido').optional().or(z.literal('')),
    phone: z.string().min(1, 'El teléfono es requerido'),
});

type CreateSupplierFormData = z.infer<typeof createSupplierSchema>;

interface SuppliersTabProps {
    submitMessage: { type: 'success' | 'error'; message: string } | null;
    setSubmitMessage: (message: { type: 'success' | 'error'; message: string } | null) => void;
}

export default function SuppliersTab({ submitMessage, setSubmitMessage }: SuppliersTabProps) {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalSuppliers, setTotalSuppliers] = useState(0);
    const [pageSize] = useState(20);
    const [showSupplierForm, setShowSupplierForm] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);

    const apiClient = createApiClient(config.apiUrl);

    // Formulario
    const supplierForm = useForm<CreateSupplierFormData>({
        resolver: zodResolver(createSupplierSchema),
        defaultValues: {
            name: '',
            website: '',
            contact_email: '',
            phone: '',
        }
    });

    // Cargar proveedores
    const loadSuppliers = async (page: number = currentPage) => {
        setLoading(true);
        try {
            const response = await apiClient.listSuppliers({ page, pageSize });
            if (response.success) {
                setSuppliers(response.data);
                setTotalPages(response.meta.totalPages);
                setTotalSuppliers(response.meta.total);
                setCurrentPage(page);
            }
        } catch (error) {
            console.error('Error loading suppliers:', error);
            setSubmitMessage({ type: 'error', message: 'Error al cargar los proveedores' });
        } finally {
            setLoading(false);
        }
    };

    // Cargar datos iniciales
    useEffect(() => {
        loadSuppliers();
    }, []);

    // Crear proveedor
    const handleCreateSupplier = async (data: CreateSupplierFormData) => {
        try {
            const payload: CreateSupplier = {
                name: data.name,
                website: data.website || '',
                contact_email: data.contact_email || '',
                phone: data.phone,
            };

            const response = await apiClient.createSupplier(payload);
            if (response.success) {
                setSubmitMessage({ type: 'success', message: 'Proveedor creado exitosamente' });
                setShowSupplierForm(false);
                supplierForm.reset();
                loadSuppliers(1); // Recargar primera página
            }
        } catch (error) {
            console.error('Error creating supplier:', error);
            setSubmitMessage({ type: 'error', message: 'Error al crear el proveedor' });
        }
    };

    // Editar proveedor
    const handleEditSupplier = async (data: CreateSupplierFormData) => {
        if (!editingSupplier) return;

        try {
            const payload: Partial<CreateSupplier> = {
                name: data.name,
                website: data.website || '',
                contact_email: data.contact_email || '',
                phone: data.phone,
            };

            const response = await apiClient.updateSupplier(editingSupplier.id, payload);
            if (response.success) {
                setSubmitMessage({ type: 'success', message: 'Proveedor actualizado exitosamente' });
                setShowSupplierForm(false);
                setEditingSupplier(null);
                supplierForm.reset();
                loadSuppliers(currentPage);
            }
        } catch (error) {
            console.error('Error updating supplier:', error);
            setSubmitMessage({ type: 'error', message: 'Error al actualizar el proveedor' });
        }
    };

    // Eliminar proveedor
    const handleDeleteSupplier = async () => {
        if (!deletingSupplier) return;

        try {
            await apiClient.deleteSupplier(deletingSupplier.id);
            setSubmitMessage({ type: 'success', message: 'Proveedor eliminado exitosamente' });
            setDeletingSupplier(null);
            loadSuppliers(currentPage);
        } catch (error) {
            console.error('Error deleting supplier:', error);
            setSubmitMessage({ type: 'error', message: 'Error al eliminar el proveedor' });
        }
    };

    // Abrir formulario de edición
    const openEditSupplier = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        supplierForm.reset({
            name: supplier.name,
            website: supplier.website,
            contact_email: supplier.contact_email,
            phone: supplier.phone,
        });
        setShowSupplierForm(true);
    };

    // Abrir modal de eliminación
    const openDeleteSupplier = (supplier: Supplier) => {
        setDeletingSupplier(supplier);
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                    Gestionar Proveedores
                </h2>
                {!showSupplierForm && (
                    <button
                        onClick={() => setShowSupplierForm(true)}
                        className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100"
                    >
                        ➕ Nuevo Proveedor
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
                {/* Formulario para crear/editar proveedor */}
                <div className="space-y-4 max-w-2xl">
                    <h3 className="font-medium text-gray-900">
                        {editingSupplier ? 'Editar Proveedor' : 'Crear Nuevo Proveedor'}
                    </h3>

                    {showSupplierForm && (
                        <form onSubmit={supplierForm.handleSubmit(editingSupplier ? handleEditSupplier : handleCreateSupplier)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre del Proveedor *
                                </label>
                                <input
                                    type="text"
                                    {...supplierForm.register('name')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400"
                                    placeholder="Ej: IKEA, Amazon, Local Store..."
                                />
                                {supplierForm.formState.errors.name && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {supplierForm.formState.errors.name.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Sitio Web (opcional)
                                </label>
                                <input
                                    type="url"
                                    {...supplierForm.register('website')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400"
                                    placeholder="https://ejemplo.com"
                                />
                                {supplierForm.formState.errors.website && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {supplierForm.formState.errors.website.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email de Contacto (opcional)
                                </label>
                                <input
                                    type="email"
                                    {...supplierForm.register('contact_email')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400"
                                    placeholder="contacto@ejemplo.com"
                                />
                                {supplierForm.formState.errors.contact_email && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {supplierForm.formState.errors.contact_email.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Teléfono *
                                </label>
                                <input
                                    type="tel"
                                    {...supplierForm.register('phone')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400"
                                    placeholder="+34 123 456 789"
                                />
                                {supplierForm.formState.errors.phone && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {supplierForm.formState.errors.phone.message}
                                    </p>
                                )}
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowSupplierForm(false);
                                        setEditingSupplier(null);
                                        supplierForm.reset();
                                    }}
                                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                                >
                                    {editingSupplier ? 'Actualizar' : 'Crear'} Proveedor
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Lista de proveedores existentes */}
                <div className="space-y-4 w-full">
                    <h3 className="font-medium text-gray-900">
                        Proveedores Existentes ({totalSuppliers})
                    </h3>

                    {loading ? (
                        <div className="text-center py-8">
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <p className="text-blue-600 text-sm">Cargando proveedores...</p>
                        </div>
                    ) : suppliers.length > 0 ? (
                        <div className="space-y-4">
                            <div className="max-h-96 overflow-y-auto space-y-2">
                                {suppliers.map((supplier) => (
                                    <div key={supplier.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">{supplier.name}</div>
                                            {supplier.website && (
                                                <div className="text-sm text-blue-600 mt-1">
                                                    <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                        {supplier.website}
                                                    </a>
                                                </div>
                                            )}
                                            <div className="text-sm text-gray-600 mt-1">
                                                {supplier.contact_email && (
                                                    <span className="mr-4">📧 {supplier.contact_email}</span>
                                                )}
                                                <span>📞 {supplier.phone}</span>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2 ml-3">
                                            <button
                                                onClick={() => openEditSupplier(supplier)}
                                                className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
                                            >
                                                ✏️ Editar
                                            </button>
                                            <button
                                                onClick={() => openDeleteSupplier(supplier)}
                                                className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100"
                                            >
                                                🗑️ Eliminar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Controles de paginación */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                    <div className="text-sm text-gray-500">
                                        Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, totalSuppliers)} de {totalSuppliers} proveedores
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => loadSuppliers(currentPage - 1)}
                                            disabled={currentPage <= 1}
                                            className={`px-3 py-1 text-sm font-medium rounded-md ${currentPage <= 1
                                                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            Anterior
                                        </button>
                                        <div className="flex space-x-1">
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                const pageNum = i + 1;
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => loadSuppliers(pageNum)}
                                                        className={`px-3 py-1 text-sm font-medium rounded-md ${currentPage === pageNum
                                                            ? 'text-white bg-blue-600'
                                                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                            {totalPages > 5 && (
                                                <span className="px-3 py-1 text-sm text-gray-500">...</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => loadSuppliers(currentPage + 1)}
                                            disabled={currentPage >= totalPages}
                                            className={`px-3 py-1 text-sm font-medium rounded-md ${currentPage >= totalPages
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
                                <span className="text-gray-400 text-xl">🏢</span>
                            </div>
                            <p className="text-gray-500 mb-2">No hay proveedores registrados</p>
                            <p className="text-sm text-gray-400">Crea el primer proveedor</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de confirmación para eliminar proveedor */}
            {deletingSupplier && (
                <Modal
                    isOpen={true}
                    onClose={() => setDeletingSupplier(null)}
                    title="Eliminar Proveedor"
                >
                    <div className="space-y-4">
                        <p className="text-gray-700">
                            ¿Estás seguro de que quieres eliminar el proveedor{' '}
                            <strong>{deletingSupplier.name}</strong>?
                        </p>
                        <p className="text-sm text-gray-500">
                            Esta acción no se puede deshacer y eliminará permanentemente el proveedor.
                        </p>
                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                onClick={() => setDeletingSupplier(null)}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteSupplier}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
