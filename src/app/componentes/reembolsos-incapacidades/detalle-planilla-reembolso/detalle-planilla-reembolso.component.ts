import { Component, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ReembolsosIncapacidadesService } from '../../../servicios/reembolsos-incapacidades/reembolsos-incapacidades.service';
import { SessionService } from '../../../servicios/auth/session.service';
import { 
  SolicitudReembolso,
  DetalleReembolsoCalculado 
} from '../../../interfaces/reembolsos-incapacidades/reembolsos-incapacidades.interface';
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
  fecha_atencion?: string | null;
  hora_atencion?: string | null; // Formato HH:mm:ss
  fecha_emision_certificado?: string | null;
  fecha_sello_vigencia?: string | null;
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
  // Campo para estado de revisión (cuando el admin revisa)
  estado_revision?: 'aprobado' | 'observado' | null;
}

@Component({
  selector: 'app-detalle-planilla-reembolso',
  templateUrl: './detalle-planilla-reembolso.component.html',
  styleUrls: ['./detalle-planilla-reembolso.component.css']
})
export class DetallePlanillaReembolsoComponent implements OnInit {
  
  idSolicitud: number | null = null;
  solicitudReembolso: SolicitudReembolso | null = null;
  detallesReembolso: DetalleReembolso[] = [];
  
  // Control de UI
  cargandoSolicitud = false;
  cargandoDetalles = false;
  mostrarBuscarTrabajador = false;
  
  // Referencia al componente hijo para resetear el stepper
  @ViewChild('buscarTrabajadorRef') buscarTrabajadorRef: any;
  
  // Control para subida de archivos de denuncia
  mostrarSubirArchivo = false;
  detalleSeleccionadoParaArchivo: DetalleReembolso | null = null;
  
  // Control para visualización de archivos de denuncia
  mostrarVisualizarArchivo = false;
  detalleSeleccionadoParaVisualizacion: DetalleReembolso | null = null;
  urlArchivoVisualizacion: SafeResourceUrl | string = '';
  tipoArchivoVisualizacion: 'pdf' | 'imagen' | null = null;
  errorCargaArchivo = false;
  
  // Controles de zoom para imágenes
  zoomLevel = 100;
  minZoom = 25;
  maxZoom = 500;
  zoomStep = 25;
  
  // Controles de pan (arrastrar) para imágenes
  isDragging = false;
  startX = 0;
  startY = 0;
  translateX = 0;
  translateY = 0;
  lastTranslateX = 0;
  lastTranslateY = 0;
  
  // Control de modo de búsqueda en el diálogo
  modoIngresoBusqueda: 'automatico' | 'manual' = 'automatico';

  // Control de paginación global (para carga inicial)
  pagina: number = 1;
  limite: number = 20;
  total: number = 0;
  totalPaginas: number = 0;
  
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
  
  // Totales calculados
  totalReembolso = 0;
  totalTrabajadores = 0;
  
  // Resumen por tipo de incapacidad
  resumenTipos = {
    ENFERMEDAD: { count: 0, monto: 0 },
    MATERNIDAD: { count: 0, monto: 0 },
    PROFESIONAL: { count: 0, monto: 0 }
  };

  // Agregar después de las propiedades existentes
  activeTabIndex = 0;

  // Organizar detalles por tipo
  detallesPorTipo = {
    ENFERMEDAD: [] as DetalleReembolso[],
    MATERNIDAD: [] as DetalleReembolso[],
    PROFESIONAL: [] as DetalleReembolso[]
  };

  // Totales por tipo
  totalesPorTipo = {
    ENFERMEDAD: { trabajadores: 0, monto: 0 },
    MATERNIDAD: { trabajadores: 0, monto: 0 },
    PROFESIONAL: { trabajadores: 0, monto: 0 }
  };

  // Propiedades para búsqueda
  busquedaGeneral: string = '';
  busquedaPorTipo = {
    ENFERMEDAD: '',
    MATERNIDAD: '',
    PROFESIONAL: ''
  };

  // Timeout para búsqueda automática con debounce
  private searchTimeout: any;

  // Propiedades para validación de denuncias de riesgo profesional
  denunciasFaltantes = 0;
  denunciasCompletas = 0;
  totalDenunciasRequeridas = 0;
  puedePresentarSolicitud = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public reembolsosService: ReembolsosIncapacidadesService,
    private sanitizer: DomSanitizer,
    private sessionService: SessionService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.idSolicitud = +params['id'];
      if (this.idSolicitud) {
        this.cargarSolicitudReembolso();
        this.cargarDetallesReembolso();
        // Cargar datos específicos por tipo
        this.cargarDetallesPorTipo('ENFERMEDAD');
        this.cargarDetallesPorTipo('MATERNIDAD');
        this.cargarDetallesPorTipo('PROFESIONAL');
      }
    });
  }

  cargarSolicitudReembolso() {
    if (!this.idSolicitud) return;
    
    this.cargandoSolicitud = true;
    this.reembolsosService.obtenerSolicitudPorId(this.idSolicitud).subscribe({
      next: (solicitud) => {
        this.cargandoSolicitud = false;
        this.solicitudReembolso = solicitud;
        console.log('📄 Solicitud cargada:', solicitud);
      },
      error: (error) => {
        this.cargandoSolicitud = false;
        console.error('Error al cargar solicitud:', error);

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar la información de la solicitud'
        });
      }
    });
  }

  cargarDetallesReembolso() {
    if (!this.idSolicitud) return;

    this.cargandoDetalles = true;

    this.reembolsosService.obtenerDetallesPorSolicitud(
      this.idSolicitud, 
      this.busquedaGeneral,
      undefined, // tipoIncapacidad
      this.pagina,
      this.limite
    ).subscribe({
      next: (response) => {
        this.cargandoDetalles = false;
        // Convertir valores string a números para evitar errores del pipe de moneda
        this.detallesReembolso = (response.detalles || []).map((detalle: any) => this.convertirValoresNumericos(detalle));
        this.total = response.total || 0;
        this.totalPaginas = response.totalPaginas || 0;
        this.pagina = response.pagina || 1;
        this.calcularTotales();
        console.log('📋 Detalles cargados:', this.detallesReembolso);
      },
      error: (error) => {
        this.cargandoDetalles = false;
        console.error('Error al cargar detalles:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los detalles de reembolso'
        });
      }
    });
  }

  onDetalleSeleccionado(detalle: DetalleReembolsoCalculado) {
    // Asignar número correlativo
    const siguienteNro = this.detallesReembolso.length + 1;
    const nuevoDetalle: DetalleReembolso = {
      id_solicitud_reembolso: this.idSolicitud!,
      nro: siguienteNro,
      ci: detalle.ci,
      apellido_paterno: detalle.apellido_paterno,
      apellido_materno: detalle.apellido_materno,
      nombres: detalle.nombres,
      matricula: detalle.matricula,
      tipo_incapacidad: detalle.tipo_incapacidad,
      fecha_inicio_baja: detalle.fecha_inicio_baja,
      fecha_fin_baja: detalle.fecha_fin_baja,
      fecha_atencion: detalle.fecha_atencion || null,
      hora_atencion: detalle.hora_atencion || null,
      fecha_emision_certificado: detalle.fecha_emision_certificado || null,
      fecha_sello_vigencia: detalle.fecha_sello_vigencia || null,
      dias_incapacidad: this.parseNumber(detalle.dias_incapacidad),
      dias_reembolso: this.parseNumber(detalle.dias_reembolso),
      salario: this.parseNumber(detalle.salario),
      monto_dia: this.parseNumber(detalle.monto_dia),
      monto_subtotal: this.parseNumber(detalle.monto_subtotal),
      porcentaje_reembolso: this.parseNumber(detalle.porcentaje_reembolso),
      monto_reembolso: this.parseNumber(detalle.monto_reembolso),
      cotizaciones_previas_verificadas: 0,
      observaciones: detalle.observaciones || '',
      // Agregar campos adicionales del cálculo
      dias_baja_total: detalle.dias_totales_baja,
      dias_mes_reembolso: detalle.correspondiente_al_mes?.dias_en_mes,
      fecha_inicio_mes_reembolso: detalle.correspondiente_al_mes?.fecha_inicio,
      fecha_fin_mes_reembolso: detalle.correspondiente_al_mes?.fecha_fin
    };
  
    // Log para depuración
    console.log('📤 ENVIANDO DETALLE AL BACKEND:', nuevoDetalle);
    console.log('   • fecha_atencion:', nuevoDetalle.fecha_atencion);
    console.log('   • fecha_emision_certificado:', nuevoDetalle.fecha_emision_certificado);
    console.log('   • fecha_sello_vigencia:', nuevoDetalle.fecha_sello_vigencia);
  
    // Guardar en el backend
    this.reembolsosService.crearDetalle(nuevoDetalle).subscribe({
      next: (response) => {
        this.mostrarBuscarTrabajador = false;
        
        console.log('✅ Trabajador guardado en BD:', response);
        
        // Recargar detalles y solicitud desde el backend para actualizar totales y badges
        this.cargarDetallesReembolso();
        this.cargarSolicitudReembolso();
        
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Trabajador agregado a la planilla de reembolsos',
          timer: 2000
        });
      },
      error: (error) => {
        console.error('Error al guardar detalle:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo guardar el trabajador en la planilla'
        });
      }
    });
  }

  eliminarDetalle(index: number) {
    const detalle = this.detallesReembolso[index];
    
    Swal.fire({
      title: '¿Está seguro?',
      text: `¿Desea eliminar a ${detalle.nombres} ${detalle.apellido_paterno} de la planilla?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        if (detalle.id_detalle_reembolso) {
          // Eliminar del backend
          this.reembolsosService.eliminarDetalle(detalle.id_detalle_reembolso).subscribe({
            next: () => {
              // Recargar detalles y solicitud desde el backend para actualizar totales y badges
              this.cargarDetallesReembolso();
              this.cargarSolicitudReembolso();
              
              Swal.fire({
                icon: 'success',
                title: 'Eliminado',
                text: 'Trabajador eliminado de la planilla',
                timer: 2000
              });
            },
            error: (error) => {
              console.error('Error al eliminar detalle:', error);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo eliminar el trabajador'
              });
            }
          });
        } else {
          // Si solo está en memoria, eliminarlo directamente
          this.detallesReembolso.splice(index, 1);
          this.calcularTotales();
          
          Swal.fire({
            icon: 'success',
            title: 'Eliminado',
            text: 'Trabajador eliminado de la planilla',
            timer: 2000
          });
        }
      }
    });
  }

  recalcularNumeros() {
    this.detallesReembolso.forEach((detalle, index) => {
      detalle.nro = index + 1;
    });
  }

  calcularTotales() {
    // Limpiar arrays por tipo
    this.detallesPorTipo.ENFERMEDAD = [];
    this.detallesPorTipo.MATERNIDAD = [];
    this.detallesPorTipo.PROFESIONAL = [];
  
    // Separar detalles por tipo
    this.detallesReembolso.forEach(detalle => {
      const tipo = detalle.tipo_incapacidad as keyof typeof this.detallesPorTipo;
      if (this.detallesPorTipo[tipo]) {
        this.detallesPorTipo[tipo].push(detalle);
      }
    });
  
    // Calcular totales generales
    // Si la solicitud NO está en BORRADOR, filtrar los detalles observados
    if (this.solicitudReembolso && this.solicitudReembolso.estado !== 0) {
      // Filtrar detalles observados para el cálculo
      const detallesContabilizables = this.detallesReembolso.filter(d => 
        d.estado_revision !== 'observado'
      );
      
      console.log('🔍 Calculando totales (filtrando observados):', {
        totalDetalles: this.detallesReembolso.length,
        detallesContabilizables: detallesContabilizables.length,
        detallesObservados: this.detallesReembolso.filter(d => d.estado_revision === 'observado').length,
        estadosRevision: this.detallesReembolso.map(d => ({ 
          nro: d.nro, 
          estado_revision: d.estado_revision, 
          monto: d.monto_reembolso 
        }))
      });
      
      this.totalReembolso = detallesContabilizables.reduce((sum, detalle) => sum + detalle.monto_reembolso, 0);
      this.totalTrabajadores = detallesContabilizables.length;
    } else {
      // Si está en BORRADOR, calcular desde todos los detalles
      this.totalReembolso = this.detallesReembolso.reduce((sum, detalle) => sum + detalle.monto_reembolso, 0);
      this.totalTrabajadores = this.detallesReembolso.length;
    }
  
    // Calcular totales por tipo (filtrando observados si no es borrador)
    Object.keys(this.detallesPorTipo).forEach(tipo => {
      const detallesTipo = this.detallesPorTipo[tipo as keyof typeof this.detallesPorTipo];
      
      // Si la solicitud no es borrador, filtrar los observados
      const detallesContabilizables = (this.solicitudReembolso && this.solicitudReembolso.estado !== 0)
        ? detallesTipo.filter(d => d.estado_revision !== 'observado')
        : detallesTipo;
      
      const montoTotal = detallesContabilizables.reduce((sum, detalle) => sum + detalle.monto_reembolso, 0);
      
      console.log(`📊 Totales para ${tipo}:`, {
        totalDetallesTipo: detallesTipo.length,
        contabilizables: detallesContabilizables.length,
        detalles: detallesTipo.map(d => ({
          nro: d.nro,
          estado_revision: d.estado_revision,
          monto: d.monto_reembolso
        })),
        montoCalculado: montoTotal
      });
      
      this.totalesPorTipo[tipo as keyof typeof this.totalesPorTipo] = {
        trabajadores: detallesContabilizables.length,
        monto: montoTotal
      };
    });

    // Validar denuncias de riesgo profesional
    this.validarDenunciasRiesgoProfesional();
  }

  validarDenunciasRiesgoProfesional() {
    const detallesProfesional = this.detallesReembolso.filter(detalle => 
      detalle.tipo_incapacidad === 'PROFESIONAL'
    );
    
    this.totalDenunciasRequeridas = detallesProfesional.length;
    this.denunciasCompletas = detallesProfesional.filter(detalle => 
      detalle.ruta_file_denuncia && detalle.ruta_file_denuncia.trim() !== ''
    ).length;
    this.denunciasFaltantes = this.totalDenunciasRequeridas - this.denunciasCompletas;
    
    // Determinar si se puede presentar la solicitud
    this.puedePresentarSolicitud = this.denunciasFaltantes === 0;
  }

  presentarSolicitud() {
    if (this.detallesReembolso.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Atención',
        text: 'Debe agregar al menos un trabajador antes de presentar la solicitud'
      });
      return;
    }

    // Validar denuncias de riesgo profesional
    if (this.denunciasFaltantes > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Denuncias Pendientes',
        html: `
          <p>No se puede presentar la solicitud porque faltan <strong>${this.denunciasFaltantes}</strong> denuncias de riesgo profesional.</p>
          <p>Por favor, suba todas las denuncias requeridas antes de continuar.</p>
        `,
        confirmButtonText: 'Entendido'
      });
      return;
    }

    Swal.fire({
      title: '¿Presentar solicitud?',
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <p><strong>⚠️ IMPORTANTE:</strong></p>
          <p>Al presentar esta solicitud, usted declara que:</p>
          <ul style="text-align: left; margin: 15px 0;">
            <li>Los datos presentados son <strong>veraces y completos</strong></li>
            <li>Asume la <strong>total responsabilidad</strong> por la información proporcionada</li>
            <li>Una vez presentada <strong>NO podrá realizar modificaciones</strong></li>
            <li>La solicitud será enviada para revisión y aprobación</li>
          </ul>
          <p style="color: #d32f2f; font-weight: bold;">¿Está seguro de continuar?</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, presentar solicitud',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d32f2f',
      cancelButtonColor: '#6c757d',
      width: '500px'
    }).then((result) => {
      if (result.isConfirmed) {
        this.presentarSolicitudBackend();
      }
    });
  }

  // Método para presentar la solicitud en el backend
  presentarSolicitudBackend() {
    if (!this.idSolicitud) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo identificar la solicitud'
      });
      return;
    }

    // Mostrar loading
    Swal.fire({
      title: 'Presentando solicitud...',
      text: 'Por favor espere',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Obtener nombre del usuario del servicio de sesión
    const sessionData = this.sessionService['sessionDataSubject'].value;
    
    console.log('=== DEBUGGING USUARIO ===');
    console.log('sessionData completo:', sessionData);
    console.log('sessionData?.usuario:', sessionData?.usuario);
    console.log('sessionData?.persona:', sessionData?.persona);
    console.log('sessionData?.usuario?.nombre:', sessionData?.usuario?.nombre);
    console.log('sessionData?.persona?.nombre:', sessionData?.persona?.nombre);
    console.log('sessionData?.usuario?.nombres:', sessionData?.usuario?.nombres);
    
    // Construir nombre completo desde los datos de persona
    let nombreUsuario = 'Usuario del Sistema';
    
    if (sessionData?.persona) {
      const persona = sessionData.persona;
      const nombres = persona.nombres || '';
      const primerApellido = persona.primerApellido || '';
      const segundoApellido = persona.segundoApellido || '';
      
      // Construir nombre completo
      const nombreCompleto = `${nombres} ${primerApellido} ${segundoApellido}`.trim();
      
      if (nombreCompleto) {
        nombreUsuario = nombreCompleto;
      }
    }
    
    console.log('Nombre del usuario final:', nombreUsuario);
    console.log('=== FIN DEBUGGING ===');

    this.reembolsosService.presentarSolicitud(this.idSolicitud, nombreUsuario).subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: '¡Solicitud Presentada!',
          html: `
            <div style="text-align: center; margin: 20px 0;">
              <p style="font-size: 18px; margin-bottom: 15px;">✅ <strong>Solicitud presentada exitosamente</strong></p>
              <p>Su solicitud ha sido enviada para revisión y aprobación.</p>
              <p style="color: #666; font-size: 14px; margin-top: 15px;">
                <strong>Número de solicitud:</strong> ${response.id_solicitud}<br>
                <strong>Fecha de presentación:</strong> ${new Date(response.fecha_presentacion).toLocaleString()}
              </p>
            </div>
          `,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#28a745',
          width: '500px'
        });

        // Recargar la solicitud completa para actualizar todos los datos de la cabecera
        // Esto incluye: nombre_usuario (presentado por) y fecha_presentacion
        this.cargarSolicitudReembolso();
        
        // Recargar los detalles para reflejar el cambio de estado
        this.cargarDetallesReembolso();
      },
      error: (error) => {
        console.error('Error al presentar solicitud:', error);
        
        let mensajeError = 'Error al presentar la solicitud';
        if (error.error?.mensaje) {
          mensajeError = error.error.mensaje;
        }

        Swal.fire({
          icon: 'error',
          title: 'Error al Presentar',
          text: mensajeError,
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  exportarExcel() {
    Swal.fire({
      icon: 'info',
      title: 'Función pendiente',
      text: 'La exportación a Excel se implementará próximamente'
    });
  }

  volver() {
    this.router.navigate(['/cotizaciones/planillas-incapacidades']);
  }

  getTipoIncapacidadClass(tipo: string): string {
    switch (tipo) {
      case 'ENFERMEDAD': return 'tipo-enfermedad';
      case 'MATERNIDAD': return 'tipo-maternidad';
      case 'PROFESIONAL': return 'tipo-profesional';
      default: return 'tipo-default';
    }
  }

  getEstadoClass(estado: number): string {
    switch (estado) {
      case 0: return 'estado-borrador';
      case 1: return 'estado-presentado';
      case 2: return 'estado-aprobado';
      default: return 'estado-default';
    }
  }

  getEstadoLabel(estado: number): string {
    switch (estado) {
      case 0: return 'BORRADOR';
      case 1: return 'PRESENTADO';
      case 2: return 'APROBADO';     
      default: return 'DESCONOCIDO';
    }
  }

  abrirBuscarTrabajador() {
    if (this.solicitudReembolso?.estado !== 0  && this.solicitudReembolso?.estado !== 3) {
      Swal.fire({
        icon: 'warning',
        title: 'No disponible',
        text: 'Solo se pueden agregar trabajadores a solicitudes en estado BORRADOR'
      });
      return;
      
    }
    
    // Resetear el modo a automático cada vez que se abre el diálogo
    this.modoIngresoBusqueda = 'automatico';
    this.mostrarBuscarTrabajador = true;
    
    // Pequeño delay para asegurar que el componente hijo esté listo y resetear su estado
    setTimeout(() => {
      // Resetear el componente hijo para limpiar todos los pasos del stepper
      if (this.buscarTrabajadorRef) {
        this.buscarTrabajadorRef.limpiarFormulario();
      }
    }, 100);
  }

  cambiarModoBusqueda(nuevoModo: 'automatico' | 'manual') {
    this.modoIngresoBusqueda = nuevoModo;
    // El componente hijo recibirá el cambio automáticamente a través del input binding
  }

  getColspanTabla(): number {
    return (this.solicitudReembolso?.estado === 0) ? 13 : 12;
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

  // Método para convertir valores string a números (evita errores del pipe currency)
  private convertirValoresNumericos(detalle: any): DetalleReembolso {
    return {
      ...detalle,
      dias_incapacidad: this.parseNumber(detalle.dias_incapacidad),
      dias_reembolso: this.parseNumber(detalle.dias_reembolso),
      salario: this.parseNumber(detalle.salario),
      monto_dia: this.parseNumber(detalle.monto_dia),
      porcentaje_reembolso: this.parseNumber(detalle.porcentaje_reembolso),
      monto_reembolso: this.parseNumber(detalle.monto_reembolso),
      cotizaciones_previas_verificadas: this.parseNumber(detalle.cotizaciones_previas_verificadas) || 0
    };
  }

  // Método auxiliar para parsear valores numéricos de manera segura
  private parseNumber(value: any): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;

    // Si es string, limpiar caracteres no numéricos y convertir
    if (typeof value === 'string') {
      const cleanedValue = value.replace(/[^\d.-]/g, '');
      const parsed = parseFloat(cleanedValue);
      return isNaN(parsed) ? 0 : parsed;
    }

    return 0;
  }

  // Método para confirmar eliminación de detalles
  confirmarEliminacionDetalles() {
    Swal.fire({
      title: '¿Eliminar todos los detalles?',
      text: 'Esta acción eliminará todos los trabajadores de la planilla. ¿Desea continuar?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Limpiar todos los detalles
        this.detallesReembolso = [];
        this.calcularTotales();
        Swal.fire({
          icon: 'success',
          title: 'Detalles eliminados',
          text: 'Todos los trabajadores han sido eliminados de la planilla',
          timer: 2000
        });
      }
    });
  }

  // Método para editar trabajador
  editarTrabajador(detalle: any) {
    // Implementar lógica de edición si es necesario
    console.log('Editar trabajador:', detalle);
  }

  getIndexInFullArray(detalle: DetalleReembolso): number {
    return this.detallesReembolso.findIndex(d => d.id_detalle_reembolso === detalle.id_detalle_reembolso);
  }

  // Métodos helper para mostrar datos del cálculo
  formatDateShort(dateString: string): string {
    if (!dateString) return '';
    // Usar UTC para evitar problemas de zona horaria
    const date = new Date(dateString);
    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = date.getUTCFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  }

  getDiasTotalesBaja(detalle: DetalleReembolso): number {
    // Prioridad 1: Campo dias_baja_total de la base de datos
    if (detalle.dias_baja_total) {
      return detalle.dias_baja_total;
    }
    
    // Prioridad 2: Calcular desde las fechas de inicio y fin de la baja
    if (detalle.fecha_inicio_baja && detalle.fecha_fin_baja) {
      const inicio = new Date(detalle.fecha_inicio_baja);
      const fin = new Date(detalle.fecha_fin_baja);
      const diffTime = Math.abs(fin.getTime() - inicio.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir ambos días
      return diffDays;
    }
    
    // Prioridad 3: Fallback a dias_incapacidad
    return detalle.dias_incapacidad;
  }

  getDiasEnMes(detalle: DetalleReembolso): number {
    // Prioridad 1: Campo dias_mes_reembolso de la base de datos
    if (detalle.dias_mes_reembolso) {
      return detalle.dias_mes_reembolso;
    }
    
    // Prioridad 2: Calcular desde dias_reembolso + carencia
    if (detalle.tipo_incapacidad === 'ENFERMEDAD') {
      return detalle.dias_reembolso + 3;
    }
    
    // Prioridad 3: Fallback a dias_reembolso
    return detalle.dias_reembolso;
  }

  getDiasMenos3(detalle: DetalleReembolso): number {
    const diasEnMes = this.getDiasEnMes(detalle);
    
    // Solo restar 3 si es ENFERMEDAD
    if (detalle.tipo_incapacidad === 'ENFERMEDAD') {
      return Math.max(0, diasEnMes - 3);
    }
    
    // Para otros tipos, mostrar los días del mes
    return diasEnMes;
  }

  getFechaInicioEnMes(detalle: DetalleReembolso): string {
    return detalle.fecha_inicio_mes_reembolso || detalle.fecha_inicio_baja;
  }

  getFechaFinEnMes(detalle: DetalleReembolso): string {
    return detalle.fecha_fin_mes_reembolso || '';
  }

  // Métodos para búsqueda
  buscarGeneral() {
    this.pagina = 1; // Resetear a la primera página al buscar
    this.cargarDetallesReembolso();
  }

  limpiarBusquedaGeneral() {
    this.busquedaGeneral = '';
    this.pagina = 1; // Resetear a la primera página
    this.cargarDetallesReembolso();
  }

  // Métodos para búsqueda y paginación por tipo específico
  buscarPorTipo(tipo: 'ENFERMEDAD' | 'MATERNIDAD' | 'PROFESIONAL') {
    if (!this.idSolicitud) return;

    // Resetear paginación del tipo específico
    this.paginacionPorTipo[tipo].pagina = 1;
    this.paginacionPorTipo[tipo].cargando = true;
    
    const busqueda = this.busquedaPorTipo[tipo];

    this.reembolsosService.obtenerDetallesPorSolicitud(
      this.idSolicitud,
      busqueda,
      tipo,
      this.paginacionPorTipo[tipo].pagina,
      this.paginacionPorTipo[tipo].limite
    ).subscribe({
      next: (response) => {
        this.paginacionPorTipo[tipo].cargando = false;
        
        // Actualizar datos de paginación específicos del tipo
        this.paginacionPorTipo[tipo].total = response.total || 0;
        this.paginacionPorTipo[tipo].totalPaginas = response.totalPaginas || 0;
        
        // Actualizar solo los detalles del tipo específico
        const detallesConvertidos = (response.detalles || []).map((detalle: any) => this.convertirValoresNumericos(detalle));
        this.detallesPorTipo[tipo] = detallesConvertidos;
        
        // Actualizar totales específicos si vienen en la respuesta
        if (response.totalesEspecificos) {
          this.totalesPorTipo[tipo] = {
            trabajadores: response.totalesEspecificos.total_trabajadores || 0,
            monto: response.totalesEspecificos.total_reembolso || 0
          };
        }
        
        console.log(`📊 Datos cargados para ${tipo}:`, {
          detalles: detallesConvertidos.length,
          total: this.paginacionPorTipo[tipo].total,
          pagina: this.paginacionPorTipo[tipo].pagina,
          totalPaginas: this.paginacionPorTipo[tipo].totalPaginas
        });
      },
      error: (error) => {
        this.paginacionPorTipo[tipo].cargando = false;
        console.error(`Error al buscar por tipo ${tipo}:`, error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: `No se pudieron cargar los detalles de ${tipo}`
        });
      }
    });
  }

  limpiarBusquedaPorTipo(tipo: 'ENFERMEDAD' | 'MATERNIDAD' | 'PROFESIONAL') {
    this.busquedaPorTipo[tipo] = '';
    this.buscarPorTipo(tipo); // Recargar sin filtro
  }

  // Método para búsqueda automática con debounce
  buscarPorTipoAutomatico(tipo: 'ENFERMEDAD' | 'MATERNIDAD' | 'PROFESIONAL') {
    // Limpiar timeout anterior si existe
    clearTimeout(this.searchTimeout);
    
    // Establecer nuevo timeout para búsqueda con retraso
    this.searchTimeout = setTimeout(() => {
      this.buscarPorTipo(tipo);
    }, 500); // Espera 500ms después de dejar de escribir
  }

  // Métodos de paginación específicos por tipo
  onPageChangePorTipo(event: any, tipo: 'ENFERMEDAD' | 'MATERNIDAD' | 'PROFESIONAL') {
    this.paginacionPorTipo[tipo].pagina = event.page + 1; // PrimeNG usa índice 0, backend usa índice 1
    this.paginacionPorTipo[tipo].limite = event.rows;
    this.cargarDetallesPorTipo(tipo);
  }

  irAPaginaPorTipo(numeroPagina: number, tipo: 'ENFERMEDAD' | 'MATERNIDAD' | 'PROFESIONAL') {
    if (numeroPagina >= 1 && numeroPagina <= this.paginacionPorTipo[tipo].totalPaginas) {
      this.paginacionPorTipo[tipo].pagina = numeroPagina;
      this.cargarDetallesPorTipo(tipo);
    }
  }

  paginaAnteriorPorTipo(tipo: 'ENFERMEDAD' | 'MATERNIDAD' | 'PROFESIONAL') {
    if (this.paginacionPorTipo[tipo].pagina > 1) {
      this.paginacionPorTipo[tipo].pagina--;
      this.cargarDetallesPorTipo(tipo);
    }
  }

  paginaSiguientePorTipo(tipo: 'ENFERMEDAD' | 'MATERNIDAD' | 'PROFESIONAL') {
    if (this.paginacionPorTipo[tipo].pagina < this.paginacionPorTipo[tipo].totalPaginas) {
      this.paginacionPorTipo[tipo].pagina++;
      this.cargarDetallesPorTipo(tipo);
    }
  }

  // Método auxiliar para cargar detalles de un tipo específico
  cargarDetallesPorTipo(tipo: 'ENFERMEDAD' | 'MATERNIDAD' | 'PROFESIONAL') {
    if (!this.idSolicitud) return;

    this.paginacionPorTipo[tipo].cargando = true;
    const busqueda = this.busquedaPorTipo[tipo];

    this.reembolsosService.obtenerDetallesPorSolicitud(
      this.idSolicitud,
      busqueda,
      tipo,
      this.paginacionPorTipo[tipo].pagina,
      this.paginacionPorTipo[tipo].limite
    ).subscribe({
      next: (response) => {
        this.paginacionPorTipo[tipo].cargando = false;
        
        // Actualizar datos de paginación específicos del tipo
        this.paginacionPorTipo[tipo].total = response.total || 0;
        this.paginacionPorTipo[tipo].totalPaginas = response.totalPaginas || 0;
        
        // Actualizar solo los detalles del tipo específico
        const detallesConvertidos = (response.detalles || []).map((detalle: any) => this.convertirValoresNumericos(detalle));
        this.detallesPorTipo[tipo] = detallesConvertidos;
        
        // Actualizar totales específicos si vienen en la respuesta
        if (response.totalesEspecificos) {
          this.totalesPorTipo[tipo] = {
            trabajadores: response.totalesEspecificos.total_trabajadores || 0,
            monto: response.totalesEspecificos.total_reembolso || 0
          };
        }
      },
      error: (error) => {
        this.paginacionPorTipo[tipo].cargando = false;
        console.error(`Error al cargar detalles de ${tipo}:`, error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: `No se pudieron cargar los detalles de ${tipo}`
        });
      }
    });
  }

  // Métodos de paginación global (mantener para compatibilidad)
  onPageChange(event: any) {
    this.pagina = event.page + 1; // PrimeNG usa índice 0, backend usa índice 1
    this.limite = event.rows;
    this.cargarDetallesReembolso();
  }

  irAPagina(numeroPagina: number) {
    if (numeroPagina >= 1 && numeroPagina <= this.totalPaginas) {
      this.pagina = numeroPagina;
      this.cargarDetallesReembolso();
    }
  }

  paginaAnterior() {
    if (this.pagina > 1) {
      this.pagina--;
      this.cargarDetallesReembolso();
    }
  }

  paginaSiguiente() {
    if (this.pagina < this.totalPaginas) {
      this.pagina++;
      this.cargarDetallesReembolso();
    }
  }

  // Método para obtener detalles filtrados por tipo (para mostrar en las tablas)
  getDetallesFiltradosPorTipo(tipo: 'ENFERMEDAD' | 'MATERNIDAD' | 'PROFESIONAL'): DetalleReembolso[] {
    const busqueda = this.busquedaPorTipo[tipo].toLowerCase();
    
    if (!busqueda) {
      return this.detallesPorTipo[tipo];
    }

    return this.detallesPorTipo[tipo].filter(detalle => 
      detalle.ci.toLowerCase().includes(busqueda) ||
      detalle.apellido_paterno.toLowerCase().includes(busqueda) ||
      detalle.apellido_materno.toLowerCase().includes(busqueda) ||
      detalle.nombres.toLowerCase().includes(busqueda) ||
      detalle.matricula.toLowerCase().includes(busqueda) ||
      `${detalle.nombres} ${detalle.apellido_paterno} ${detalle.apellido_materno}`.toLowerCase().includes(busqueda) ||
      `${detalle.apellido_paterno} ${detalle.apellido_materno} ${detalle.nombres}`.toLowerCase().includes(busqueda)
    );
  }

  // Método para abrir el modal de subida de archivo
  abrirSubirArchivo(detalle: DetalleReembolso) {
    this.detalleSeleccionadoParaArchivo = detalle;
    this.mostrarSubirArchivo = true;
  }

  // Método para manejar cuando se sube un archivo exitosamente
  onArchivoSubido(response: any) {
    console.log('Archivo subido exitosamente:', response);
    // Recargar los detalles para mostrar el archivo actualizado
    this.cargarDetallesReembolso();
  }

  // Método para verificar si un detalle tiene archivo de denuncia
  tieneArchivoDenuncia(detalle: DetalleReembolso): boolean {
    return !!(detalle.ruta_file_denuncia);
  }

  // Método para descargar archivo de denuncia
  descargarArchivoDenuncia(detalle: DetalleReembolso) {
    if (!detalle.id_detalle_reembolso) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se puede descargar el archivo: ID de detalle no válido'
      });
      return;
    }

    this.reembolsosService.descargarArchivoDenuncia(detalle.id_detalle_reembolso)
      .subscribe({
        next: (blob: Blob) => {
          // Crear URL para el blob y descargar
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          
          // Determinar la extensión del archivo basada en la ruta
          const extension = detalle.ruta_file_denuncia ? 
            detalle.ruta_file_denuncia.split('.').pop() || 'pdf' : 'pdf';
          
          link.download = `denuncia_${detalle.matricula}_${detalle.id_detalle_reembolso}.${extension}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        },
        error: (error: any) => {
          console.error('Error al descargar archivo:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo descargar el archivo'
          });
        }
      });
  }

  // Método para ver archivo de denuncia sin descarga
  verArchivoDenuncia(detalle: DetalleReembolso) {
    if (!detalle.ruta_file_denuncia) {
      Swal.fire({
        icon: 'warning',
        title: 'Advertencia',
        text: 'No hay archivo de denuncia disponible para este detalle'
      });
      return;
    }

    if (!detalle.id_detalle_reembolso) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'ID de detalle no válido'
      });
      return;
    }

    // Configurar el modal
    this.detalleSeleccionadoParaVisualizacion = detalle;
    
    // Obtener la URL del archivo usando la ruta de la base de datos (como en recursos)
    const urlString = this.reembolsosService.obtenerUrlArchivoDenuncia(detalle);
    
    // Sanitizar la URL para evitar errores de seguridad
    this.urlArchivoVisualizacion = this.sanitizer.bypassSecurityTrustResourceUrl(urlString);
    
    // Determinar el tipo de archivo basado en la extensión
    const extension = detalle.ruta_file_denuncia.toLowerCase().split('.').pop();
    if (extension === 'pdf') {
      this.tipoArchivoVisualizacion = 'pdf';
    } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '')) {
      this.tipoArchivoVisualizacion = 'imagen';
    } else {
      this.tipoArchivoVisualizacion = 'pdf'; // Por defecto, asumir PDF
    }
    
    // Log básico para debug (opcional)
    console.log('🔍 Visualizando archivo:', {
      tipo: this.tipoArchivoVisualizacion,
      extension: extension
    });
    
    // Mostrar el modal
    this.mostrarVisualizarArchivo = true;
  }

  cerrarModalVisualizacion() {
    this.mostrarVisualizarArchivo = false;
    this.detalleSeleccionadoParaVisualizacion = null;
    this.urlArchivoVisualizacion = '';
    this.tipoArchivoVisualizacion = null;
    this.errorCargaArchivo = false;
    this.zoomLevel = 100; // Resetear zoom
    this.resetPan(); // Resetear pan
  }

  descargarArchivoDesdeModal() {
    if (this.detalleSeleccionadoParaVisualizacion) {
      this.descargarArchivoDenuncia(this.detalleSeleccionadoParaVisualizacion);
    }
  }

  // Métodos para manejar errores de carga de archivos
  onErrorCargaArchivo() {
    console.error('❌ Error al cargar archivo:', this.urlArchivoVisualizacion);
    this.errorCargaArchivo = true;
  }

  onCargaArchivo() {
    console.log('✅ Archivo cargado exitosamente:', this.urlArchivoVisualizacion);
    this.errorCargaArchivo = false;
  }

  reintentarCargaArchivo() {
    this.errorCargaArchivo = false;
    // Forzar recarga del iframe/img
    const currentUrl = this.urlArchivoVisualizacion;
    this.urlArchivoVisualizacion = '';
    setTimeout(() => {
      this.urlArchivoVisualizacion = currentUrl;
    }, 100);
  }

  // Métodos para controlar el zoom de imágenes
  zoomIn() {
    if (this.zoomLevel < this.maxZoom) {
      this.zoomLevel += this.zoomStep;
    }
  }

  zoomOut() {
    if (this.zoomLevel > this.minZoom) {
      this.zoomLevel -= this.zoomStep;
    }
  }

  resetZoom() {
    this.zoomLevel = 100;
  }

  getZoomStyle(): string {
    return `transform: scale(${this.zoomLevel / 100}); transform-origin: center;`;
  }

  // Métodos para manejar el pan (arrastrar) de imágenes
  onMouseDown(event: MouseEvent) {
    if (this.tipoArchivoVisualizacion !== 'imagen') return;
    
    this.isDragging = true;
    this.startX = event.clientX - this.translateX;
    this.startY = event.clientY - this.translateY;
    
    event.preventDefault();
  }

  onMouseMove(event: MouseEvent) {
    if (!this.isDragging || this.tipoArchivoVisualizacion !== 'imagen') return;
    
    this.translateX = event.clientX - this.startX;
    this.translateY = event.clientY - this.startY;
    
    event.preventDefault();
  }

  onMouseUp(event: MouseEvent) {
    if (this.tipoArchivoVisualizacion !== 'imagen') return;
    
    this.isDragging = false;
    this.lastTranslateX = this.translateX;
    this.lastTranslateY = this.translateY;
  }

  onMouseLeave() {
    this.isDragging = false;
  }

  // Método para manejar zoom con scroll del mouse
  onMouseWheel(event: WheelEvent) {
    if (this.tipoArchivoVisualizacion !== 'imagen') return;
    
    event.preventDefault();
    
    // Determinar dirección del scroll
    const delta = event.deltaY;
    const zoomFactor = delta > 0 ? -this.zoomStep : this.zoomStep;
    
    // Aplicar zoom
    const newZoom = this.zoomLevel + zoomFactor;
    
    // Limitar zoom dentro de los rangos permitidos
    if (newZoom >= this.minZoom && newZoom <= this.maxZoom) {
      this.zoomLevel = newZoom;
    }
  }

  getPanStyle(): string {
    const scale = this.zoomLevel / 100;
    return `transform: scale(${scale}) translate(${this.translateX}px, ${this.translateY}px); transform-origin: center;`;
  }

  resetPan() {
    this.translateX = 0;
    this.translateY = 0;
    this.lastTranslateX = 0;
    this.lastTranslateY = 0;
  }

  // Método para generar reporte PDF
  generarReportePDF() {
    if (!this.idSolicitud) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se encontró el ID de la solicitud.',
        confirmButtonText: 'Ok',
      });
      return;
    }

    // Mostrar loading
    Swal.fire({
      title: 'Generando reporte...',
      text: 'Por favor espere mientras se genera el reporte PDF.',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Llamar al servicio para generar el reporte
    this.reembolsosService.generarReportePDF(this.idSolicitud).subscribe({
      next: (data: Blob) => {
        // Crear URL del archivo y abrir en nueva ventana
        const fileURL = URL.createObjectURL(data);
        const ventanaEmergente = window.open(
          fileURL,
          '_blank',
          'width=800,height=600,scrollbars=yes,resizable=yes'
        );

        if (ventanaEmergente) {
          ventanaEmergente.focus();
        } else {
          // Si no se puede abrir ventana emergente, descargar directamente
          const link = document.createElement('a');
          link.href = fileURL;
          link.download = `reporte_reembolsos_${this.idSolicitud}.pdf`;
          link.click();
        }

        // Limpiar URL después de un tiempo
        setTimeout(() => {
          URL.revokeObjectURL(fileURL);
        }, 1000);

        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'El reporte PDF se ha generado correctamente.',
          confirmButtonText: 'Ok',
        });
      },
      error: (error) => {
        console.error('Error al generar el reporte:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo generar el reporte PDF.',
          confirmButtonText: 'Ok',
        });
      }
    });
  }

  // ===== ENVIAR CORRECCIONES DE PLANILLA OBSERVADA =====
  enviarCorrecciones() {
    if (!this.idSolicitud) {
      console.error('ID de solicitud no encontrado');
      return;
    }

    Swal.fire({
      title: '¿Enviar correcciones?',
      html: `
        <div style="text-align: left;">
          <p><strong>¿Está seguro de que desea enviar las correcciones de esta planilla?</strong></p>
          <hr>
          <p><i class="pi pi-info-circle"></i> <strong>Acciones que se realizarán:</strong></p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>La planilla volverá al estado <strong style="color: #17a2b8;">PRESENTADO</strong></li>
            <li>Se recalcularán los totales basados en los detalles no observados</li>
            <li>Se limpiarán las observaciones de la planilla</li>
            <li>Los detalles observados no se contabilizarán en los totales</li>
          </ul>
          <hr>
          <p style="color: #6c757d; font-size: 0.9rem;">
            <i class="pi pi-exclamation-triangle"></i> 
            Una vez enviadas las correcciones, la planilla será revisada nuevamente por el administrador
          </p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, enviar correcciones',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.procesarEnvioCorrecciones();
      }
    });
  }

  procesarEnvioCorrecciones() {
    if (!this.idSolicitud) return;

    this.reembolsosService.enviarCorrecciones(this.idSolicitud).subscribe({
      next: (response) => {
        console.log('✅ Correcciones enviadas:', response);
        
        Swal.fire({
          icon: 'success',
          title: 'Correcciones enviadas',
          html: `
            <div style="text-align: left;">
              <p><strong>Las correcciones han sido enviadas exitosamente</strong></p>
              <hr>
              <p><i class="pi pi-check-circle"></i> Estado: <strong style="color: #17a2b8;">PRESENTADO</strong></p>
              <p><i class="pi pi-users"></i> Total trabajadores: <strong>${response.resumen?.totalTrabajadores || 0}</strong></p>
              <p><i class="pi pi-money-bill"></i> Total reembolso: <strong>${response.resumen?.totalReembolso || 0} Bs</strong></p>
              ${response.resumen?.detallesObservados > 0 ? 
                `<p><i class="pi pi-exclamation-triangle"></i> Detalles observados: <strong style="color: #f39c12;">${response.resumen.detallesObservados}</strong> (no contabilizados)</p>` : 
                ''
              }
              <hr>
              <p style="color: #6c757d; font-size: 0.9rem;">
                La planilla será revisada nuevamente por el administrador
              </p>
            </div>
          `,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#009688'
        }).then(() => {
          // Recargar datos para reflejar los cambios
          this.cargarSolicitudReembolso();
          this.cargarDetallesReembolso();
        });
      },
      error: (error) => {
        console.error('❌ Error al enviar correcciones:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'No se pudieron enviar las correcciones',
          confirmButtonColor: '#dc3545'
        });
      }
    });
  }

}