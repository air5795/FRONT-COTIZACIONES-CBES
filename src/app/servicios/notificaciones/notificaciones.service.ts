import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NotificacionResponse {
  notificaciones: any[];
  total: number;
  totalNotificaciones: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificacionesService {
  private baseUrl = `${environment.url}notificaciones`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener las notificaciones de un usuario con paginación y filtros
   */
  getNotificaciones(
    id_usuario: string,
    leido?: boolean,
    pagina: number = 1,
    limite: number = 10,
  ): Observable<NotificacionResponse> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('limite', limite.toString());

    // Solo agregar el parámetro leido si tiene un valor definido
    if (leido !== undefined) {
      params = params.set('leido', leido.toString());
    }

    const url = `${this.baseUrl}/${id_usuario}`;
    
    return this.http.get<NotificacionResponse>(url, { params });
  }

  /**
   * Marcar una notificación específica como leída
   */
  marcarNotificacionComoLeida(id_notificacion: number): Observable<any> {
    const url = `${this.baseUrl}/marcar-leida/${id_notificacion}`;
    
    return this.http.post(url, {
      leido: true,
    });
  }

  /**
   * Obtener el contador de notificaciones no leídas
   */
  getContadorNoLeidas(id_usuario: string): Observable<{ contador: number; id_usuario: string }> {
    const url = `${this.baseUrl}/contador/${id_usuario}`;
    
    return this.http.get<{ contador: number; id_usuario: string }>(url);
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  marcarTodasComoLeidas(id_usuario: string): Observable<any> {
    const url = `${this.baseUrl}/marcar-todas-leidas/${id_usuario}`;
    
    return this.http.post(url, {});
  }
}