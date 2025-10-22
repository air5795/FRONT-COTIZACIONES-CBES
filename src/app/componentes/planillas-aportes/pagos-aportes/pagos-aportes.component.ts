import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { PlanillasAportesService } from '../../../servicios/planillas-aportes/planillas-aportes.service';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TableLazyLoadEvent } from 'primeng/table';
import { Dialog } from 'primeng/dialog';
import { PagoAporte } from '../../../models/pago-aporte.model';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'; 
import { StepperModule } from 'primeng/stepper'; // Agregar esta importación
import Swal from 'sweetalert2';
import { environment } from '../../../../environments/environment';



@Component({
  selector: 'app-pagos-aportes',
  templateUrl: './pagos-aportes.component.html',
  styleUrls: ['./pagos-aportes.component.css'],
  providers: [MessageService],
})
export class PagosAportesComponent implements OnInit {
  @Input() idPlanilla!: number;
  @ViewChild('createPagoDialog') createPagoDialog!: Dialog;
  @ViewChild('imageDialog') imageDialog!: Dialog;

  pagoForm: FormGroup;
  pagos: PagoAporte[] = [];
  totalRecords: number = 0;
  loading: boolean = false;
  limite: number = 10;
  selectedFile: File | null = null;
  displayDialog: boolean = false;
  displayImageDialog: boolean = false;
  selectedImageUrl: string = '';
  isPdfLoaded: boolean = true;
  calculoDetalles: any = null;
  calculating: boolean = false;
  activeStep: number = 0;
  previewUrl: SafeResourceUrl | null = null;
  isPdf: boolean = false;
  steps: MenuItem[] = [
    { label: 'Fecha de Pago' },
    { label: 'Detalles del Cálculo' },
    { label: 'Detalles del Pago' },
    { label: 'Confirmación' },
  ];
  metodoPagoOptions: any[] = [
    { label: 'SIGEP', value: 'SIGEP' },
    { label: 'DEPOSITO O TRANSFERENCIA', value: 'DEPOSITO O TRANSFERENCIA' },
  ];
  

constructor(
  private planillasAportesService: PlanillasAportesService,
  private fb: FormBuilder,
  private messageService: MessageService,
  private router: Router,
  private sanitizer: DomSanitizer
) {
  this.pagoForm = this.fb.group({
    id_planilla_aportes: ['', Validators.required],
    fecha_pago: ['', Validators.required],
    monto_pagado: ['', [
      Validators.required,
      Validators.min(0),
      // CORREGIR: Usar total_con_descuento en lugar de total_a_cancelar
      (control: AbstractControl) => {
        if (this.calculoDetalles && this.calculoDetalles.total_con_descuento !== undefined) {
          const montoPagado = Number(control.value) || 0;
          const totalConDescuento = Number(this.calculoDetalles.total_con_descuento) || 0;
          
          if (montoPagado < totalConDescuento) {
            return { montoInsuficiente: true };
          }
        }
        return null;
      }
    ]],
    monto_demasia: [0, [Validators.min(0)]], 
    total_a_cancelar: [0],
    metodo_pago: [''],
    comprobante_pago: [''],
    observaciones: [''],
  });
}

  ngOnInit(): void {
    if (this.idPlanilla) {
      this.pagoForm.patchValue({ id_planilla_aportes: this.idPlanilla });
      this.loadPagos({ first: 0, rows: this.limite } as TableLazyLoadEvent);
    }
  }

  // Cargar pagos con paginación lazy
  loadPagos(event: TableLazyLoadEvent): void {
    if (!this.idPlanilla) {
      console.error('No se proporcionó un idPlanilla válido');
      this.loading = false;
      return;
    }

    this.loading = true;
    const first = event.first || 0;
    const rows = event.rows || this.limite;

    this.planillasAportesService.findByIdPlanilla(this.idPlanilla).subscribe(
      (data) => {
        this.pagos = data.slice(first, first + rows);
        this.totalRecords = data.length;
        this.loading = false;
      },
      (error) => {
        console.error('Error al cargar pagos:', error);
        this.loading = false;
      }
    );
  }

  // Calcular el total a cancelar
calcularTotalACancelar(): void {
  const fechaPago = this.pagoForm.get('fecha_pago')?.value;
  console.log('Fecha seleccionada en el formulario:', fechaPago);

  if (!fechaPago) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Advertencia',
      detail: 'Por favor, selecciona una fecha de pago.',
    });
    return;
  }

  let fechaPagoDate: Date;
  if (fechaPago.length === 16) {
    fechaPagoDate = new Date(`${fechaPago}:00.000Z`);
  } else {
    fechaPagoDate = new Date(fechaPago);
  }

  if (isNaN(fechaPagoDate.getTime())) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Fecha de pago inválida.',
    });
    return;
  }

  const fechaPagoIso = fechaPagoDate.toISOString();
  this.calculating = true;
  
  this.planillasAportesService
    .calcularAportesPreliminar(this.idPlanilla, fechaPagoIso)
    .subscribe(
      (detalles) => {
        // Solicitar demasía del mes anterior
        this.planillasAportesService.obtenerDemasiaMesAnterior(this.idPlanilla).subscribe(
          (demasiaAnterior) => {
            detalles.total_a_cancelar = Math.round(detalles.total_a_cancelar * 100) / 100;
            detalles.demasia_mes_anterior = demasiaAnterior;
            detalles.total_con_descuento = Math.max(0, detalles.total_a_cancelar - demasiaAnterior);
            
            this.calculoDetalles = detalles;
            this.pagoForm.patchValue({ 
              monto_pagado: detalles.total_con_descuento,
              monto_demasia: 0,
              total_a_cancelar: detalles.total_a_cancelar
            });
            
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: `Cálculo realizado. ${demasiaAnterior > 0 ? `Demasía anterior aplicada: ${demasiaAnterior} BOB` : ''}`,
            });
            this.calculating = false;
            this.activeStep = 1;
          },
          (error) => {
            console.error('Error al obtener demasía anterior:', error);
            // Continuar sin demasía anterior
            detalles.demasia_mes_anterior = 0;
            detalles.total_con_descuento = detalles.total_a_cancelar;
            this.calculoDetalles = detalles;
            this.pagoForm.patchValue({ 
              monto_pagado: detalles.total_a_cancelar,
              monto_demasia: 0,
              total_a_cancelar: detalles.total_a_cancelar
            });
            this.calculating = false;
            this.activeStep = 1;
          }
        );
      },
      (error) => {
        console.error('Error al calcular el total a cancelar:', error);
        this.calculoDetalles = null;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo calcular el total a cancelar.',
        });
        this.calculating = false;
      }
    );
}

  // ✅ PASO 3.2: AGREGAR ESTE NUEVO MÉTODO después del método calcularTotalACancelar():

calcularDemasia(): void {
  const montoPagado = Number(this.pagoForm.get('monto_pagado')?.value) || 0;
  const totalConDescuento = Number(this.calculoDetalles?.total_con_descuento) || 0;
  
  console.log('Calculando demasía:', {
    montoPagado,
    totalConDescuento,
    diferencia: montoPagado - totalConDescuento
  });
  
  if (montoPagado > totalConDescuento) {
    const demasia = Math.round((montoPagado - totalConDescuento) * 100) / 100;
    this.pagoForm.patchValue({ monto_demasia: demasia });
    console.log('Demasía calculada:', demasia);
  } else {
    this.pagoForm.patchValue({ monto_demasia: 0 });
    console.log('Sin demasía');
  }
}

// TAMBIÉN AGREGAR este método para debugging:
onMontoChange(): void {
  console.log('Monto cambiado:', this.pagoForm.get('monto_pagado')?.value);
  this.calcularDemasia();
}

  // Crear un nuevo pago
onSubmit(): void {
  if (this.pagoForm.valid && this.selectedFile && this.calculoDetalles) {
    const pagoData = this.pagoForm.getRawValue();
    
    // Mostrar loading con z-index alto
    Swal.fire({
      title: 'Procesando Pago...',
      text: 'Por favor espere mientras se procesa el pago',
      allowOutsideClick: false,
      backdrop: true,
      // ✅ SOLUCIÓN: Configurar z-index más alto que PrimeNG
      customClass: {
        container: 'swal-high-zindex'
      },
      didOpen: () => {
        Swal.showLoading();
        // ✅ FORZAR z-index via JavaScript
        const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
        if (swalContainer) {
          swalContainer.style.zIndex = '9999';
        }
      }
    });

    this.planillasAportesService.createPago(pagoData, this.selectedFile).subscribe(
      (response) => {
        console.log('Pago creado:', response);
        
        // ✅ CERRAR EL DIALOG PRIMERO, LUEGO MOSTRAR SWEETALERT
        this.displayDialog = false;
        this.resetForm();
        
        // Pequeño delay para que se cierre el dialog
        setTimeout(() => {
          Swal.fire({
            icon: 'success',
            title: '¡Pago Registrado Exitosamente!',
            html: `
              <div style="text-align: left; margin: 20px 0;">
                <p><strong>📅 Fecha:</strong> ${new Date(pagoData.fecha_pago).toLocaleDateString('es-ES')}</p>
                <p><strong>💰 Monto Pagado:</strong> ${Number(pagoData.monto_pagado).toLocaleString('es-ES', {
                  style: 'currency',
                  currency: 'BOB',
                  minimumFractionDigits: 2
                })}</p>
                ${pagoData.monto_demasia > 0 ? 
                  `<p><strong>🎯 Demasía Generada:</strong> ${Number(pagoData.monto_demasia).toLocaleString('es-ES', {
                    style: 'currency',
                    currency: 'BOB',
                    minimumFractionDigits: 2
                  })}</p>
                  <p style="color: #28a745; font-size: 14px;">
                    <i class="pi pi-info-circle"></i> 
                    La demasía se descontará automáticamente del siguiente mes
                  </p>` : ''
                }
                <p><strong>📄 Comprobante:</strong> ${pagoData.comprobante_pago || 'No especificado'}</p>
              </div>
            `,
            confirmButtonText: 'Continuar',
            confirmButtonColor: '#28a745',
            allowOutsideClick: false,
            // ✅ Z-INDEX ALTO PARA EL MODAL DE ÉXITO
            customClass: {
              container: 'swal-high-zindex',
              popup: 'swal-success-popup'
            },
            didOpen: () => {
              const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
              if (swalContainer) {
                swalContainer.style.zIndex = '9999';
              }
            }
          }).then(() => {
            // Acciones después de confirmar
            this.loadPagos({ first: 0, rows: this.limite } as TableLazyLoadEvent);
            this.router.navigate(['cotizaciones/planillas-aportes']);
          });
        }, 300); // 300ms de delay
      },
      (error) => {
        console.error('Error al crear pago:', error);
        
        // ✅ CERRAR DIALOG ANTES DE MOSTRAR ERROR
        this.displayDialog = false;
        
        setTimeout(() => {
          Swal.fire({
            icon: 'error',
            title: 'Error al Procesar el Pago',
            text: error.error?.message || 'No se pudo procesar el pago. Por favor, intenta de nuevo.',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#dc3545',
            customClass: {
              container: 'swal-high-zindex'
            },
            didOpen: () => {
              const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
              if (swalContainer) {
                swalContainer.style.zIndex = '9999';
              }
            }
          });
        }, 300);
      }
    );
  } else {
    // Validación de campos - cerrar dialog si está abierto
    Swal.fire({
      icon: 'warning',
      title: 'Formulario Incompleto',
      text: 'Por favor completa todos los campos requeridos y adjunta un comprobante.',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#ffc107',
      customClass: {
        container: 'swal-high-zindex'
      },
      didOpen: () => {
        const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
        if (swalContainer) {
          swalContainer.style.zIndex = '9999';
        }
      }
    });
  }
}

private resetForm(): void {
  this.pagoForm.reset();
  this.pagoForm.patchValue({ id_planilla_aportes: this.idPlanilla });
  this.selectedFile = null;
  this.previewUrl = null;
  this.calculoDetalles = null;
  this.activeStep = 0;
}

  // Manejar la selección del archivo y generar vista previa
  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0] as File;
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.isPdf = this.selectedFile!.type === 'application/pdf';
        this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(e.target.result);
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  // Abrir el modal para crear pago
  openCreatePagoDialog(): void {
    this.pagoForm.reset();
    this.pagoForm.patchValue({ id_planilla_aportes: this.idPlanilla });
    this.selectedFile = null;
    this.previewUrl = null; // Reinicia la vista previa
    this.calculoDetalles = null;
    this.activeStep = 0;
    this.displayDialog = true;
  }

  // Limpiar el formulario al cerrar el modal
  onDialogHide(): void {
    this.pagoForm.reset();
    this.pagoForm.patchValue({ id_planilla_aportes: this.idPlanilla });
    this.selectedFile = null;
    this.previewUrl = null; // Reinicia la vista previa
    this.calculoDetalles = null;
    this.activeStep = 0;
  }

  // Abrir el modal para ver la imagen
  openImageDialog(pago: PagoAporte): void {
    if (!pago.foto_comprobante) return;
  
    // Construye la URL completa usando la variable del environment
    this.selectedImageUrl = `${environment.url_imagenes}${pago.foto_comprobante}`;
    this.isPdfLoaded = true;
    this.displayImageDialog = true;
  }

  // Manejar errores del iframe
  onIframeError(event: Event): void {
    console.error('Error al cargar el PDF:', event);
    this.isPdfLoaded = false;
  }

  // Formatear la fecha
  formatFecha(fecha: string): string {
    return fecha.split('.')[0];
  }
}