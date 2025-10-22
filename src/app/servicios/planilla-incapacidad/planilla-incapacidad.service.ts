import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IPaginatedPlanillaIncapacidad } from '../../dominio/PlanillaIncapacidad';
import { IApiResponse } from '../../interfaces/respuesta.interface';

@Injectable({
  providedIn: 'root'
})
export class PlanillaIncapacidadService {

  constructor(private http: HttpClient) { }
  getPlanillaIncapacidadesList(
    empNpatronal: string,
    idIncapacidad: number,
    fechaInicio: string,
    fechaFin: string,
    page: number,
    cantidad: number): Observable<IPaginatedPlanillaIncapacidad> {
    const url = `${environment.url}planilla-incapacidades/${empNpatronal}/${idIncapacidad}/${fechaInicio}/${fechaFin}?limit=${cantidad}&offset=${page}`;
    return this.http.get<IApiResponse<IPaginatedPlanillaIncapacidad>>(url).pipe(
      map((response) => {
        // Comprueba si la respuesta es válida
        if (response.status && response.data) {
          return response.data;
        }
        // Lanza un error si la respuesta no es válida
        console.log(response.message);
        throw new Error('No se pudo obtener la lista de planillas de incapacidad registradas');
      })
    ); // Aquí se cambió any a PaginatedResponse
  }
  guardarIncapacidad(regIncapacidad: any): Observable<any> {
    return this.http.post(environment.url + "planilla-incapacidades", regIncapacidad);
  }

  generarReporte(
    empNpatronal: string,
    idIncapacidad: number,
    fechaInicio: string,
    fechaFin: string
  ): Observable<Blob> {
    const url = `${environment.url}planilla-incapacidades/pdf/${empNpatronal}/${idIncapacidad}/${encodeURIComponent(fechaInicio)}/${encodeURIComponent(fechaFin)}`;
    const headers = new HttpHeaders({ 'Accept': 'application/pdf' });
  
    return this.http.get(url, { headers, responseType: 'blob' });
  }
}
