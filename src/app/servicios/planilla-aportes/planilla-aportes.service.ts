import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IApiResponse } from '../../interfaces/respuesta.interface';
import { IPaginatedPlanillaAportes } from '../../dominio/PlanillaAportes';

@Injectable({
  providedIn: 'root'
})
export class PlanillaAportesService {

  constructor(private http: HttpClient) { }
  getPlanillaAportesList(
    empNpatronal: string,
    periodo: number,
    gestion: number,
    page: number,
    cantidad: number): Observable<IPaginatedPlanillaAportes> {
    const url = `${environment.url}planilla/lista-empleados-planilla/${empNpatronal}/${periodo}/${gestion}?limit=${cantidad}&offset=${page}`;
    return this.http.get<IApiResponse<IPaginatedPlanillaAportes>>(url).pipe(
      map((response) => {
        // Comprueba si la respuesta es válida
        if (response.status && response.data) {
          return response.data;
        }
        // Lanza un error si la respuesta no es válida
        console.log(response.message);
        throw new Error('No se pudo obtener la lista de planillas de aportes registradas');
      })
    ); // Aquí se cambió any a PaginatedResponse
  }
  guardarIncapacidad(regIncapacidad: any): Observable<any> {
    return this.http.post(environment.url + "planilla-incapacidades", regIncapacidad);
  }
  /*Reporte Excel de planillas registradas por entidad asegurada*/
  descargarExcelCarbone(
    empNpatronal: string,
    periodo: number,
    gestion: number
  ): Observable<Blob> {
    const url = `${environment.url}planilla/generarPlanillas/excel-carbone/${empNpatronal}/${periodo}/${gestion}`;
    return this.http.get(url, { responseType: 'blob' });
  }
  /*Método para migrar las listas de planillas por empleado*/
  migrarPlanillaCotizacion(
    mes: string,
    gestion: string,
    empPatronal: string,
    file: File,
  ): Observable<IApiResponse<null>> {
    const formData: FormData = new FormData();
    formData.append('mes', mes);
    formData.append('gestion', gestion);
    formData.append('empPatronal', empPatronal);
    formData.append('file', file, file.name);

    const url = `${environment.url}planilla/migrar-planillas`;
    return this.http.post<IApiResponse<null>>(url, formData).pipe(
      map((response) => {
        if (response.status) {
          return response;
        }
        return response;
        throw new Error(response.message);
      })
    );
  }
  /*Método para migrar las listas de planillas por empleado*/
  validaAfiliacion(
    mes: string,
    gestion: string,
    empPatronal: string
  ): Observable<IApiResponse<null>> {
    const bodyData =  {mes: mes, gestion: gestion, empPatronal: empPatronal};
    const url = `${environment.url}planilla/valida-afiliaciones`;
    return this.http.put<IApiResponse<null>>(url, bodyData).pipe(
      map((response) => {
        if (response.status) {
          return response;
        }
        return response;
        throw new Error(response.message);
      })
    );
  }
}
