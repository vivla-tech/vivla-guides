import { 
  ListMeta, 
  ListResponse, 
  ItemResponse, 
  ErrorResponse,
  Home,
  Room,
  RoomType,
  Amenity,
  Category,
  Brand,
  Supplier,
  CreateHome,
  CreateRoom,
  CreateRoomType,
  CreateAmenity,
  CreateCategory,
  CreateBrand,
  CreateSupplier
} from './types';

export type { ListMeta, ListResponse, ItemResponse, ErrorResponse };

export function createApiClient(baseUrl: string) {
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${baseUrl}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
      ...init,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || (body as any)?.success === false) {
      const err = (body as ErrorResponse)?.error || { message: `HTTP ${res.status}` } as any;
      throw new Error(err.message);
    }
    return body as T;
  }

  const q = (params?: Record<string, any>) =>
    params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null) as any).toString() : '';

  return {
    // ===== CRUD GENÉRICOS =====
    list: <T>(resource: string, params?: { page?: number; pageSize?: number }) =>
      request<ListResponse<T>>(`/${resource}${q(params)}`),
    getById: <T>(resource: string, id: string) =>
      request<ItemResponse<T>>(`/${resource}/${id}`),
    create: <T>(resource: string, payload: any) =>
      request<ItemResponse<T>>(`/${resource}`, { method: 'POST', body: JSON.stringify(payload) }),
    update: <T>(resource: string, id: string, payload: any) =>
      request<ItemResponse<T>>(`/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    remove: (resource: string, id: string) =>
      request<{}>(`/${resource}/${id}`, { method: 'DELETE' }),

    // ===== ENDPOINTS ESPECÍFICOS VIVLA GUIDES =====
    
    // HOMES (Casas)
    listHomes: (params?: { page?: number; pageSize?: number }) =>
      request<ListResponse<Home>>(`/homes${q(params)}`),
    createHome: (payload: CreateHome) =>
      request<ItemResponse<Home>>(`/homes`, { method: 'POST', body: JSON.stringify(payload) }),
    getHomeById: (id: string) =>
      request<ItemResponse<Home>>(`/homes/${id}`),
    updateHome: (id: string, payload: Partial<CreateHome>) =>
      request<ItemResponse<Home>>(`/homes/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    deleteHome: (id: string) =>
      request<{}>(`/homes/${id}`, { method: 'DELETE' }),

    // ROOMS (Habitaciones)
    listRooms: (params?: { page?: number; pageSize?: number; home_id?: string }) =>
      request<ListResponse<Room>>(`/rooms${q(params)}`),
    createRoom: (payload: CreateRoom) =>
      request<ItemResponse<Room>>(`/rooms`, { method: 'POST', body: JSON.stringify(payload) }),
    getRoomById: (id: string) =>
      request<ItemResponse<Room>>(`/rooms/${id}`),
    updateRoom: (id: string, payload: Partial<CreateRoom>) =>
      request<ItemResponse<Room>>(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    deleteRoom: (id: string) =>
      request<{}>(`/rooms/${id}`, { method: 'DELETE' }),

    // ROOM TYPES (Tipos de Habitación)
    listRoomTypes: (params?: { page?: number; pageSize?: number }) =>
      request<ListResponse<RoomType>>(`/rooms-type${q(params)}`),
    createRoomType: (payload: CreateRoomType) =>
      request<ItemResponse<RoomType>>(`/rooms-type`, { method: 'POST', body: JSON.stringify(payload) }),
    getRoomTypeById: (id: string) =>
      request<ItemResponse<RoomType>>(`/rooms-type/${id}`),
    updateRoomType: (id: string, payload: Partial<CreateRoomType>) =>
      request<ItemResponse<RoomType>>(`/rooms-type/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    deleteRoomType: (id: string) =>
      request<{}>(`/rooms-type/${id}`, { method: 'DELETE' }),

    // CATEGORIES (Categorías)
    listCategories: (params?: { page?: number; pageSize?: number }) =>
      request<ListResponse<Category>>(`/categories${q(params)}`),
    createCategory: (payload: CreateCategory) =>
      request<ItemResponse<Category>>(`/categories`, { method: 'POST', body: JSON.stringify(payload) }),
    getCategoryById: (id: string) =>
      request<ItemResponse<Category>>(`/categories/${id}`),
    updateCategory: (id: string, payload: Partial<CreateCategory>) =>
      request<ItemResponse<Category>>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    deleteCategory: (id: string) =>
      request<{}>(`/categories/${id}`, { method: 'DELETE' }),

    // BRANDS (Marcas)
    listBrands: (params?: { page?: number; pageSize?: number }) =>
      request<ListResponse<Brand>>(`/brands${q(params)}`),
    createBrand: (payload: CreateBrand) =>
      request<ItemResponse<Brand>>(`/brands`, { method: 'POST', body: JSON.stringify(payload) }),
    getBrandById: (id: string) =>
      request<ItemResponse<Brand>>(`/brands/${id}`),
    updateBrand: (id: string, payload: Partial<CreateBrand>) =>
      request<ItemResponse<Brand>>(`/brands/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    deleteBrand: (id: string) =>
      request<{}>(`/brands/${id}`, { method: 'DELETE' }),

    // AMENITIES (Productos)
    listAmenities: (params?: { page?: number; pageSize?: number; category_id?: string; brand_id?: string }) =>
      request<ListResponse<Amenity>>(`/amenities${q(params)}`),
    createAmenity: (payload: CreateAmenity) =>
      request<ItemResponse<Amenity>>(`/amenities`, { method: 'POST', body: JSON.stringify(payload) }),
    getAmenityById: (id: string) =>
      request<ItemResponse<Amenity>>(`/amenities/${id}`),
    updateAmenity: (id: string, payload: Partial<CreateAmenity>) =>
      request<ItemResponse<Amenity>>(`/amenities/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    deleteAmenity: (id: string) =>
      request<{}>(`/amenities/${id}`, { method: 'DELETE' }),

    // SUPPLIERS (Proveedores)
    listSuppliers: (params?: { page?: number; pageSize?: number }) =>
      request<ListResponse<Supplier>>(`/suppliers${q(params)}`),
    createSupplier: (payload: CreateSupplier) =>
      request<ItemResponse<Supplier>>(`/suppliers`, { method: 'POST', body: JSON.stringify(payload) }),
    getSupplierById: (id: string) =>
      request<ItemResponse<Supplier>>(`/suppliers/${id}`),
    updateSupplier: (id: string, payload: Partial<CreateSupplier>) =>
      request<ItemResponse<Supplier>>(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    deleteSupplier: (id: string) =>
      request<{}>(`/suppliers/${id}`, { method: 'DELETE' }),

    // ===== ENDPOINTS ESPECIALES =====
    
    // Habitaciones por casa
    listRoomsByHome: (homeId: string, params?: { page?: number; pageSize?: number }) =>
      request<ListResponse<Room>>(`/rooms${q({ home_id: homeId, ...params })}`),
    
    // Amenities por casa
    listAmenitiesByHome: (homeId: string, params?: { page?: number; pageSize?: number }) =>
      request<ListResponse<Amenity>>(`/amenities${q({ home_id: homeId, ...params })}`),

    // ===== ENDPOINTS LEGACY (mantener compatibilidad) =====
    listStylingGuidesByHome: (homeId: string, params?: { page?: number; pageSize?: number }) =>
      request<ListResponse<any>>(`/styling-guides${q({ home_id: homeId, ...params })}`),
    listPlaybooksByHome: (homeId: string, params?: { page?: number; pageSize?: number }) =>
      request<ListResponse<any>>(`/playbooks${q({ home_id: homeId, ...params })}`),
    listApplianceGuidesByHome: (homeId: string) =>
      request<{ success: true; data: any[] }>(`/appliance-guides/by-home/${homeId}`),

    linkApplianceGuide: (homeId: string, guideId: string) =>
      request<{ success: true }>(`/appliance-guides/link`, {
        method: 'POST',
        body: JSON.stringify({ home_id: homeId, appliance_guide_id: guideId }),
      }),
    unlinkApplianceGuide: (homeId: string, guideId: string) =>
      request<{ success: true }>(`/appliance-guides/link`, {
        method: 'DELETE',
        body: JSON.stringify({ home_id: homeId, appliance_guide_id: guideId }),
      }),
  };
}
