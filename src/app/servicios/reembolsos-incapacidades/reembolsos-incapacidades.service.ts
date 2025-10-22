import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IApiResponse } from '../../interfaces/respuesta.interface';
import { 
  CreateSolicitudesReembolsoDto, 
  SolicitudReembolso, 
  CrearSolicitudResponse,
  SolicitudesPaginadasResponse,
  ParametrosBusquedaSolicitudes, 
  ResponseBajasMedicas,
  DetalleReembolsoCalculado,
  BajaMedica,
  ResponseAsegurado,
  DatosAsegurado
} from '../../interfaces/reembolsos-incapacidades/reembolsos-incapacidades.interface';

@Injectable({
  providedIn: 'root'
})
export class ReembolsosIncapacidadesService {

  constructor(private http: HttpClient) { }

//1.- CREAR SOLICITUD MENSUAL DE REEMBOLSO -------------------------------------------------------------
  crearSolicitudMensual(createDto: CreateSolicitudesReembolsoDto): Observable<CrearSolicitudResponse> {
    return this.http.post<any>(`${environment.url}reembolsos-incapacidades`, createDto).pipe(
      map((response) => {
        console.log('🔍 Respuesta completa del backend:', response);
        
        // Si la respuesta tiene la estructura IApiResponse
        if (response.status !== undefined && response.data) {
          return response.data;
        }
        
        // Si la respuesta viene directamente (como tu backend actualizado)
        if (response.mensaje && response.id_solicitud !== undefined) {
          return {
            mensaje: response.mensaje,
            id_solicitud: response.id_solicitud
          };
        }
        
        // Si hay mensaje pero no la estructura esperada
        if (response.mensaje) {
          return {
            mensaje: response.mensaje,
            id_solicitud: response.id_solicitud_reembolso || 0
          };
        }
        
        console.log('⚠️ Estructura de respuesta inesperada:', response);
        throw new Error('Estructura de respuesta inesperada del servidor');
      })
    );
  }

// 2.- OBTENER SOLICITUD POR ID -------------------------------------------------------------------------
  obtenerSolicitudPorId(id: number): Observable<SolicitudReembolso> {
    return this.http.get<any>(`${environment.url}reembolsos-incapacidades/${id}`).pipe(
      map((response) => {
        console.log('🔍 Respuesta del backend para obtener solicitud:', response);
        
        // Si la respuesta tiene la estructura IApiResponse
        if (response.status !== undefined && response.data) {
          return response.data;
        }
        
        // Si la respuesta viene directamente (como tu backend está devolviendo)
        if (response.id_solicitud_reembolso !== undefined) {
          return response;
        }
        
        console.log('⚠️ Estructura de respuesta inesperada:', response);
        throw new Error('No se pudo obtener la solicitud: Estructura de respuesta inesperada');
      })
    );
  }

// 3.- OBTENER TODAS LAS SOLICITUDES POR CODIGO PATRONAL CON PAGINACIÓN Y FILTROS -------------------------------------------------------------------------
  obtenerSolicitudesPorCodPatronal(
    cod_patronal: string, 
    parametros?: ParametrosBusquedaSolicitudes
  ): Observable<SolicitudesPaginadasResponse> {
    let params = new HttpParams();
    
    if (parametros?.pagina !== undefined) {
      params = params.set('pagina', parametros.pagina.toString());
    }
    if (parametros?.limite !== undefined) {
      params = params.set('limite', parametros.limite.toString());
    }
    if (parametros?.busqueda) {
      params = params.set('busqueda', parametros.busqueda);
    }
    if (parametros?.mes) {
      params = params.set('mes', parametros.mes);
    }
    if (parametros?.anio) {
      params = params.set('anio', parametros.anio);
    }

    return this.http.get<SolicitudesPaginadasResponse>(
      `${environment.url}reembolsos-incapacidades/cod-patronal/${cod_patronal}`,
      { params }
    );
  }



  // Buscar bajas médicas por matrícula
  buscarBajasMedicasPorMatricula(matricula: string): Observable<ResponseBajasMedicas> {
    return this.http.get<ResponseBajasMedicas>(`${environment.url}servicios-externos/GetCertificadoIncapacidadByParamMat/${matricula}`);
  }

  // Buscar asegurado por CI
  buscarAseguradoPorCi(ci: string): Observable<ResponseAsegurado> {
    return this.http.get<ResponseAsegurado>(`${environment.url}servicios-externos/GetAseguradoCi/${ci}`);
  }

  // Buscar asegurado por matrícula
  buscarAseguradoPorMatricula(matricula: string): Observable<ResponseAsegurado> {
    return this.http.get<ResponseAsegurado>(`${environment.url}servicios-externos/GetAseguradoMat/${matricula}`);
  }

  // Obtener salario de trabajador desde planillas
  obtenerSalarioTrabajador(codPatronal: string, mes: string, gestion: string, matricula: string): Observable<any> {
    // Codificar la matrícula para manejar espacios y caracteres especiales
    const matriculaEncoded = encodeURIComponent(matricula);
    
    return this.http.get<any>(`${environment.url}reembolsos-incapacidades/obtener-salario-trabajador/${codPatronal}/${mes}/${gestion}/${matriculaEncoded}`);
  }

  // Método para calcular el reembolso basado en una baja médica seleccionada
  calcularReembolso(bajaMedica: BajaMedica, datosWorker: any, codPatronal: string, mes: string, gestion: string): Observable<any> {
    const calcularDto = {
      matricula: bajaMedica.ASE_MAT,
      cod_patronal: codPatronal,
      mes: mes,
      gestion: gestion,
      baja_medica: bajaMedica,
      usuario_calculo: 'SYSTEM'
    };

    return this.http.post<any>(`${environment.url}reembolsos-incapacidades/calcular-reembolso`, calcularDto);
  }

  // Método para calcular reembolso en modo prueba (sin validar planilla)
  calcularReembolsoPrueba(datosWorker: any, bajaMedica: any, mes: string, gestion: string): Observable<any> {
    const calcularDto = {
      datos_trabajador: {
        ci: datosWorker.ci,
        apellido_paterno: datosWorker.apellido_paterno,
        apellido_materno: datosWorker.apellido_materno,
        nombres: datosWorker.nombres,
        matricula: datosWorker.matricula,
        salario: datosWorker.salario,
        dias_pagados: datosWorker.dias_pagados
      },
      baja_medica: {
        tipo_baja: bajaMedica.tipo_baja,
        fecha_inicio: bajaMedica.fecha_inicio,
        fecha_fin: bajaMedica.fecha_fin,
        dias_impedimento: bajaMedica.dias_impedimento,
        especialidad: bajaMedica.especialidad,
        medico: bajaMedica.medico,
        comprobante: bajaMedica.comprobante
      },
      mes: mes,
      gestion: gestion
    };

    return this.http.post<any>(`${environment.url}reembolsos-incapacidades/calcular-reembolso-prueba`, calcularDto);
  }

  // Método auxiliar para formatear fechas
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Método para validar si un trabajador cumple con las cotizaciones mínimas
  validarCotizacionesPrevias(tipoIncapacidad: string, cotizacionesPrevias: number): boolean {
    switch (tipoIncapacidad) {
      case 'ENFERMEDAD':
      case 'PROFESIONAL':
        return cotizacionesPrevias >= 2;
      case 'MATERNIDAD':
        return cotizacionesPrevias >= 4;
      default:
        return cotizacionesPrevias >= 2;
    }
  }

  // Crear detalle de reembolso
crearDetalle(detalle: any): Observable<any> {
  return this.http.post<any>(`${environment.url}reembolsos-incapacidades/detalles`, detalle);
}

// 4.- OBTENER DETALLES POR SOLICITUD CON BÚSQUEDA Y PAGINACIÓN -------------------------------------------------------------------------
obtenerDetallesPorSolicitud(
  idSolicitud: number, 
  busqueda?: string, 
  tipoIncapacidad?: string,
  pagina?: number,
  limite?: number
): Observable<any> {
  let params = new HttpParams();
  
  if (busqueda && busqueda.trim() !== '') {
    params = params.set('busqueda', busqueda);
  }
  if (tipoIncapacidad && tipoIncapacidad.trim() !== '') {
    params = params.set('tipo_incapacidad', tipoIncapacidad);
  }
  if (pagina !== undefined) {
    params = params.set('pagina', pagina.toString());
  }
  if (limite !== undefined) {
    params = params.set('limite', limite.toString());
  }

  return this.http.get<any>(
    `${environment.url}reembolsos-incapacidades/${idSolicitud}/detalles`,
    { params }
  );
}

// Eliminar detalle
eliminarDetalle(idDetalle: number): Observable<any> {
  return this.http.delete<any>(`${environment.url}reembolsos-incapacidades/detalles/${idDetalle}`);
}

// Actualizar totales de solicitud
actualizarTotales(idSolicitud: number, totales: { total_reembolso: number; total_trabajadores: number }): Observable<any> {
  return this.http.patch<any>(`${environment.url}reembolsos-incapacidades/${idSolicitud}/totales`, totales);
}

// ===== MÉTODOS PARA MANEJO DE ARCHIVOS DE DENUNCIA =====

// Subir archivo de denuncia
subirArchivoDenuncia(idDetalle: number, archivo: File): Observable<any> {
  const formData = new FormData();
  formData.append('archivo_denuncia', archivo);
  formData.append('id_detalle_reembolso', idDetalle.toString());
  
  return this.http.post<any>(`${environment.url}reembolsos-incapacidades/detalles/${idDetalle}/archivo-denuncia`, formData);
}

// Obtener información del archivo de denuncia
obtenerArchivoDenuncia(idDetalle: number): Observable<any> {
  return this.http.get<any>(`${environment.url}reembolsos-incapacidades/detalles/${idDetalle}/archivo-denuncia`);
}

// Descargar archivo de denuncia
descargarArchivoDenuncia(idDetalle: number): Observable<Blob> {
  return this.http.get(`${environment.url}reembolsos-incapacidades/detalles/${idDetalle}/descargar-denuncia`, {
    responseType: 'blob'
  });
}

// Ver archivo de denuncia (para visualización sin descarga)
verArchivoDenuncia(idDetalle: number): string {
  return `${environment.url}reembolsos-incapacidades/detalles/${idDetalle}/ver-denuncia`;
}

// ===== MÉTODOS PARA PRESENTAR SOLICITUD =====

// Presentar solicitud de reembolso
presentarSolicitud(idSolicitud: number, nombreUsuario?: string): Observable<any> {
  return this.http.post<any>(`${environment.url}reembolsos-incapacidades/${idSolicitud}/presentar`, {
    nombreUsuario: nombreUsuario
  });
}

// Obtener URL del archivo usando la ruta de la base de datos (similar a recursos)
obtenerUrlArchivoDenuncia(detalle: any): string {
  if (!detalle.ruta_file_denuncia) {
    return '';
  }
  
  // Construir URL base - asegurar que termine con /
  let baseUrl = environment.url.replace('/api/v1/', '');
  if (!baseUrl.endsWith('/')) {
    baseUrl += '/';
  }
  
  // La ruta en la base de datos es algo como "denuncias/denuncia-66-20250109-123456-123456789.pdf"
  // Necesitamos construir la URL completa
  const filename = detalle.ruta_file_denuncia.split('/').pop() || detalle.ruta_file_denuncia;
  
  return `${baseUrl}denuncias/${filename}`;
}

// Método para generar reporte PDF
generarReportePDF(idSolicitud: number): Observable<Blob> {
  const params = new HttpParams().set('idSolicitud', idSolicitud.toString());
  return this.http.get(`${environment.url}reportes-reembolsos/reporte-pdf`, {
    params: params,
    responseType: 'blob'
  });
}

// Método para obtener datos del reporte en JSON
obtenerDatosReporte(idSolicitud: number): Observable<any> {
  const params = new HttpParams().set('idSolicitud', idSolicitud.toString());
  return this.http.get(`${environment.url}reportes-reembolsos/datos`, {
    params: params
  });
}

// ===== ENVIAR CORRECCIONES DE PLANILLA OBSERVADA =====
enviarCorrecciones(idSolicitud: number): Observable<any> {
  return this.http.put(`${environment.url}reembolsos-incapacidades/${idSolicitud}/enviar-correcciones`, {});
}

}
