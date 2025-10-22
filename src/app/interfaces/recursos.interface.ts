// src/app/interfaces/recursos.interface.ts
export interface Recurso {
    id_recurso: number;
    titulo: string;
    descripcion?: string;
    nombre_archivo: string;
    ruta_archivo: string;
    tamaño_archivo?: number;
    tipo_mime?: string;
    extension?: string;
    categoria: string;
    version: string;
    estado: number; // 1=activo, 0=inactivo
    fecha_creacion: Date;
    fecha_actualizacion: Date;
    usuario_creacion: string;
    usuario_actualizacion?: string;
    orden_visualizacion: number;
    descargas_count: number;
    es_publico: number; // 1=público, 0=solo admin
    tipo_usuario: string;
  }
  
  export interface CreateRecursoDto {
    titulo: string;
    descripcion?: string;
    categoria: string;
    esPublico: boolean;
    nombre_archivo: string;
    ruta_archivo: string;
    estado?: number;
    tipo_usuario: string;
  }
  
  export interface UpdateRecursoDto {
    titulo?: string;
    descripcion?: string;
    categoria?: string;
    esPublico?: boolean;
    estado?: number;
    orden_visualizacion?: number;
    tipo_usuario?: string;
  }
  
  export interface FilterRecursoDto {
    categoria?: string;
    buscar?: string; // Para buscar en titulo y descripcion
    estado?: number;
    es_publico?: number;
    page?: number;
    limit?: number;
    tipo_usuario?: string;
  }
  
  export interface RecursosResponse {
    data: Recurso[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }