import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FiltrosDevengados {
  fechaDesde?: string;
  fechaHasta?: string;
  codPatronal?: string;
  empresa?: string;
  mes?: string;
  gestion?: string;
}

export interface LiquidacionDevengada {
  id_planilla_aportes: number;
  cod_patronal: string;
  empresa: string;
  mes: string;
  gestion: string;
  fecha_planilla: Date;
  fecha_liquidacion: Date;
  total_importe: number;
  dias_retraso: number;
  total_multas: number;
  total_a_cancelar: number;
  tipo_empresa: string;
  nivel_multa: 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAJO' | 'SIN_MULTA';
  dias_mora_categoria: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA' | 'SIN_MORA';
}

export interface DetalleLiquidacionDevengada {
  // Información general
  tipo_empresa: string;
  tasa: string;
  fecha_presentacion_oficial: string;
  fecha_deposito_presentacion: string;
  calculo_vigencia_hasta: string;
  salario_cotizable: number;
  subtotal_aportes: number;

  // Empresa
  empresa: string;
  regional: string;
  cod_patronal: string;
  mes: string;
  gestion: string;

  // Recargos de ley
  dias_mora: number;
  ap_ac: number;
  interes: number;
  multa_sobre_interes: number;
  multa_no_presentacion: number;
  subtotal_recargos_ley: number;

  // Deducciones
  descuento_min_salud: number;
  otros_descuentos: number;
  subtotal_deducciones: number;

  // Totales
  total_a_cancelar: number;

  // Metadatos
  fecha_liquidacion: Date;
  com_nro: number;
  ufv_dia_formal: number;
  ufv_dia_presentacion: number;
  nota_calculo: string;
  presentacion_fecha: string;
}

export interface EstadisticasDevengadas {
  total_devengadas: number;
  por_tipo_empresa: Array<{
    tipo: string;
    cantidad: number;
    total_multas: number;
  }>;
  por_mes: Array<{
    mes: string;
    gestion: string;
    cantidad: number;
    total_multas: number;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class DevengadosService {

  constructor(private http: HttpClient) { }

  /**
   * 📋 Obtener lista de liquidaciones devengadas con filtros
   */
  obtenerLiquidacionesDevengadas(filtros?: FiltrosDevengados): Observable<{
    mensaje: string;
    total: number;
    liquidaciones: LiquidacionDevengada[];
  }> {
    let params = new HttpParams();
    
    if (filtros) {
      if (filtros.fechaDesde) params = params.set('fechaDesde', filtros.fechaDesde);
      if (filtros.fechaHasta) params = params.set('fechaHasta', filtros.fechaHasta);
      if (filtros.codPatronal) params = params.set('codPatronal', filtros.codPatronal);
      if (filtros.empresa) params = params.set('empresa', filtros.empresa);
      if (filtros.mes) params = params.set('mes', filtros.mes);
      if (filtros.gestion) params = params.set('gestion', filtros.gestion);
    }

    return this.http.get<any>(`${environment.url}devengados`, { params });
  }

  /**
   * 📄 Obtener detalle específico de liquidación devengada
   */
  obtenerDetalleLiquidacionDevengada(idPlanilla: number): Observable<DetalleLiquidacionDevengada> {
    return this.http.get<DetalleLiquidacionDevengada>(`${environment.url}devengados/${idPlanilla}/detalle`);
  }

  /**
   * 📈 Obtener estadísticas de liquidaciones devengadas
   */
  obtenerEstadisticasDevengadas(): Observable<EstadisticasDevengadas> {
    return this.http.get<EstadisticasDevengadas>(`${environment.url}devengados/estadisticas`);
  }

  /**
   * 🖨️ Generar reporte PDF de liquidación devengada
   * (Reutilizamos el endpoint existente de planillas)
   */
  generarReporteDevengado(idPlanilla: number): Observable<Blob> {
    return this.http.get(`${environment.url}planillas_aportes/reporte-planilla-regional/${idPlanilla}`, {
      responseType: 'blob'
    });
  }
}