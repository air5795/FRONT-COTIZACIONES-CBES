import { Component, OnInit } from '@angular/core';
import { ReembolsosIncapacidadesService } from '../../../servicios/reembolsos-incapacidades/reembolsos-incapacidades.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { SessionService } from '../../../servicios/auth/session.service';
import { TokenService } from '../../../servicios/token/token.service';
import { 
  CreateSolicitudesReembolsoDto, 
  SolicitudReembolso, 
  CrearSolicitudResponse,
  SolicitudesPaginadasResponse,
  ParametrosBusquedaSolicitudes
} from '../../../interfaces/reembolsos-incapacidades/reembolsos-incapacidades.interface';

@Component({
  selector: 'app-solicitud-reembolso',
  templateUrl: './solicitud-reembolso.component.html',
  styleUrl: './solicitud-reembolso.component.css'
})
export class SolicitudReembolsoComponent implements OnInit {
  solicitudes: SolicitudReembolso[] = [];
  loading = true;
  empresa: any = null;
  mostrarModal = false;
  activeIndex: number = 0;
  mesSeleccionado: string = '';
  gestiones: { label: string; value: number }[] = [];
  gestionSeleccionada: number | null = null;
  numPatronal: string | null = null;
  nomEmpresa: string | null = null;
  tipoEmpresa: string | null = null;
  totalRegistros: number = 0;
  pagina: number = 1;
  limite: number = 10;
  busqueda: string = '';
  mesFiltro: string = '';
  anioFiltro: string = '';
  usuario_creacion: string = '';
  nombre_creacion: string = '';

  isLoading: boolean = false;
  loadingProgress: number = 0;
  loadingMessage: string = 'Cargando....';

  meses = [
    { label: 'ENERO', value: '01' },
    { label: 'FEBRERO', value: '02' },
    { label: 'MARZO', value: '03' },
    { label: 'ABRIL', value: '04' },
    { label: 'MAYO', value: '05' },
    { label: 'JUNIO', value: '06' },
    { label: 'JULIO', value: '07' },
    { label: 'AGOSTO', value: '08' },
    { label: 'SEPTIEMBRE', value: '09' },
    { label: 'OCTUBRE', value: '10' },
    { label: 'NOVIEMBRE', value: '11' },
    { label: 'DICIEMBRE', value: '12' },
  ];

  anios: { label: string; value: string }[] = [];

  steps = [
    { label: 'Elegir Mes y Gestión' },
    { label: 'Confirmar Solicitud' }
  ];

  persona: any = null;

  constructor(
    private reembolsosService: ReembolsosIncapacidadesService,
    private sessionService: SessionService,
    private router: Router,
    private tokenService: TokenService
  ) {}

  ngOnInit(): void {
    this.generarGestiones();
    const sessionData = this.sessionService.sessionDataSubject.value;
    console.log('Datos de sesión:', sessionData);
    this.persona = sessionData?.persona;
    this.usuario_creacion = sessionData?.usuario;
    const nombreCompleto = `${sessionData?.persona?.nombres || ''} ${sessionData?.persona?.primerApellido || ''} ${sessionData?.persona?.segundoApellido || ''}`.replace(/\s+/g, ' ').trim();
    this.nombre_creacion = nombreCompleto;
    console.log('Persona:', this.persona);
    console.log('Usuario de creación:', this.usuario_creacion);
    console.log('Nombre del usuario:', this.nombre_creacion);
    this.obtenerNumeroPatronal();

    if (this.numPatronal) {
      this.obtenerSolicitudes();
      console.log('🔍 Buscando solicitudes de reembolso para:', this.numPatronal);
    } else {
      console.error('⚠️ El número patronal no es válido.');
    }
    this.generarAnios();
  }

  // Generar el arreglo de gestiones
  generarGestiones() {
    const currentYear = new Date().getFullYear();
    this.gestiones = [
      { label: (currentYear - 1).toString(), value: currentYear - 1 },
      { label: currentYear.toString(), value: currentYear },
      { label: (currentYear + 1).toString(), value: currentYear + 1 },
    ];
  }

  obtenerNumeroPatronal() {
    try {
      const sessionData = this.sessionService.sessionDataSubject.value;
      this.numPatronal = sessionData?.persona.empresa.codPatronal || null;
      this.nomEmpresa = sessionData?.persona.empresa.nombre || null;
      if (this.numPatronal) {
        console.log('COD patronal:', this.numPatronal);
        console.log('Nombre empresa:', this.nomEmpresa);
      }

      if (!this.numPatronal) {
        console.error('⚠️ No se encontró el número patronal en sessionService.');
      } else {
        console.log(`✅ Número patronal obtenido: ${this.numPatronal}`);
      }
    } catch (error) {
      console.error('❌ Error al obtener número patronal:', error);
    }
  }

  procesarFecha(fechaSolicitud: string) {
    const fecha = new Date(fechaSolicitud);
    const meses = [
      'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
      'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
    ];
    return {
      mes: meses[fecha.getUTCMonth()],
      gestion: fecha.getUTCFullYear(),
    };
  }

  // Método actualizado para obtener todas las solicitudes por código patronal con paginación
  obtenerSolicitudes() {
    if (!this.numPatronal) {
      console.error('⚠️ No hay número patronal disponible');
      return;
    }

    this.loading = true;
    
    const parametros: ParametrosBusquedaSolicitudes = {
      pagina: this.pagina,
      limite: this.limite,
      busqueda: this.busqueda || undefined,
      mes: this.mesFiltro || undefined,
      anio: this.anioFiltro || undefined
    };

    this.reembolsosService.obtenerSolicitudesPorCodPatronal(this.numPatronal, parametros)
      .subscribe({
        next: (response: SolicitudesPaginadasResponse) => {
          this.solicitudes = response.solicitudes;
          this.totalRegistros = response.total;
          this.loading = false;
          console.log('📡 Respuesta del servidor:', response);
          console.log('📡 Solicitudes de reembolso:', this.solicitudes);
          console.log('📊 Total de registros:', this.totalRegistros);
        },
        error: (error) => {
          console.error('❌ Error al cargar las solicitudes:', error);
          this.loading = false;
          Swal.fire({
            title: 'Error',
            text: 'No se pudieron cargar las solicitudes de reembolso',
            icon: 'error'
          });
        }
      });
  }

  // Método para obtener una solicitud por ID
  obtenerSolicitudPorId(id: number) {
    this.reembolsosService.obtenerSolicitudPorId(id)
      .subscribe({
        next: (solicitud) => {
          console.log('📄 Solicitud específica:', solicitud);
          // Aquí puedes manejar la solicitud específica si es necesario
        },
        error: (error) => {
          console.error('❌ Error al obtener la solicitud:', error);
          Swal.fire({
            title: 'Error',
            text: 'No se pudo obtener la solicitud',
            icon: 'error'
          });
        }
      });
  }

  // Método actualizado para manejar el cambio de página
  onPageChange(event: any) {
    console.log('📄 Evento de cambio de página:', event);
    this.pagina = Math.floor(event.first / event.rows) + 1; // Convertir a base 1
    this.limite = event.rows;
    this.obtenerSolicitudes();
  }

  // Método actualizado para la búsqueda
  buscar(value: string): void {
    this.busqueda = value.trim();
    this.pagina = 1; // Resetear a la primera página
    this.obtenerSolicitudes();
  }

  // Método actualizado para aplicar filtros
  aplicarFiltros() {
    this.pagina = 1; // Resetear a la primera página
    this.obtenerSolicitudes();
  }

  // Método actualizado para recargar
  recargar() {
    this.busqueda = '';
    this.mesFiltro = '';
    this.anioFiltro = '';
    this.pagina = 1;
    this.obtenerSolicitudes();
  }

  // Generar lista de años
  generarAnios() {
    const currentYear = new Date().getFullYear();
    this.anios = [
      {
        label: (currentYear - 1).toString(),
        value: (currentYear - 1).toString(),
      },
      { label: currentYear.toString(), value: currentYear.toString() },
      {
        label: (currentYear + 1).toString(),
        value: (currentYear + 1).toString(),
      },
    ];
  }

  verDetalle(idSolicitud: number) {
    console.log('🔍 ID recibido en verDetalle:', idSolicitud);
    
    if (!idSolicitud || idSolicitud <= 0) {
      console.error('❌ Error: ID de solicitud no válido', idSolicitud);
      return;
    }
    
    // Navegar al componente de detalle
    this.router.navigate(['/cotizaciones/planillas-incapacidades/detalle', idSolicitud]);
  }

  // Navegación del modal paso a paso
  nextStep() {
    if (this.activeIndex === 0) {
      // Validar que se hayan seleccionado mes y gestión
      if (!this.mesSeleccionado || !this.gestionSeleccionada) {
        Swal.fire({
          title: 'Datos Incompletos',
          text: 'Por favor seleccione el mes y la gestión',
          icon: 'warning'
        });
        return;
      }
    }
    
    if (this.activeIndex < this.steps.length - 1) {
      this.activeIndex++;
    }
  }

  prevStep() {
    if (this.activeIndex > 0) {
      this.activeIndex--;
    }
  }

  // Método para limpiar los campos del modal
  limpiarCamposModal() {
    this.mesSeleccionado = '';
    this.gestionSeleccionada = null;
    this.activeIndex = 0;
  }

  // Método para cerrar el modal y limpiar campos
  cerrarModal() {
    this.mostrarModal = false;
    this.limpiarCamposModal();
  }

  // Método actualizado para crear nueva solicitud de reembolso
  crearSolicitudReembolso() {
    if (!this.mesSeleccionado || !this.gestionSeleccionada || !this.numPatronal) {
      Swal.fire({
        title: 'Error',
        text: 'Faltan datos obligatorios para crear la solicitud',
        icon: 'error',
        customClass: { container: 'swal2-container' },
        willOpen: () => {
          document.querySelector('.swal2-container')?.setAttribute('style', 'z-index: 9999 !important;');
        },
      });
      return;
    }

    const createDto: CreateSolicitudesReembolsoDto = {
      cod_patronal: this.numPatronal,
      mes: this.mesSeleccionado,
      gestion: this.gestionSeleccionada.toString(),
      usuario_creacion: this.usuario_creacion,
      nombre_creacion: this.nombre_creacion
    };

    console.log('📤 Enviando datos para crear solicitud:', createDto);

    this.isLoading = true;
    this.loadingMessage = 'Creando solicitud de reembolso...';

    this.reembolsosService.crearSolicitudMensual(createDto)
      .subscribe({
        next: (response: CrearSolicitudResponse) => {
          console.log('✅ Respuesta exitosa:', response);
          this.isLoading = false;
          Swal.fire({
            title: '¡Éxito!',
            text: response.mensaje || 'Solicitud creada exitosamente',
            icon: 'success',
            confirmButtonText: 'Aceptar',
            customClass: { container: 'swal2-container' },
            willOpen: () => {
              document.querySelector('.swal2-container')?.setAttribute('style', 'z-index: 9999 !important;');
            },
          }).then(() => {
            this.cerrarModal(); // Usar el nuevo método para cerrar y limpiar
            // Recargar las solicitudes con la nueva implementación
            this.pagina = 1;
            this.obtenerSolicitudes();
          });
        },
        error: (error) => {
          console.error('❌ Error completo:', error);
          this.isLoading = false;
          
          let mensajeError = 'No se pudo crear la solicitud de reembolso';
          
          // Manejar diferentes tipos de errores
          if (error.error?.mensaje) {
            mensajeError = error.error.mensaje;
          } else if (error.error?.message) {
            mensajeError = error.error.message;
          } else if (error.message) {
            mensajeError = error.message;
          } else if (typeof error.error === 'string') {
            mensajeError = error.error;
          }
          
          Swal.fire({
            title: 'Error',
            text: mensajeError,
            icon: 'error'
          });
        }
      });
  }

  obtenerMesNombre(mesNumero: string): string {
    const mes = this.meses.find(m => m.value === mesNumero);
    return mes ? mes.label : mesNumero;
  }

  obtenerEstadoTexto(estado: number): string {
    switch (estado) {
      case 0: return 'BORRADOR';
      case 1: return 'PRESENTADO';
      case 2: return 'APROBADO';
      case 3: return 'OBSERVADO';
      default: return 'DESCONOCIDO';
    }
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
}
