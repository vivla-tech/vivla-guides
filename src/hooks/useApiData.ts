import { useState, useEffect, useCallback, useMemo } from 'react';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';

// Hook personalizado para cargar datos de la API
export function useApiData<T>(
  endpoint: 'categories' | 'brands' | 'homes' | 'rooms-type' | 'suppliers' | 'amenities' | 'rooms' | 'homes/with-completeness',
  params?: { page?: number; pageSize?: number }
) {
  const [data, setData] = useState<T[]>([]);
  const [meta, setMeta] = useState<{ page: number; pageSize: number; total: number; totalPages: number } | null>(null);
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
          response = await apiClient.listCategories(params);
          break;
        case 'brands':
          response = await apiClient.listBrands(params);
          break;
        case 'homes':
          response = await apiClient.listHomes(params);
          break;
        case 'homes/with-completeness':
          response = await apiClient.listHomesWithCompleteness(params);
          break;
        case 'rooms-type':
          response = await apiClient.listRoomTypes(params);
          break;
        case 'suppliers':
          response = await apiClient.listSuppliers(params);
          break;
        case 'amenities':
          response = await apiClient.listAmenities(params);
          break;
        case 'rooms':
          response = await apiClient.listRooms(params);
          break;
        default:
          throw new Error(`Endpoint no soportado: ${endpoint}`);
      }

      if (response.success) {
        setData(response.data as T[]);
        setMeta(response.meta);
      } else {
        setError('Error al cargar datos');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error(`Error al cargar ${endpoint}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, apiClient, params?.page, params?.pageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, meta, isLoading, error };
}
