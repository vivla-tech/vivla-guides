'use client';

import { useState } from 'react';
import { HomeWithCompleteness } from '@/lib/types';
import HomeSelector from './HomeSelector';

// Ejemplo de cómo usar HomeSelector en un wizard
export default function HomeSelectorExample() {
    const [selectedHome, setSelectedHome] = useState<HomeWithCompleteness | null>(null);
    const [currentStep, setCurrentStep] = useState(1);

    const handleHomeSelect = (home: HomeWithCompleteness) => {
        setSelectedHome(home);
        // Avanzar al siguiente paso automáticamente
        setCurrentStep(2);
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <HomeSelector
                        selectedHome={selectedHome}
                        onHomeSelect={handleHomeSelect}
                        title="Seleccionar Casa para Inventario"
                        description="Elige la casa para la que quieres gestionar el inventario"
                        showCompleteness={true}
                    />
                );
            case 2:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Inventario de {selectedHome?.name}
                            </h2>
                            <p className="text-gray-600">
                                Gestiona el inventario de la casa seleccionada
                            </p>
                        </div>

                        {/* Aquí iría el contenido del inventario */}
                        <div className="bg-gray-50 p-6 rounded-lg">
                            <p className="text-gray-600">
                                Contenido del inventario para: <strong>{selectedHome?.name}</strong>
                            </p>
                        </div>

                        {/* Botón para volver atrás */}
                        <div className="flex justify-center">
                            <button
                                onClick={() => {
                                    setSelectedHome(null);
                                    setCurrentStep(1);
                                }}
                                className="px-4 py-2 text-gray-600 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                            >
                                ← Volver a seleccionar casa
                            </button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto py-8 px-4">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 1 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
                                }`}>
                                1
                            </div>
                            <span className="ml-2 font-medium">Seleccionar Casa</span>
                        </div>
                        <div className={`flex-1 h-1 mx-4 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                        <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 2 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
                                }`}>
                                2
                            </div>
                            <span className="ml-2 font-medium">Inventario</span>
                        </div>
                    </div>
                </div>

                {/* Step Content */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    {renderStepContent()}
                </div>
            </div>
        </div>
    );
}
