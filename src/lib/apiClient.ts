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
  CreateSupplier,
  CreateInventory,
  CreateStylingGuide,
  HomeInventory,
  HomeInventoryWithRelations,
  StylingGuide,
  Playbook,
  CreatePlaybook,
  ApplianceGuide,
  CreateApplianceGuide,
  TechnicalPlan,
  CreateTechnicalPlan,
  HomeWithCompleteness,
  HomesCompletenessReport
} from './types';

export type { ListMeta, ListResponse, ItemResponse, ErrorResponse };

export function createApiClient(baseUrl: string) {
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${baseUrl}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
      ...init,
    });
    
    let body: unknown;
    try {
      // Para HTTP 204 (No Content), no hay body para parsear
      if (res.status === 204) {
        body = {};
      } else {
        body = await res.json();
      }
    } catch {
      body = { success: false };
    }
    
    // HTTP 204 (No Content) es exitoso para eliminaciones
    if (res.status === 204) {
      return {} as T;
    }
    
    if (!res.ok || (body as { success?: boolean })?.success === false) {
      const err = (body as ErrorResponse)?.error || { message: `HTTP ${res.status}` } as ErrorResponse['error'];
      throw new Error(err.message);
    }
    return body as T;
  }

  const q = (params?: Record<string, unknown>) =>
    params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null) as [string, string][]).toString() : '';

  return {
    // ===== CRUD GENÉRICOS =====
    list: <T>(resource: string, params?: { page?: number; pageSize?: number }) =>
      request<ListResponse<T>>(`/${resource}${q(params)}`),
    getById: <T>(resource: string, id: string) =>
      request<ItemResponse<T>>(`/${resource}/${id}`),
    create: <T>(resource: string, payload: unknown) =>
      request<ItemResponse<T>>(`/${resource}`, { method: 'POST', body: JSON.stringify(payload) }),
    update: <T>(resource: string, id: string, payload: unknown) =>
      request<ItemResponse<T>>(`/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    remove: (resource: string, id: string) =>
      request<Record<string, never>>(`/${resource}/${id}`, { method: 'DELETE' }),

    // ===== ENDPOINTS ESPECÍFICOS VIVLA GUIDES =====
    
    // HOMES (Casas)
    listHomes: (params?: { page?: number; pageSize?: number }) =>
      request<ListResponse<Home>>(`/homes${q(params)}`),
    listHomesWithCompleteness: (params?: { page?: number; pageSize?: number }) =>
      request<ListResponse<HomeWithCompleteness>>(`/homes/with-completeness${q(params)}`),
    listHomesCompleteness: () =>
      request<ItemResponse<HomesCompletenessReport>>(`/homes/completeness`),
    createHome: (payload: CreateHome) =>
      request<ItemResponse<Home>>(`/homes`, { method: 'POST', body: JSON.stringify(payload) }),
    getHomeById: (id: string) =>
      request<ItemResponse<Home>>(`/homes/${id}`),
    updateHome: (id: string, payload: Partial<CreateHome>) =>
      request<ItemResponse<Home>>(`/homes/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    deleteHome: (id: string) =>
      request<Record<string, never>>(`/homes/${id}`, { method: 'DELETE' }),

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
      request<Record<string, never>>(`/rooms/${id}`, { method: 'DELETE' }),

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
      request<Record<string, never>>(`/rooms-type/${id}`, { method: 'DELETE' }),

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
      request<Record<string, never>>(`/categories/${id}`, { method: 'DELETE' }),

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
      request<Record<string, never>>(`/brands/${id}`, { method: 'DELETE' }),

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
      request<Record<string, never>>(`/amenities/${id}`, { method: 'DELETE' }),

    // INVENTORY (Inventario)
    listInventory: (params?: { page?: number; pageSize?: number; home_id?: string; amenity_id?: string; room_id?: string }) =>
      request<ListResponse<HomeInventoryWithRelations>>(`/home-inventory${q(params)}`),
    createInventory: (payload: CreateInventory) =>
      request<ItemResponse<HomeInventoryWithRelations>>(`/home-inventory`, { method: 'POST', body: JSON.stringify(payload) }),
    getInventoryById: (id: string) =>
      request<ItemResponse<HomeInventoryWithRelations>>(`/home-inventory/${id}`),
    updateInventory: (id: string, payload: Partial<CreateInventory>) =>
      request<ItemResponse<HomeInventoryWithRelations>>(`/home-inventory/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    deleteInventory: (id: string) =>
      request<Record<string, never>>(`/home-inventory/${id}`, { method: 'DELETE' }),

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
      request<Record<string, never>>(`/suppliers/${id}`, { method: 'DELETE' }),

    // STYLING GUIDES (Guías de Estilo)
    listStylingGuides: (params?: { page?: number; pageSize?: number; room_id?: string }) =>
      request<ListResponse<StylingGuide>>(`/styling-guides${q(params)}`),
    createStylingGuide: (payload: CreateStylingGuide) =>
      request<ItemResponse<StylingGuide>>(`/styling-guides`, { method: 'POST', body: JSON.stringify(payload) }),
    getStylingGuideById: (id: string) =>
      request<ItemResponse<StylingGuide>>(`/styling-guides/${id}`),
    updateStylingGuide: (id: string, payload: Partial<CreateStylingGuide>) =>
      request<ItemResponse<StylingGuide>>(`/styling-guides/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    deleteStylingGuide: (id: string) =>
      request<Record<string, never>>(`/styling-guides/${id}`, { method: 'DELETE' }),

    // PLAYBOOKS (Playbooks)
    listPlaybooks: (params?: { page?: number; pageSize?: number; room_id?: string }) =>
      request<ListResponse<Playbook>>(`/playbooks${q(params)}`),
    createPlaybook: (payload: CreatePlaybook) =>
      request<ItemResponse<Playbook>>(`/playbooks`, { method: 'POST', body: JSON.stringify(payload) }),
    getPlaybookById: (id: string) =>
      request<ItemResponse<Playbook>>(`/playbooks/${id}`),
    updatePlaybook: (id: string, payload: Partial<CreatePlaybook>) =>
      request<ItemResponse<Playbook>>(`/playbooks/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    deletePlaybook: (id: string) =>
      request<Record<string, never>>(`/playbooks/${id}`, { method: 'DELETE' }),

    // APPLIANCE GUIDES (Guías de Electrodomésticos)
    listApplianceGuides: (params?: { page?: number; pageSize?: number; home_id?: string }) =>
      request<ListResponse<ApplianceGuide>>(`/appliance-guides${q(params)}`),
    createApplianceGuide: (payload: CreateApplianceGuide) =>
      request<ItemResponse<ApplianceGuide>>(`/appliance-guides`, { method: 'POST', body: JSON.stringify(payload) }),
    getApplianceGuideById: (id: string) =>
      request<ItemResponse<ApplianceGuide>>(`/appliance-guides/${id}`),
    updateApplianceGuide: (id: string, payload: Partial<CreateApplianceGuide>) =>
      request<ItemResponse<ApplianceGuide>>(`/appliance-guides/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    deleteApplianceGuide: (id: string) =>
      request<Record<string, never>>(`/appliance-guides/${id}`, { method: 'DELETE' }),

    // TECHNICAL PLANS (Planos Técnicos)
    listTechnicalPlans: (params?: { page?: number; pageSize?: number; home_id?: string }) =>
      request<ListResponse<TechnicalPlan>>(`/technical-plans${q(params)}`),
    createTechnicalPlan: (payload: CreateTechnicalPlan) =>
      request<ItemResponse<TechnicalPlan>>(`/technical-plans`, { method: 'POST', body: JSON.stringify(payload) }),
    getTechnicalPlanById: (id: string) =>
      request<ItemResponse<TechnicalPlan>>(`/technical-plans/${id}`),
    updateTechnicalPlan: (id: string, payload: Partial<CreateTechnicalPlan>) =>
      request<ItemResponse<TechnicalPlan>>(`/technical-plans/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    deleteTechnicalPlan: (id: string) =>
      request<Record<string, never>>(`/technical-plans/${id}`, { method: 'DELETE' }),


    // ===== ENDPOINTS ESPECIALES =====
    
    // Habitaciones por casa
    listRoomsByHome: (homeId: string, params?: { page?: number; pageSize?: number }) =>
      request<ListResponse<Room>>(`/rooms${q({ home_id: homeId, ...params })}`),
    
    // Amenities por casa
    listAmenitiesByHome: (homeId: string, params?: { page?: number; pageSize?: number }) =>
      request<ListResponse<Amenity>>(`/amenities${q({ home_id: homeId, ...params })}`),

    // ===== ENDPOINTS LEGACY (mantener compatibilidad) =====
    listStylingGuidesByHome: (homeId: string, params?: { page?: number; pageSize?: number }) =>
      request<ListResponse<StylingGuide>>(`/styling-guides${q({ home_id: homeId, ...params })}`),
    listPlaybooksByHome: (homeId: string, params?: { page?: number; pageSize?: number }) =>
      request<ListResponse<Playbook>>(`/playbooks${q({ home_id: homeId, ...params })}`),
    listApplianceGuidesByHome: (homeId: string) =>
      request<{ success: true; data: ApplianceGuide[] }>(`/appliance-guides/by-home/${homeId}`),

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
