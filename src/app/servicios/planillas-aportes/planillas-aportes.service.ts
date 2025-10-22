import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagoAporte } from '../../models/pago-aporte.model';

@Injectable({
  providedIn: 'root'
})
export class PlanillasAportesService {

  constructor(private http: HttpClient) {}

    descargarPlantilla(): Observable<Blob> {
      return this.http.get(`${environment.url}planillas_aportes/descargar-plantilla`, {
        responseType: 'blob' 
      });
    }

    descargarPlantillaCorta(): Observable<Blob> {
      return this.http.get(`${environment.url}planillas_aportes/descargar-plantilla-corta`, {
        responseType: 'blob' 
      });
    }

/* ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// */
/* PLANILLAS MENSUALES DE APORTES ////////////////////////////////////////////////////////////////////////////////////////////////////////////////// */
/* ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  subirPlanilla(
    archivo: File,
    codPatronal: string,
    mes: string,
    gestion: string,
    tipoPlanilla: string,
    usuario_creacion: string,
    nombre_creacion: string
  ): Observable<any> {
    const formData = new FormData();
    formData.append('file', archivo);
    formData.append('cod_patronal', codPatronal);
    formData.append('gestion', gestion);
    formData.append('mes', mes);
    formData.append('tipo_planilla', tipoPlanilla);
    formData.append('usuario_creacion', usuario_creacion);
    formData.append('nombre_creacion', nombre_creacion);
    return this.http.post(`${environment.url}planillas_aportes/subir`, formData, {
      headers: new HttpHeaders().set('Accept', 'application/json')
    });
  }

  actualizarDetallesPlanilla(id_planilla: number, trabajadores: any[]): Observable<any> {
    return this.http.put(`${environment.url}planillas_aportes/detalles/${id_planilla}`, { trabajadores });
  }

  getPlanillas(
    cod_patronal: string,
    pagina: number = 0,
    limite: number = 10,
    busqueda: string = '',
    mes?: string,
    anio?: string
  ): Observable<any> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('limite', limite.toString());
  
    if (busqueda) {
      params = params.set('busqueda', busqueda);
    }
    if (mes) {
      params = params.set('mes', mes);
    }
    if (anio) {
      params = params.set('anio', anio);
    }
  
    
    return this.http.get(`${environment.url}planillas_aportes/historial/${cod_patronal}`, { params });
  }

  obtenerHistorialAdmin(pagina: number = 0, limite: number = 10, busqueda: string = '' , mes?:string, anio?:string , estado?:number): Observable<any> {

    let params = new HttpParams()
      .set('pagina', pagina)
      .set('limite', limite);
    
    if (busqueda) {
      params = params.set('busqueda', busqueda);
    }
    if (mes) {
      params = params.set('mes', mes);
    }

    if (anio) {
      params = params.set('anio', anio);
    }
    if (estado !== undefined && estado !== null) {
      params = params.set('estado', estado);
    }

   
    return this.http.get(`${environment.url}planillas_aportes/historialAdmin`, { params });
  }

  getPlanillasTodoHistorial(pagina: number = 0, limite: number = 10, busqueda: string = ''): Observable<any> {
    let params = new HttpParams()
      .set('pagina', pagina)  
      .set('limite', limite);
  
    if (busqueda) {
      params = params.set('busqueda', busqueda);
    }
  
  
    return this.http.get(`${environment.url}planillas_aportes/historial-completo`, { params });
  }

  getPlanillasTodo(): Observable<any> {
    return this.http.get(`${environment.url}planillas_aportes/historial`);
  }
  
  getPlanillaId(id_planilla: number): Observable<any> {
    return this.http.get(`${environment.url}planillas_aportes/${id_planilla}`);
  }

  getPlanillaDetalle(id_planilla: number,pagina: number = 1,limite: number = 10,busqueda: string = ''): Observable<any> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('limite', limite.toString());
    if (busqueda) {
      params = params.set('busqueda', busqueda);
    }
    return this.http.get(`${environment.url}planillas_aportes/detalles/${id_planilla}`, { params });
  }

  enviarCorreccionPlanilla(id_planilla: number, data: { 
    trabajadores: any[]; 
    fecha_planilla?: string;
    usuario_procesador?: string;
    nom_usuario?: string;
  }): Observable<any> {
    return this.http.put(`${environment.url}planillas_aportes/corregir/${id_planilla}`, data);
  }


  actualizarEstadoPlanilla(
    id_planilla: number, 
    estado: number, 
    observaciones?: string, 
    usuarioProcesador?: string,
    nombreProcesador?: string
  ): Observable<any> {
    const body = { 
      estado, 
      observaciones, 
      usuario_procesador: usuarioProcesador,
      nom_usuario: nombreProcesador 
    };
    
    
    return this.http.put(`${environment.url}planillas_aportes/estado/${id_planilla}`, body);
  }

  actualizarEstadoAPendiente(idPlanilla: number, payload: {
    fecha_declarada?: string;
    usuario_procesador?: string;
    nom_usuario?: string;
  }): Observable<any> {
    return this.http.put(`${environment.url}planillas_aportes/estado/pendiente/${idPlanilla}`, payload);
  }

  eliminarDetallesPlanilla(id_planilla: number): Observable<any> {
    return this.http.delete(`${environment.url}planillas_aportes/detalles/${id_planilla}`);
  }


  compararPlanillas(cod_patronal: string, gestion: string, mesAnterior: string, mesActual: string): Observable<any> {
    return this.http.get<any>(`${environment.url}planillas_aportes/comparar/${cod_patronal}/${gestion}/${mesAnterior}/${mesActual}`);
  }

  generarReporteBajas(id_planilla: number,cod_patronal: string, mesAnterior: string, mesActual: string, gestion: string): Observable<Blob> {
    return this.http.get(`${environment.url}planillas_aportes/reporte-bajas/${id_planilla}/${cod_patronal}/${mesAnterior}/${mesActual}/${gestion}`, {
      responseType: 'blob' 
    });
  }

  generarReporteResumen(id_planilla: number): Observable<Blob> {
    return this.http.get(`${environment.url}planillas_aportes/reporte-planilla/${id_planilla}`, {
      responseType: 'blob' 
    });
  }

  obtenerDatosPlanillaPorRegional(id_planilla: number): Observable<any> {
    return this.http.get(`${environment.url}planillas_aportes/datos-planilla/${id_planilla}`);
  }

  // ELIMINAR PLANILLA COMPLETA (solo si está en estado BORRADOR)
eliminarPlanillaCompleta(id_planilla: number, usuario_eliminacion?: string): Observable<any> {
  const body = usuario_eliminacion ? { usuario_eliminacion } : {};
  
  return this.http.delete(`${environment.url}planillas_aportes/${id_planilla}`, { 
    body,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

/* ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// */
/* PAGOS PLANILLAS MENSUALES DE APORTES ////////////////////////////////////////////////////////////////////////////////////////////////////////////////// */
/* ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// */

// 1. Crear un pago con imagen
createPago(pagoData: any, file: File): Observable<PagoAporte> {
  const formData = new FormData();
  formData.append('id_planilla_aportes', pagoData.id_planilla_aportes);
  formData.append('fecha_pago', pagoData.fecha_pago);
  formData.append('monto_pagado', pagoData.monto_pagado);
  formData.append('monto_demasia', pagoData.monto_demasia || '0');
  formData.append('total_a_cancelar', pagoData.total_a_cancelar || '0');
  formData.append('metodo_pago', pagoData.metodo_pago || '');
  formData.append('comprobante_pago', pagoData.comprobante_pago || '');
  formData.append('observaciones', pagoData.observaciones || '');
  if (file) {
    formData.append('foto_comprobante', file, file.name);
  }

  return this.http.post<PagoAporte>(`${environment.url}pagos-aportes/create`, formData);
}

// ✅ NUEVO MÉTODO: Obtener demasía del mes anterior
obtenerDemasiaMesAnterior(idPlanilla: number): Observable<number> {
  return this.http.get<number>(`${environment.url}pagos-aportes/demasia-mes-anterior/${idPlanilla}`);
}

// 2. Listar todos los pagos
findAll(): Observable<PagoAporte[]> {
  return this.http.get<PagoAporte[]>(`${environment.url}pagos-aportes`);
}

// 3. Listar pagos por id_planilla_aportes (ajustado para devolver una lista)
findByIdPlanilla(id: number): Observable<PagoAporte[]> {
  return this.http.get<PagoAporte[]>(`${environment.url}pagos-aportes/by-id/${id}`);
}

// 4. Nuevo método para calcular el total a cancelar preliminar
calcularAportesPreliminar(idPlanilla: number, fechaPago: string): Observable<any> {
  const body = { fecha_pago: fechaPago };
  return this.http.post<any>(`${environment.url}planillas_aportes/calcular-preliminar`, body, {
    params: { id: idPlanilla.toString() },
  });
}

generarReporteDS08(id_planilla: number): Observable<Blob> {
  return this.http.get(`${environment.url}planillas_aportes/reporte-aportes/${id_planilla}`, {
    responseType: 'blob' 
  });
}

generarReporteAporte(id_planilla: number): Observable<Blob> {
  return this.http.get(`${environment.url}planillas_aportes/reporte-planilla-regional/${id_planilla}`, {
    responseType: 'blob' 
  });
}

findAllWithDetails(): Observable<any> {
  return this.http.get(`${environment.url}pagos-aportes/lista-pagos`);
}

generarReportePagoAporte(id_planilla_aportes: number): Observable<Blob> {
  return this.http.get(`${environment.url}pagos-aportes/reporte-pago/${id_planilla_aportes}`, {
    responseType: 'blob'
  });
}

generarReporteHistorial(mes: number, gestion: number): Observable<Blob> {
  return this.http.get(`${environment.url}planillas_aportes/reporte-aportes-mes/${mes}/${gestion}`, {
    responseType: 'blob'
  });
}

verificarAfiliacionDetalles(idPlanilla: number): Observable<any> {
  return this.http.post(`${environment.url}planillas_aportes/verificar-afiliacion/${idPlanilla}`, {});
}

generarReporteAfiliacion(idPlanilla: number): Observable<Blob> {
  return this.http.get(`${environment.url}planillas_aportes/reporte-afiliacion/${idPlanilla}`, {
    responseType: 'blob'
  });
}

generarReportePlanillaSalarios(idPlanilla: number): Observable<Blob> {
  return this.http.get(`${environment.url}planillas_aportes/reporte-detalles-excel/${idPlanilla}`, {
    responseType: 'blob',
  });
}


  
  
/* ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// */
/* LIQUIDACION PLANILLAS MENSUALES DE APORTES ////////////////////////////////////////////////////////////////////////////////////////////////////////////////// */
/* ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// */


// 1.- Calcular aportes
calcularAportes(id: number): Observable<any> {
  return this.http.post(`${environment.url}planillas_aportes/calcular/${id}`, {});
}

  validarLiquidacion(idPlanilla: number, payload: { fecha_pago?: string; valido_cotizacion?: string }): Observable<any> {
    return this.http.put(`${environment.url}planillas_aportes/validar-liquidacion/${idPlanilla}`, payload);
  }

  // NUEVO MÉTODO: Obtener liquidación (desde BD si existe, o calcular)
  obtenerLiquidacion(idPlanilla: number): Observable<any> {
    return this.http.get(`${environment.url}planillas_aportes/${idPlanilla}/liquidacion`);
  }



/* ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// */
/* LIQUIDACIÓN ESPECÍFICA POR TIPO DE EMPRESA ///////////////////////////////////////////////////////////////////////////////////////// */
/* ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// */

// 🏢 EMPRESAS PRIVADAS: Recalcular liquidación con nueva fecha
recalcularLiquidacionPrivada(idPlanilla: number, fechaPago: Date): Observable<any> {
  
  const body = {
    fechaPago: fechaPago.toISOString()
  };
  
  return this.http.post(`${environment.url}planillas_aportes/privada/${idPlanilla}/recalcular-fecha`, body);
}

// 🏛️ EMPRESAS PÚBLICAS: Actualizar con nuevo monto TGN real
actualizarEmpresaPublicaConTGN(idPlanilla: number, fechaPago: Date, nuevoMontoTGN: number): Observable<any> {
  
  const body = {
    fechaPago: fechaPago.toISOString(),
    nuevoMontoTGN: nuevoMontoTGN
  };
  
  return this.http.post(`${environment.url}planillas_aportes/publica/${idPlanilla}/actualizar-tgn`, body);
}

// 🏛️ EMPRESAS PÚBLICAS: Recalcular liquidación normal (sin nuevo TGN)
recalcularLiquidacionPublica(idPlanilla: number, fechaPago: Date): Observable<any> {

  const body = {
    fechaPago: fechaPago.toISOString()
  };
  
  return this.http.post(`${environment.url}planillas_aportes/publica/${idPlanilla}/recalcular-fecha`, body);
}

// 🔧 HELPER: Determinar tipo de empresa desde datos de planilla
determinarTipoEmpresa(planilla: any): 'publica' | 'privada' {
  const tipo = planilla?.tipo_empresa?.toUpperCase();
  return tipo === 'AP' ? 'publica' : 'privada';
}

validarPlanilla(idPlanilla: number, nombreAdministrador: string): Observable<any> {
  return this.http.post(`${environment.url}planillas_aportes/${idPlanilla}/validar-planilla`, {
    nombreAdministrador: nombreAdministrador
  });
}





  /* ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// */
/* VERIFICACION AFILIACIONES ////////////////////////////////////////////////////////////////////////////////////////////////////////////////// */
/* ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// */


// ✅ MÉTODO PARA VERIFICAR CIS EN AFILIACIONES
verificarCiEnAfiliaciones(idPlanilla: number): Observable<any> {
  return this.http.post(`${environment.url}planillas_aportes/verificar-ci-simple/${idPlanilla}`, {});
}

// ✅ MÉTODO PARA DESCARGAR REPORTE DE VERIFICACIÓN
descargarReporteVerificacionAfiliaciones(idPlanilla: number): Observable<Blob> {
  return this.http.get(`${environment.url}planillas_aportes/reporte-verificacion-afiliaciones/${idPlanilla}`, {
    responseType: 'blob'
  });
}

  obtenerAnalisisAfiliacion(idPlanilla: number): Observable<any> {
    return this.http.get(`${environment.url}planillas_aportes/analisis-afiliacion/${idPlanilla}`);
  }

  // 1. ✅ AGREGAR al servicio (planilla-aportes.service.ts)
obtenerDatosVerificacionGuardados(idPlanilla: number): Observable<any> {
  return this.http.get(`${environment.url}planillas_aportes/datos-verificacion/${idPlanilla}`);
}



  /* ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// */
/* PÁGOS APORTES ////////////////////////////////////////////////////////////////////////////////////////////////////////////////// */
/* ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// */

// Método para actualizar observaciones de un pago
updateObservacionesPago(id: number, observaciones: string, usuario_modificacion?: string): Observable<any> {
  const body = {
    observaciones,
    usuario_modificacion: usuario_modificacion || 'SYSTEM'
  };
  
  return this.http.patch(`${environment.url}pagos-aportes/update-observaciones/${id}`, body);
}




}

