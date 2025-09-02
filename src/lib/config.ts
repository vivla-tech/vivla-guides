// Configuración de la aplicación
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  ? `${process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, '')}/api/v1`
  : undefined;

export const config = {
  // URL de la API backend
  apiUrl: baseUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  
  // Configuración de la aplicación
  app: {
    name: 'VIVLA Guides',
    version: '1.0.0',
    description: 'Sistema de gestión inmobiliaria'
  }
};
