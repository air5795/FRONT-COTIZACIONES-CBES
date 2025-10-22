import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { forkJoin } from 'rxjs';
import { DevengadosService, DetalleLiquidacionDevengada } from '../../../servicios/devengados/devengados.service';
import { PlanillasAportesService } from '../../../servicios/planillas-aportes/planillas-aportes.service';

@Component({
  selector: 'app-detalle-devengado',
  templateUrl: './detalle-devengado.component.html',
  styleUrls: ['./detalle-devengado.component.css']
})
export class DetalleDevengadoComponent implements OnInit {

  detalle: DetalleLiquidacionDevengada | null = null;
  planilla: any = null;
  loading: boolean = false;
  generandoPDF: boolean = false;
  idPlanilla: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private devengadosService: DevengadosService,
    private planillasService: PlanillasAportesService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.idPlanilla = +params['id'];
      if (this.idPlanilla) {
        this.cargarDetalle();
      }
    });
  }

  /**
   * 📄 Cargar detalle de la liquidación devengada
   */
  cargarDetalle(): void {
    this.loading = true;
    
    // Usar forkJoin para hacer ambas llamadas en paralelo
    forkJoin({
      detalle: this.devengadosService.obtenerDetalleLiquidacionDevengada(this.idPlanilla),
      planilla: this.planillasService.obtenerLiquidacion(this.idPlanilla)
    }).subscribe({
      next: ({ detalle, planilla }) => {
        this.detalle = detalle;
        this.planilla = planilla;
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar detalle:', error);
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el detalle de la liquidación devengada.'
        });
        this.volver();
      }
    });
  }

  /**
   * 🖨️ Generar PDF del reporte
   */
  generarPDF(): void {
    if (!this.detalle) return;
    
    this.generandoPDF = true;
    
    this.devengadosService.generarReporteDevengado(this.idPlanilla).subscribe({
      next: (blob) => {
        // Crear URL para el blob
        const url = window.URL.createObjectURL(blob);
        
        // Crear enlace de descarga
        const link = document.createElement('a');
        link.href = url;
        link.download = `liquidacion_devengada_${this.detalle?.cod_patronal}_${this.detalle?.mes}_${this.detalle?.gestion}.pdf`;
        link.click();
        
        // Limpiar URL
        window.URL.revokeObjectURL(url);
        
        this.generandoPDF = false;
        this.messageService.add({
          severity: 'success',
          summary: 'PDF Generado',
          detail: 'El reporte se ha descargado correctamente.'
        });
      },
      error: (error) => {
        console.error('Error al generar PDF:', error);
        this.generandoPDF = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo generar el reporte PDF.'
        });
      }
    });
  }

  /**
   * 🔙 Volver a la lista
   */
  volver(): void {
    this.router.navigate(['/cotizaciones/devengados']);
  }

  /**
   * 💰 Formatear moneda
   */
  formatearMoneda(monto: number): string {
    return new Intl.NumberFormat('es-BO', { 
      style: 'currency', 
      currency: 'BOB' 
    }).format(monto);
  }

  /**
   * 📅 Formatear fecha
   */
  formatearFecha(fecha: string | Date): string {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-ES');
  }

  /**
   * 🎨 Obtener clase CSS para días de mora
   */
  obtenerClaseMora(): string {
    if (!this.detalle) return '';
    
    const dias = this.detalle.dias_mora;
    if (dias === 0) return 'mora-none';
    if (dias <= 30) return 'mora-low';
    if (dias <= 90) return 'mora-medium';
    if (dias <= 180) return 'mora-high';
    return 'mora-critical';
  }

  /**
   * 📅 Formatear fecha corta (dd/mm/yyyy)
   */
  formatearFechaCorta(fecha: string | Date): string {
    if (!fecha) return '-';
    const date = new Date(fecha);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * 📅 Formatear mes corto (primeras 2 letras)
   */
  formatearMesCorto(mes: string): string {
    if (!mes) return '';
    return mes.substring(0, 2).toLowerCase();
  }

  /**
   * 💰 Formatear moneda sin símbolo (solo números)
   */
  formatearMonedaSinSimbolo(monto: number): string {
    return new Intl.NumberFormat('es-BO', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(monto);
  }

  /**
   * 🎨 Obtener nivel de alerta
   */
  obtenerNivelAlerta(): 'success' | 'info' | 'warning' | 'danger' {
    if (!this.detalle) return 'info';
    
    const porcentaje = (this.detalle.subtotal_recargos_ley / this.detalle.salario_cotizable) * 100;
    
    if (porcentaje < 5) return 'info';
    if (porcentaje < 15) return 'warning';
    return 'danger';
  }
}