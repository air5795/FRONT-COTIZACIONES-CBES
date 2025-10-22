// src/app/servicios/recursos/recursos.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Interfaces
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
  estado: number;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
  usuario_creacion: string;
  usuario_actualizacion?: string;
  orden_visualizacion: number;
  descargas_count: number;
  es_publico: number;
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
  tipo_usuario?: string;
}

export interface FilterRecursoDto {
  categoria?: string;
  buscar?: string;
  estado?: number;
  es_publico?: number;
  page?: number;
  limit?: number;
}

export interface RecursosResponse {
  data: Recurso[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class RecursosService {
  private apiUrl = `${environment.url}recursos`;

  constructor(private http: HttpClient) {}

  // Obtener URL base para construir URLs de preview
  getBaseUrl(): string {
    return environment.url.replace('/api/', '');
  }

  // Obtener recursos públicos (para usuarios normales)
  findPublicos(filtros: FilterRecursoDto): Observable<RecursosResponse> {
    let params = new HttpParams();
    
    if (filtros.page) params = params.set('page', filtros.page.toString());
    if (filtros.limit) params = params.set('limit', filtros.limit.toString());
    if (filtros.categoria) params = params.set('categoria', filtros.categoria);
    if (filtros.buscar) params = params.set('buscar', filtros.buscar);
    if (filtros.estado !== undefined) params = params.set('estado', filtros.estado.toString());

    return this.http.get<RecursosResponse>(`${this.apiUrl}/publicos`, { params });
  }

  // Obtener recursos por tipo de usuario
  findByTipoUsuario(tipoUsuario: string, filtros: FilterRecursoDto): Observable<RecursosResponse> {
    let params = new HttpParams();
    
    if (filtros.page) params = params.set('page', filtros.page.toString());
    if (filtros.limit) params = params.set('limit', filtros.limit.toString());
    if (filtros.categoria) params = params.set('categoria', filtros.categoria);
    if (filtros.buscar) params = params.set('buscar', filtros.buscar);
    if (filtros.estado !== undefined) params = params.set('estado', filtros.estado.toString());

    return this.http.get<RecursosResponse>(`${this.apiUrl}/por-tipo/${tipoUsuario}`, { params });
  }



  // Obtener todos los recursos (solo admin)
  findAll(filtros: FilterRecursoDto): Observable<RecursosResponse> {
    let params = new HttpParams();
    
    if (filtros.page) params = params.set('page', filtros.page.toString());
    if (filtros.limit) params = params.set('limit', filtros.limit.toString());
    if (filtros.categoria) params = params.set('categoria', filtros.categoria);
    if (filtros.buscar) params = params.set('buscar', filtros.buscar);
    if (filtros.estado !== undefined) params = params.set('estado', filtros.estado.toString());
    if (filtros.es_publico !== undefined) params = params.set('es_publico', filtros.es_publico.toString());

    return this.http.get<RecursosResponse>(`${this.apiUrl}/admin/all`, { params });
  }

  // Obtener categorías disponibles
  getCategorias(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/categorias`);
  }

  // Obtener un recurso por ID
  findOne(id: number): Observable<Recurso> {
    return this.http.get<Recurso>(`${this.apiUrl}/${id}`);
  }

  // Subir archivo con datos del recurso
  uploadFile(formData: FormData): Observable<Recurso> {
    return this.http.post<Recurso>(`${this.apiUrl}/upload`, formData);
  }

  // Crear recurso manualmente (sin archivo)
  create(createDto: CreateRecursoDto): Observable<Recurso> {
    return this.http.post<Recurso>(`${this.apiUrl}`, createDto);
  }

  // Actualizar recurso
  update(id: number, updateDto: Partial<CreateRecursoDto>): Observable<Recurso> {
    return this.http.patch<Recurso>(`${this.apiUrl}/${id}`, updateDto);
  }

  // Desactivar recurso
  remove(id: number): Observable<any> {
    console.log(`🗑️ Llamando endpoint desactivar para ID: ${id}`);
    return this.http.delete<any>(`${this.apiUrl}/${id}/deactivate`);
  }

  // Eliminar recurso permanentemente (solo super admin)
  delete(id: number): Observable<any> {
    console.log(`🗑️ Llamando endpoint eliminar permanente para ID: ${id}`);
    return this.http.delete<any>(`${this.apiUrl}/${id}/permanent`);
  }

  // Descargar archivo usando URL directa
  downloadFile(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/url`).pipe(
      map((response: any) => {
        // Crear enlace de descarga temporal
        const link = document.createElement('a');
        link.href = response.url;
        link.download = response.nombre_archivo;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        return { success: true, filename: response.nombre_archivo };
      })
    );
  }

  // Obtener URL pública del archivo
  getFileUrl(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/url`);
  }

  // Obtener contenido para vista previa (solo PDFs)
  getFileContent(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/preview`, {
      responseType: 'blob'
    });
  }
}