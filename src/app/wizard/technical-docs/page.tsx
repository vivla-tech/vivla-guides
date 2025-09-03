'use client';

import { useState, useMemo, useCallback, useEffect, Suspense } from 'react';
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

function TechnicalDocsWizardContent() {
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
            pdf_url: '',
            video_url: '',
            quick_use_bullets: '',
            maintenance_bullets: '',
        }
    });

    // Cargar planos técnicos
    const loadTechnicalPlans = async (homeId: string) => {
        setLoadingPlans(true);
        try {
            const response = await apiClient.listTechnicalPlans({ home_id: homeId, pageSize: 100 });
            if (response.success) {
                setTechnicalPlans(response.data);
            }
        } catch (error) {
            console.error('Error loading technical plans:', error);
        } finally {
            setLoadingPlans(false);
        }
    };

    // Cargar guías de electrodomésticos vinculadas
    const loadLinkedGuides = async (homeId: string) => {
        setLoadingGuides(true);
        try {
            const response = await apiClient.listApplianceGuides({ home_id: homeId, pageSize: 100 });
            if (response.success) {
                setApplianceGuides(response.data);
                setLinkedGuides(response.data.map(guide => guide.id));
            }
        } catch (error) {
            console.error('Error loading appliance guides:', error);
        } finally {
            setLoadingGuides(false);
        }
    };

    // Cargar marcas
    useEffect(() => {
        if (brandsData) {
            setBrands(brandsData);
        }
    }, [brandsData]);

    // Crear plano técnico
    const handleCreateTechnicalPlan = async (data: CreateTechnicalPlanFormData) => {
        if (!selectedHome) return;

        try {
            const payload = {
                home_id: selectedHome.id,
                title: data.title,
                description: data.description || '',
                plan_file_url: planFileUrls[0] || '',
            };

            await apiClient.createTechnicalPlan(payload);
            setSubmitMessage({ type: 'success', message: 'Plano técnico creado exitosamente' });
            technicalPlanForm.reset();
            setPlanFileUrls([]);
            setShowPlanForm(false);
            loadTechnicalPlans(selectedHome.id);
        } catch (error) {
            console.error('Error creating technical plan:', error);
            setSubmitMessage({ type: 'error', message: 'Error al crear el plano técnico' });
        }
    };

    // Crear guía de electrodoméstico
    const handleCreateApplianceGuide = async (data: CreateApplianceGuideFormData) => {
        if (!selectedHome) return;

        try {
            const payload = {
                equipment_name: data.equipment_name,
                brand_id: data.brand_id || '',
                model: data.model || '',
                brief_description: data.brief_description || '',
                image_urls: applianceImageUrls,
                pdf_url: manualFileUrls[0] || '',
                video_url: videoUrls[0] || '',
                quick_use_bullets: data.quick_use_bullets || '',
                maintenance_bullets: data.maintenance_bullets || '',
            };

            const guideResponse = await apiClient.createApplianceGuide(payload);
            if (guideResponse.success) {
                // Vincular la guía con la casa
                await apiClient.linkApplianceGuide(selectedHome.id, guideResponse.data.id);
                setSubmitMessage({ type: 'success', message: 'Guía de electrodoméstico creada y vinculada exitosamente' });
                applianceGuideForm.reset();
                setManualFileUrls([]);
                setApplianceImageUrls([]);
                setVideoUrls([]);
                setShowApplianceForm(false);
                loadLinkedGuides(selectedHome.id);
            }
        } catch (error) {
            console.error('Error creating appliance guide:', error);
            setSubmitMessage({ type: 'error', message: 'Error al crear la guía de electrodoméstico' });
        }
    };

    // Filtrar guías no vinculadas
    const unlinkedGuides = applianceGuides.filter(guide => !linkedGuides.includes(guide.id));

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center text-green-600 hover:text-green-800 text-sm font-medium mb-4"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Volver al Inicio
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Documentación Técnica
                    </h1>
                    <p className="text-lg text-gray-600 mb-4">
                        Planos técnicos y guías de electrodomésticos para tu casa
                    </p>

                    {/* Help Section */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-2xl mx-auto">
                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="text-sm text-green-800">
                                <p className="font-medium mb-1">¿Para qué crear documentación técnica?</p>
                                <p className="text-green-700">
                                    Los planos técnicos y guías de electrodomésticos ayudan a mantener y operar correctamente
                                    todos los sistemas y equipos de la casa.
                                </p>
                            </div>
                        </div>
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

                {/* Selección de Casa */}
                {!selectedHome && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <HomeSelector
                            selectedHome={selectedHome}
                            onHomeSelect={(home) => {
                                setSelectedHome(home);
                                if (home) {
                                    loadTechnicalPlans(home.id);
                                    loadLinkedGuides(home.id);
                                }
                            }}
                            title="Seleccionar Casa para Documentación Técnica"
                            description="Elige la casa para la que quieres crear documentación técnica"
                            showCompleteness={true}
                        />
                    </div>
                )}

                {/* Contenido Principal */}
                {selectedHome && (
                    <div className="space-y-8">
                        {/* Header de la casa seleccionada */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        Documentación Técnica de {selectedHome.name}
                                    </h2>
                                    <p className="text-gray-600 mt-1">
                                        {selectedHome.address} • {selectedHome.destination}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedHome(null)}
                                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                                >
                                    Cambiar casa
                                </button>
                            </div>
                        </div>

                        {/* Planos Técnicos */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">Planos Técnicos</h3>
                                <button
                                    onClick={() => setShowPlanForm(true)}
                                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                                >
                                    ➕ Crear Plano Técnico
                                </button>
                            </div>

                            {loadingPlans ? (
                                <div className="text-center py-8">
                                    <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                    <p className="text-green-600 text-sm">Cargando planos técnicos...</p>
                                </div>
                            ) : technicalPlans.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {technicalPlans.map((plan) => (
                                        <div key={plan.id} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center space-x-3 mb-3">
                                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                    <span className="text-green-600 text-sm">📐</span>
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-900">{plan.title}</h4>
                                                    <p className="text-sm text-gray-500">{plan.description || 'Sin descripción'}</p>
                                                </div>
                                            </div>
                                            {plan.plan_file_url && (
                                                <div className="mt-2">
                                                    <a
                                                        href={plan.plan_file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                                                    >
                                                        📄 Ver plano
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <span className="text-green-600 text-xl">📐</span>
                                    </div>
                                    <p className="text-green-600 mb-2">No hay planos técnicos</p>
                                    <p className="text-sm text-green-500">Crea el primer plano técnico para esta casa</p>
                                </div>
                            )}
                        </div>

                        {/* Guías de Electrodomésticos */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">Guías de Electrodomésticos</h3>
                                <button
                                    onClick={() => setShowApplianceForm(true)}
                                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                                >
                                    ➕ Crear Guía de Electrodoméstico
                                </button>
                            </div>

                            {loadingGuides ? (
                                <div className="text-center py-8">
                                    <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                    <p className="text-green-600 text-sm">Cargando guías de electrodomésticos...</p>
                                </div>
                            ) : linkedGuides.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {applianceGuides.filter(guide => linkedGuides.includes(guide.id)).map((guide) => (
                                        <div key={guide.id} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center space-x-3 mb-3">
                                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                    <span className="text-green-600 text-sm">🔌</span>
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-900">{guide.equipment_name}</h4>
                                                    <p className="text-sm text-gray-500">
                                                        {guide.brand_id && brands.find(b => b.id === guide.brand_id)?.name} • {guide.model}
                                                    </p>
                                                </div>
                                            </div>
                                            {guide.brief_description && (
                                                <p className="text-sm text-gray-600 mb-2">{guide.brief_description}</p>
                                            )}
                                            <div className="flex space-x-2 text-xs">
                                                {guide.pdf_url && (
                                                    <a
                                                        href={guide.pdf_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-green-600 hover:text-green-800"
                                                    >
                                                        📄 Manual
                                                    </a>
                                                )}
                                                {guide.video_url && (
                                                    <a
                                                        href={guide.video_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-green-600 hover:text-green-800"
                                                    >
                                                        🎥 Video
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <span className="text-green-600 text-xl">🔌</span>
                                    </div>
                                    <p className="text-green-600 mb-2">No hay guías de electrodomésticos</p>
                                    <p className="text-sm text-green-500">Crea la primera guía de electrodoméstico para esta casa</p>
                                </div>
                            )}

                            {/* Guías no vinculadas */}
                            {unlinkedGuides.length > 0 && (
                                <div className="mt-8">
                                    <h4 className="text-md font-medium text-gray-900 mb-4">Guías Disponibles para Vincular</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {unlinkedGuides.map((guide) => (
                                            <div key={guide.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                                <div className="flex items-center space-x-3 mb-3">
                                                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                                        <span className="text-gray-600 text-sm">🔌</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">{guide.equipment_name}</h4>
                                                        <p className="text-sm text-gray-500">
                                                            {guide.brand_id && brands.find(b => b.id === guide.brand_id)?.name} • {guide.model}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await apiClient.linkApplianceGuide(selectedHome.id, guide.id);
                                                            setSubmitMessage({ type: 'success', message: 'Guía vinculada exitosamente' });
                                                            loadLinkedGuides(selectedHome.id);
                                                        } catch (error) {
                                                            console.error('Error linking guide:', error);
                                                            setSubmitMessage({ type: 'error', message: 'Error al vincular la guía' });
                                                        }
                                                    }}
                                                    className="w-full px-3 py-1 text-xs font-medium text-white bg-green-600 border border-transparent rounded hover:bg-green-700"
                                                >
                                                    Vincular a esta casa
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Modal para crear plano técnico */}
                {showPlanForm && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex min-h-screen items-center justify-center p-4">
                            <div className="fixed inset-0 bg-black opacity-30" onClick={() => setShowPlanForm(false)}></div>
                            <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                                <div className="mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        Crear Plano Técnico
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Casa: <strong>{selectedHome?.name}</strong>
                                    </p>
                                </div>

                                <form onSubmit={technicalPlanForm.handleSubmit(handleCreateTechnicalPlan)} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Título del Plano *
                                        </label>
                                        <input
                                            type="text"
                                            {...technicalPlanForm.register('title')}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white placeholder-gray-400"
                                            placeholder="Ej: Plano eléctrico, Plano de fontanería..."
                                        />
                                        {technicalPlanForm.formState.errors.title && (
                                            <p className="text-red-500 text-sm mt-1">
                                                {technicalPlanForm.formState.errors.title.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Descripción (opcional)
                                        </label>
                                        <textarea
                                            {...technicalPlanForm.register('description')}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white placeholder-gray-400"
                                            placeholder="Descripción del plano técnico..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Archivo del Plano (opcional)
                                        </label>
                                        <FileUpload
                                            onUrlsChange={setPlanFileUrls}
                                            accept=".pdf,.dwg,.dxf"
                                            maxFiles={1}
                                            maxSize={10}
                                            basePath="technical-plans"
                                        />
                                    </div>

                                    <div className="flex justify-end space-x-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowPlanForm(false);
                                                technicalPlanForm.reset();
                                                setPlanFileUrls([]);
                                            }}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                        >
                                            Crear Plano
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal para crear guía de electrodoméstico */}
                {showApplianceForm && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex min-h-screen items-center justify-center p-4">
                            <div className="fixed inset-0 bg-black opacity-30" onClick={() => setShowApplianceForm(false)}></div>
                            <div className="relative bg-white rounded-lg shadow-lg max-w-2xl w-full p-6">
                                <div className="mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        Crear Guía de Electrodoméstico
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Casa: <strong>{selectedHome?.name}</strong>
                                    </p>
                                </div>

                                <form onSubmit={applianceGuideForm.handleSubmit(handleCreateApplianceGuide)} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nombre del Electrodoméstico *
                                        </label>
                                        <input
                                            type="text"
                                            {...applianceGuideForm.register('equipment_name')}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white placeholder-gray-400"
                                            placeholder="Ej: Lavadora, Nevera, Horno..."
                                        />
                                        {applianceGuideForm.formState.errors.equipment_name && (
                                            <p className="text-red-500 text-sm mt-1">
                                                {applianceGuideForm.formState.errors.equipment_name.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Marca (opcional)
                                            </label>
                                            <select
                                                {...applianceGuideForm.register('brand_id')}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                                            >
                                                <option value="">Selecciona una marca</option>
                                                {brands.map((brand) => (
                                                    <option key={brand.id} value={brand.id}>
                                                        {brand.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Modelo (opcional)
                                            </label>
                                            <input
                                                type="text"
                                                {...applianceGuideForm.register('model')}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white placeholder-gray-400"
                                                placeholder="Ej: ABC123, XYZ789..."
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Descripción Breve (opcional)
                                        </label>
                                        <textarea
                                            {...applianceGuideForm.register('brief_description')}
                                            rows={2}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white placeholder-gray-400"
                                            placeholder="Descripción breve del electrodoméstico..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Imágenes del Electrodoméstico (opcional)
                                        </label>
                                        <FileUpload
                                            onUrlsChange={setApplianceImageUrls}
                                            accept="image/*"
                                            maxFiles={5}
                                            maxSize={5}
                                            basePath="appliance-guides/images"
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
                                            basePath="appliance-guides/manuals"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            URL del Video Tutorial (opcional)
                                        </label>
                                        <input
                                            type="url"
                                            {...applianceGuideForm.register('video_url')}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white placeholder-gray-400"
                                            placeholder="https://ejemplo.com/video-tutorial"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Puntos de Uso Rápido (opcional)
                                        </label>
                                        <textarea
                                            {...applianceGuideForm.register('quick_use_bullets')}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white placeholder-gray-400"
                                            placeholder="• Punto 1&#10;• Punto 2&#10;• Punto 3..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Puntos de Mantenimiento (opcional)
                                        </label>
                                        <textarea
                                            {...applianceGuideForm.register('maintenance_bullets')}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white placeholder-gray-400"
                                            placeholder="• Limpiar filtros mensualmente&#10;• Revisar conexiones trimestralmente&#10;• Mantenimiento anual..."
                                        />
                                    </div>

                                    <div className="flex justify-end space-x-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowApplianceForm(false);
                                                applianceGuideForm.reset();
                                                setManualFileUrls([]);
                                                setApplianceImageUrls([]);
                                                setVideoUrls([]);
                                            }}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                        >
                                            Crear Guía
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function TechnicalDocsWizardPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando...</p>
                </div>
            </div>
        }>
            <TechnicalDocsWizardContent />
        </Suspense>
    );
}