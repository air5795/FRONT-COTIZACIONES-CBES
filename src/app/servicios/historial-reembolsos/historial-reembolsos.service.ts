import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SolicitudPresentada {
  id_solicitud_reembolso: number;
  cod_patronal: string;
  mes: string;
  gestion: string;
  total_reembolso: number;
  total_trabajadores: number;
  estado: number;
  fecha_creacion: Date;
  fecha_modificacion: Date;
  fecha_presentacion?: Date;
  nombre_usuario?: string;
  observaciones?: string;
  tipo_empresa?: string;
  empresa: {
    id_empresa: number;
    emp_nom: string;
    cod_patronal: string;
  };
}

export interface EstadisticasGenerales {
  totalSolicitudes: number;
  totalTrabajadores: number;
  totalMonto: number;
  solicitudesPorMes: any[];
  empresasTop: any[];
}

export interface DetallesSolicitud {
  solicitud: SolicitudPresentada;
  detalles: any[];
  totalesPorTipo: any;
  totalTrabajadores: number;
  totalMonto: number;
}

export interface FiltrosHistorial {
  pagina?: number;
  limite?: number;
  busqueda?: string;
  mes?: string;
  anio?: string;
  codPatronal?: string;
}

@Injectable({
  providedIn: 'root'
})
export class HistorialReembolsosService {

  constructor(private http: HttpClient) {}

  // ===== MÉTODOS PARA OBTENER SOLICITUDES PRESENTADAS =====

  // Obtener todas las solicitudes presentadas con filtros
  obtenerSolicitudesPresentadas(filtros: FiltrosHistorial = {}): Observable<any> {
    const params = new URLSearchParams();
    
    if (filtros.pagina) params.append('pagina', filtros.pagina.toString());
    if (filtros.limite) params.append('limite', filtros.limite.toString());
    if (filtros.busqueda) params.append('busqueda', filtros.busqueda);
    if (filtros.mes) params.append('mes', filtros.mes);
    if (filtros.anio) params.append('anio', filtros.anio);
    if (filtros.codPatronal) params.append('codPatronal', filtros.codPatronal);

    const queryString = params.toString();
    const url = `${environment.url}historial-reembolsos${queryString ? '?' + queryString : ''}`;
    
    return this.http.get<any>(url);
  }

  // Obtener estadísticas generales
  obtenerEstadisticasGenerales(): Observable<EstadisticasGenerales> {
    return this.http.get<EstadisticasGenerales>(`${environment.url}historial-reembolsos/estadisticas`);
  }

  // Obtener detalles de una solicitud específica
  obtenerDetallesSolicitud(idSolicitud: number): Observable<DetallesSolicitud> {
    return this.http.get<DetallesSolicitud>(`${environment.url}historial-reembolsos/solicitud/${idSolicitud}`);
  }

  // Obtener estadísticas por empresa
  obtenerEstadisticasPorEmpresa(codPatronal: string): Observable<any> {
    return this.http.get<any>(`${environment.url}historial-reembolsos/empresa/${codPatronal}`);
  }

  // Actualizar estado de revisión de un detalle
  actualizarEstadoRevision(idDetalle: number, estadoRevision: 'neutro' | 'aprobado' | 'observado', observaciones?: string): Observable<any> {
    const body = {
      estadoRevision,
      observaciones
    };
    return this.http.put<any>(`${environment.url}historial-reembolsos/detalle/${idDetalle}/revision`, body);
  }

  // Aprobar planilla completa
  aprobarPlanilla(idSolicitud: number): Observable<any> {
    return this.http.put<any>(`${environment.url}historial-reembolsos/solicitud/${idSolicitud}/aprobar`, {});
  }

  // Observar planilla completa
  observarPlanilla(idSolicitud: number, observaciones: string): Observable<any> {
    const body = {
      observaciones
    };
    return this.http.put<any>(`${environment.url}historial-reembolsos/solicitud/${idSolicitud}/observar`, body);
  }

  // ===== MÉTODOS DE UTILIDAD =====

  // Formatear fecha para mostrar
  formatearFecha(fecha: Date | string): string {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-BO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Formatear monto para mostrar
  formatearMonto(monto: number): string {
    if (!monto) return '0.00';
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2
    }).format(monto);
  }

  // Obtener nombre del mes
  obtenerNombreMes(mes: string): string {
    const meses = {
      '01': 'ENERO', 
      '02': 'FEBRERO', 
      '03': 'MARZO', 
      '04': 'ABRIL',
      '05': 'MAYO', 
      '06': 'JUNIO', 
      '07': 'JULIO', 
      '08': 'AGOSTO',
      '09': 'SEPTIEMBRE', 
      '10': 'OCTUBRE', 
      '11': 'NOVIEMBRE', 
      '12': 'DICIEMBRE'
    };
    return meses[mes as keyof typeof meses] || mes;
  }

  // Obtener color del estado
  obtenerColorEstado(estado: number): string {
    const colores = {
      0: '#ffc107', // Borrador - Amarillo
      1: '#17a2b8', // Presentado - Azul
      2: '#28a745', // Aprobado - Verde
      3: '#dc3545'  // Rechazado - Rojo
    };
    return colores[estado as keyof typeof colores] || '#6c757d';
  }

  // Obtener texto del estado
  obtenerTextoEstado(estado: number): string {
    const estados = {
      0: 'BORRADOR',
      1: 'PRESENTADO',
      2: 'APROBADO',
      3: 'OBSERVADO'
    };
    return estados[estado as keyof typeof estados] || 'DESCONOCIDO';
  }
  
  obtenerUrlArchivoDenuncia(rutaArchivo: string): string {
    const url = `${environment.url_imagenes}${rutaArchivo}`;
    console.log('🔗 Generando URL para archivo:', {
      rutaArchivo,
      urlImagenes: environment.url_imagenes,
      urlFinal: url
    });
    return url;
  }
}
