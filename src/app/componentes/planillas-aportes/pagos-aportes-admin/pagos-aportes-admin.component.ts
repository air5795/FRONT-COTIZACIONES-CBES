import { Component, OnInit, ViewChild } from '@angular/core';
import { Table } from 'primeng/table';
import { PlanillasAportesService } from '../../../servicios/planillas-aportes/planillas-aportes.service';
import { PagoAporte } from '../../../models/pago-aporte.model';
import Swal from 'sweetalert2';
import { SessionService } from '../../../servicios/auth/session.service';

@Component({
  selector: 'app-pagos-aportes-admin',
  templateUrl: './pagos-aportes-admin.component.html',
  styleUrls: ['./pagos-aportes-admin.component.css']
})
export class PagosAportesAdminComponent implements OnInit {
  @ViewChild('tablaPlanillasAportes') tablaPlanillasAportes!: Table;

  pagos: PagoAporte[] = [];
  loading: boolean = true;

  displayDialog: boolean = false;
  displayImageDialog: boolean = false;
  selectedImageUrl: string = '';
  isPdfLoaded: boolean = true;

  // Propiedades para el modal del reporte de historial
  displayHistorialDialog: boolean = false;
  mes: number | null = null;
  gestion: number | null = null;
  meses: { label: string, value: number }[] = [
    { label: 'Enero', value: 1 },
    { label: 'Febrero', value: 2 },
    { label: 'Marzo', value: 3 },
    { label: 'Abril', value: 4 },
    { label: 'Mayo', value: 5 },
    { label: 'Junio', value: 6 },
    { label: 'Julio', value: 7 },
    { label: 'Agosto', value: 8 },
    { label: 'Septiembre', value: 9 },
    { label: 'Octubre', value: 10 },
    { label: 'Noviembre', value: 11 },
    { label: 'Diciembre', value: 12 }
  ];
  gestiones: number[] = [];

  // Nuevas propiedades para el diálogo de observaciones
  displayObservacionesDialog: boolean = false;
  selectedPago: PagoAporte | null = null;
  nuevaObservacion: string = '';

  // Propiedades para el loading del recibo
  showLoadingRecibo: boolean = false;
  loadingProgress: number = 0;
  loadingMessage: string = 'Generando recibo...';

  // Propiedad para controlar permisos
  puedeEditarYDescargar: boolean = false;

  constructor(private planillasAportesService: PlanillasAportesService, private sessionService: SessionService) {}

  verificarPermisos(): void {
    const rolUsuario = this.sessionService.getRolActual();
    this.puedeEditarYDescargar = rolUsuario === 'ADMIN_TESORERIA_DESARROLLO' || rolUsuario === 'ADMIN_TESORERIA';
  }

  ngOnInit(): void {
    this.verificarPermisos();
    this.cargarPagos();
    this.cargarGestiones();
  }

  cargarPagos(): void {
    this.loading = true;
    this.planillasAportesService.findAllWithDetails().subscribe({
      next: (response) => {
        this.pagos = response.pagos.map((pago: PagoAporte) => ({
          ...pago,
          mes: pago.fecha_planilla !== 'No disponible'
            ? new Date(pago.fecha_planilla).toLocaleString('es', { month: 'long' })
            : 'N/A',
          gestion: pago.fecha_planilla !== 'No disponible'
            ? new Date(pago.fecha_planilla).getFullYear().toString()
            : 'N/A',
        }));
        console.log('Pagos cargados:', this.pagos);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar los pagos:', error);
        this.loading = false;
      }
    });
  }

  cargarGestiones(): void {
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 10; year <= currentYear + 5; year++) {
      this.gestiones.push(year);
    }
  }

  onGlobalFilter(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.tablaPlanillasAportes.filterGlobal(inputElement.value, 'contains');
  }

  openImageDialog(pago: PagoAporte): void {
    this.selectedImageUrl = `http://10.0.0.152:4001/${pago.foto_comprobante}`;
    this.isPdfLoaded = true;
    this.displayImageDialog = true;
  }

  onIframeError(event: Event): void {
    console.error('Error al cargar el PDF:', event);
    this.isPdfLoaded = false;
  }

  Recibo(idPlanilla: number): void {
    if (!idPlanilla) {
      Swal.fire({
        icon: 'warning',
        title: 'No hay datos',
        text: 'No se ha proporcionado el ID de la planilla.',
        confirmButtonText: 'Ok',
      });
      return;
    }

    // Mostrar loading
    this.showLoadingRecibo = true;
    this.loadingProgress = 0;
    this.loadingMessage = 'Preparando recibo...';

    // Simular progreso
    const progressInterval = setInterval(() => {
      if (this.loadingProgress < 90) {
        this.loadingProgress += 10;
        if (this.loadingProgress <= 30) {
          this.loadingMessage = 'Conectando con el servidor...';
        } else if (this.loadingProgress <= 60) {
          this.loadingMessage = 'Generando documento...';
        } else if (this.loadingProgress <= 90) {
          this.loadingMessage = 'Preparando vista previa...';
        }
      }
    }, 200);

    this.planillasAportesService.generarReportePagoAporte(idPlanilla).subscribe({
      next: (data: Blob) => {
        // Completar progreso
        clearInterval(progressInterval);
        this.loadingProgress = 100;
        this.loadingMessage = 'Recibo generado exitosamente';

        // Esperar un momento para mostrar el 100% antes de cerrar
        setTimeout(() => {
          this.showLoadingRecibo = false;
          
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
                  <title>Vista Previa del Recibo</title>
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
        }, 500);
      },
      error: (err) => {
        // Ocultar loading y mostrar error
        clearInterval(progressInterval);
        this.showLoadingRecibo = false;
        
        console.error('Error al generar el recibo:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo generar el recibo.',
          confirmButtonText: 'Ok',
        });
      }
    });
  }

  // Mostrar el modal para el reporte de historial
  showHistorialDialog(): void {
    this.mes = null;
    this.gestion = null;
    this.displayHistorialDialog = true;
  }

  // Generar el reporte de historial
  generarReporteHistorial(): void {
    if (!this.mes || !this.gestion) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor, seleccione el mes y el año.',
        confirmButtonText: 'Ok',
      });
      return;
    }

    this.planillasAportesService.generarReporteHistorial(this.mes, this.gestion).subscribe({
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
                <title>Vista Previa del Reporte de Historial</title>
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
          this.displayHistorialDialog = false;
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
        console.error('Error al generar el reporte de historial:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo generar el reporte de historial.',
          confirmButtonText: 'Ok',
        });
      }
    });
  }

  // Método para abrir el diálogo de edición de observaciones
  editarObservaciones(pago: PagoAporte): void {
    this.selectedPago = pago;
    this.nuevaObservacion = pago.observaciones || '';
    this.displayObservacionesDialog = true;
  }

  // Método para guardar las observaciones editadas
  guardarObservaciones(): void {
    if (!this.selectedPago) {
      return;
    }

    if (!this.nuevaObservacion.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'Por favor, ingrese una observación.',
        confirmButtonText: 'Ok',
      });
      return;
    }

    this.planillasAportesService.updateObservacionesPago(
      this.selectedPago.id, 
      this.nuevaObservacion.trim(),
      'ADMIN' // Puedes obtener el usuario actual del token o servicio de auth
    ).subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Observaciones actualizadas correctamente.',
          confirmButtonText: 'Ok',
        });

        // Actualizar la observación en la lista local
        const index = this.pagos.findIndex(p => p.id === this.selectedPago!.id);
        if (index !== -1) {
          this.pagos[index].observaciones = this.nuevaObservacion.trim();
        }

        this.cerrarDialogObservaciones();
      },
      error: (error) => {
        console.error('Error al actualizar observaciones:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo actualizar las observaciones.',
          confirmButtonText: 'Ok',
        });
      }
    });
  }

  // Método para cerrar el diálogo
  cerrarDialogObservaciones(): void {
    this.displayObservacionesDialog = false;
    this.selectedPago = null;
    this.nuevaObservacion = '';
  }
}