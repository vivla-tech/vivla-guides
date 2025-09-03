'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Home, Room, StylingGuide, HomeWithCompleteness, CreateStylingGuide, RoomType, CreateRoom, Playbook, CreatePlaybook } from '@/lib/types';
import { FileUpload } from '@/components/ui/FileUpload';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';
import { useApiData } from '@/hooks/useApiData';
import Link from 'next/link';
import HomeSelector from '@/components/wizard/HomeSelector';
import { useSearchParams } from 'next/navigation';

// Esquemas de validación para cada paso
const createStylingGuideSchema = z.object({
    title: z.string().min(1, 'El título es requerido'),
    reference_photo_url: z.string().optional(),
    image_urls: z.array(z.string()).optional(),
});

const createRoomSchema = z.object({
    name: z.string().min(1, 'El nombre de la habitación es requerido'),
    room_type_id: z.string().min(1, 'El tipo de habitación es requerido'),
    description: z.string().optional(),
});

const createPlaybookSchema = z.object({
    title: z.string().min(1, 'El título del playbook es requerido'),
    type: z.string().min(1, 'El tipo es requerido'),
    estimated_time: z.string().min(1, 'El tiempo estimado es requerido'),
    tasks: z.string().min(1, 'Las tareas son requeridas'),
    materials: z.string().optional(),
});

type CreateStylingGuideFormData = z.infer<typeof createStylingGuideSchema>;
type CreateRoomFormData = z.infer<typeof createRoomSchema>;
type CreatePlaybookFormData = z.infer<typeof createPlaybookSchema>;

interface WizardState {
    currentStep: number;
    home: HomeWithCompleteness | null;
    room: Room | null;
}

const STEPS = [
    { id: 1, title: 'Seleccionar Casa y Habitación', description: 'Elige la casa y habitación para crear la guía de estilo' },
    { id: 2, title: 'Crear Guía de Estilo', description: 'Define el título y sube imágenes de referencia' },
    { id: 3, title: 'Añadir Playbooks (Opcional)', description: 'Crea guías de procesos para esta habitación' },
];

export default function StylingGuidesWizardPage() {
    const searchParams = useSearchParams();
    const homeIdFromUrl = searchParams.get('homeId');
    const roomIdFromUrl = searchParams.get('roomId');

    const [wizardState, setWizardState] = useState<WizardState>({
        currentStep: homeIdFromUrl ? 2 : 1, // Saltar al paso 2 si hay homeId en URL
        home: null,
        room: null,
    });

    const [rooms, setRooms] = useState<Room[]>([]);
    const [loadingRooms, setLoadingRooms] = useState(false);

    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [referenceImageUrls, setReferenceImageUrls] = useState<string[]>([]);
    const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
    const [creatingRoom, setCreatingRoom] = useState(false);
    const [playbooks, setPlaybooks] = useState<CreatePlaybookFormData[]>([]);
    const [showPlaybookForm, setShowPlaybookForm] = useState(false);

    const apiClient = useMemo(() => createApiClient(config.apiUrl), []);

    // Cargar tipos de habitación
    const { data: roomTypesData } = useApiData<RoomType>('rooms-type', { pageSize: 100 });

    // Cargar casa y habitación si hay parámetros en la URL
    useEffect(() => {
        if (homeIdFromUrl) {
            const loadHomeFromUrl = async () => {
                try {
                    const response = await apiClient.listHomesWithCompleteness({ pageSize: 100 });
                    if (response.success) {
                        const foundHome = response.data.find(h => h.id === homeIdFromUrl);
                        if (foundHome) {
                            setWizardState(prev => ({ ...prev, home: foundHome }));
                            loadRooms(foundHome.id);

                            // Si también hay roomId, cargar la habitación
                            if (roomIdFromUrl) {
                                const roomResponse = await apiClient.listRooms({ home_id: homeIdFromUrl });
                                if (roomResponse.success) {
                                    const foundRoom = roomResponse.data.find(r => r.id === roomIdFromUrl);
                                    if (foundRoom) {
                                        setWizardState(prev => ({ ...prev, room: foundRoom }));
                                    }
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error loading home/room from URL:', error);
                }
            };
            loadHomeFromUrl();
        }
    }, [homeIdFromUrl, roomIdFromUrl, apiClient]);

    useEffect(() => {
        if (roomTypesData) {
            setRoomTypes(roomTypesData);
        }
    }, [roomTypesData]);

    // Formularios
    const stylingGuideForm = useForm<CreateStylingGuideFormData>({
        resolver: zodResolver(createStylingGuideSchema),
        defaultValues: {
            title: '',
        }
    });

    const createRoomForm = useForm<CreateRoomFormData>({
        resolver: zodResolver(createRoomSchema),
        defaultValues: {
            name: '',
            room_type_id: '',
            description: '',
        }
    });

    const createPlaybookForm = useForm<CreatePlaybookFormData>({
        resolver: zodResolver(createPlaybookSchema),
        defaultValues: {
            title: '',
            type: '',
            estimated_time: '',
            tasks: '',
            materials: '',
        }
    });

    const handleNextStep = () => {
        if (wizardState.currentStep < STEPS.length) {
            setSubmitMessage(null); // Limpiar mensaje al navegar
            setWizardState(prev => ({
                ...prev,
                currentStep: prev.currentStep + 1
            }));
        }
    };

    const handlePrevStep = () => {
        if (wizardState.currentStep > 1) {
            setSubmitMessage(null); // Limpiar mensaje al navegar
            setWizardState(prev => ({
                ...prev,
                currentStep: prev.currentStep - 1
            }));
        }
    };

    // Cargar habitaciones de una casa específica
    const loadRooms = useCallback(async (homeId: string) => {
        if (!homeId) return;
        setLoadingRooms(true);
        try {
            const response = await apiClient.listRoomsByHome(homeId);
            if (response.success) {
                setRooms(response.data);
            }
        } catch (error) {
            console.error('Error loading rooms:', error);
        } finally {
            setLoadingRooms(false);
        }
    }, [apiClient]);



    // Función para crear nueva habitación
    const handleCreateRoom = async (data: CreateRoomFormData) => {
        if (!wizardState.home) return;

        setCreatingRoom(true);
        try {
            const response = await apiClient.createRoom({
                home_id: wizardState.home.id,
                name: data.name,
                room_type_id: data.room_type_id,
                description: data.description || '',
            });

            if (response.success) {
                // Actualizar lista de habitaciones
                await loadRooms(wizardState.home.id);

                // Cerrar modal y limpiar formulario
                setShowCreateRoomModal(false);
                createRoomForm.reset();

                setSubmitMessage({
                    type: 'success',
                    message: `¡Habitación "${data.name}" creada exitosamente!`
                });

                // Limpiar mensaje después de 3 segundos
                setTimeout(() => setSubmitMessage(null), 3000);
            }
        } catch (error) {
            console.error('Error creating room:', error);
            setSubmitMessage({
                type: 'error',
                message: 'Error al crear la habitación'
            });
        } finally {
            setCreatingRoom(false);
        }
    };

    // Función para enviar el formulario de guía de estilo
    const handleSubmitStylingGuide = async (data: CreateStylingGuideFormData) => {
        if (!wizardState.room) return;

        try {
            const stylingGuideData: CreateStylingGuide = {
                room_id: wizardState.room.id,
                title: data.title,
                reference_photo_url: referenceImageUrls[0] || undefined,
                image_urls: imageUrls,
            };

            const response = await apiClient.createStylingGuide(stylingGuideData);

            if (response.success) {
                setSubmitMessage({
                    type: 'success',
                    message: '¡Guía de estilo creada exitosamente!'
                });
                // Avanzar al paso 3 en lugar de redirigir
                handleNextStep();
            }
        } catch (error) {
            console.error('❌ Error creating styling guide:', error);
            setSubmitMessage({
                type: 'error',
                message: 'Error al crear la guía de estilo'
            });
        }
    };

    // Función para añadir playbook a la lista
    const handleAddPlaybook = (data: CreatePlaybookFormData) => {
        setPlaybooks(prev => [...prev, data]);
        createPlaybookForm.reset();
        setShowPlaybookForm(false);
    };

    // Función para eliminar playbook de la lista
    const handleRemovePlaybook = (index: number) => {
        setPlaybooks(prev => prev.filter((_, i) => i !== index));
    };

    // Función para finalizar el wizard
    const handleFinishWizard = async () => {
        if (!wizardState.room) return;

        // Crear playbooks si los hay
        if (playbooks.length > 0) {
            try {
                for (const playbook of playbooks) {
                    const playbookData: CreatePlaybook = {
                        room_id: wizardState.room.id,
                        title: playbook.title,
                        type: playbook.type,
                        estimated_time: playbook.estimated_time,
                        tasks: playbook.tasks,
                        materials: playbook.materials || '',
                    };
                    await apiClient.createPlaybook(playbookData);
                }

                setSubmitMessage({
                    type: 'success',
                    message: `¡Guía de estilo y ${playbooks.length} playbook${playbooks.length !== 1 ? 's' : ''} creados exitosamente! Redirigiendo...`
                });
            } catch (error) {
                console.error('❌ Error creating playbooks:', error);
                setSubmitMessage({
                    type: 'error',
                    message: 'Error al crear los playbooks'
                });
                return;
            }
        } else {
            setSubmitMessage({
                type: 'success',
                message: '¡Guía de estilo creada exitosamente!'
            });

            // Mostrar enlace para ver todas las guías después de 2 segundos
            setTimeout(() => {
                setSubmitMessage({
                    type: 'success',
                    message: `¡Guía de estilo creada exitosamente! ¿Quieres ver todas las guías de ${wizardState.home?.name}?`
                });
            }, 2000);
        }

        // No redirigir automáticamente, dejar que el usuario decida
    };

    const renderStepContent = () => {
        switch (wizardState.currentStep) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Seleccionar Casa y Habitación
                            </h2>
                            <p className="text-gray-600">
                                Elige la casa y habitación para la que quieres crear una guía de estilo
                            </p>
                        </div>

                        {/* Selección de Casa */}
                        {!wizardState.home && (
                            <HomeSelector
                                selectedHome={wizardState.home}
                                onHomeSelect={(home) => {
                                    setWizardState(prev => ({ ...prev, home }));
                                    loadRooms(home.id);
                                }}
                                title="Seleccionar Casa para Guía de Estilo"
                                description="Elige la casa para la que quieres crear una guía de estilo"
                                showCompleteness={true}
                            />
                        )}

                        {/* Selección de Habitación */}
                        {wizardState.home && !wizardState.room && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        2. Selecciona una Habitación en &quot;{wizardState.home.name}&quot;
                                    </h3>
                                    <button
                                        onClick={() => setWizardState(prev => ({ ...prev, home: null }))}
                                        className="text-sm text-purple-600 hover:text-purple-800"
                                    >
                                        Cambiar casa
                                    </button>
                                </div>

                                {loadingRooms ? (
                                    <div className="text-center py-8">
                                        <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                        <p className="text-purple-600 text-sm">Cargando habitaciones...</p>
                                    </div>
                                ) : rooms.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                        {rooms.map((room) => (
                                            <div
                                                key={room.id}
                                                className="bg-white border border-purple-200 rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer hover:border-purple-300"
                                                onClick={() => {
                                                    setWizardState(prev => ({ ...prev, room }));
                                                }}
                                            >
                                                <div className="text-center">
                                                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                                        <span className="text-purple-600 text-sm">🚪</span>
                                                    </div>
                                                    <h4 className="font-medium text-gray-900 text-sm">{room.name}</h4>
                                                    <p className="text-xs text-gray-500">
                                                        {roomTypes.find(rt => rt.id === room.room_type_id)?.name || 'Sin tipo'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <span className="text-purple-600 text-xl">🚪</span>
                                        </div>
                                        <p className="text-gray-500 mb-2">No hay habitaciones en esta casa</p>
                                        <button
                                            onClick={() => setShowCreateRoomModal(true)}
                                            className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                                        >
                                            ➕ Crear nueva habitación
                                        </button>
                                    </div>
                                )}

                                {/* Botón para crear habitación cuando hay habitaciones existentes */}
                                {rooms.length > 0 && (
                                    <div className="text-center mt-4">
                                        <button
                                            onClick={() => setShowCreateRoomModal(true)}
                                            className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                                        >
                                            ➕ ¿No encuentras la habitación? Crear nueva
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Confirmación y Botón para Continuar */}
                        {wizardState.home && wizardState.room && (
                            <div className="space-y-4">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <span className="text-green-600 text-2xl">✨</span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-green-900 mb-2">
                                        ¡Perfecto! Vamos a crear tu guía de estilo
                                    </h3>
                                    <p className="text-green-700 mb-1">
                                        <strong>Casa:</strong> {wizardState.home.name}
                                    </p>
                                    <p className="text-green-700">
                                        <strong>Habitación:</strong> {wizardState.room.name}
                                    </p>
                                </div>

                                <div className="flex justify-between pt-4">
                                    <button
                                        onClick={() => setWizardState(prev => ({ ...prev, room: null }))}
                                        className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                                    >
                                        ← Cambiar Habitación
                                    </button>
                                    <button
                                        onClick={handleNextStep}
                                        className="px-6 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                                    >
                                        Crear Guía de Estilo →
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Crear Guía de Estilo
                            </h2>
                            <p className="text-gray-600">
                                Define el título y sube imágenes de referencia para <strong>{wizardState.room?.name}</strong> en <strong>{wizardState.home?.name}</strong>
                            </p>
                        </div>

                        <form onSubmit={stylingGuideForm.handleSubmit(handleSubmitStylingGuide)} className="space-y-6">
                            {/* Título de la guía */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Título de la Guía de Estilo *
                                </label>
                                <input
                                    type="text"
                                    {...stylingGuideForm.register('title')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white placeholder-gray-400"
                                    placeholder="Ej: Estilo Nórdico, Decoración Moderna, Ambiente Rústico..."
                                />
                                {stylingGuideForm.formState.errors.title && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {stylingGuideForm.formState.errors.title.message}
                                    </p>
                                )}
                            </div>

                            {/* Imagen de referencia principal */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Imagen de Referencia Principal (opcional)
                                </label>
                                <p className="text-sm text-gray-500 mb-3">
                                    Sube una imagen que represente mejor el estilo de esta habitación
                                </p>
                                <FileUpload
                                    onUrlsChange={setReferenceImageUrls}
                                    accept="image/*"
                                    maxFiles={1}
                                    maxSize={5}
                                    basePath="styling-guides/reference"
                                />
                            </div>

                            {/* Galería de imágenes de inspiración */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Galería de Inspiración (opcional)
                                </label>
                                <p className="text-sm text-gray-500 mb-3">
                                    Sube múltiples imágenes que sirvan de inspiración para el estilo
                                </p>
                                <FileUpload
                                    onUrlsChange={setImageUrls}
                                    accept="image/*"
                                    maxFiles={10}
                                    maxSize={5}
                                    basePath="styling-guides/gallery"
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
                            <div className="flex justify-between">
                                <button
                                    type="button"
                                    onClick={handlePrevStep}
                                    className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                                >
                                    Anterior
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                                >
                                    <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Crear Guía de Estilo
                                </button>
                            </div>
                        </form>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Añadir Playbooks (Opcional)
                            </h2>
                            <p className="text-gray-600">
                                Crea guías de procesos para <strong>{wizardState.room?.name}</strong> en <strong>{wizardState.home?.name}</strong>
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                Los playbooks son guías paso a paso para tareas específicas de esta habitación
                            </p>
                        </div>

                        {/* Lista de playbooks agregados */}
                        {playbooks.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Playbooks agregados ({playbooks.length})
                                </h3>
                                {playbooks.map((playbook, index) => (
                                    <div key={index} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h4 className="font-medium text-purple-900">{playbook.title}</h4>
                                                <p className="text-xs text-purple-600 mt-1">
                                                    <span className="font-medium">Tipo:</span> {playbook.type} |
                                                    <span className="font-medium ml-2">Tiempo:</span> {playbook.estimated_time}
                                                </p>
                                                <p className="text-sm text-purple-700 mt-1">{playbook.tasks}</p>
                                                {playbook.materials && (
                                                    <p className="text-xs text-purple-600 mt-1">
                                                        <span className="font-medium">Materiales:</span> {playbook.materials}
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleRemovePlaybook(index)}
                                                className="text-red-500 hover:text-red-700 ml-3"
                                                title="Eliminar playbook"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Formulario para agregar playbook */}
                        {showPlaybookForm ? (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Nuevo Playbook</h3>
                                <form onSubmit={createPlaybookForm.handleSubmit(handleAddPlaybook)} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Título del Playbook *
                                        </label>
                                        <input
                                            type="text"
                                            {...createPlaybookForm.register('title')}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white placeholder-gray-400"
                                            placeholder="Ej: Limpieza Diaria, Preparación Huéspedes..."
                                        />
                                        {createPlaybookForm.formState.errors.title && (
                                            <p className="text-red-500 text-sm mt-1">
                                                {createPlaybookForm.formState.errors.title.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Tipo de Procedimiento *
                                            </label>
                                            <select
                                                {...createPlaybookForm.register('type')}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                                            >
                                                <option value="">Selecciona un tipo</option>
                                                <option value="limpieza">Limpieza</option>
                                                <option value="mantenimiento">Mantenimiento</option>
                                                <option value="preparacion">Preparación</option>
                                                <option value="revision">Revisión</option>
                                                <option value="emergencia">Emergencia</option>
                                            </select>
                                            {createPlaybookForm.formState.errors.type && (
                                                <p className="text-red-500 text-sm mt-1">
                                                    {createPlaybookForm.formState.errors.type.message}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Tiempo Estimado *
                                            </label>
                                            <input
                                                type="text"
                                                {...createPlaybookForm.register('estimated_time')}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white placeholder-gray-400"
                                                placeholder="Ej: 30 minutos, 1 hora..."
                                            />
                                            {createPlaybookForm.formState.errors.estimated_time && (
                                                <p className="text-red-500 text-sm mt-1">
                                                    {createPlaybookForm.formState.errors.estimated_time.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Tareas/Pasos a Seguir *
                                        </label>
                                        <textarea
                                            {...createPlaybookForm.register('tasks')}
                                            rows={4}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white placeholder-gray-400"
                                            placeholder="1. Primer paso...&#10;2. Segundo paso...&#10;3. Tercer paso..."
                                        />
                                        {createPlaybookForm.formState.errors.tasks && (
                                            <p className="text-red-500 text-sm mt-1">
                                                {createPlaybookForm.formState.errors.tasks.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Materiales Necesarios (opcional)
                                        </label>
                                        <textarea
                                            {...createPlaybookForm.register('materials')}
                                            rows={2}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white placeholder-gray-400"
                                            placeholder="Productos de limpieza, herramientas, etc..."
                                        />
                                    </div>

                                    <div className="flex justify-end space-x-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowPlaybookForm(false);
                                                createPlaybookForm.reset();
                                            }}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700"
                                        >
                                            Agregar Playbook
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <div className="text-center">
                                <button
                                    onClick={() => setShowPlaybookForm(true)}
                                    className="px-6 py-3 text-sm font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100"
                                >
                                    ➕ Agregar Playbook
                                </button>
                            </div>
                        )}

                        {/* Mensaje de estado */}
                        {submitMessage && (
                            <div className={`p-4 rounded-md ${submitMessage.type === 'success'
                                ? 'bg-green-50 text-green-800 border border-green-200'
                                : 'bg-red-50 text-red-800 border border-red-200'
                                }`}>
                                <div className="flex items-center justify-between">
                                    <span>{submitMessage.message}</span>
                                    {submitMessage.type === 'success' && submitMessage.message.includes('¿Quieres ver todas las guías') && (
                                        <Link
                                            href={`/home/${wizardState.home?.id}/styling-guides`}
                                            className="ml-4 px-3 py-1 text-xs font-medium text-green-700 bg-green-100 border border-green-200 rounded hover:bg-green-200"
                                        >
                                            Ver Guías →
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Botones */}
                        <div className="flex justify-between">
                            <button
                                type="button"
                                onClick={handlePrevStep}
                                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                            >
                                ← Anterior
                            </button>
                            <button
                                onClick={handleFinishWizard}
                                className="px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                            >
                                <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {playbooks.length > 0 ? `Finalizar con ${playbooks.length} Playbook${playbooks.length !== 1 ? 's' : ''}` : 'Finalizar sin Playbooks'}
                            </button>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <>
            {/* Modal para crear habitación */}
            {showCreateRoomModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black opacity-30" onClick={() => setShowCreateRoomModal(false)}></div>
                        <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Crear Nueva Habitación
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Casa: <strong>{wizardState.home?.name}</strong>
                                </p>
                            </div>

                            <form onSubmit={createRoomForm.handleSubmit(handleCreateRoom)} className="space-y-4">
                                {/* Nombre de la habitación */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nombre de la Habitación *
                                    </label>
                                    <input
                                        type="text"
                                        {...createRoomForm.register('name')}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white placeholder-gray-400"
                                        placeholder="Ej: Dormitorio Principal, Cocina..."
                                    />
                                    {createRoomForm.formState.errors.name && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {createRoomForm.formState.errors.name.message}
                                        </p>
                                    )}
                                </div>

                                {/* Tipo de habitación */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tipo de Habitación *
                                    </label>
                                    <select
                                        {...createRoomForm.register('room_type_id')}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                                    >
                                        <option value="">Selecciona un tipo</option>
                                        {roomTypes.map((type) => (
                                            <option key={type.id} value={type.id}>
                                                {type.name}
                                            </option>
                                        ))}
                                    </select>
                                    {createRoomForm.formState.errors.room_type_id && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {createRoomForm.formState.errors.room_type_id.message}
                                        </p>
                                    )}
                                </div>

                                {/* Descripción (opcional) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Descripción (opcional)
                                    </label>
                                    <textarea
                                        {...createRoomForm.register('description')}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white placeholder-gray-400"
                                        placeholder="Descripción adicional de la habitación..."
                                    />
                                </div>

                                {/* Botones */}
                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCreateRoomModal(false);
                                            createRoomForm.reset();
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creatingRoom}
                                        className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {creatingRoom ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block"></div>
                                                Creando...
                                            </>
                                        ) : (
                                            'Crear Habitación'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <Link
                            href="/"
                            className="inline-flex items-center text-purple-600 hover:text-purple-800 text-sm font-medium mb-4"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Volver al Inicio
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Crear Guía de Estilo
                        </h1>
                        <p className="text-lg text-gray-600 mb-4">
                            Asistente paso a paso para crear guías de decoración y estilo por habitación
                        </p>

                        {/* Help Section */}
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 max-w-2xl mx-auto">
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0">
                                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="text-sm text-purple-800">
                                    <p className="font-medium mb-1">¿Para qué crear guías de estilo?</p>
                                    <p className="text-purple-700">
                                        Las guías de estilo ayudan a mantener la coherencia decorativa en cada habitación,
                                        proporcionando referencias visuales e inspiración para la decoración.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                                Paso {wizardState.currentStep} de {STEPS.length}
                            </span>
                            <span className="text-sm text-gray-500">
                                {Math.round((wizardState.currentStep / STEPS.length) * 100)}% completado
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(wizardState.currentStep / STEPS.length) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Steps Indicator */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            {STEPS.map((step, index) => (
                                <div key={step.id} className="flex items-center">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${index + 1 < wizardState.currentStep
                                        ? 'bg-purple-600 border-purple-600 text-white'
                                        : index + 1 === wizardState.currentStep
                                            ? 'border-purple-600 text-purple-600'
                                            : 'border-gray-300 text-gray-400'
                                        }`}>
                                        {index + 1 < wizardState.currentStep ? (
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            step.id
                                        )}
                                    </div>
                                    <div className="ml-3">
                                        <div className={`text-sm font-medium ${index + 1 <= wizardState.currentStep ? 'text-purple-600' : 'text-gray-500'
                                            }`}>
                                            {step.title}
                                        </div>
                                        <div className="text-xs text-gray-500">{step.description}</div>
                                    </div>
                                    {index < STEPS.length - 1 && (
                                        <div className={`hidden sm:block mx-4 w-12 h-0.5 ${index + 1 < wizardState.currentStep ? 'bg-purple-600' : 'bg-gray-300'
                                            }`}></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Step Content */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        {renderStepContent()}
                    </div>
                </div>
            </div>
        </>
    );
}