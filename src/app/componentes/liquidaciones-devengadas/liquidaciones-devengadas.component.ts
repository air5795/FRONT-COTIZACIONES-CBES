import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { DevengadosService, FiltrosDevengados, LiquidacionDevengada, EstadisticasDevengadas } from '../../servicios/devengados/devengados.service';
import { SessionService } from '../../servicios/auth/session.service';

@Component({
  selector: 'app-liquidaciones-devengadas',
  templateUrl: './liquidaciones-devengadas.component.html',
  styleUrls: ['./liquidaciones-devengadas.component.css']
})
export class LiquidacionesDevengadasComponent implements OnInit {

  // 📋 Datos principales
  liquidaciones: LiquidacionDevengada[] = [];
  liquidacionesFiltradas: LiquidacionDevengada[] = [];
  estadisticas: EstadisticasDevengadas | null = null;
  
  // 🔄 Estados
  loading: boolean = false;
  loadingEstadisticas: boolean = false;
  
  // 🔍 Filtros
  filtros: FiltrosDevengados = {};
  mostrarFiltros: boolean = false;
  
  // 📊 Opciones para filtros
  meses = [
    { label: 'Todos', value: '' },
    { label: 'Enero', value: 'ENERO' },
    { label: 'Febrero', value: 'FEBRERO' },
    { label: 'Marzo', value: 'MARZO' },
    { label: 'Abril', value: 'ABRIL' },
    { label: 'Mayo', value: 'MAYO' },
    { label: 'Junio', value: 'JUNIO' },
    { label: 'Julio', value: 'JULIO' },
    { label: 'Agosto', value: 'AGOSTO' },
    { label: 'Septiembre', value: 'SEPTIEMBRE' },
    { label: 'Octubre', value: 'OCTUBRE' },
    { label: 'Noviembre', value: 'NOVIEMBRE' },
    { label: 'Diciembre', value: 'DICIEMBRE' }
  ];

  gestiones: { label: string; value: string }[] = [];
  
  // 📝 Búsqueda y filtros compatibles con planillas-aportes
  busquedaGlobal: string = '';
  mesFiltro: string = '';
  anioFiltro: string = '';
  
  // 📊 Paginación
  limite: number = 10;
  totalRegistros: number = 0;
  
  // 🔐 Permisos
  esAdministrador: boolean = false;

  constructor(
    private devengadosService: DevengadosService,
    private messageService: MessageService,
    private sessionService: SessionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.verificarPermisos();
    this.inicializarGestiones();
    this.cargarLiquidacionesDevengadas();
    this.cargarEstadisticas();
  }

  /**
   * 🔐 Verificar que el usuario sea administrador
   */
  verificarPermisos(): void {
    this.esAdministrador = this.sessionService.esAdministrador();
    
    if (!this.esAdministrador) {
      this.messageService.add({
        severity: 'error',
        summary: 'Acceso Denegado',
        detail: 'Solo los administradores pueden acceder a las liquidaciones devengadas.'
      });
      this.router.navigate(['/cotizaciones/dashboard']);
      return;
    }
  }

  /**
   * 📅 Inicializar opciones de gestiones
   */
  inicializarGestiones(): void {
    const añoActual = new Date().getFullYear();
    this.gestiones = [{ label: 'Todas', value: '' }];
    
    for (let año = añoActual; año >= añoActual - 5; año--) {
      this.gestiones.push({ label: año.toString(), value: año.toString() });
    }
  }

  /**
   * 📋 Cargar liquidaciones devengadas
   */
  cargarLiquidacionesDevengadas(): void {
    this.loading = true;
    
    this.devengadosService.obtenerLiquidacionesDevengadas(this.filtros).subscribe({
      next: (response) => {
        this.liquidaciones = response.liquidaciones;
        this.aplicarFiltrosBusqueda();
        this.loading = false;
        
        this.messageService.add({
          severity: 'success',
          summary: 'Datos Cargados',
          detail: `${response.total} liquidaciones devengadas encontradas.`
        });
      },
      error: (error) => {
        console.error('Error al cargar liquidaciones devengadas:', error);
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las liquidaciones devengadas.'
        });
      }
    });
  }

  /**
   * 📈 Cargar estadísticas
   */
  cargarEstadisticas(): void {
    this.loadingEstadisticas = true;
    
    this.devengadosService.obtenerEstadisticasDevengadas().subscribe({
      next: (estadisticas) => {
        this.estadisticas = estadisticas;
        this.loadingEstadisticas = false;
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
        this.loadingEstadisticas = false;
      }
    });
  }

  /**
   * 🔍 Aplicar filtros
   */
  aplicarFiltros(): void {
    this.cargarLiquidacionesDevengadas();
  }

  /**
   * 🧹 Limpiar filtros
   */
  limpiarFiltros(): void {
    this.filtros = {};
    this.busquedaGlobal = '';
    this.cargarLiquidacionesDevengadas();
  }

  /**
   * 🔍 Aplicar filtros de búsqueda local
   */
  aplicarFiltrosBusqueda(): void {
    if (!this.busquedaGlobal) {
      this.liquidacionesFiltradas = [...this.liquidaciones];
      return;
    }

    const termino = this.busquedaGlobal.toLowerCase();
    this.liquidacionesFiltradas = this.liquidaciones.filter(liquidacion =>
      liquidacion.empresa.toLowerCase().includes(termino) ||
      liquidacion.cod_patronal.toLowerCase().includes(termino) ||
      liquidacion.mes.toLowerCase().includes(termino) ||
      liquidacion.gestion.includes(termino)
    );
  }

  /**
   * 📄 Ver detalle de liquidación devengada
   */
  verDetalle(idPlanilla: number): void {
    this.router.navigate(['/cotizaciones/devengados', idPlanilla]);
  }

  /**
   * 🎨 Obtener clase CSS según nivel de multa
   */
  obtenerClaseNivelMulta(nivel: string): string {
    switch (nivel) {
      case 'CRITICO': return 'nivel-critico';
      case 'ALTO': return 'nivel-alto';
      case 'MEDIO': return 'nivel-medio';
      case 'BAJO': return 'nivel-bajo';
      default: return 'nivel-sin-multa';
    }
  }

  /**
   * 🎨 Obtener clase CSS según días de mora
   */
  obtenerClaseDiasMora(categoria: string): string {
    switch (categoria) {
      case 'CRITICA': return 'mora-critica';
      case 'ALTA': return 'mora-alta';
      case 'MEDIA': return 'mora-media';
      case 'BAJA': return 'mora-baja';
      default: return 'mora-sin';
    }
  }

  /**
   * 📊 Obtener severidad para etiquetas (tipo correcto para PrimeNG)
   */
  obtenerSeveridadMulta(nivel: string): 'success' | 'secondary' | 'info' | 'warning' | 'danger' {
    switch (nivel) {
      case 'CRITICO': return 'danger';
      case 'ALTO': return 'warning';
      case 'MEDIO': return 'info';
      case 'BAJO': return 'success';
      default: return 'secondary';
    }
  }

  /**
   * 📅 Formatear fecha
   */
  formatearFecha(fecha: Date): string {
    return new Date(fecha).toLocaleDateString('es-ES');
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
   * 📊 Obtener total de multas para estadísticas
   */
  obtenerTotalMultas(): number {
    if (!this.estadisticas?.por_tipo_empresa) return 0;
    return this.estadisticas.por_tipo_empresa.reduce((total, item) => total + Number(item.total_multas), 0);
  }

  /**
   * 🔄 Recargar datos (compatible con planillas-aportes)
   */
  recargar(): void {
    this.cargarLiquidacionesDevengadas();
    this.cargarEstadisticas();
  }

  /**
   * 🔍 Buscar (compatible con planillas-aportes)
   */
  buscar(termino: string): void {
    this.busquedaGlobal = termino;
    this.aplicarFiltrosBusqueda();
  }

  /**
   * 📄 Cambio de página (compatible con planillas-aportes)
   */
  onPageChange(event: any): void {
    this.limite = event.rows;
    // Aquí podrías implementar paginación del servidor si es necesario
    this.cargarLiquidacionesDevengadas();
  }
}