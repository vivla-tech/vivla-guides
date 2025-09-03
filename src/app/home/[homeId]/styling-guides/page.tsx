'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';
import { Home, StylingGuide, Playbook } from '@/lib/types';
import { FileUpload } from '@/components/ui/FileUpload';

export default function StylingGuidesPage() {
    const params = useParams();
    const homeId = params.homeId as string;
    const apiClient = createApiClient(config.apiUrl);

    const [home, setHome] = useState<Home | null>(null);
    const [stylingGuides, setStylingGuides] = useState<StylingGuide[]>([]);
    const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingGuide, setEditingGuide] = useState<StylingGuide | null>(null);
    const [deletingGuide, setDeletingGuide] = useState<StylingGuide | null>(null);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [editForm, setEditForm] = useState({
        title: '',
        qr_code_url: '',
        image_urls: [] as string[]
    });
    const [editImageUrls, setEditImageUrls] = useState<string[]>([]);
    const [editReferencePhotoUrl, setEditReferencePhotoUrl] = useState<string>('');
    const [editingPlaybook, setEditingPlaybook] = useState<Playbook | null>(null);
    const [deletingPlaybook, setDeletingPlaybook] = useState<Playbook | null>(null);
    const [editPlaybookForm, setEditPlaybookForm] = useState({
        title: '',
        type: '',
        estimated_time: '',
        tasks: '',
        materials: ''
    });

    useEffect(() => {
        const loadHomeData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Cargar datos de la casa
                const homeResponse = await apiClient.getHomeById(homeId);
                setHome(homeResponse.data);

                // Cargar guías de estilismo de la casa
                const guidesResponse = await apiClient.listStylingGuidesByHome(homeId, { pageSize: 100 });
                setStylingGuides(guidesResponse.data);

                // Cargar playbooks de la casa
                const playbooksResponse = await apiClient.listPlaybooksByHome(homeId, { pageSize: 100 });
                setPlaybooks(playbooksResponse.data);
            } catch (err) {
                console.error('Error loading styling guides:', err);
                setError('Error al cargar las guías de estilismo');
            } finally {
                setLoading(false);
            }
        };

        if (homeId) {
            loadHomeData();
        }
    }, [homeId]);

    // Funciones para manejar edición y eliminación
    const handleEditGuide = (guide: StylingGuide) => {
        setEditingGuide(guide);
        setEditForm({
            title: guide.title,
            qr_code_url: guide.qr_code_url || '',
            image_urls: guide.image_urls || []
        });
        setEditImageUrls(guide.image_urls || []);
        setEditReferencePhotoUrl(guide.reference_photo_url || '');
    };

    const handleDeleteGuide = async (guide: StylingGuide) => {
        try {
            await apiClient.deleteStylingGuide(guide.id);
            setSubmitMessage({ type: 'success', message: 'Guía de estilismo eliminada exitosamente' });
            setDeletingGuide(null);
            // Recargar las guías
            const guidesResponse = await apiClient.listStylingGuidesByHome(homeId, { pageSize: 100 });
            setStylingGuides(guidesResponse.data);
        } catch (error) {
            console.error('Error deleting styling guide:', error);
            setSubmitMessage({ type: 'error', message: 'Error al eliminar la guía de estilismo' });
        }
    };

    // Función helper para obtener playbooks de una guía (misma habitación)
    const getPlaybooksForGuide = (guide: StylingGuide) => {
        return playbooks.filter(playbook => playbook.room_id === guide.room_id);
    };

    const handleSaveEdit = async () => {
        if (!editingGuide) return;

        try {
            await apiClient.updateStylingGuide(editingGuide.id, {
                title: editForm.title,
                reference_photo_url: editReferencePhotoUrl || undefined,
                qr_code_url: editForm.qr_code_url || undefined,
                image_urls: editImageUrls
            });
            setSubmitMessage({ type: 'success', message: 'Guía de estilismo actualizada exitosamente' });
            setEditingGuide(null);
            // Recargar las guías
            const guidesResponse = await apiClient.listStylingGuidesByHome(homeId, { pageSize: 100 });
            setStylingGuides(guidesResponse.data);
        } catch (error) {
            console.error('Error updating styling guide:', error);
            setSubmitMessage({ type: 'error', message: 'Error al actualizar la guía de estilismo' });
        }
    };

    const handleEditPlaybook = (playbook: Playbook) => {
        setEditingPlaybook(playbook);
        setEditPlaybookForm({
            title: playbook.title,
            type: playbook.type,
            estimated_time: playbook.estimated_time,
            tasks: playbook.tasks,
            materials: playbook.materials || ''
        });
    };

    const handleSavePlaybookEdit = async () => {
        if (!editingPlaybook) return;

        try {
            await apiClient.updatePlaybook(editingPlaybook.id, {
                title: editPlaybookForm.title,
                type: editPlaybookForm.type,
                estimated_time: editPlaybookForm.estimated_time,
                tasks: editPlaybookForm.tasks,
                materials: editPlaybookForm.materials || undefined
            });
            setSubmitMessage({ type: 'success', message: 'Playbook actualizado exitosamente' });
            setEditingPlaybook(null);
            // Recargar los playbooks
            const playbooksResponse = await apiClient.listPlaybooksByHome(homeId, { pageSize: 100 });
            setPlaybooks(playbooksResponse.data);
        } catch (error) {
            console.error('Error updating playbook:', error);
            setSubmitMessage({ type: 'error', message: 'Error al actualizar el playbook' });
        }
    };

    const handleDeletePlaybook = async (playbook: Playbook) => {
        try {
            await apiClient.deletePlaybook(playbook.id);
            setSubmitMessage({ type: 'success', message: 'Playbook eliminado exitosamente' });
            setDeletingPlaybook(null);
            // Recargar los playbooks
            const playbooksResponse = await apiClient.listPlaybooksByHome(homeId, { pageSize: 100 });
            setPlaybooks(playbooksResponse.data);
        } catch (error) {
            console.error('Error deleting playbook:', error);
            setSubmitMessage({ type: 'error', message: 'Error al eliminar el playbook' });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center py-12">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Cargando guías de estilismo...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !home) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-red-600 text-2xl">⚠️</span>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
                        <p className="text-gray-600 mb-4">{error || 'Casa no encontrada'}</p>
                        <Link
                            href="/"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                            Volver al Inicio
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Mensaje de estado */}
                {submitMessage && (
                    <div className={`p-4 rounded-md mb-6 ${submitMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                        {submitMessage.message}
                    </div>
                )}

                {/* Header */}
                <div className="mb-8">
                    <div>
                        <Link
                            href={`/home/${homeId}`}
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-2"
                        >
                            ← Volver a {home.name}
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Guías de Estilismo de {home.name}
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Todas las guías de estilo y decoración de esta casa
                        </p>
                    </div>
                </div>

                {/* Botón de Gestionar */}
                <div className="mb-6">
                    <Link
                        href={`/wizard/styling-guides?homeId=${homeId}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                    >
                        ✏️ Gestionar Guías de Estilo
                    </Link>
                </div>

                {/* Lista de Guías de Estilismo */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">
                            Guías de Estilismo
                        </h2>
                    </div>

                    {stylingGuides.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-gray-400 text-2xl">🎨</span>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No hay guías de estilismo
                            </h3>
                            <p className="text-gray-500 mb-4">
                                Aún no se han creado guías de estilismo para esta casa.
                            </p>
                            <Link
                                href={`/wizard/styling-guides?homeId=${homeId}`}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                Crear Primera Guía
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {stylingGuides.map((guide) => {
                                const guidePlaybooks = getPlaybooksForGuide(guide);
                                return (
                                    <div key={guide.id} className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-start space-x-4">
                                                    {/* Imagen de referencia si existe */}
                                                    {guide.reference_photo_url && (
                                                        <div className="flex-shrink-0">
                                                            <img
                                                                src={guide.reference_photo_url}
                                                                alt="Foto de referencia"
                                                                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-3 mb-2">
                                                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                                                <span className="text-blue-600 text-xl">🎨</span>
                                                            </div>
                                                            <div className="flex-1">
                                                                <h3 className="text-lg font-medium text-gray-900">
                                                                    {guide.title}
                                                                </h3>
                                                                <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                                                                    <span>📅 {new Date(guide.created_at).toLocaleDateString('es-ES')}</span>
                                                                    {guide.image_urls && guide.image_urls.length > 0 && (
                                                                        <span>📷 {guide.image_urls.length} imágenes</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Galería de imágenes si existe */}
                                                        {guide.image_urls && guide.image_urls.length > 0 && (
                                                            <div className="mt-3">
                                                                <h4 className="text-sm font-medium text-gray-700 mb-2">Galería de Inspiración</h4>
                                                                <div className="flex space-x-2 overflow-x-auto pb-2">
                                                                    {guide.image_urls.map((imageUrl, index) => (
                                                                        <img
                                                                            key={index}
                                                                            src={imageUrl}
                                                                            alt={`Imagen ${index + 1}`}
                                                                            className="w-20 h-20 object-cover rounded border border-gray-200 flex-shrink-0"
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Playbooks asociados */}
                                                        {guidePlaybooks.length > 0 && (
                                                            <div className="mt-3">
                                                                <h4 className="text-sm font-medium text-gray-700 mb-2">
                                                                    Playbooks ({guidePlaybooks.length})
                                                                </h4>
                                                                <div className="space-y-2">
                                                                    {guidePlaybooks.map((playbook) => (
                                                                        <div key={playbook.id} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                                                            <div className="flex items-start justify-between mb-2">
                                                                                <div className="flex items-center space-x-2">
                                                                                    <span className="text-blue-600">📋</span>
                                                                                    <span className="font-medium text-gray-900">{playbook.title}</span>
                                                                                </div>
                                                                                <div className="flex items-center space-x-2">
                                                                                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                                                                        {playbook.type}
                                                                                    </span>
                                                                                    <button
                                                                                        onClick={() => handleEditPlaybook(playbook)}
                                                                                        className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 border border-blue-200 rounded hover:bg-blue-200"
                                                                                    >
                                                                                        ✏️ Editar
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => setDeletingPlaybook(playbook)}
                                                                                        className="px-2 py-1 text-xs font-medium text-red-600 bg-red-100 border border-red-200 rounded hover:bg-red-200"
                                                                                    >
                                                                                        🗑️ Eliminar
                                                                                    </button>
                                                                                </div>
                                                                            </div>

                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                                                <div>
                                                                                    <span className="text-gray-600">⏱️ Tiempo estimado:</span>
                                                                                    <span className="ml-1 text-gray-900">{playbook.estimated_time}</span>
                                                                                </div>

                                                                                {playbook.materials && (
                                                                                    <div>
                                                                                        <span className="text-gray-600">🛠️ Materiales:</span>
                                                                                        <span className="ml-1 text-gray-900">{playbook.materials}</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            {playbook.tasks && (
                                                                                <div className="mt-2">
                                                                                    <span className="text-gray-600 text-sm">📝 Tareas:</span>
                                                                                    <div className="mt-1 text-sm text-gray-700 bg-white p-2 rounded border">
                                                                                        <pre className="whitespace-pre-wrap font-sans">{playbook.tasks}</pre>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Indicadores adicionales */}
                                                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                                                            {guide.reference_photo_url && (
                                                                <span>📸 Foto de referencia</span>
                                                            )}
                                                            {guide.qr_code_url && (
                                                                <span>📱 Código QR</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex space-x-2 mt-4">
                                                    <button
                                                        onClick={() => handleEditGuide(guide)}
                                                        className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
                                                    >
                                                        ✏️ Editar
                                                    </button>
                                                    <button
                                                        onClick={() => setDeletingGuide(guide)}
                                                        className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100"
                                                    >
                                                        🗑️ Eliminar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de confirmación para eliminar */}
            {deletingGuide && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black opacity-30" onClick={() => setDeletingGuide(null)}></div>
                        <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                            <div className="mb-4">
                                <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                                    Eliminar Guía de Estilismo
                                </h3>
                                <p className="text-sm text-gray-500 text-center">
                                    ¿Estás seguro de que quieres eliminar <strong>{deletingGuide.title}</strong>?
                                </p>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setDeletingGuide(null)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleDeleteGuide(deletingGuide)}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de edición */}
            {editingGuide && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black opacity-30" onClick={() => setEditingGuide(null)}></div>
                        <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                            <div className="mb-6">
                                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-4">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                                    Editar Guía de Estilismo
                                </h3>
                            </div>

                            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Título *
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.title}
                                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm"
                                        placeholder="Título de la guía"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Foto de Referencia
                                    </label>
                                    {editReferencePhotoUrl && (
                                        <div className="mb-3">
                                            <div className="relative inline-block">
                                                <img
                                                    src={editReferencePhotoUrl}
                                                    alt="Foto de referencia"
                                                    className="w-24 h-24 object-cover rounded border"
                                                />
                                                <button
                                                    onClick={() => setEditReferencePhotoUrl('')}
                                                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    <FileUpload
                                        onUrlsChange={(urls) => setEditReferencePhotoUrl(urls[0] || '')}
                                        accept="image/*"
                                        maxFiles={1}
                                        maxSize={5}
                                        basePath="styling-guides/reference"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Galería de Inspiración
                                    </label>
                                    <p className="text-sm text-gray-500 mb-2">
                                        Imágenes actuales: {editImageUrls.length}
                                    </p>
                                    {editImageUrls.length > 0 && (
                                        <div className="mb-3">
                                            <div className="flex flex-wrap gap-2">
                                                {editImageUrls.map((url, index) => (
                                                    <div key={index} className="relative">
                                                        <img
                                                            src={url}
                                                            alt={`Imagen ${index + 1}`}
                                                            className="w-16 h-16 object-cover rounded border"
                                                        />
                                                        <button
                                                            onClick={() => setEditImageUrls(editImageUrls.filter((_, i) => i !== index))}
                                                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <FileUpload
                                        onUrlsChange={(urls) => setEditImageUrls([...editImageUrls, ...urls])}
                                        accept="image/*"
                                        maxFiles={5}
                                        maxSize={5}
                                        basePath="styling-guides/gallery"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        URL del Código QR (opcional)
                                    </label>
                                    <input
                                        type="url"
                                        value={editForm.qr_code_url}
                                        onChange={(e) => setEditForm({ ...editForm, qr_code_url: e.target.value })}
                                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm"
                                        placeholder="https://ejemplo.com/qr.png"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => setEditingGuide(null)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                                >
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de edición de playbook */}
            {editingPlaybook && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black opacity-30" onClick={() => setEditingPlaybook(null)}></div>
                        <div className="relative bg-white rounded-lg shadow-lg max-w-2xl w-full p-6">
                            <div className="mb-6">
                                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-4">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                                    Editar Playbook
                                </h3>
                            </div>

                            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Título *
                                    </label>
                                    <input
                                        type="text"
                                        value={editPlaybookForm.title}
                                        onChange={(e) => setEditPlaybookForm({ ...editPlaybookForm, title: e.target.value })}
                                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm"
                                        placeholder="Título del playbook"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Tipo *
                                        </label>
                                        <select
                                            value={editPlaybookForm.type}
                                            onChange={(e) => setEditPlaybookForm({ ...editPlaybookForm, type: e.target.value })}
                                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm"
                                        >
                                            <option value="">Selecciona un tipo</option>
                                            <option value="limpieza">Limpieza</option>
                                            <option value="mantenimiento">Mantenimiento</option>
                                            <option value="preparacion">Preparación</option>
                                            <option value="revision">Revisión</option>
                                            <option value="emergencia">Emergencia</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Tiempo Estimado *
                                        </label>
                                        <input
                                            type="text"
                                            value={editPlaybookForm.estimated_time}
                                            onChange={(e) => setEditPlaybookForm({ ...editPlaybookForm, estimated_time: e.target.value })}
                                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm"
                                            placeholder="Ej: 30 minutos, 1 hora..."
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tareas/Pasos a Seguir *
                                    </label>
                                    <textarea
                                        value={editPlaybookForm.tasks}
                                        onChange={(e) => setEditPlaybookForm({ ...editPlaybookForm, tasks: e.target.value })}
                                        rows={4}
                                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm"
                                        placeholder="1. Primer paso...&#10;2. Segundo paso...&#10;3. Tercer paso..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Materiales Necesarios (opcional)
                                    </label>
                                    <textarea
                                        value={editPlaybookForm.materials}
                                        onChange={(e) => setEditPlaybookForm({ ...editPlaybookForm, materials: e.target.value })}
                                        rows={2}
                                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm"
                                        placeholder="Productos de limpieza, herramientas, etc..."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => setEditingPlaybook(null)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSavePlaybookEdit}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                                >
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmación para eliminar playbook */}
            {deletingPlaybook && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black opacity-30" onClick={() => setDeletingPlaybook(null)}></div>
                        <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                            <div className="mb-4">
                                <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                                    Eliminar Playbook
                                </h3>
                                <p className="text-sm text-gray-500 text-center">
                                    ¿Estás seguro de que quieres eliminar <strong>{deletingPlaybook.title}</strong>?
                                </p>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setDeletingPlaybook(null)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleDeletePlaybook(deletingPlaybook)}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
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
