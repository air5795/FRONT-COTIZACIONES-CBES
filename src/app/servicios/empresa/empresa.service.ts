import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {

  constructor(private http: HttpClient) {}

  // Método existente
  getEmpresaByNroPatronal(nroPatronal: string): Observable<any> {
    return this.http.get<any>(`${environment.url}servicios-externos/GetEmpresaByNroPatronal/${nroPatronal}`);
  }

  // Método existente
  getAllEmpresas(): Observable<any> {
      return this.http.get<any>(`${environment.url}empresas`);
  }

  // Método existente
  empresasNroPatronal(nroPatronal: string): Observable<any> {
    return this.http.get<any>(`${environment.url}empresas/cod-patronal/${nroPatronal}`);
  }

  // Método existente
  getTipoByCodPatronal(codPatronal: string): Observable<string> {
    return this.http.get<string>(`${environment.url}empresas/tipo/${codPatronal}`, {
      responseType: 'text' as 'json', 
    });
  }

  // Método existente
  getDireccionCompleta(idEmpresa: number): Observable<{ direccion: string }> {
    return this.http.get<{ direccion: string }>(`${environment.url}empresas/${idEmpresa}/direccion-completa`);
  }
  
  // NUEVO MÉTODO - Obtener empresas paginadas
  getEmpresasPaginadas(
    page: number = 1,
    limit: number = 10,
    search: string = ''
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get(`${environment.url}empresas/paginated`, { params });
  }

  // NUEVO MÉTODO - Sincronizar empresas
  sincronizarEmpresas(): Observable<any> {
    return this.http.post(`${environment.url}empresas/sync`, {});
  }
}
