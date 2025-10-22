import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlanillasAportesService } from '../../../servicios/planillas-aportes/planillas-aportes.service';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { LazyLoadEvent } from 'primeng/api';
import { SessionService } from '../../../servicios/auth/session.service';
import { Subject } from 'rxjs';
import { TokenService } from '../../../servicios/token/token.service';

@Component({
  selector: 'app-planillas-aportes-detalle',
  templateUrl: './planillas-aportes-detalle.component.html',
  styleUrls: ['./planillas-aportes-detalle.component.css'],
})
export class PlanillasAportesDetalleComponent implements OnInit {

  idPlanilla!: number;
  trabajadores: any[] = [];
  loading = true;
  displayModal = false;
  trabajadorSeleccionado: any = {};
  planillaInfo: any = {};

  mostrarModalImportacion = false;
  mostrarModalImportar = false;
  archivoSeleccionado: File | null = null;

  pagina: number = 1;
  limite: number = 20;
  total: number = 0;
  busqueda: string = '';

  // Variable para almacenar el conteo de estados del backend
  conteoEstadosAsegurados: any = {
    VIGENTE: 0,
    BAJA: 0,
    'DER HABIENTE': 0,
    FALLECIDO: 0,
    CESANTIA: 0
  };

  altas: any[] = [];
  bajasNoEncontradas: any[] = [];
  bajasPorRetiro: any[] = []; 

  resumenData: any = null; 
  resumenLoading = false; 

  progreso: number = 100;

  isLoading: boolean = false;
  loadingProgress: number = 0;
  loadingMessage: string = 'Cargando...';

  regionales = [
    { label: 'LA PAZ', value: 'LA PAZ' },
    { label: 'COCHABAMBA', value: 'COCHABAMBA' },
    { label: 'SANTA CRUZ', value: 'SANTA CRUZ' },
    { label: 'POTOSÍ', value: 'POTOSI' },
    { label: 'ORURO', value: 'ORURO' },
    { label: 'TARIJA', value: 'TARIJA' },
    { label: 'PANDO', value: 'PANDO' },
    { label: 'BENI', value: 'BENI' },
    { label: 'CHUQUISACA', value: 'CHUQUISACA' },
  ];

  nuevoMes: string | null = null;
  nuevoAnio: number | null = null;
  nuevaFechaPlanilla: string | null = null;
  meses = [
    { label: 'Enero', value: '1' },
    { label: 'Febrero', value: '2' },
    { label: 'Marzo', value: '3' },
    { label: 'Abril', value: '4' },
    { label: 'Mayo', value: '5' },
    { label: 'Junio', value: '6' },
    { label: 'Julio', value: '7' },
    { label: 'Agosto', value: '8' },
    { label: 'Septiembre', value: '9' },
    { label: 'Octubre', value: '10' },
    { label: 'Noviembre', value: '11' },
    { label: 'Diciembre', value: '12' },
  ];

  anios: number[] = [];

  // cruce afiliaciones
  casosAnalisis: any = null;
  resumenCompleto: any = null;
  mostrarAnalisisCompletoDialog: boolean = false;  
  estadisticasCompletas: any = null;
  trabajadoresFaltantes: any[] = [];
  fechaUltimaVerificacion: Date | null = null;

// Propiedades para control de roles
  esAdministrador: boolean = false;
  rolUsuario: string = '';
  tipoEmpresa: string = '';
  nombreEmpresa: string = '';
  // Para manejar la suscripción
  private destroy$ = new Subject<void>();

  
  constructor(
    private route: ActivatedRoute,
    private planillasService: PlanillasAportesService,
    private sessionService: SessionService,
    private router: Router,
    private tokenService: TokenService
  ) {}

ngOnInit(): void {
  this.verificarRolUsuario();
  const currentYear = new Date().getFullYear();
  for (let i = currentYear - 10; i <= currentYear + 1; i++) {
    this.anios.push(i);
  }
  
  // ✅ NUEVA LÓGICA PARA PROCESAR ID ENCRIPTADO
  const identificador = this.route.snapshot.paramMap.get('id');
  if (identificador) {
    this.procesarIdentificadorPlanilla(identificador);
  } else {
    this.router.navigate(['/cotizaciones/planillas-aportes']);
  }
}

// ✅ NUEVO MÉTODO PARA PROCESAR ID ENCRIPTADO
private procesarIdentificadorPlanilla(identificador: string) {
  
  // Intentar desencriptar el ID
  const idDesencriptado = this.tokenService.desencriptarId(identificador);
  
  if (idDesencriptado) {

    
    // Establecer el ID y cargar datos
    this.idPlanilla = idDesencriptado;
    this.cargarDatosPlanilla();
    
  } else {
    // Si no se puede desencriptar, podría ser un ID numérico directo (compatibilidad)
    const idNumerico = parseInt(identificador);
    if (!isNaN(idNumerico) && idNumerico > 0) {
      this.idPlanilla = idNumerico;
      this.cargarDatosPlanilla();
    } else {
      this.router.navigate(['/cotizaciones/planillas-aportes']);
    }
  }
}

// ✅ NUEVO MÉTODO PARA CARGAR TODOS LOS DATOS
private cargarDatosPlanilla() {
  
  this.obtenerDetalles();
  this.obtenerInformacionPlanilla().then(() => {
    this.obtenerComparacionPlanillas();
    this.obtenerResumenPlanilla(); 
  }).catch((error) => {
    
  });
}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

    verificarRolUsuario() {
    // Usar los métodos helper del SessionService
    this.esAdministrador = this.sessionService.esAdministrador();
    this.rolUsuario = this.sessionService.getRolActual();
    this.tipoEmpresa = this.sessionService.getTipoEmpresa();
    
    const empresaInfo = this.sessionService.getEmpresaInfo();
    if (empresaInfo) {
      this.nombreEmpresa = empresaInfo.nombre || '';
    }
    

  }



  // Función para seleccionar el archivo
  seleccionarArchivo(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.archivoSeleccionado = file;
      // Simula una carga completa
      this.progreso = 100;
    }
  }

  // Función para cerrar el modal
  cerrarModalImportar() {
    this.mostrarModalImportar = false;
    this.archivoSeleccionado = null;
    this.progreso = 0;
  }

  // Función para importar la planilla
  importarNuevaPlanilla() {
    if (!this.archivoSeleccionado) {
      Swal.fire({
        icon: 'warning',
        title: 'Seleccione un archivo',
        text: 'Debe seleccionar un archivo antes de importar.',
      });
      return;
    }

    this.isLoading = true;
    this.loadingProgress = 0;
    this.loadingMessage = 'Iniciando importación...';
    this.mostrarModalImportar = false;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.loadingProgress = 20;
      this.loadingMessage = 'Leyendo archivo...';

      const binaryString = e.target.result;
      const workbook = XLSX.read(binaryString, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      this.loadingProgress = 40;
      this.loadingMessage = 'Procesando datos...';

      const headers = data[0] as string[];
      let trabajadores = data.slice(1).map((row: any) => {
        let rowData: any = {};
        headers.forEach((header: string, index: number) => {
          rowData[header] = row[index];
        });
        return rowData;
      });

      // 🔥 Filtrar filas vacías
      trabajadores = trabajadores.filter((row) =>
        Object.values(row).some(
          (value) => value !== undefined && value !== null && value !== ''
        )
      );

      this.loadingProgress = 60;
      this.loadingMessage = 'Enviando datos al servidor...';

      // Enviar los datos al backend
      this.planillasService
        .actualizarDetallesPlanilla(this.idPlanilla, trabajadores)
        .subscribe({
          next: () => {
            this.loadingProgress = 100;
            this.loadingMessage = '¡Completado!';
            setTimeout(() => {
              this.isLoading = false;
              Swal.fire({
                icon: 'success',
                title: 'Planilla actualizada',
                text: 'Los detalles han sido actualizados correctamente.',
              });
              this.cerrarModalImportar();
              this.obtenerDetalles();
              this.obtenerResumenPlanilla();
              this.obtenerComparacionPlanillas();
              this.obtenerInformacionPlanilla();
            }, 500);
          },
          error: (err) => {
            this.isLoading = false;
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Hubo un problema al actualizar los detalles.',
            });
          },
        });
    };

    reader.onerror = () => {
      this.isLoading = false;
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo leer el archivo seleccionado.',
      });
    };

    reader.readAsBinaryString(this.archivoSeleccionado);
  }

  obtenerInformacionPlanilla(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.planillasService.getPlanillaId(this.idPlanilla).subscribe({
        next: (data) => {
          this.planillaInfo = data;
          if (this.planillaInfo.planilla && this.planillaInfo.planilla.fecha_planilla) {
            const fecha = new Date(this.planillaInfo.planilla.fecha_planilla);
            const meses = [
              'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
              'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
            ];
            this.planillaInfo.planilla.mes = meses[fecha.getUTCMonth()];
            this.planillaInfo.planilla.gestion = fecha.getUTCFullYear();
          }
          
          resolve(); 
        },
        error: (err) => {
        
          reject(err);
        }
      });
    });
  }


  /* OBTENER TODOS LOS DETALLES SIN PAGINACION **********************************************************************************/

  obtenerTodosDetalles() {
    this.loading = true;
    this.planillasService
      .getPlanillaDetalle(this.idPlanilla, 1, -1, this.busqueda) // 
      .subscribe({
        next: (data) => {
          this.trabajadores = data.trabajadores || [];
          this.total = data.total || 0;
          this.loading = false;
        },
        error: (err) => {
          
          this.loading = false;
        },
      });
  }

  /* OBTENER DETALLES BUSQUEDA Y PAGINACION *************************************************************************************************** */

  
  obtenerDetalles() {
    this.loading = true;
    this.planillasService
      .getPlanillaDetalle(
        this.idPlanilla,
        this.pagina,
        this.limite,
        this.busqueda
      )
      .subscribe({
        next: (data) => {
          this.trabajadores = data.trabajadores || [];
          this.total = data.total || 0;
          
          // Capturar el conteo de estados del backend
          if (data.conteo_estados_asegurados) {
            this.conteoEstadosAsegurados = data.conteo_estados_asegurados;
          }
          
          this.loading = false;

        },
        error: (err) => {
          
          this.loading = false;
        },
      });
  }

  onPageChange(event: any) {
    this.pagina = Math.floor(event.first / event.rows) + 1;
    this.limite = event.rows;
    this.obtenerDetalles();
  }

  buscar(value: string): void {
    this.busqueda = value.trim();
    this.pagina = 1; 
    this.obtenerDetalles();
  }

  recargar() {
    this.busqueda = ''; 
    this.pagina = 1; 
    
    this.obtenerDetalles(); 
  }

/************************************************************************************************************************************************ */
/* colores de estado *********************************************************************************************************************** */
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
/**********************************************************************************************************************************************/ 
/* BAJAS Y ALTAS ******************************************************************************************************************************/


obtenerMesAnterior(fechaActual: string): { mesAnterior: string, gestion: string } | null {
  const [year, month] = fechaActual.split('T')[0].split('-'); 
  const añoActual = parseInt(year); 
  const mesActual = parseInt(month) - 1; 

  let añoAnterior = añoActual;
  let mesAnterior = mesActual - 1; 

  if (mesAnterior < 0) {
    mesAnterior = 11; 
    añoAnterior = añoActual - 1;
  }

  const mesAnteriorStr = String(mesAnterior + 1).padStart(2, '0'); 
  const gestionAnterior = añoAnterior.toString();

  

  return { mesAnterior: mesAnteriorStr, gestion: gestionAnterior };
}


obtenerComparacionPlanillas() {
  if (!this.planillaInfo.planilla) return;

  const { cod_patronal, fecha_planilla } = this.planillaInfo.planilla;
  

  // Extraer gestión y mes actual directamente de fecha_planilla
  const [year, month] = fecha_planilla.split('T')[0].split('-'); 
  const gestion = year; 
  const mesActual = month; 

  // Calcular mes anterior
  const mesAnteriorData = this.obtenerMesAnterior(fecha_planilla);

  if (!mesAnteriorData) {
    
    return;
  }

  const { mesAnterior } = mesAnteriorData;


  this.planillasService.compararPlanillas(cod_patronal, gestion, mesAnterior, mesActual).subscribe({
    next: (data) => {
      
      this.altas = data.altas;
      this.bajasNoEncontradas = data.bajas.noEncontradas; // Bajas por trabajador no encontrado
      this.bajasPorRetiro = data.bajas.porRetiro; // Bajas por fecha de retiro
    },
    error: (err) => {
      
    }
  });
}





/*************************************************************************************************************************************************/
  editarTrabajador(trabajador: any) {
    this.trabajadorSeleccionado = { ...trabajador };
    this.displayModal = true;
  }

  guardarEdicion() {
    const index = this.trabajadores.findIndex(
      (t) => t.nro === this.trabajadorSeleccionado.nro
    );
    if (index !== -1) {
      this.trabajadores[index] = { ...this.trabajadorSeleccionado };
    }
    this.displayModal = false;
    
    this.obtenerResumenPlanilla();
    this.obtenerComparacionPlanillas();
  }

  declararPlanillaBorrador() {
  Swal.fire({
    title: '¿Declarar la Planilla?',
    text: 'Esta acción enviará la planilla a revisión.',
    icon: 'question',
    html: `
      <input 
        type="date" 
        id="fechaDeclaracion" 
        class="swal2-input"
        placeholder="Seleccione fecha (opcional)">
    `,
    showCancelButton: true,
    confirmButtonText: 'Sí, declarar',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      const fechaDeclaracion = (document.getElementById('fechaDeclaracion') as HTMLInputElement).value;
      return { fechaDeclaracion: fechaDeclaracion ? fechaDeclaracion : null };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      let fechaDeclaracion = result.value?.fechaDeclaracion;
      if (fechaDeclaracion) {
        // Normalizar a formato YYYY-MM-DD sin hora
        fechaDeclaracion = new Date(fechaDeclaracion).toISOString().split('T')[0];
      }

      // 🔧 OBTENER DATOS DEL USUARIO DE LA SESIÓN
      const sessionData = this.sessionService.sessionDataSubject.value;
      const usuarioProcesador = sessionData?.usuario || 'EMPRESA';
      const nombreProcesador = sessionData?.persona 
        ? `${sessionData.persona.nombres || ''} ${sessionData.persona.primerApellido || ''} ${sessionData.persona.segundoApellido || ''}`.trim()
        : 'Usuario Empresa';

      // 🔧 PAYLOAD CON DATOS DEL USUARIO
      const payload = {
        fecha_declarada: fechaDeclaracion,
        usuario_procesador: usuarioProcesador,
        nom_usuario: nombreProcesador
      };

      
      
      this.planillasService
        .actualizarEstadoAPendiente(this.idPlanilla, payload)
        .subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Planilla enviada',
              text: 'La planilla ha sido declarada como borrador.',
            });
            this.router.navigate(['cotizaciones/planillas-aportes']);
          },
          error: (err) => {
            
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo declarar la planilla.',
            });
          },
        });
    }
  });
}

actualizarFecha() {
    if (this.nuevoMes && this.nuevoAnio) {
      this.nuevaFechaPlanilla = `${this.nuevoAnio}-${this.nuevoMes.padStart(2, '0')}-01`;
    } else {
      this.nuevaFechaPlanilla = null; // Si no se selecciona mes o año, no se envía nueva fecha
    }
  }

  guardarYEnviar() {
  Swal.fire({
    title: '¿Confirmar envío?',
    text: '¿Estás seguro de que deseas enviar la planilla corregida?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, enviar',
    cancelButtonText: 'Cancelar',
  }).then((result) => {
    if (result.isConfirmed) {
      // Obtener todos los registros antes de enviar
      this.obtenerTodosDetalles();
      setTimeout(() => { // Esperar a que los datos se carguen
        for (let trabajador of this.trabajadores) {
          if (!trabajador.ci) {
            Swal.fire({
              icon: 'warning',
              title: 'Campos Vacíos',
              text: 'Hay trabajadores con campos vacíos. Verifica antes de enviar.',
              confirmButtonText: 'Ok',
            });
            return;
          }
          if (trabajador.salario <= 0) {
            Swal.fire({
              icon: 'error',
              title: 'Salario Inválido',
              text: `El salario de ${trabajador.nombres} debe ser mayor a 0.`,
              confirmButtonText: 'Ok',
            });
            return;
          }
        }

        // 🔧 OBTENER DATOS DEL USUARIO DE LA SESIÓN
        const sessionData = this.sessionService.sessionDataSubject.value;
        const usuarioProcesador = sessionData?.usuario || 'EMPRESA';
        const nombreProcesador = sessionData?.persona 
          ? `${sessionData.persona.nombres || ''} ${sessionData.persona.primerApellido || ''} ${sessionData.persona.segundoApellido || ''}`.trim()
          : 'Usuario Empresa';

        const datosEnviar: any = {
          trabajadores: this.trabajadores,
          usuario_procesador: usuarioProcesador, 
          nom_usuario: nombreProcesador           
        };

        if (this.nuevaFechaPlanilla) {
          datosEnviar.fecha_planilla = this.nuevaFechaPlanilla;
        }

        

        this.planillasService
          .enviarCorreccionPlanilla(this.idPlanilla, datosEnviar)
          .subscribe({
            next: (response) => {
              Swal.fire({
                icon: 'success',
                title: 'Planilla enviada',
                text: 'La planilla corregida se ha enviado con éxito.',
                confirmButtonText: 'Ok',
              });
              this.router.navigate(['cotizaciones/planillas-aportes']);
            },
            error: (err) => {
              
              Swal.fire({
                icon: 'error',
                title: 'Error al enviar',
                text: err.error.message || 'Hubo un problema al enviar la planilla.',
                confirmButtonText: 'Ok',
              });
            },
          });
      }, 500); // Ajusta el tiempo según la velocidad de tu API
    }
  });
}

  exportarExcel() {
    if (!this.trabajadores || this.trabajadores.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No hay datos',
        text: 'No hay trabajadores en la planilla para exportar.',
        confirmButtonText: 'Ok',
      });
      return;
    }

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.trabajadores);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Planilla');
    const excelBuffer: any = XLSX.write(wb, {
      bookType: 'xlsx',
      type: 'array',
    });
    const data: Blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(data, `Planilla_${this.idPlanilla}.xlsx`);

    Swal.fire({
      icon: 'success',
      title: 'Exportación Exitosa',
      text: 'La planilla ha sido exportada a Excel.',
      confirmButtonText: 'Ok',
    });
  }

  // eliminar detalles de la planilla --------------------------------------------------------------------------------------

  confirmarEliminacionDetalles() {
    Swal.fire({
      title: '¿Eliminar los detalles de la planilla?',
      text: 'Esta acción no se puede deshacer. ¿Desea continuar?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.eliminarDetallesPlanilla();
        
      }
    });
  }

  eliminarDetallesPlanilla() {
    this.planillasService.eliminarDetallesPlanilla(this.idPlanilla).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Detalles eliminados',
          text: 'Los detalles de la planilla han sido eliminados correctamente.',
        }).then((result) => {
          if (result.isConfirmed) {
            
            window.location.reload();
          }
        });
        this.trabajadores = []; 
        this.loading = false; 
      },
      error: (err) => {
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un problema al eliminar los detalles.',
        });
        this.loading = false; 
      },
    });
  }

  declararPlanilla() {
    Swal.fire({
      title: '¿Declarar la planilla nuevamente?',
      text: 'Esto enviará la planilla para revisión.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, declarar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.planillasService
          .actualizarEstadoPlanilla(this.idPlanilla, 1)
          .subscribe({
            next: () => {
              Swal.fire({
                icon: 'success',
                title: 'Planilla enviada',
                text: 'La planilla ha sido declarada nuevamente.',
              });
              this.obtenerDetalles();
            },
            error: (err) => {
              
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo declarar la planilla.',
              });
            },
          });
      }
    });
  }

  // reporte de resumen de planilla declara -------------------------------------------------------------------------------------------

  exportarPdfrResumen() {
    if (!this.idPlanilla) {
      Swal.fire({
        icon: 'warning',
        title: 'No hay datos',
        text: 'No se ha cargado el ID de la planilla.',
        confirmButtonText: 'Ok',
      });
      return;
    }

    this.planillasService.generarReporteResumen(this.idPlanilla).subscribe({
      next: (data: Blob) => {
        const fileURL = URL.createObjectURL(data);
        const ventanaEmergente = window.open(
          '',
          'VistaPreviaPDF',
          'width=900,height=600,scrollbars=no,resizable=no'
        );

        if (ventanaEmergente) {
          ventanaEmergente.document.write(`
              <html>
                <head>
                  <title>Vista Previa del PDF</title>
                  <style>
                    body { margin: 0; text-align: center; }
                    iframe { width: 100%; height: 100vh; border: none; }
                  </style>
                </head>
                <body>
                  <iframe src="${fileURL}"></iframe>
                </body>
              </html>
            `);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo abrir la vista previa del PDF. Es posible que el navegador haya bloqueado la ventana emergente.',
            confirmButtonText: 'Ok',
          });
        }
      },
      error: (err) => {
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo generar el reporte resumen.',
          confirmButtonText: 'Ok',
        });
      },
    });
  }

  ReporteDS08() {
    if (!this.idPlanilla) {
      Swal.fire({
        icon: 'warning',
        title: 'No hay datos',
        text: 'No se ha cargado el ID de la planilla.',
        confirmButtonText: 'Ok',
      });
      return;
    }

    this.planillasService.generarReporteDS08(this.idPlanilla).subscribe({
      next: (data: Blob) => {
        const fileURL = URL.createObjectURL(data);
        const ventanaEmergente = window.open(
          '',
          'VistaPreviaPDF',
          'width=900,height=600,scrollbars=no,resizable=no'
        );

        if (ventanaEmergente) {
          ventanaEmergente.document.write(`
              <html>
                <head>
                  <title>Vista Previa del PDF</title>
                  <style>
                    body { margin: 0; text-align: center; }
                    iframe { width: 100%; height: 100vh; border: none; }
                  </style>
                </head>
                <body>
                  <iframe src="${fileURL}"></iframe>
                </body>
              </html>
            `);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo abrir la vista previa del PDF. Es posible que el navegador haya bloqueado la ventana emergente.',
            confirmButtonText: 'Ok',
          });
        }
      },
      error: (err) => {
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo generar el reporte resumen.',
          confirmButtonText: 'Ok',
        });
      },
    });
  }

  ReporteAporte() {
    if (!this.idPlanilla) {
      Swal.fire({
        icon: 'warning',
        title: 'No hay datos',
        text: 'No se ha cargado el ID de la planilla.',
        confirmButtonText: 'Ok',
      });
      return;
    }

    this.planillasService.generarReporteAporte(this.idPlanilla).subscribe({
      next: (data: Blob) => {
        const fileURL = URL.createObjectURL(data);
        const ventanaEmergente = window.open(
          '',
          'VistaPreviaPDF',
          'width=900,height=600,scrollbars=no,resizable=no'
        );

        if (ventanaEmergente) {
          ventanaEmergente.document.write(`
              <html>
                <head>
                  <title>Vista Previa del PDF</title>
                  <style>
                    body { margin: 0; text-align: center; }
                    iframe { width: 100%; height: 100vh; border: none; }
                  </style>
                </head>
                <body>
                  <iframe src="${fileURL}"></iframe>
                </body>
              </html>
            `);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo abrir la vista previa del PDF. Es posible que el navegador haya bloqueado la ventana emergente.',
            confirmButtonText: 'Ok',
          });
        }
      },
      error: (err) => {
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo generar el reporte resumen.',
          confirmButtonText: 'Ok',
        });
      },
    });
  }

  ReportePlanilla() {
    if (!this.idPlanilla) {
      Swal.fire({
        icon: 'warning',
        title: 'No hay datos',
        text: 'No se ha cargado el ID de la planilla.',
        confirmButtonText: 'Ok',
      });
      return;
    }

    this.planillasService.generarReportePlanillaSalarios(this.idPlanilla).subscribe({
      next: (data: Blob) => {
        // Crear un enlace temporal para descargar el archivo Excel
        const fileURL = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = fileURL;
        a.download = `Reporte_Detalles_Planilla_${this.idPlanilla}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        a.click();
        URL.revokeObjectURL(fileURL);

        // Opcional: Mostrar notificación de éxito
        Swal.fire({
          icon: 'success',
          title: 'Reporte generado',
          text: 'El reporte en Excel se ha descargado correctamente.',
          confirmButtonText: 'Ok',
        });
      },
      error: (err) => {
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo generar el reporte de la planilla.',
          confirmButtonText: 'Ok',
        });
      },
    });
  }

  // resumen por regionales ----------------------------------------------------------------------------------------------------

  obtenerResumenPlanilla() {
    this.resumenLoading = true;
    this.planillasService.obtenerDatosPlanillaPorRegional(this.idPlanilla).subscribe({
      next: (response) => {
        if (response.success) {
          this.resumenData = response.data;
          
        } else {
          Swal.fire({
            icon: 'warning',
            title: 'Advertencia',
            text: 'No se pudieron obtener los datos del resumen.',
          });
        }
        this.resumenLoading = false;
      }
      });
    }

  parseNumber(value: string): number {
    return parseFloat(value.replace(/,/g, ''));
  }


// REEMPLAZAR tu función verificarAfiliaciones() con esta versión:

verificarAfiliaciones() {
  Swal.fire({
    title: '¿Verificación con Afiliaciones?',
    html: `
      <ul style="text-align: left; margin: 10px 0;">
        <li>Verificará todos los trabajadores de la planilla</li>
        <li>Detectará trabajadores faltantes en la planilla</li>
      </ul>
      <p><small>Este proceso puede tomar varios minutos.</small></p>
    `,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sí, verificar',
    cancelButtonText: 'Cancelar',
    width: '500px'
  }).then((result) => {
    if (result.isConfirmed) {
      this.loading = true;
      const inicioTiempo = Date.now();
      
      this.planillasService.verificarAfiliacionDetalles(this.idPlanilla).subscribe({
        next: (response) => {
          this.loading = false;
          const tiempoTranscurrido = Math.round((Date.now() - inicioTiempo) / 1000);
          
          // Guardar datos del análisis completo
          this.casosAnalisis = response.casos;
          this.resumenCompleto = response.resumen;
          this.estadisticasCompletas = response.estadisticas;
          this.trabajadoresFaltantes = response.casos.faltantes || [];
          this.fechaUltimaVerificacion = response.fecha_verificacion;
          // Mostrar resultado
          this.mostrarResultadoVerificacionCompleta(response, tiempoTranscurrido);
          
          // Recargar detalles
          this.obtenerDetalles();
        },
        error: (err) => {
          this.loading = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `No se pudo verificar las afiliaciones: ${err.error.message || 'Error desconocido'}`,
            confirmButtonText: 'Ok'
          });
        }
      });
    }
  });
}

// AGREGAR estas nuevas funciones después de verificarAfiliaciones():

mostrarResultadoVerificacionCompleta(response: any, tiempoSegundos: number) {
  const resumen = response.resumen;
  const tiempoFormateado = this.formatearTiempo(tiempoSegundos);
  
  Swal.fire({
    icon: 'success',
    title: 'Análisis Completo Finalizado',
    html: `
      <div style="text-align: left;">
        <p><strong>${response.mensaje}</strong></p>
        <hr>
        
        <h6>Resumen de ${resumen.total_planilla} trabajadores:</h6>
        <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
          <tr style="background-color: #d4edda;">
            <td style="padding: 8px; border: 1px solid #ccc; text-align: center; font-weight: bold;">Vigentes</td>
            <td style="padding: 8px; border: 1px solid #ccc; text-align: center; font-size: 18px;">${resumen.vigentes}</td>
          </tr>
          <tr style="background-color: #fff3cd;">
            <td style="padding: 8px; border: 1px solid #ccc; text-align: center; font-weight: bold;">No Vigentes</td>
            <td style="padding: 8px; border: 1px solid #ccc; text-align: center; font-size: 18px;">${resumen.no_vigentes}</td>
          </tr>
          <tr style="background-color: #f8d7da;">
            <td style="padding: 8px; border: 1px solid #ccc; text-align: center; font-weight: bold;">No Encontrados</td>
            <td style="padding: 8px; border: 1px solid #ccc; text-align: center; font-size: 18px;">${resumen.no_encontrados}</td>
          </tr>
          <tr style="background-color: #cce5ff;">
            <td style="padding: 8px; border: 1px solid #ccc; text-align: center; font-weight: bold;">Faltantes</td>
            <td style="padding: 8px; border: 1px solid #ccc; text-align: center; font-size: 18px;">${resumen.faltantes}</td>
          </tr>
        </table>
        
        
        <hr>
        <p><small><strong>Tiempo transcurrido:</strong> ${tiempoFormateado}</small></p>
      </div>
    `,
    width: '600px',
    confirmButtonText: 'Ver Detalles',
    showDenyButton: true,
    denyButtonText: 'Cerrar',
    denyButtonColor: '#6c757d'
  }).then((result) => {
    if (result.isConfirmed) {
      this.mostrarAnalisisCompletoDialog = true;
    }
  });
}

formatearTiempo(segundos: number): string {
  if (segundos < 60) {
    return `${segundos} segundos`;
  } else if (segundos < 3600) {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos}m ${segs}s`;
  } else {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    return `${horas}h ${minutos}m`;
  }
}

verTrabajadoresFaltantes() {
  if (!this.casosAnalisis || !this.resumenCompleto) {
    Swal.fire({
      icon: 'info',
      title: 'Sin análisis',
      text: 'Primero debe ejecutar la verificación de afiliaciones.',
      confirmButtonText: 'Ok'
    });
    return;
  }
  
  this.mostrarAnalisisCompletoDialog = true;
}

exportarTrabajadoresFaltantes() {
  if (!this.casosAnalisis || !this.resumenCompleto) {
    Swal.fire({
      icon: 'info',
      title: 'Sin datos',
      text: 'No hay datos de análisis para exportar.',
      confirmButtonText: 'Ok'
    });
    return;
  }

  // Crear datos para exportar
  const datosExportacion = [];
  
  // Resumen
  datosExportacion.push(['RESUMEN GENERAL']);
  datosExportacion.push(['Total Trabajadores', this.resumenCompleto.total_planilla]);
  datosExportacion.push(['Vigentes', this.resumenCompleto.vigentes]);
  datosExportacion.push(['No Vigentes', this.resumenCompleto.no_vigentes]);
  datosExportacion.push(['No Encontrados', this.resumenCompleto.no_encontrados]);
  datosExportacion.push(['Faltantes', this.resumenCompleto.faltantes]);
  datosExportacion.push(['']);

  // Caso 1: Vigentes
  if (this.casosAnalisis.vigentes?.length > 0) {
    datosExportacion.push(['TRABAJADORES VIGENTES']);
    datosExportacion.push(['CI', 'Nombres', 'Apellido Paterno', 'Apellido Materno', 'Cargo', 'Matrícula', 'Estado', 'Salario']);
    this.casosAnalisis.vigentes.forEach((t: any) => {
      datosExportacion.push([t.ci, t.nombres, t.apellido_paterno, t.apellido_materno, t.cargo, t.matricula, t.estado, t.salario]);
    });
    datosExportacion.push(['']);
  }

  // Caso 2: No Vigentes
  if (this.casosAnalisis.no_vigentes?.length > 0) {
    datosExportacion.push(['TRABAJADORES NO VIGENTES']);
    datosExportacion.push(['CI', 'Nombres', 'Apellido Paterno', 'Apellido Materno', 'Cargo', 'Estado', 'Motivo', 'Salario']);
    this.casosAnalisis.no_vigentes.forEach((t: any) => {
      datosExportacion.push([t.ci, t.nombres, t.apellido_paterno, t.apellido_materno, t.cargo, t.estado, t.motivo, t.salario]);
    });
    datosExportacion.push(['']);
  }

  // Caso 3: No Encontrados
  if (this.casosAnalisis.no_encontrados?.length > 0) {
    datosExportacion.push(['TRABAJADORES NO ENCONTRADOS']);
    datosExportacion.push(['CI', 'Nombres', 'Apellido Paterno', 'Apellido Materno', 'Cargo', 'Fecha Ingreso', 'Motivo', 'Salario']);
    this.casosAnalisis.no_encontrados.forEach((t: any) => {
      datosExportacion.push([t.ci, t.nombres, t.apellido_paterno, t.apellido_materno, t.cargo, t.fecha_ingreso, t.motivo, t.salario]);
    });
    datosExportacion.push(['']);
  }

  // Caso 4: Faltantes
  if (this.casosAnalisis.faltantes?.length > 0) {
    datosExportacion.push(['TRABAJADORES FALTANTES EN PLANILLA']);
    datosExportacion.push(['CI', 'Nombres', 'Apellido Paterno', 'Apellido Materno', 'Cargo', 'Matrícula', 'Estado', 'Haber']);
    this.casosAnalisis.faltantes.forEach((t: any) => {
      datosExportacion.push([t.ci, t.nombres, t.apellido_paterno, t.apellido_materno, t.cargo, t.matricula, t.estado, t.haber]);
    });
  }

  // Crear CSV
  const csvContent = datosExportacion.map(row => 
    row.map(cell => `"${cell || ''}"`).join(',')
  ).join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `analisis_completo_planilla_${this.idPlanilla}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  Swal.fire({
    icon: 'success',
    title: 'Archivo descargado',
    text: `Se descargó un archivo CSV con el análisis completo de ${this.resumenCompleto.total_planilla} trabajadores.`,
    confirmButtonText: 'Ok'
  });
}

// Función para obtener la clase CSS según el estado de afiliación
/* getClaseEstadoAfiliacion(estadoAfiliacion: string): string {
  if (!estadoAfiliacion) {
    return 'fila-estado-sin-estado';
  }

  const estado = estadoAfiliacion.trim().toUpperCase();
  
  switch (estado) {
    case 'VIGENTE':
      return 'fila-estado-vigente';
    case 'BAJA':
      return 'fila-estado-baja';
    case 'FALLECIDO':
      return 'fila-estado-fallecido';
    case 'CESANTIA':
    case 'CESANTÍA':
      return 'fila-estado-cesantia';
    case 'DER HABIENTE':
    case 'DERHABIENTE':
    case 'DER_HABIENTE':
      return 'fila-estado-der-habiente';
    default:
      return 'fila-estado-sin-estado';
  }
} */

// Función para obtener totales por estado de afiliación desde el backend
obtenerTotalesEstadosAfiliacion() {
  return {
    vigentes: this.conteoEstadosAsegurados?.VIGENTE || 0,
    bajas: this.conteoEstadosAsegurados?.BAJA || 0,
    fallecidos: this.conteoEstadosAsegurados?.FALLECIDO || 0,
    cesantias: this.conteoEstadosAsegurados?.CESANTIA || 0,
    derHabientes: this.conteoEstadosAsegurados?.['DER HABIENTE'] || 0,
    sinEstado: 0 // Esto se puede calcular si el backend no lo incluye
  };
}





}