import { useState, useEffect, useCallback, useMemo } from 'react';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';

// Hook personalizado para cargar datos de la API
export function useApiData<T>(
  endpoint: 'categories' | 'brands' | 'homes' | 'rooms-type' | 'suppliers' | 'amenities' | 'rooms',
  dependencies: unknown[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoizar el apiClient para evitar recrearlo en cada render
  const apiClient = useMemo(() => createApiClient(config.apiUrl), []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let response;
      switch (endpoint) {
        case 'categories':
          response = await apiClient.listCategories();
          break;
        case 'brands':
          response = await apiClient.listBrands();
          break;
        case 'homes':
          response = await apiClient.listHomes();
          break;
        case 'rooms-type':
          response = await apiClient.listRoomTypes();
          break;
        case 'suppliers':
          response = await apiClient.listSuppliers();
          break;
        case 'amenities':
          response = await apiClient.listAmenities();
          break;
        case 'rooms':
          response = await apiClient.listRooms();
          break;
        default:
          throw new Error(`Endpoint no soportado: ${endpoint}`);
      }

      if (response.success) {
        setData(response.data as T[]);
      } else {
        setError('Error al cargar datos');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error(`Error al cargar ${endpoint}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, apiClient]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, isLoading, error };
}
