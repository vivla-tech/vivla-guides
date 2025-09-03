# Componentes de Wizard

## HomeSelector

Componente reutilizable para seleccionar una casa en los diferentes wizards de la aplicación.

### Características

- **Búsqueda en tiempo real** por nombre o dirección (mínimo 3 letras)
- **Filtrado por destino** con select dropdown
- **Paginación** para manejar grandes volúmenes de casas
- **Indicador de completitud** de cada casa
- **Selección visual** con estados activo/inactivo
- **Información detallada** de la casa seleccionada
- **Responsive** y accesible

### Uso Básico

```tsx
import HomeSelector from '@/components/wizard/HomeSelector';
import { HomeWithCompleteness } from '@/lib/types';

function MyWizard() {
    const [selectedHome, setSelectedHome] = useState<HomeWithCompleteness | null>(null);

    return (
        <HomeSelector
            selectedHome={selectedHome}
            onHomeSelect={setSelectedHome}
        />
    );
}
```

### Props

| Prop | Tipo | Requerido | Default | Descripción |
|------|------|-----------|---------|-------------|
| `selectedHome` | `HomeWithCompleteness \| null` | ✅ | - | Casa actualmente seleccionada |
| `onHomeSelect` | `(home: HomeWithCompleteness) => void` | ✅ | - | Callback cuando se selecciona una casa |
| `title` | `string` | ❌ | "Seleccionar Casa" | Título del componente |
| `description` | `string` | ❌ | "Elige la casa para la que quieres gestionar el contenido" | Descripción del componente |
| `showCompleteness` | `boolean` | ❌ | `true` | Mostrar indicador de completitud |
| `className` | `string` | ❌ | `""` | Clases CSS adicionales |

### Ejemplo Completo

```tsx
import { useState } from 'react';
import HomeSelector from '@/components/wizard/HomeSelector';
import { HomeWithCompleteness } from '@/lib/types';

export default function InventoryWizard() {
    const [selectedHome, setSelectedHome] = useState<HomeWithCompleteness | null>(null);
    const [currentStep, setCurrentStep] = useState(1);

    const handleHomeSelect = (home: HomeWithCompleteness) => {
        setSelectedHome(home);
        setCurrentStep(2); // Avanzar al siguiente paso
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto py-8 px-4">
                {/* Progress Bar */}
                <div className="mb-8">
                    {/* ... progress bar code ... */}
                </div>

                {/* Step Content */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    {currentStep === 1 ? (
                        <HomeSelector
                            selectedHome={selectedHome}
                            onHomeSelect={handleHomeSelect}
                            title="Seleccionar Casa para Inventario"
                            description="Elige la casa para la que quieres gestionar el inventario"
                            showCompleteness={true}
                        />
                    ) : (
                        <div className="p-6">
                            <h2>Inventario de {selectedHome?.name}</h2>
                            {/* Contenido del inventario */}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
```

### Casos de Uso

#### 1. Wizard de Inventario
```tsx
<HomeSelector
    selectedHome={selectedHome}
    onHomeSelect={handleHomeSelect}
    title="Seleccionar Casa para Inventario"
    description="Elige la casa para la que quieres gestionar el inventario"
    showCompleteness={true}
/>
```

#### 2. Wizard de Guías de Estilo
```tsx
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
```

#### 3. Wizard de Documentación Técnica
```tsx
<HomeSelector
    selectedHome={selectedHome}
    onHomeSelect={(home) => setSelectedHome(home)}
    title="Seleccionar Casa para Documentación Técnica"
    description="Elige la casa para la que quieres gestionar planos técnicos y guías de electrodomésticos"
    showCompleteness={true}
/>
```

### Funcionalidades

#### Búsqueda
- Búsqueda en tiempo real por nombre de casa
- Búsqueda por dirección
- Filtrado automático mientras escribes

#### Filtros
- Filtro por destino (ciudad, región, etc.)
- Búsqueda por nombre o dirección (mínimo 3 letras)
- Combinación de búsqueda + filtro
- Reset de filtros automático al cambiar filtros
- Feedback visual durante la búsqueda

#### Paginación
- 20 casas por página por defecto
- Navegación entre páginas
- Contador de elementos mostrados
- Reset a página 1 al aplicar filtros

#### Indicador de Completitud
- Verde: 80-100% (Completa)
- Amarillo: 60-79% (Buena)
- Naranja: 40-59% (Regular)
- Rojo: 0-39% (Incompleta)

#### Estados Visuales
- Loading mientras carga las casas
- Estado vacío cuando no hay resultados
- Selección activa con checkmark
- Hover effects suaves

### Integración con API

El componente utiliza:
- `apiClient.listHomesWithCompleteness()` - Para cargar casas con completitud
- `apiClient.listDestinations()` - Para cargar destinos disponibles

### Estilos

Utiliza Tailwind CSS con clases consistentes:
- `bg-gray-50` para fondos
- `border-gray-200` para bordes
- `text-blue-600` para elementos activos
- `hover:shadow-md` para efectos hover

### Accesibilidad

- Labels apropiados para inputs
- Estados de focus visibles
- Contraste de colores adecuado
- Navegación por teclado
- Screen reader friendly

## Estado de Implementación

### ✅ Wizards Completados
- **Inventario**: ✅ HomeSelector implementado
- **Guías de Estilo**: ✅ HomeSelector implementado  
- **Documentación Técnica**: ✅ HomeSelector implementado

### 🎯 Beneficios Logrados
- **Consistencia**: Misma experiencia de selección en todos los wizards
- **Mantenibilidad**: Código reutilizable y centralizado
- **Performance**: Búsqueda optimizada con paginación
- **UX**: Interfaz unificada y intuitiva
