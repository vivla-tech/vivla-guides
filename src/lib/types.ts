// ===== INTERFACES COMPLETAS VIVLA GUIDES =====

// 1. HOME (Casas)
export interface Home {
  id: string;                    // UUID
  name: string;                  // Nombre de la casa
  destination: string;           // Destino (vacacional, residencial, etc.)
  address: string;               // Dirección
  main_image: string;            // Imagen principal
  created_at: Date;
  updated_at: Date;
}

// 2. ROOM (Habitaciones)
export interface Room {
  id: string;                    // UUID
  name: string;                  // Nombre de la habitación
  home_id: string;               // UUID de la casa
  room_type_id: string;          // UUID del tipo de habitación
  description: string;            // Descripción
  created_at: Date;
  updated_at: Date;
}

// 3. ROOM_TYPE (Tipos de Habitación)
export interface RoomType {
  id: string;                    // UUID
  name: string;                  // Nombre del tipo (dormitorio, baño, cocina, etc.)
  created_at: Date;
  updated_at: Date;
}

// 4. AMENITY (Amenities/Productos)
export interface Amenity {
  id: string;                    // UUID
  name: string;                  // Nombre del producto
  category_id: string;           // UUID de la categoría
  brand_id: string;              // UUID de la marca
  reference: string;             // Referencia del producto
  amenity_type: string;          // Tipo de amenity
  model: string;                 // Modelo
  description: string;            // Descripción (TEXT)
  base_price: number;            // Precio base
  images: string[];              // Array de URLs de imágenes (JSONB)
  created_at: Date;
  updated_at: Date;
}

// 5. CATEGORY (Categorías)
export interface Category {
  id: string;                    // UUID
  name: string;                  // Nombre de la categoría
  description: string;            // Descripción
  created_at: Date;
  updated_at: Date;
}

// 6. BRAND (Marcas)
export interface Brand {
  id: string;                    // UUID
  name: string;                  // Nombre de la marca
  website: string;               // Sitio web
  contact_info: string;          // Información de contacto
  created_at: Date;
  updated_at: Date;
}

// 7. SUPPLIER (Proveedores)
export interface Supplier {
  id: string;                    // UUID
  name: string;                  // Nombre del proveedor
  website: string;               // Sitio web
  contact_email: string;         // Email de contacto
  phone: string;                 // Teléfono
  created_at: Date;
  updated_at: Date;
}

// 8. HOME_INVENTORY (Inventario por Casa)
export interface HomeInventory {
  id: string;                    // UUID
  home_id: string;               // UUID de la casa
  amenity_id: string;            // UUID del amenity
  room_id?: string;              // UUID de la habitación (opcional)
  quantity: number;              // Cantidad
  location_details: string;      // Detalles de ubicación
  minimum_threshold: number;     // Umbral mínimo de stock
  supplier_id: string;           // UUID del proveedor
  purchase_link?: string;        // Enlace de compra (opcional)
  purchase_price: number;        // Precio de compra
  last_restocked_date?: Date;    // Fecha del último reabastecimiento (opcional)
  notes?: string;                // Notas (TEXT) (opcional)
  created_at: Date;
  updated_at: Date;
}

// 9. STYLING_GUIDE (Guías de Estilo)
export interface StylingGuide {
  id: string;                    // UUID
  room_id: string;               // UUID de la habitación
  title: string;                 // Título de la guía
  reference_photo_url?: string;  // URL de la foto de referencia (opcional)
  qr_code_url?: string;          // URL del código QR (opcional)
  image_urls: string[];          // Array de URLs de imágenes (JSONB)
  created_at: Date;
  updated_at: Date;
}

// 10. PLAYBOOK (Procedimientos)
export interface Playbook {
  id: string;                    // UUID
  room_id: string;               // UUID de la habitación
  type: string;                  // Tipo de procedimiento
  title: string;                 // Título
  estimated_time: string;        // Tiempo estimado
  tasks: string;                 // Tareas (TEXT)
  materials: string;             // Materiales necesarios
  created_at: Date;
  updated_at: Date;
}

// 11. APPLIANCE_GUIDE (Guías de Electrodomésticos)
export interface ApplianceGuide {
  id: string;                    // UUID
  equipment_name: string;        // Nombre del equipo
  brand_id: string;              // UUID de la marca
  model: string;                 // Modelo
  brief_description: string;     // Descripción breve
  image_urls: string[];          // Array de URLs de imágenes (JSONB)
  pdf_url?: string;              // URL del PDF del manual (opcional)
  video_url?: string;            // URL del video tutorial (opcional)
  quick_use_bullets: string;     // Puntos de uso rápido (TEXT)
  maintenance_bullets: string;   // Puntos de mantenimiento (TEXT)
  created_at: Date;
  updated_at: Date;
}

// 12. TECHNICAL_PLAN (Planos Técnicos)
export interface TechnicalPlan {
  id: string;                    // UUID
  home_id: string;               // UUID de la casa
  title: string;                 // Título del plan
  description: string;            // Descripción
  plan_file_url?: string;         // URL del archivo del plan (opcional)
  created_at: Date;
  updated_at: Date;
}

// ===== TIPOS PARA FORMULARIOS =====
// Tipos para crear entidades (sin ID ni timestamps)

export type CreateHome = Omit<Home, 'id' | 'created_at' | 'updated_at'>;
export type CreateRoom = Omit<Room, 'id' | 'created_at' | 'updated_at'>;
export type CreateRoomType = Omit<RoomType, 'id' | 'created_at' | 'updated_at'>;
export type CreateAmenity = Omit<Amenity, 'id' | 'created_at' | 'updated_at'>;
export type CreateCategory = Omit<Category, 'id' | 'created_at' | 'updated_at'>;
export type CreateBrand = Omit<Brand, 'id' | 'created_at' | 'updated_at'>;
export type CreateSupplier = Omit<Supplier, 'id' | 'created_at' | 'updated_at'>;
export type CreateInventory = Omit<HomeInventory, 'id' | 'created_at' | 'updated_at'>;
export type CreateStylingGuide = Omit<StylingGuide, 'id' | 'created_at' | 'updated_at'>;
export type CreatePlaybook = Omit<Playbook, 'id' | 'created_at' | 'updated_at'>;
export type CreateApplianceGuide = Omit<ApplianceGuide, 'id' | 'created_at' | 'updated_at'>;
export type CreateTechnicalPlan = Omit<TechnicalPlan, 'id' | 'created_at' | 'updated_at'>;

// ===== TIPOS DE RESPUESTA DE LA API =====

export type ListMeta = { page: number; pageSize: number; total: number; totalPages: number };
export type ListResponse<T> = { success: true; data: T[]; meta: ListMeta };
export type ItemResponse<T> = { success: true; data: T };
export type ErrorResponse = { success: false; error: { message: string; details?: { field?: string; message: string }[] } };
