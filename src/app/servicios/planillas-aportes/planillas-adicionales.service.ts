import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagoAporte } from '../../models/pago-aporte.model';
import { PagoAporteAdicional } from '../../models/pago-aporte-adicional.model';

@Injectable({
  providedIn: 'root'
})
export class PlanillasAdicionalesService {

  constructor(private http: HttpClient) {}

  // Método para subir el archivo Excel y guardar la planilla adicional
  subirPlanillaAdicional(idPlanillaAportes: number, file: File, motivoAdicional: string , tipo_empresa:string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('motivo_adicional', motivoAdicional);
    formData.append('tipo_empresa', tipo_empresa);
    const headers = new HttpHeaders();

    return this.http.post(`${environment.url}planillas_adicionales/subir/${idPlanillaAportes}`, formData, { headers });
  }

  // Nuevo método para obtener el historial de planillas adicionales
  obtenerHistorialAdicional(
    idPlanillaAportes: number,
    pagina: number = 1,
    limite: number = 10,
    busqueda: string = '',
    mes?: string,
    anio?: string
  ): Observable<any> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('limite', limite.toString())
      .set('busqueda', busqueda);

    if (mes) {
      params = params.set('mes', mes);
    }
    if (anio) {
      params = params.set('anio', anio);
    }

    return this.http.get(`${environment.url}planillas_adicionales/historial/${idPlanillaAportes}`, { params });
  }
// Nuevo método para obtener detalles adicionales
  obtenerDetallesAdicional(
    idPlanillaAdicional: number,
    pagina: number = 1,
    limite: number = 10,
    busqueda: string = ''
  ): Observable<any> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('limite', limite.toString())
      .set('busqueda', busqueda);
    return this.http.get(`${environment.url}planillas_adicionales/detalles/${idPlanillaAdicional}`, { params });
  }

// obtener datos de tabla planillas_adicionales
getPlanillaIdAdicional(id_planilla_adicional: number): Observable<any> {
  return this.http.get(`${environment.url}planillas_adicionales/${id_planilla_adicional}`);
}

// para resumen 
obtenerDatosPlanillaADPorRegional(id_planilla_adicional: number): Observable<any> {
  return this.http.get(`${environment.url}planillas_adicionales/datos-planilla/${id_planilla_adicional}`);
}

// actualizar detalles de planilla

actualizarDetallesPlanillaAdicional(id_planilla_adicional: number, trabajadores: any[]): Observable<any> {
  return this.http.put(`${environment.url}planillas_adicionales/detalles/${id_planilla_adicional}`, { trabajadores });
}

// Eliminar detalles de planilla
eliminarDetallesPlanillaAdicional(id_planilla_adicional: number): Observable<any> {
  return this.http.delete(`${environment.url}planillas_adicionales/detalles/${id_planilla_adicional}`);
}

// actuializar planilla adicional de borrador a presentado 

actualizarEstadoAPendiente(id_planilla_adicional: number) {
  return this.http.put(`${environment.url}planillas_adicionales/estado/pendiente/${id_planilla_adicional}`, {});
}


/* ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// */
/* PAGOS PLANILLAS ADICIONALES DE APORTES ////////////////////////////////////////////////////////////////////////////////////////////////////////////////// */
/* ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// */

// 1. Crear un pago con imagen
createPagoAdicional(pagoData: any, file: File): Observable<PagoAporteAdicional> {
  const formData = new FormData();
  formData.append('id_planilla_adicional', pagoData.id_planilla_adicional);
  formData.append('fecha_pago', pagoData.fecha_pago);
  formData.append('monto_pagado', pagoData.monto_pagado);
  formData.append('metodo_pago', pagoData.metodo_pago || '');
  formData.append('comprobante_pago', pagoData.comprobante_pago || '');
  formData.append('observaciones', pagoData.observaciones || '');
  if (file) {
    formData.append('foto_comprobante', file, file.name);
  }

  return this.http.post<PagoAporteAdicional>(`${environment.url}pagos-aportes-adicionales/createAdicional`, formData);
}

// 3. Listar pagos por id_planilla_aportes (ajustado para devolver una lista)
findByIdPlanillaAdicional(id: number): Observable<PagoAporteAdicional[]> {
  return this.http.get<PagoAporteAdicional[]>(`${environment.url}pagos-aportes-adicionales/listar-pagos-empleador/${id}`);
}

// 4. Nuevo método para calcular el total a cancelar preliminar
calcularAportesPreliminar(id_planilla_adicional: number, fechaPago: string): Observable<any> {
  const body = { fecha_pago: fechaPago };
  return this.http.post<any>(`${environment.url}planillas_adicionales/calcular-preliminar`, body, {
    params: { id: id_planilla_adicional.toString() },
  });
}

generarReporteAporteAdicional(id_planilla: number): Observable<Blob> {
  return this.http.get(`${environment.url}planillas_adicionales/reporte-planilla-adicional-regional/${id_planilla}`, {
    responseType: 'blob' 
  });
}



}