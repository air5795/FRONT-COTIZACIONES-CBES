import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { MessageService } from 'primeng/api';
import { PlanillasAdicionalesService } from '../../../../servicios/planillas-aportes/planillas-adicionales.service';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { LazyLoadEvent } from 'primeng/api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-planillas-adicionales-detalles',
  templateUrl: './planillas-adicionales-detalles.component.html',
  styleUrls: ['./planillas-adicionales-detalles.component.css'],
  providers: [MessageService]
})
export class PlanillasAdicionalesDetallesComponent implements OnInit, OnChanges {
  @Input() idPlanillaAdicional: number | null = null;
  idPlanilla = this.idPlanillaAdicional;
  planillaInfo: any = { planilla: {} };
  resumenLoading = false;
  resumenData: any = null;

  trabajadores: any[] = [];
  total: number = 0;
  pagina: number = 1;
  limite: number = 10;
  busqueda: string = '';
  loading: boolean = true;

  displayModal = false;
  trabajadorSeleccionado: any = {};
  archivoSeleccionado: File | null = null;
  progreso: number = 100;
  mostrarModalImportar = false;
  mostrarModalImportacion = false;

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

  constructor(
    private planillasAdicionalesService: PlanillasAdicionalesService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('ngOnInit - idPlanillaAdicional:', this.idPlanillaAdicional);
    if (this.idPlanillaAdicional) {
      this.cargarTodo();
    } else {
      this.loading = false;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['idPlanillaAdicional'] && changes['idPlanillaAdicional'].currentValue !== changes['idPlanillaAdicional'].previousValue) {
      console.log('ngOnChanges - Nuevo idPlanillaAdicional:', this.idPlanillaAdicional);
      this.pagina = 1;
      this.busqueda = '';
      this.cargarTodo();
    }
      if (changes['idPlanillaAdicional']) {
        this.idPlanilla = changes['idPlanillaAdicional'].currentValue;
      }
    
  }

  // Método para cargar todo (detalles, info y resumen)
  cargarTodo() {
    if (!this.idPlanillaAdicional) {
      this.loading = false;
      return;
    }

    this.loading = true;
    this.cargarDetalles();
    this.obtenerInformacionPlanilla().then(() => {
      this.obtenerResumenPlanilla();
    }).catch((err) => {
      console.error('Error al cargar información inicial:', err);
      this.loading = false;
    });
  }

  cargarDetalles() {
    if (!this.idPlanillaAdicional) return;

    console.log('Cargando detalles para id:', this.idPlanillaAdicional, 'Página:', this.pagina, 'Límite:', this.limite, 'Búsqueda:', this.busqueda);
    this.loading = true;

    this.planillasAdicionalesService
      .obtenerDetallesAdicional(this.idPlanillaAdicional, this.pagina, this.limite, this.busqueda)
      .subscribe({
        next: (response) => {
          console.log('Respuesta de detalles:', response);
          this.trabajadores = response.trabajadores || [];
          this.total = response.total || 0;
          this.loading = false;
          if (!response.trabajadores.length) {
            this.messageService.add({ severity: 'info', summary: 'Sin datos', detail: response.mensaje || 'No hay detalles disponibles' });
          }
        },
        error: (error) => {
          console.error('Error al cargar detalles:', error);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.error || 'No se pudieron cargar los detalles' });
          this.trabajadores = [];
          this.total = 0;
          this.loading = false;
        }
      });
  }

  onPageChange(event: any) {
    this.pagina = Math.floor(event.first / event.rows) + 1;
    this.limite = event.rows;
    this.cargarDetalles();
  }

  buscar(value: string): void {
    this.busqueda = value.trim();
    this.pagina = 1;
    this.cargarDetalles();
  }

  recargar() {
    this.busqueda = '';
    this.pagina = 1;
    console.log('Búsqueda después de recargar:', this.busqueda);
    this.cargarTodo();
  }

  // Obtener información de la planilla
  obtenerInformacionPlanilla(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.idPlanillaAdicional) {
        resolve();
        return;
      }

      this.planillasAdicionalesService.getPlanillaIdAdicional(this.idPlanillaAdicional).subscribe({
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
          console.log('Información de la planilla:', this.planillaInfo);
          resolve();
        },
        error: (err) => {
          console.error('Error al obtener información de la planilla:', err);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la información de la planilla' });
          reject(err);
        }
      });
    });
  }

  // Obtener resumen por regionales
  obtenerResumenPlanilla() {
    if (!this.idPlanillaAdicional) return;

    this.resumenLoading = true;
    this.planillasAdicionalesService.obtenerDatosPlanillaADPorRegional(this.idPlanillaAdicional).subscribe({
      next: (response) => {
        if (response.success) {
          this.resumenData = response.data;
          console.log('Datos del resumen:', this.resumenData);
        } else {
          Swal.fire({
            icon: 'warning',
            title: 'Advertencia',
            text: 'No se pudieron obtener los datos del resumen.',
          });
        }
        this.resumenLoading = false;
      },
      error: (err) => {
        console.error('Error al obtener resumen:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al cargar el resumen de la planilla.',
        });
        this.resumenLoading = false;
      }
    });
  }

  // Colores de estado
  getColorEstado(estado: number): string {
    switch (estado) {
      case 3: return '#ff4545';
      case 0: return '#b769fb';
      case 2: return '#059b89';
      default: return '#558fbb';
    }
  }

  getFondoEstado(fondo: number): string {
    switch (fondo) {
      case 0: return '#ebe6ff';
      case 3: return '#ffdfdf';
      case 2: return '#edfff6';
      default: return '#e5edf9';
    }
  }

  /*editar ************************************************************************************************************************************************/
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
        didOpen: () => {
          // Aplicar estilo en línea al contenedor de SweetAlert
          const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
          if (swalContainer) {
            swalContainer.style.zIndex = '2000';
          }
        }
      }).then((result) => {
        if (result.isConfirmed) {
          this.eliminarDetallesPlanilla();
        }
      });
    }
  
    eliminarDetallesPlanilla() {
      this.planillasAdicionalesService.eliminarDetallesPlanillaAdicional(this.idPlanillaAdicional!).subscribe({
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
          console.error('Error al eliminar detalles:', err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Hubo un problema al eliminar los detalles.',
          });
          this.loading = false; 
        },
      });
    }

/* importar planilla adicional en borrador  ***************************************************************/ 

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

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const binaryString = e.target.result;
      const workbook = XLSX.read(binaryString, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

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

      // Enviar los datos al backend
      this.planillasAdicionalesService
        .actualizarDetallesPlanillaAdicional(this.idPlanillaAdicional!, trabajadores)
        .subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Planilla actualizada',
              text: 'Los detalles han sido actualizados correctamente.',
              didOpen: () => {
                // Aplicar estilo en línea al contenedor de SweetAlert
                const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
                if (swalContainer) {
                  swalContainer.style.zIndex = '2000';
                }
              }
            });
            this.cerrarModalImportar();
            this.cargarDetalles();
            this.obtenerResumenPlanilla();
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Hubo un problema al actualizar los detalles.',
            });
          },
        });
    };

    reader.readAsBinaryString(this.archivoSeleccionado);
  }

  declararPlanillaBorrador() {
      Swal.fire({
        title: '¿Declarar la Planilla de Aportes?',
        text: 'Esta acción enviará la planilla a revisión.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, declarar',
        cancelButtonText: 'Cancelar',
        didOpen: () => {
          // Aplicar estilo en línea al contenedor de SweetAlert
          const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
          if (swalContainer) {
            swalContainer.style.zIndex = '2000';
          }
        }
      }).then((result) => {
        if (result.isConfirmed) {
          this.planillasAdicionalesService
            .actualizarEstadoAPendiente(this.idPlanillaAdicional!)
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
                console.error('Error al actualizar estado:', err);
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
    
        this.planillasAdicionalesService.generarReporteAporteAdicional(this.idPlanilla).subscribe({
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
            console.error('Error al generar el reporte resumen:', err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo generar el reporte resumen.',
              confirmButtonText: 'Ok',
            });
          },
        });
      }


}