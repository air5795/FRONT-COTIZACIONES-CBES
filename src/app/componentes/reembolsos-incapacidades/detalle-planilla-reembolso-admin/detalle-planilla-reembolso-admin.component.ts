import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { HistorialReembolsosService } from '../../../servicios/historial-reembolsos/historial-reembolsos.service';
import { 
  SolicitudPresentada,
  DetallesSolicitud 
} from '../../../servicios/historial-reembolsos/historial-reembolsos.service';
import Swal from 'sweetalert2';

interface DetalleReembolso {
  id_detalle_reembolso?: number;
  id_solicitud_reembolso: number;
  nro?: number;
  ci: string;
  apellido_paterno: string;
  apellido_materno: string;
  nombres: string;
  matricula: string;
  tipo_incapacidad: string;
  fecha_inicio_baja: string;
  fecha_fin_baja: string;
  dias_incapacidad: number;
  dias_reembolso: number;
  salario: number;
  monto_dia: number;
  monto_subtotal?: number;
  porcentaje_reembolso: number;
  monto_reembolso: number;
  cotizaciones_previas_verificadas?: number;
  observaciones_afiliacion?: string;
  observaciones?: string;
  // Campos del cálculo detallado (desde la base de datos)
  dias_baja_total?: number;
  dias_mes_reembolso?: number;
  fecha_inicio_mes_reembolso?: string;
  fecha_fin_mes_reembolso?: string;
  // Campo para archivo de denuncia
  ruta_file_denuncia?: string;
  // Campos para revisión
  estado_revision?: 'neutro' | 'aprobado' | 'observado' | null;
}

@Component({
  selector: 'app-detalle-planilla-reembolso-admin',
  templateUrl: './detalle-planilla-reembolso-admin.component.html',
  styleUrls: ['./detalle-planilla-reembolso-admin.component.css']
})
export class DetallePlanillaReembolsoAdminComponent implements OnInit {
  
  idSolicitud: number | null = null;
  solicitudReembolso: SolicitudPresentada | null = null;
  detallesReembolso: DetalleReembolso[] = [];
  cargando = false;
  
  // ===== PROPIEDADES PARA VISUALIZACIÓN DE ARCHIVOS =====
  mostrarModalVisualizacion = false;
  urlArchivoVisualizacion: SafeResourceUrl | string = '';
  tipoArchivoVisualizacion: 'imagen' | 'pdf' | null = null;
  
  // ===== PROPIEDADES PARA ZOOM Y PAN =====
  zoomLevel = 1;
  isDragging = false;
  startX = 0;
  startY = 0;
  translateX = 0;
  translateY = 0;
  lastTranslateX = 0;
  lastTranslateY = 0;
  
  // ===== PROPIEDADES PARA CÁLCULOS =====
  totalTrabajadores = 0;
  totalReembolso = 0;
  totalesPorTipo: any = {};
  
  // ===== PROPIEDADES PARA PESTAÑAS =====
  activeTabIndex = 0;
  
  // ===== PROPIEDADES PARA VALIDACIONES =====
  denunciasFaltantes = 0;
  denunciasCompletas = 0;
  totalDenunciasRequeridas = 0;
  puedePresentarSolicitud = false;
  
  // ===== PROPIEDADES PARA BÚSQUEDA Y PAGINACIÓN =====
  busquedaPorTipo = {
    ENFERMEDAD: '',
    MATERNIDAD: '',
    PROFESIONAL: ''
  };
  
  // Control de paginación independiente por tipo
  paginacionPorTipo = {
    ENFERMEDAD: {
      pagina: 1,
      limite: 20,
      total: 0,
      totalPaginas: 0,
      cargando: false
    },
    MATERNIDAD: {
      pagina: 1,
      limite: 20,
      total: 0,
      totalPaginas: 0,
      cargando: false
    },
    PROFESIONAL: {
      pagina: 1,
      limite: 20,
      total: 0,
      totalPaginas: 0,
      cargando: false
    }
  };
  
  // Timeout para búsqueda automática con debounce
  private searchTimeout: any;
  
  // ===== PROPIEDADES PARA REVISIÓN =====
  mostrarModalObservaciones = false;
  detalleSeleccionadoParaObservacion: DetalleReembolso | null = null;
  observacionesTexto = '';
  
  // ===== PROPIEDADES PARA VALIDACIÓN DE PLANILLA =====
  mostrarDialogoAprobarPlanilla = false;
  mostrarDialogoObservarPlanilla = false;
  observacionesPlanilla = '';
  detallesObservadosEnPlanilla: DetalleReembolso[] = [];
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private historialService: HistorialReembolsosService,
    public sanitizer: DomSanitizer
  ) {}
  
  ngOnInit() {
    this.route.params.subscribe(params => {
      this.idSolicitud = +params['id'];
      if (this.idSolicitud) {
        this.cargarDetallesReembolso();
      }
    });
  }
  
  // ===== MÉTODOS DE CARGA =====
  
  cargarDetallesReembolso() {
    if (!this.idSolicitud) return;
    
    this.cargando = true;
    
    this.historialService.obtenerDetallesSolicitud(this.idSolicitud).subscribe({
      next: (response: DetallesSolicitud) => {
        this.cargando = false;
        this.solicitudReembolso = response.solicitud;
        this.detallesReembolso = response.detalles;
        this.totalesPorTipo = response.totalesPorTipo;
        this.totalTrabajadores = response.totalTrabajadores;
        this.totalReembolso = response.totalMonto;
        
        // Actualizar paginación para cada tipo
        this.actualizarPaginacionPorTipo();
        
        console.log('✅ Detalles cargados:', {
          solicitud: this.solicitudReembolso,
          detalles: this.detallesReembolso.length,
          totales: this.totalesPorTipo
        });
      },
      error: (error) => {
        this.cargando = false;
        console.error('❌ Error al cargar detalles:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los detalles de la solicitud'
        });
      }
    });
  }
  
  // ===== MÉTODOS DE NAVEGACIÓN =====
  
  volverAHistorial() {
    this.router.navigate(['/cotizaciones/historial-reembolsos']);
  }
  
  // ===== MÉTODOS DE VISUALIZACIÓN DE ARCHIVOS =====
  
  verArchivoDenuncia(detalle: DetalleReembolso) {
    console.log('🔍 Verificando archivo de denuncia:', detalle);
    
    if (!detalle.ruta_file_denuncia) {
      console.log('❌ No hay ruta de archivo');
      Swal.fire({
        icon: 'warning',
        title: 'Sin archivo',
        text: 'No hay archivo de denuncia disponible'
      });
      return;
    }
    
    // Guardar el detalle seleccionado para el modal
    this.detalleSeleccionadoParaVisualizacion = detalle;
    
    const url = this.historialService.obtenerUrlArchivoDenuncia(detalle.ruta_file_denuncia);
    console.log('🌐 URL generada:', url);
    
    this.urlArchivoVisualizacion = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    console.log('🔒 URL sanitizada:', this.urlArchivoVisualizacion);
    
    // Determinar tipo de archivo
    const extension = detalle.ruta_file_denuncia.toLowerCase().split('.').pop();
    console.log('📁 Extensión detectada:', extension);
    
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      this.tipoArchivoVisualizacion = 'imagen';
      console.log('🖼️ Tipo: IMAGEN');
    } else if (extension === 'pdf') {
      this.tipoArchivoVisualizacion = 'pdf';
      console.log('📄 Tipo: PDF');
    } else {
      this.tipoArchivoVisualizacion = null;
      console.log('❓ Tipo: DESCONOCIDO');
    }
    
    this.mostrarModalVisualizacion = true;
    this.resetZoom();
    this.resetPan();
    
    console.log('✅ Modal abierto, tipo:', this.tipoArchivoVisualizacion);
  }
  
  cerrarModalVisualizacion() {
    this.mostrarModalVisualizacion = false;
    this.urlArchivoVisualizacion = '';
    this.tipoArchivoVisualizacion = null;
    this.resetZoom();
    this.resetPan();
  }
  
  // ===== MÉTODOS DE ZOOM =====
  
  zoomIn() {
    this.zoomLevel = Math.min(this.zoomLevel + 0.25, 3);
  }
  
  zoomOut() {
    this.zoomLevel = Math.max(this.zoomLevel - 0.25, 0.5);
  }
  
  resetZoom() {
    this.zoomLevel = 1;
  }
  
  // ===== MÉTODOS DE PAN =====
  
  onMouseDown(event: MouseEvent) {
    this.isDragging = true;
    this.startX = event.clientX - this.translateX;
    this.startY = event.clientY - this.translateY;
  }
  
  onMouseMove(event: MouseEvent) {
    if (this.isDragging) {
      this.translateX = event.clientX - this.startX;
      this.translateY = event.clientY - this.startY;
    }
  }
  
  onMouseUp() {
    this.isDragging = false;
    this.lastTranslateX = this.translateX;
    this.lastTranslateY = this.translateY;
  }
  
  onMouseLeave() {
    this.isDragging = false;
  }
  
  onMouseWheel(event: WheelEvent) {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    this.zoomLevel = Math.max(0.5, Math.min(3, this.zoomLevel + delta));
  }
  
  getPanStyle() {
    return {
      transform: `scale(${this.zoomLevel}) translate(${this.translateX}px, ${this.translateY}px)`,
      cursor: this.isDragging ? 'grabbing' : 'grab'
    };
  }
  
  resetPan() {
    this.translateX = 0;
    this.translateY = 0;
    this.lastTranslateX = 0;
    this.lastTranslateY = 0;
  }
  
  // ===== MÉTODOS DE UTILIDAD =====
  
  tieneArchivoDenuncia(detalle: DetalleReembolso): boolean {
    return !!(detalle.ruta_file_denuncia && detalle.ruta_file_denuncia.trim() !== '');
  }
  
  descargarArchivoDenuncia(detalle: DetalleReembolso) {
    if (!detalle.ruta_file_denuncia) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin archivo',
        text: 'No hay archivo de denuncia disponible'
      });
      return;
    }
    
    const url = this.historialService.obtenerUrlArchivoDenuncia(detalle.ruta_file_denuncia);
    const link = document.createElement('a');
    link.href = url;
    
    // Obtener extensión del archivo
    const extension = detalle.ruta_file_denuncia.toLowerCase().split('.').pop() || '';
    link.download = `denuncia-${detalle.ci}-${detalle.apellido_paterno}.${extension}`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  obtenerNombreCompleto(detalle: DetalleReembolso): string {
    return `${detalle.apellido_paterno} ${detalle.apellido_materno} ${detalle.nombres}`.trim();
  }
  
  obtenerTipoIncapacidadTexto(tipo: string): string {
    const tipos = {
      'ENFERMEDAD': 'Enfermedad',
      'MATERNIDAD': 'Maternidad',
      'PROFESIONAL': 'Riesgo Profesional',
      'RIESGO_PROFESIONAL': 'Riesgo Profesional'
    };
    return tipos[tipo as keyof typeof tipos] || tipo;
  }
  
  obtenerColorTipoIncapacidad(tipo: string): string {
    const colores = {
      'ENFERMEDAD': '#17a2b8',
      'MATERNIDAD': '#28a745',
      'PROFESIONAL': '#ffc107',
      'RIESGO_PROFESIONAL': '#ffc107'
    };
    return colores[tipo as keyof typeof colores] || '#6c757d';
  }
  
  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-BO');
  }
  
  formatearMonto(monto: number): string {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2
    }).format(monto);
  }
  
  // ===== MÉTODOS PARA OBTENER DETALLES POR TIPO =====
  
  getDetallesPorTipo(tipo: string): DetalleReembolso[] {
    return this.detallesReembolso.filter(detalle => detalle.tipo_incapacidad === tipo);
  }

  // Verificar si todos los detalles de un tipo están revisados
  todosTipoRevisados(tipo: string): boolean {
    const detallesTipo = this.getDetallesPorTipo(tipo);
    if (detallesTipo.length === 0) return true; // Si no hay detalles, consideramos que está completo
    
    // Todos deben tener estado_revision (aprobado u observado), no pueden estar en null/neutro
    return detallesTipo.every(detalle => 
      detalle.estado_revision !== null && 
      detalle.estado_revision !== undefined
    );
  }

  // Verificar si TODA la planilla está revisada (todos los detalles)
  todaLaPlanillaRevisada(): boolean {
    if (this.detallesReembolso.length === 0) return false;
    
    return this.detallesReembolso.every(detalle => 
      detalle.estado_revision !== null && 
      detalle.estado_revision !== undefined
    );
  }
  
  
  // ===== PROPIEDADES ADICIONALES PARA COMPATIBILIDAD =====
  
  detalleSeleccionadoParaVisualizacion: DetalleReembolso | null = null;
  
  // ===== MÉTODOS ADICIONALES PARA COMPATIBILIDAD =====
  
  descargarArchivoDesdeModal() {
    if (this.detalleSeleccionadoParaVisualizacion) {
      this.descargarArchivoDenuncia(this.detalleSeleccionadoParaVisualizacion);
    }
  }


    // Funciones para colores de estado (tomadas de planillas-aportes-detalle)
    getColorEstado(estado: number): string {
      switch (estado) {
        case 3:
          return '#ff4545';
        case 0:
          return '#b769fb';
        case 2:
          return '#059b89';
        default:
          return '#558fbb';
      }
    }
  
    getFondoEstado(fondo: number): string {
      switch (fondo) {
        case 0:
          return '#ebe6ff';
        case 3:
          return '#ffdfdf';
        case 2:
          return '#edfff6';
        default:
          return '#e5edf9';
      }
    }
  
  // ===== MÉTODOS DE BÚSQUEDA Y RECARGA =====
  
  // Método para actualizar la paginación por tipo
  actualizarPaginacionPorTipo() {
    Object.keys(this.paginacionPorTipo).forEach(tipo => {
      const detallesTipo = this.getDetallesPorTipo(tipo);
      this.paginacionPorTipo[tipo as keyof typeof this.paginacionPorTipo].total = detallesTipo.length;
      this.paginacionPorTipo[tipo as keyof typeof this.paginacionPorTipo].totalPaginas = Math.ceil(detallesTipo.length / this.paginacionPorTipo[tipo as keyof typeof this.paginacionPorTipo].limite);
    });
  }
  
  // Método para búsqueda por tipo con debounce
  buscarPorTipoAutomatico(tipo: 'ENFERMEDAD' | 'MATERNIDAD' | 'PROFESIONAL') {
    // Limpiar timeout anterior si existe
    clearTimeout(this.searchTimeout);
    
    // Establecer nuevo timeout para búsqueda con retraso
    this.searchTimeout = setTimeout(() => {
      this.buscarPorTipo(tipo);
    }, 500); // Espera 500ms después de dejar de escribir
  }
  
  // Método para búsqueda por tipo específico
  buscarPorTipo(tipo: 'ENFERMEDAD' | 'MATERNIDAD' | 'PROFESIONAL') {
    const busqueda = this.busquedaPorTipo[tipo];
    const detallesTipo = this.getDetallesPorTipo(tipo);
    
    if (!busqueda.trim()) {
      // Si no hay búsqueda, mostrar todos los detalles del tipo
      this.paginacionPorTipo[tipo].total = detallesTipo.length;
      this.paginacionPorTipo[tipo].totalPaginas = Math.ceil(detallesTipo.length / this.paginacionPorTipo[tipo].limite);
      return;
    }
    
    // Filtrar detalles por búsqueda
    const detallesFiltrados = detallesTipo.filter(detalle => 
      detalle.ci.toLowerCase().includes(busqueda.toLowerCase()) ||
      detalle.apellido_paterno.toLowerCase().includes(busqueda.toLowerCase()) ||
      detalle.apellido_materno.toLowerCase().includes(busqueda.toLowerCase()) ||
      detalle.nombres.toLowerCase().includes(busqueda.toLowerCase()) ||
      detalle.matricula.toLowerCase().includes(busqueda.toLowerCase()) ||
      `${detalle.nombres} ${detalle.apellido_paterno} ${detalle.apellido_materno}`.toLowerCase().includes(busqueda.toLowerCase()) ||
      `${detalle.apellido_paterno} ${detalle.apellido_materno} ${detalle.nombres}`.toLowerCase().includes(busqueda.toLowerCase())
    );
    
    this.paginacionPorTipo[tipo].total = detallesFiltrados.length;
    this.paginacionPorTipo[tipo].totalPaginas = Math.ceil(detallesFiltrados.length / this.paginacionPorTipo[tipo].limite);
  }
  
  // Método para obtener detalles filtrados por tipo (para mostrar en las tablas)
  getDetallesFiltradosPorTipo(tipo: 'ENFERMEDAD' | 'MATERNIDAD' | 'PROFESIONAL'): DetalleReembolso[] {
    const busqueda = this.busquedaPorTipo[tipo].toLowerCase();
    const detallesTipo = this.getDetallesPorTipo(tipo);
    
    if (!busqueda) {
      return detallesTipo;
    }

    return detallesTipo.filter(detalle => 
      detalle.ci.toLowerCase().includes(busqueda) ||
      detalle.apellido_paterno.toLowerCase().includes(busqueda) ||
      detalle.apellido_materno.toLowerCase().includes(busqueda) ||
      detalle.nombres.toLowerCase().includes(busqueda) ||
      detalle.matricula.toLowerCase().includes(busqueda) ||
      `${detalle.nombres} ${detalle.apellido_paterno} ${detalle.apellido_materno}`.toLowerCase().includes(busqueda) ||
      `${detalle.apellido_paterno} ${detalle.apellido_materno} ${detalle.nombres}`.toLowerCase().includes(busqueda)
    );
  }
  
  // Métodos de paginación específicos por tipo
  onPageChangePorTipo(event: any, tipo: 'ENFERMEDAD' | 'MATERNIDAD' | 'PROFESIONAL') {
    this.paginacionPorTipo[tipo].pagina = event.page + 1; // PrimeNG usa índice 0, backend usa índice 1
    this.paginacionPorTipo[tipo].limite = event.rows;
  }
  
  // Método para limpiar búsqueda por tipo
  limpiarBusquedaPorTipo(tipo: 'ENFERMEDAD' | 'MATERNIDAD' | 'PROFESIONAL') {
    this.busquedaPorTipo[tipo] = '';
    this.paginacionPorTipo[tipo].pagina = 1;
    this.actualizarPaginacionPorTipo();
  }

  // ===== MÉTODOS PARA REVISIÓN =====
  
  // Obtener el estado de revisión de un detalle
  obtenerEstadoRevision(detalle: DetalleReembolso): 'neutro' | 'aprobado' | 'observado' {
    // Si estado_revision es null o undefined, está neutro (sin revisar)
    if (detalle.estado_revision === null || detalle.estado_revision === undefined) {
      return 'neutro';
    }
    
    // Usar el campo estado_revision si está disponible
    if (detalle.estado_revision) {
      return detalle.estado_revision;
    }
    
    // Lógica de fallback para compatibilidad
    if (detalle.observaciones && detalle.observaciones.trim() !== '') {
      return 'observado';
    }
    
    return 'neutro';
  }
  
  // Obtener el color de fondo de la fila según el estado de revisión
  obtenerColorFilaRevision(detalle: DetalleReembolso): string {
    const estado = this.obtenerEstadoRevision(detalle);
    switch (estado) {
      case 'aprobado':
        return '#d4edda'; // Verde suave
      case 'observado':
        return '#f8d7da'; // Rojo suave
      case 'neutro':
      default:
        return 'transparent'; // Sin color (neutro)
    }
  }
  
  // Manejar cambio en el switch de revisión (3 estados)
  onCambioRevision(detalle: DetalleReembolso, nuevoEstado: 'aprobado' | 'observado' | 'neutro') {
    if (nuevoEstado === 'aprobado') {
      // Si se aprueba, actualizar directamente
      this.actualizarEstadoRevision(detalle, 'aprobado');
    } else if (nuevoEstado === 'observado') {
      // Si se observa, abrir modal para observaciones
      this.abrirModalObservaciones(detalle);
    } else {
      // Si se marca como neutro, limpiar observaciones
      this.actualizarEstadoRevision(detalle, 'neutro');
    }
  }
  
  // Abrir modal para agregar observaciones
  abrirModalObservaciones(detalle: DetalleReembolso) {
    this.detalleSeleccionadoParaObservacion = detalle;
    this.observacionesTexto = detalle.observaciones || '';
    this.mostrarModalObservaciones = true;
  }
  
  // Guardar observaciones
  guardarObservaciones() {
    if (!this.detalleSeleccionadoParaObservacion) return;
    
    if (!this.observacionesTexto.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Observaciones requeridas',
        text: 'Debe ingresar las observaciones para marcar como observado'
      });
      return;
    }
    
    this.actualizarEstadoRevision(this.detalleSeleccionadoParaObservacion, 'observado', this.observacionesTexto.trim());
    this.cerrarModalObservaciones();
  }
  
  // Cerrar modal de observaciones
  cerrarModalObservaciones() {
    this.mostrarModalObservaciones = false;
    this.detalleSeleccionadoParaObservacion = null;
    this.observacionesTexto = '';
  }
  
  // Actualizar estado de revisión en el backend
  actualizarEstadoRevision(detalle: DetalleReembolso, estado: 'aprobado' | 'observado' | 'neutro', observaciones?: string) {
    if (!detalle.id_detalle_reembolso) {
      console.error('ID del detalle no encontrado');
      return;
    }
    
    // Para estado neutro, limpiar observaciones
    const observacionesFinal = estado === 'neutro' ? '' : observaciones;
    
    this.historialService.actualizarEstadoRevision(
      detalle.id_detalle_reembolso, 
      estado, // Enviar el estado tal como viene
      observacionesFinal
    ).subscribe({
      next: (response) => {
        console.log('✅ Estado de revisión actualizado:', response);
        
        // Actualizar el detalle en la lista local
        const index = this.detallesReembolso.findIndex(d => d.id_detalle_reembolso === detalle.id_detalle_reembolso);
        if (index !== -1) {
          // Si es neutro, limpiar el estado (null)
          if (estado === 'neutro') {
            this.detallesReembolso[index].estado_revision = null;
          } else {
            this.detallesReembolso[index].estado_revision = estado;
          }
          this.detallesReembolso[index].observaciones = observacionesFinal;
        }
        
        // ===== RECARGAR DATOS PARA ACTUALIZAR TOTALES DE CABECERA =====
        console.log('🔄 Recargando datos para actualizar totales...');
        this.cargarDetallesReembolso();
        
        let mensaje = '';
        let mensajeDetalle = '';
        switch (estado) {
          case 'aprobado':
            mensaje = 'Detalle aprobado exitosamente';
            mensajeDetalle = 'El detalle se ha aprobado y se contabiliza en los totales';
            break;
          case 'observado':
            mensaje = 'Detalle observado exitosamente';
            mensajeDetalle = 'El detalle se ha observado y NO se contabiliza en los totales';
            break;
          case 'neutro':
            mensaje = 'Estado de revisión restablecido';
            mensajeDetalle = 'El detalle volvió a su estado original y se contabiliza en los totales';
            break;
        }
        
        Swal.fire({
          icon: 'success',
          title: mensaje,
          text: mensajeDetalle,
          timer: 3000,
          timerProgressBar: true
        });
      },
      error: (error) => {
        console.error('❌ Error al actualizar estado:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo actualizar el estado de revisión'
        });
      }
    });
  }

  // ===== MÉTODOS PARA VALIDACIÓN DE PLANILLA COMPLETA =====
  
  // Abrir diálogo para aprobar planilla
  abrirDialogoAprobarPlanilla() {
    // Filtrar detalles observados
    this.detallesObservadosEnPlanilla = this.detallesReembolso.filter(d => d.estado_revision === 'observado');
    this.mostrarDialogoAprobarPlanilla = true;
  }
  
  // Confirmar aprobación de planilla
  confirmarAprobarPlanilla() {
    if (!this.idSolicitud) {
      console.error('ID de solicitud no encontrado');
      return;
    }

    Swal.fire({
      title: '¿Aprobar planilla?',
      html: `
        <div style="text-align: left;">
          <p><strong>Total de detalles:</strong> ${this.totalTrabajadores}</p>
          <p><strong>Detalles observados:</strong> ${this.detallesObservadosEnPlanilla.length}</p>
          <p><strong>Detalles aprobados:</strong> ${this.totalTrabajadores - this.detallesObservadosEnPlanilla.length}</p>
          ${this.detallesObservadosEnPlanilla.length > 0 ? 
            '<p style="color: #f39c12; margin-top: 10px;"><i class="pi pi-exclamation-triangle"></i> Hay detalles observados que no se contabilizarán</p>' : 
            '<p style="color: #28a745; margin-top: 10px;"><i class="pi pi-check"></i> Todos los detalles están aprobados</p>'
          }
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, aprobar planilla',
      cancelButtonText: 'Cancelar',
      didOpen: () => {
        const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
        if (swalContainer) {
          swalContainer.style.zIndex = '10000';
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.aprobarPlanilla();
      }
    });
  }
  
  // Aprobar planilla
  aprobarPlanilla() {
    if (!this.idSolicitud) return;

    this.historialService.aprobarPlanilla(this.idSolicitud).subscribe({
      next: (response) => {
        console.log('✅ Planilla aprobada:', response);
        
        this.mostrarDialogoAprobarPlanilla = false;
        
        Swal.fire({
          icon: 'success',
          title: 'Planilla aprobada',
          html: `
            <div style="text-align: left;">
              <p><strong>La planilla ha sido aprobada exitosamente</strong></p>
              <hr>
              <p><i class="pi pi-check-circle"></i> Estado: <strong style="color: #28a745;">APROBADO</strong></p>
              <p><i class="pi pi-users"></i> Total trabajadores: <strong>${response.resumen?.totalDetalles || 0}</strong></p>
              <p><i class="pi pi-check"></i> Detalles aprobados: <strong style="color: #28a745;">${response.resumen?.detallesAprobados || 0}</strong></p>
              ${response.resumen?.detallesObservados > 0 ? 
                `<p><i class="pi pi-exclamation-triangle"></i> Detalles observados: <strong style="color: #f39c12;">${response.resumen.detallesObservados}</strong></p>` : 
                ''
              }
            </div>
          `,
          confirmButtonText: 'Volver al historial',
          confirmButtonColor: '#009688',
          didOpen: () => {
            const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
            if (swalContainer) {
              swalContainer.style.zIndex = '10000';
            }
          }
        }).then(() => {
          this.volverAHistorial();
        });
      },
      error: (error) => {
        console.error('❌ Error al aprobar planilla:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'No se pudo aprobar la planilla',
          confirmButtonColor: '#dc3545',
          didOpen: () => {
            const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
            if (swalContainer) {
              swalContainer.style.zIndex = '10000';
            }
          }
        });
      }
    });
  }
  
  // Cerrar diálogo de aprobar planilla
  cerrarDialogoAprobarPlanilla() {
    this.mostrarDialogoAprobarPlanilla = false;
    this.detallesObservadosEnPlanilla = [];
  }
  
  // Abrir diálogo para observar planilla
  abrirDialogoObservarPlanilla() {
    this.observacionesPlanilla = '';
    this.mostrarDialogoObservarPlanilla = true;
  }
  
  // Confirmar observación de planilla
  confirmarObservarPlanilla() {
    if (!this.idSolicitud) {
      console.error('ID de solicitud no encontrado');
      return;
    }
    
    if (!this.observacionesPlanilla.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Observaciones requeridas',
        text: 'Debe ingresar las observaciones para observar la planilla',
        confirmButtonColor: '#f39c12',
        didOpen: () => {
          const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
          if (swalContainer) {
            swalContainer.style.zIndex = '10000';
          }
        }
      });
      return;
    }

    Swal.fire({
      title: '¿Observar planilla?',
      html: `
        <div style="text-align: left;">
          <p>¿Está seguro de que desea <strong style="color: #dc3545;">OBSERVAR</strong> esta planilla?</p>
          <hr>
          <p><strong>Observaciones:</strong></p>
          <div style="background-color: #f8f9fa; padding: 10px; border-radius: 5px; max-height: 150px; overflow-y: auto;">
            ${this.observacionesPlanilla}
          </div>
          <hr>
          <p style="color: #dc3545; margin-top: 10px;">
            <i class="pi pi-exclamation-triangle"></i> 
            La planilla será marcada como OBSERVADA y deberá ser corregida por la empresa
          </p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, observar planilla',
      cancelButtonText: 'Cancelar',
      didOpen: () => {
        const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
        if (swalContainer) {
          swalContainer.style.zIndex = '10000';
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.observarPlanilla();
      }
    });
  }
  
  // Observar planilla
  observarPlanilla() {
    if (!this.idSolicitud) return;

    this.historialService.observarPlanilla(this.idSolicitud, this.observacionesPlanilla.trim()).subscribe({
      next: (response) => {
        console.log('✅ Planilla observada:', response);
        
        this.mostrarDialogoObservarPlanilla = false;
        this.observacionesPlanilla = '';
        
        Swal.fire({
          icon: 'info',
          title: 'Planilla observada',
          html: `
            <div style="text-align: left;">
              <p><strong>La planilla ha sido marcada como OBSERVADA</strong></p>
              <hr>
              <p><i class="pi pi-exclamation-circle"></i> Estado: <strong style="color: #dc3545;">OBSERVADO</strong></p>
              <p><i class="pi pi-comment"></i> Observaciones registradas</p>
              <hr>
              <p style="color: #6c757d; font-size: 0.9rem;">
                La empresa deberá corregir las observaciones y volver a presentar la planilla
              </p>
            </div>
          `,
          confirmButtonText: 'Volver al historial',
          confirmButtonColor: '#009688',
          didOpen: () => {
            const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
            if (swalContainer) {
              swalContainer.style.zIndex = '10000';
            }
          }
        }).then(() => {
          this.volverAHistorial();
        });
      },
      error: (error) => {
        console.error('❌ Error al observar planilla:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'No se pudo observar la planilla',
          confirmButtonColor: '#dc3545',
          didOpen: () => {
            const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
            if (swalContainer) {
              swalContainer.style.zIndex = '10000';
            }
          }
        });
      }
    });
  }
  
  // Cerrar diálogo de observar planilla
  cerrarDialogoObservarPlanilla() {
    this.mostrarDialogoObservarPlanilla = false;
    this.observacionesPlanilla = '';
  }
}
