import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HistorialReembolsosService, SolicitudPresentada, EstadisticasGenerales, FiltrosHistorial } from '../../../servicios/historial-reembolsos/historial-reembolsos.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-historial-reembolsos',
  templateUrl: './historial-reembolsos.component.html',
  styleUrls: ['./historial-reembolsos.component.css']
})
export class HistorialReembolsosComponent implements OnInit {
  
  // ===== PROPIEDADES PRINCIPALES =====
  solicitudes: SolicitudPresentada[] = [];
  estadisticas: EstadisticasGenerales | null = null;
  cargando = false;
  
  // ===== PAGINACIÓN =====
  pagina = 1;
  limite = 15;
  totalRegistros = 0;
  totalPaginas = 0;
  tieneSiguiente = false;
  tieneAnterior = false;
  
  // ===== FILTROS =====
  busqueda = '';
  mesSeleccionado = '';
  anioSeleccionado = '';
  codPatronalSeleccionado = '';
  
  // ===== OPCIONES DE FILTROS =====
  meses = [
    { value: '', label: 'Todos los meses' },
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' }
  ];
  
  anios = this.generarAnios();
  
  constructor(
    public historialService: HistorialReembolsosService,
    private router: Router
  ) {}
  
  ngOnInit() {
    this.cargarSolicitudes();
    this.cargarEstadisticas();
  }
  
  // ===== MÉTODOS DE CARGA =====
  
  cargarSolicitudes() {
    this.cargando = true;
    console.log('🔄 Cargando solicitudes...', { pagina: this.pagina, limite: this.limite });
    
    const filtros: FiltrosHistorial = {
      pagina: this.pagina,
      limite: this.limite,
      busqueda: this.busqueda,
      mes: this.mesSeleccionado || undefined,
      anio: this.anioSeleccionado || undefined,
      codPatronal: this.codPatronalSeleccionado || undefined
    };
    
    console.log('📋 Filtros aplicados:', filtros);
    
    this.historialService.obtenerSolicitudesPresentadas(filtros).subscribe({
      next: (response) => {
        console.log('✅ Respuesta recibida:', response);
        this.cargando = false;
        this.solicitudes = response.solicitudes || [];
        this.totalRegistros = response.paginacion?.totalRegistros || 0;
        this.totalPaginas = response.paginacion?.totalPaginas || 0;
        this.tieneSiguiente = response.paginacion?.tieneSiguiente || false;
        this.tieneAnterior = response.paginacion?.tieneAnterior || false;
        console.log('📊 Datos cargados:', { 
          solicitudes: this.solicitudes.length, 
          totalRegistros: this.totalRegistros 
        });
      },
      error: (error) => {
        this.cargando = false;
        console.error('❌ Error al cargar solicitudes:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar las solicitudes presentadas'
        });
      }
    });
  }
  
  cargarEstadisticas() {
    this.historialService.obtenerEstadisticasGenerales().subscribe({
      next: (estadisticas) => {
        this.estadisticas = estadisticas;
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
      }
    });
  }
  
  // ===== MÉTODOS DE FILTROS =====
  
  aplicarFiltros() {
    this.pagina = 1; // Resetear a primera página
    this.cargarSolicitudes();
  }
  
  limpiarFiltros() {
    this.busqueda = '';
    this.mesSeleccionado = '';
    this.anioSeleccionado = '';
    this.codPatronalSeleccionado = '';
    this.pagina = 1;
    this.cargarSolicitudes();
  }
  
  buscar(valor: string) {
    this.busqueda = valor;
    this.pagina = 1;
    this.cargarSolicitudes();
  }
  
  buscarAutomatico() {
    // Debounce para búsqueda automática
    setTimeout(() => {
      this.aplicarFiltros();
    }, 500);
  }
  
  // ===== MÉTODOS DE PAGINACIÓN =====
  
  onPageChange(event: any) {
    this.pagina = event.page + 1;
    this.limite = event.rows;
    this.cargarSolicitudes();
  }
  
  cambiarLimite(event: any) {
    this.limite = event.value;
    this.pagina = 1;
    this.cargarSolicitudes();
  }
  
  // ===== MÉTODOS DE UTILIDAD =====
  
  verDetalles(solicitud: SolicitudPresentada) {
    this.router.navigate(['/cotizaciones/historial-reembolsos/detalle', solicitud.id_solicitud_reembolso]);
  }
  
  obtenerClaseEstado(estado: number): string {
    switch (estado) {
      case 0: return 'borrador';
      case 1: return 'pendiente';
      case 2: return 'aprobado';
      case 3: return 'observado';
      default: return 'borrador';
    }
  }
  
  exportarExcel() {
    Swal.fire({
      icon: 'info',
      title: 'Función pendiente',
      text: 'La exportación a Excel se implementará próximamente'
    });
  }
  
  // ===== MÉTODOS PRIVADOS =====
  
  // Agregar Math al componente para usar en el template
  Math = Math;
  
  private generarAnios(): Array<{value: string, label: string}> {
    const anios = [];
    const anioActual = new Date().getFullYear();
    
    anios.push({ value: '', label: 'Todos los años' });
    
    for (let i = anioActual; i >= 2020; i--) {
      anios.push({ value: i.toString(), label: i.toString() });
    }
    
    return anios;
  }
}
