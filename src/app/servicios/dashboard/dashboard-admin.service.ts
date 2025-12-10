import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminDashboardSummary {
  planillasDeclaradas: number;
  planillasPendientesRevision: number;
  reembolsosSolicitados: number;
  reembolsosPendientesRevision: number;
}

export interface UltimaPlanilla {
  id: number;
  codPatronal: string;
  tipoPlanilla: string;
  empresa: string;
  fechaCreacion: string;
  totalImporte: number;
}

export interface UltimaReembolso {
  id: number;
  codPatronal: string;
  empresa: string;
  fechaCreacion: string;
  totalReembolso: number;
  estado: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardAdminService {
  private readonly baseUrl = `${environment.url}dashboard/admin`;

  constructor(private http: HttpClient) {}

  obtenerResumen(): Observable<AdminDashboardSummary> {
    return this.http
      .get<{ data: AdminDashboardSummary }>(`${this.baseUrl}/resumen`)
      .pipe(map((resp) => resp?.data || (resp as any)));
  }

  obtenerUltimasPlanillas(limit: number = 6): Observable<UltimaPlanilla[]> {
    let params = new HttpParams();
    if (limit) {
      params = params.set('limit', limit.toString());
    }
    return this.http
      .get<{ data: UltimaPlanilla[] }>(`${this.baseUrl}/ultimas-planillas`, { params })
      .pipe(map((resp) => resp?.data || (resp as any)));
  }

  obtenerUltimasReembolsos(limit: number = 6): Observable<UltimaReembolso[]> {
    let params = new HttpParams();
    if (limit) {
      params = params.set('limit', limit.toString());
    }
    return this.http
      .get<{ data: UltimaReembolso[] }>(`${this.baseUrl}/ultimas-reembolsos`, { params })
      .pipe(map((resp) => resp?.data || (resp as any)));
  }
}

