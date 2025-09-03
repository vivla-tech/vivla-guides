'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Home, HomeWithCompleteness, TechnicalPlan, CreateTechnicalPlan, ApplianceGuide, CreateApplianceGuide, Brand } from '@/lib/types';
import { FileUpload } from '@/components/ui/FileUpload';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';
import { useApiData } from '@/hooks/useApiData';
import Link from 'next/link';
import HomeSelector from '@/components/wizard/HomeSelector';
import { useSearchParams } from 'next/navigation';

// Esquemas de validación
const createTechnicalPlanSchema = z.object({
    title: z.string().min(1, 'El título es requerido'),
    description: z.string().optional(),
    plan_file_url: z.string().optional(),
});

const createApplianceGuideSchema = z.object({
    equipment_name: z.string().min(1, 'El nombre del electrodoméstico es requerido'),
    brand_id: z.string().optional(),
    model: z.string().optional(),
    brief_description: z.string().optional(),
    image_urls: z.array(z.string()).optional(),
    pdf_url: z.string().optional(),
    video_url: z.string().optional(),
    quick_use_bullets: z.string().optional(),
    maintenance_bullets: z.string().optional(),
});

type CreateTechnicalPlanFormData = z.infer<typeof createTechnicalPlanSchema>;
type CreateApplianceGuideFormData = z.infer<typeof createApplianceGuideSchema>;

export default function TechnicalDocsWizardPage() {
    const searchParams = useSearchParams();
    const homeIdFromUrl = searchParams.get('homeId');

    const [selectedHome, setSelectedHome] = useState<HomeWithCompleteness | null>(null);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Estados para planos técnicos
    const [technicalPlans, setTechnicalPlans] = useState<TechnicalPlan[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(false);
    const [showPlanForm, setShowPlanForm] = useState(false);
    const [planFileUrls, setPlanFileUrls] = useState<string[]>([]);

    // Estados para guías de electrodomésticos
    const [applianceGuides, setApplianceGuides] = useState<ApplianceGuide[]>([]);
    const [linkedGuides, setLinkedGuides] = useState<string[]>([]);
    const [loadingGuides, setLoadingGuides] = useState(false);
    const [showApplianceForm, setShowApplianceForm] = useState(false);
    const [manualFileUrls, setManualFileUrls] = useState<string[]>([]);
    const [applianceImageUrls, setApplianceImageUrls] = useState<string[]>([]);
    const [videoUrls, setVideoUrls] = useState<string[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);



    const apiClient = useMemo(() => createApiClient(config.apiUrl), []);

    // Cargar marcas
    const { data: brandsData } = useApiData<Brand>('brands', { pageSize: 100 });

    // Cargar casa si hay homeId en la URL
    useEffect(() => {
        if (homeIdFromUrl) {
            const loadHomeFromUrl = async () => {
                try {
                    const response = await apiClient.listHomesWithCompleteness({ pageSize: 100 });
                    if (response.success) {
                        const foundHome = response.data.find(h => h.id === homeIdFromUrl);
                        if (foundHome) {
                            setSelectedHome(foundHome);
                            loadTechnicalPlans(foundHome.id);
                            loadLinkedGuides(foundHome.id);
                        }
                    }
                } catch (error) {
                    console.error('Error loading home from URL:', error);
                }
            };
            loadHomeFromUrl();
        }
    }, [homeIdFromUrl, apiClient]);

    // Formularios
    const technicalPlanForm = useForm<CreateTechnicalPlanFormData>({
        resolver: zodResolver(createTechnicalPlanSchema),
        defaultValues: {
            title: '',
            description: '',
        }
    });

    const applianceGuideForm = useForm<CreateApplianceGuideFormData>({
        resolver: zodResolver(createApplianceGuideSchema),
        defaultValues: {
            equipment_name: '',
            brand_id: '',
            model: '',
            brief_description: '',
            quick_use_bullets: '',
            maintenance_bullets: '',
        }
    });

    // Cargar marcas
    useEffect(() => {
        if (brandsData) {
            setBrands(brandsData);
        }
    }, [brandsData]);

    // Cargar planos técnicos de una casa
    const loadTechnicalPlans = useCallback(async (homeId: string) => {
        setLoadingPlans(true);
        try {
            const response = await apiClient.listTechnicalPlans({ home_id: homeId });
            if (response.success) {
                setTechnicalPlans(response.data);
            }
        } catch (error) {
            console.error('Error loading technical plans:', error);
        } finally {
            setLoadingPlans(false);
        }
    }, [apiClient]);

    // Cargar guías de electrodomésticos
    const loadApplianceGuides = useCallback(async () => {
        setLoadingGuides(true);
        try {
            const response = await apiClient.listApplianceGuides({ pageSize: 100 });
            if (response.success) {
                setApplianceGuides(response.data);
            }
        } catch (error) {
            console.error('Error loading appliance guides:', error);
        } finally {
            setLoadingGuides(false);
        }
    }, [apiClient]);

    // Cargar guías vinculadas a la casa
    const loadLinkedGuides = useCallback(async (homeId: string) => {
        try {
            const response = await apiClient.listApplianceGuidesByHome(homeId);
            if (response.success) {
                // El API devuelve las guías completas ya vinculadas, usamos item.id
                const ids = response.data.map((item: { id: string }) => item.id);
                setLinkedGuides(ids);
            }
        } catch (error) {
            console.error('Error loading linked guides:', error);
        }
    }, [apiClient]);

    // Efecto para cargar datos cuando se selecciona una casa
    useEffect(() => {
        if (selectedHome) {
            loadTechnicalPlans(selectedHome.id);
            loadLinkedGuides(selectedHome.id);
            loadApplianceGuides();
        }
    }, [selectedHome, loadTechnicalPlans, loadLinkedGuides, loadApplianceGuides]);

    // Crear plano técnico
    const handleCreateTechnicalPlan = async (data: CreateTechnicalPlanFormData) => {
        if (!selectedHome) return;

        try {
            const planData: CreateTechnicalPlan = {
                home_id: selectedHome.id,
                title: data.title,
                description: data.description || '',
                plan_file_url: planFileUrls[0] || '',
            };

            const response = await apiClient.createTechnicalPlan(planData);

            if (response.success) {
                setSubmitMessage({
                    type: 'success',
                    message: '¡Plano técnico creado exitosamente!'
                });

                // Actualizar lista y resetear formulario
                await loadTechnicalPlans(selectedHome.id);
                technicalPlanForm.reset();
                setPlanFileUrls([]);
                setShowPlanForm(false);

                setTimeout(() => setSubmitMessage(null), 3000);
            }
        } catch (error) {
            console.error('Error creating technical plan:', error);
            setSubmitMessage({
                type: 'error',
                message: 'Error al crear el plano técnico'
            });
        }
    };

    // Crear guía de electrodoméstico
    const handleCreateApplianceGuide = async (data: CreateApplianceGuideFormData) => {
        try {
            const guideData: CreateApplianceGuide = {
                equipment_name: data.equipment_name,
                brand_id: data.brand_id || '',
                model: data.model || '',
                brief_description: data.brief_description || '',
                image_urls: applianceImageUrls,
                pdf_url: manualFileUrls[0] || undefined,
                video_url: videoUrls[0] || undefined,
                quick_use_bullets: data.quick_use_bullets || '',
                maintenance_bullets: data.maintenance_bullets || '',
            };

            const response = await apiClient.createApplianceGuide(guideData);

            if (response.success) {
                setSubmitMessage({
                    type: 'success',
                    message: '¡Guía de electrodoméstico creada exitosamente!'
                });

                // Actualizar lista y resetear formulario
                await loadApplianceGuides();
                applianceGuideForm.reset();
                setManualFileUrls([]);
                setApplianceImageUrls([]);
                setVideoUrls([]);
                setShowApplianceForm(false);

                setTimeout(() => setSubmitMessage(null), 3000);
            }
        } catch (error) {
            console.error('Error creating appliance guide:', error);
            setSubmitMessage({
                type: 'error',
                message: 'Error al crear la guía de electrodoméstico'
            });
        }
    };

    // Vincular/desvincular guía de electrodoméstico
    const toggleApplianceGuideLink = async (guideId: string) => {
        if (!selectedHome) return;

        try {
            const isLinked = linkedGuides.includes(guideId);

            if (isLinked) {
                await apiClient.unlinkApplianceGuide(selectedHome.id, guideId);
                setLinkedGuides(prev => prev.filter(id => id !== guideId));
                setSubmitMessage({
                    type: 'success',
                    message: 'Guía desvinculada de la casa'
                });
            } else {
                await apiClient.linkApplianceGuide(selectedHome.id, guideId);
                setLinkedGuides(prev => [...prev, guideId]);
                setSubmitMessage({
                    type: 'success',
                    message: 'Guía vinculada a la casa'
                });
            }

            setTimeout(() => setSubmitMessage(null), 2000);
        } catch (error) {
            console.error('Error toggling appliance guide link:', error);
            setSubmitMessage({
                type: 'error',
                message: 'Error al vincular/desvincular la guía'
            });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium mb-4"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Volver al Inicio
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Gestionar Documentación Técnica
                    </h1>
                    <p className="text-lg text-gray-600 mb-4">
                        Administra planos técnicos y guías de electrodomésticos por casa
                    </p>

                    {/* Help Section */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-3xl mx-auto">
                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="text-sm text-blue-800">
                                <p className="font-medium mb-1">¿Qué documentación técnica puedes gestionar?</p>
                                <p className="text-blue-700">
                                    📐 <strong>Planos técnicos:</strong> Arquitectura, electricidad, fontanería |
                                    🔌 <strong>Electrodomésticos:</strong> Manuales, mantenimiento, puntos clave
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Selección de Casa */}
                {!selectedHome ? (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                        <HomeSelector
                            selectedHome={selectedHome}
                            onHomeSelect={(home) => setSelectedHome(home)}
                            title="Seleccionar Casa para Documentación Técnica"
                            description="Elige la casa para la que quieres gestionar planos técnicos y guías de electrodomésticos"
                            showCompleteness={true}
                        />
                    </div>
                ) : (
                    <>
                        {/* Casa Seleccionada */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <span className="text-green-600 text-xl">🏠</span>
                                    <div>
                                        <h3 className="font-semibold text-green-900">{selectedHome.name}</h3>
                                        <p className="text-sm text-green-700">{selectedHome.destination}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedHome(null)}
                                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                                >
                                    Cambiar casa
                                </button>
                            </div>
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

                        {/* Dos Secciones Independientes */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Sección 1: Planos Técnicos */}
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center space-x-3">
                                        <span className="text-blue-600 text-2xl">📐</span>
                                        <h2 className="text-xl font-bold text-gray-900">Planos Técnicos</h2>
                                    </div>
                                    <button
                                        onClick={() => setShowPlanForm(!showPlanForm)}
                                        className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
                                    >
                                        {showPlanForm ? 'Cancelar' : '➕ Agregar Plano'}
                                    </button>
                                </div>

                                {/* Formulario de plano técnico */}
                                {showPlanForm && (
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                                        <form onSubmit={technicalPlanForm.handleSubmit(handleCreateTechnicalPlan)} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Título del Plano *
                                                </label>
                                                <input
                                                    type="text"
                                                    {...technicalPlanForm.register('title')}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400"
                                                    placeholder="Ej: Plano Eléctrico Principal, Fontanería..."
                                                />
                                                {technicalPlanForm.formState.errors.title && (
                                                    <p className="text-red-500 text-sm mt-1">
                                                        {technicalPlanForm.formState.errors.title.message}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Descripción (opcional)
                                                </label>
                                                <textarea
                                                    {...technicalPlanForm.register('description')}
                                                    rows={3}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400"
                                                    placeholder="Descripción adicional del plano..."
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Archivo del Plano (opcional)
                                                </label>
                                                <FileUpload
                                                    onUrlsChange={setPlanFileUrls}
                                                    accept=".pdf,image/*"
                                                    maxFiles={1}
                                                    maxSize={10}
                                                    basePath="technical-plans"
                                                />
                                            </div>

                                            <div className="flex justify-end space-x-3">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowPlanForm(false);
                                                        technicalPlanForm.reset();
                                                        setPlanFileUrls([]);
                                                    }}
                                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                                                >
                                                    Crear Plano
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {/* Lista de planos técnicos */}
                                <div>
                                    {loadingPlans ? (
                                        <div className="text-center py-8">
                                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                            <p className="text-blue-600 text-sm">Cargando planos...</p>
                                        </div>
                                    ) : technicalPlans.length > 0 ? (
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-medium text-gray-700">
                                                Planos actuales ({technicalPlans.length})
                                            </h3>
                                            {technicalPlans.map((plan) => (
                                                <div key={plan.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <h4 className="font-medium text-blue-900">{plan.title}</h4>
                                                            {plan.description && (
                                                                <p className="text-sm text-blue-700 mt-1">{plan.description}</p>
                                                            )}
                                                            {plan.plan_file_url && (
                                                                <a
                                                                    href={plan.plan_file_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-xs text-blue-600 hover:text-blue-800 mt-2 inline-flex items-center"
                                                                >
                                                                    📄 Ver archivo
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <span className="text-blue-600 text-3xl">📐</span>
                                            <p className="text-gray-500 mt-2">No hay planos técnicos</p>
                                            <p className="text-sm text-gray-400">Agrega el primer plano para esta casa</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sección 2: Guías de Electrodomésticos */}
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center space-x-3">
                                        <span className="text-orange-600 text-2xl">🔌</span>
                                        <h2 className="text-xl font-bold text-gray-900">Guías de Electrodomésticos</h2>
                                    </div>
                                    <button
                                        onClick={() => setShowApplianceForm(!showApplianceForm)}
                                        className="px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-md hover:bg-orange-100"
                                    >
                                        {showApplianceForm ? 'Cancelar' : '➕ Crear Guía'}
                                    </button>
                                </div>

                                {/* Formulario de guía de electrodoméstico */}
                                {showApplianceForm && (
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                                        <form onSubmit={applianceGuideForm.handleSubmit(handleCreateApplianceGuide)} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Nombre del Electrodoméstico *
                                                </label>
                                                <input
                                                    type="text"
                                                    {...applianceGuideForm.register('equipment_name')}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white placeholder-gray-400"
                                                    placeholder="Ej: Refrigerador, Lavadora..."
                                                />
                                                {applianceGuideForm.formState.errors.equipment_name && (
                                                    <p className="text-red-500 text-sm mt-1">
                                                        {applianceGuideForm.formState.errors.equipment_name.message}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Descripción Breve (opcional)
                                                </label>
                                                <textarea
                                                    {...applianceGuideForm.register('brief_description')}
                                                    rows={2}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white placeholder-gray-400"
                                                    placeholder="Descripción breve del electrodoméstico..."
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Marca (opcional)
                                                    </label>
                                                    <select
                                                        {...applianceGuideForm.register('brand_id')}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white"
                                                    >
                                                        <option value="">Selecciona una marca</option>
                                                        {brands.map((brand) => (
                                                            <option key={brand.id} value={brand.id}>
                                                                {brand.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {applianceGuideForm.formState.errors.brand_id && (
                                                        <p className="text-red-500 text-sm mt-1">
                                                            {applianceGuideForm.formState.errors.brand_id.message}
                                                        </p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Modelo (opcional)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        {...applianceGuideForm.register('model')}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white placeholder-gray-400"
                                                        placeholder="Modelo del electrodoméstico"
                                                    />
                                                    {applianceGuideForm.formState.errors.model && (
                                                        <p className="text-red-500 text-sm mt-1">
                                                            {applianceGuideForm.formState.errors.model.message}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Imágenes del Electrodoméstico (opcional)
                                                </label>
                                                <p className="text-sm text-gray-500 mb-2">
                                                    Sube imágenes del electrodoméstico para identificarlo fácilmente
                                                </p>
                                                <FileUpload
                                                    onUrlsChange={setApplianceImageUrls}
                                                    accept="image/*"
                                                    maxFiles={5}
                                                    maxSize={5}
                                                    basePath="appliance-images"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Manual PDF (opcional)
                                                </label>
                                                <FileUpload
                                                    onUrlsChange={setManualFileUrls}
                                                    accept=".pdf"
                                                    maxFiles={1}
                                                    maxSize={10}
                                                    basePath="appliance-manuals"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Video Tutorial (opcional)
                                                </label>
                                                <p className="text-sm text-gray-500 mb-2">
                                                    Sube un video explicativo de uso o mantenimiento
                                                </p>
                                                <FileUpload
                                                    onUrlsChange={setVideoUrls}
                                                    accept="video/*"
                                                    maxFiles={1}
                                                    maxSize={50}
                                                    basePath="appliance-videos"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Puntos de Uso Rápido (opcional)
                                                </label>
                                                <textarea
                                                    {...applianceGuideForm.register('quick_use_bullets')}
                                                    rows={3}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white placeholder-gray-400"
                                                    placeholder="• Punto importante 1&#10;• Punto importante 2..."
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Puntos de Mantenimiento (opcional)
                                                </label>
                                                <textarea
                                                    {...applianceGuideForm.register('maintenance_bullets')}
                                                    rows={3}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white placeholder-gray-400"
                                                    placeholder="• Limpiar cada mes&#10;• Revisar filtros&#10;• Punto de mantenimiento..."
                                                />
                                            </div>

                                            <div className="flex justify-end space-x-3">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowApplianceForm(false);
                                                        applianceGuideForm.reset();
                                                        setManualFileUrls([]);
                                                        setApplianceImageUrls([]);
                                                        setVideoUrls([]);
                                                    }}
                                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700"
                                                >
                                                    Crear Guía
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {/* Guías vinculadas a esta casa */}
                                <div className="mb-6">
                                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                                        Guías vinculadas a esta casa ({linkedGuides.length})
                                    </h3>
                                    {linkedGuides.length > 0 ? (
                                        <div className="space-y-2">
                                            {applianceGuides
                                                .filter(guide => linkedGuides.includes(guide.id))
                                                .map((guide) => {
                                                    const brand = brands.find(b => b.id === guide.brand_id);
                                                    return (
                                                        <div key={guide.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex-1">
                                                                    <h4 className="font-medium text-sm text-green-900">
                                                                        {guide.equipment_name}
                                                                    </h4>
                                                                    <p className="text-xs text-green-700">
                                                                        {brand?.name || 'Sin marca'} {guide.model && `- ${guide.model}`}
                                                                    </p>
                                                                    {guide.brief_description && (
                                                                        <p className="text-xs text-green-600 mt-1">
                                                                            {guide.brief_description}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center space-x-2 ml-3">
                                                                    <span className="text-green-600 text-xs font-medium">✓ Vinculada</span>
                                                                    <button
                                                                        onClick={() => toggleApplianceGuideLink(guide.id)}
                                                                        className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100"
                                                                    >
                                                                        Desvincular
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                            <p className="text-gray-500 text-sm">No hay guías vinculadas a esta casa</p>
                                        </div>
                                    )}
                                </div>

                                {/* Lista de todas las guías para gestionar vinculación */}
                                <div>
                                    {loadingGuides ? (
                                        <div className="text-center py-8">
                                            <div className="w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                            <p className="text-orange-600 text-sm">Cargando guías...</p>
                                        </div>
                                    ) : applianceGuides.length > 0 ? (
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-medium text-gray-700">
                                                Todas las guías ({applianceGuides.length}) - Gestionar vinculación
                                            </h3>
                                            <div className="max-h-64 overflow-y-auto space-y-2">
                                                {applianceGuides.map((guide) => {
                                                    const isLinked = linkedGuides.includes(guide.id);
                                                    const brand = brands.find(b => b.id === guide.brand_id);
                                                    return (
                                                        <div key={guide.id} className={`border rounded-lg p-3 ${isLinked ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'
                                                            }`}>
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex-1">
                                                                    <h4 className={`font-medium text-sm ${isLinked ? 'text-orange-900' : 'text-gray-900'}`}>
                                                                        {guide.equipment_name}
                                                                    </h4>
                                                                    <p className={`text-xs ${isLinked ? 'text-orange-700' : 'text-gray-600'}`}>
                                                                        {brand?.name || 'Sin marca'} {guide.model && `- ${guide.model}`}
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    onClick={() => toggleApplianceGuideLink(guide.id)}
                                                                    className={`px-3 py-1 text-xs font-medium rounded-md ${isLinked
                                                                        ? 'text-red-600 bg-red-50 border border-red-200 hover:bg-red-100'
                                                                        : 'text-orange-600 bg-orange-50 border border-orange-200 hover:bg-orange-100'
                                                                        }`}
                                                                >
                                                                    {isLinked ? 'Desvincular' : 'Vincular'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <span className="text-orange-600 text-3xl">🔌</span>
                                            <p className="text-gray-500 mt-2">No hay guías de electrodomésticos</p>
                                            <p className="text-sm text-gray-400">Crea la primera guía</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}