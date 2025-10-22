// src/app/components/liquidaciones-aportes/liquidaciones-aportes.component.ts
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { PlanillasAportesService } from '../../../servicios/planillas-aportes/planillas-aportes.service';
import { SessionService } from '../../../servicios/auth/session.service';
import { MessageService, Message } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-liquidaciones-aportes',
  templateUrl: './liquidaciones-aportes.component.html',
  styleUrls: ['./liquidaciones-aportes.component.css'],
  providers: [MessageService],
})
export class LiquidacionesAportesComponent implements OnInit, OnDestroy {

  @Input() idPlanilla!: number;
  planilla: any = null;
  loading: boolean = false;
  errorMessage: string | undefined = undefined;
  messages: Message[] = [];
  displayDialog: boolean = false;
  showFechaPagoInput: boolean = false;
  fechaPago: Date | null = null;
  today: Date = new Date();
  datosDesdeDB: boolean = false;
  esEmpresaPublicaConLiquidacionPreliminar: boolean = false;
  esAdministrador: boolean = false;
  rolUsuario: string = '';
  tipoEmpresa: string = '';
  nombreEmpresa: string = '';
  nuevoMontoTGN: number | null = null;
  mostrarInputMontoTGN: boolean = false;
  validadoPor: string = '';
  liquidacionValidada: boolean = false;
  cotizacionReal: number | null = null;
  showCotizacionRealInput: boolean = false;
  
  // Para manejar la suscripción
  private destroy$ = new Subject<void>();

  // Agregar estas nuevas propiedades:
  mostrarModalValidacion: boolean = false;
  nombreCompleto: string = '';

  constructor(
    private planillasService: PlanillasAportesService,
    private sessionService: SessionService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.verificarRolUsuario();
    this.loadAportes();
    // Obtener nombre completo del usuario
    this.nombreCompleto = this.sessionService.getNombreCompleto();
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  verificarRolUsuario() {
    this.esAdministrador = this.sessionService.esAdministrador();
    this.rolUsuario = this.sessionService.getRolActual();
    this.tipoEmpresa = this.sessionService.getTipoEmpresa();
    
    const empresaInfo = this.sessionService.getEmpresaInfo();
    if (empresaInfo) {
      this.nombreEmpresa = empresaInfo.nombre || '';
    }
    
    console.log('Verificación de rol:', {
      esAdministrador: this.esAdministrador,
      rol: this.rolUsuario,
      tipoEmpresa: this.tipoEmpresa,
      nombreEmpresa: this.nombreEmpresa
    });
  }

  // load aportes
  loadAportes() {
    if (!this.idPlanilla) {
      this.errorMessage = 'Por favor, asegúrate de que el ID de la planilla esté definido.';
      this.messages = [{ severity: 'error', summary: 'Error', detail: this.errorMessage }];
      return;
    }
  
    this.loading = true;
    this.errorMessage = undefined;
    this.messages = [];
  
    // El dispatcher del backend maneja automáticamente el tipo de empresa
    this.planillasService.obtenerLiquidacion(this.idPlanilla).subscribe({
      next: (response: any) => {
        console.log('📊 Respuesta de obtenerLiquidacion:', {
          valido_cotizacion: response.valido_cotizacion,
          validado_por: response.validado_por,
          fecha_liquidacion: response.fecha_liquidacion
        });
        
        this.planilla = response;
        this.datosDesdeDB = response.fecha_liquidacion ? true : false;
        
        // Verificar si es empresa pública con liquidación preliminar
        this.esEmpresaPublicaConLiquidacionPreliminar = 
          response.tipo_empresa === 'AP' && 
          (response.es_liquidacion_preliminar || 
          response.observaciones?.includes('LIQUIDACIÓN PRELIMINAR'));
        
        // Verificar el estado de validación
        if (response.valido_cotizacion || response.validado_por) {
          this.liquidacionValidada = true;
          this.validadoPor = response.valido_cotizacion || response.validado_por;
          console.log('✅ Liquidación está validada por:', this.validadoPor);
        } else {
          this.liquidacionValidada = false;
          this.validadoPor = '';
          console.log('⚠️ Liquidación NO está validada');
        }
        
        this.mostrarMensajesSegunContexto(response);
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error en obtenerLiquidacion:', error);
        this.manejarErrorCarga(error);
      },
    });
  }

  confirmarLiquidacion(actualizarFechaPago: boolean) {
    if (!this.esAdministrador) {
      this.messageService.add({
        severity: 'error',
        summary: 'Sin permisos',
        detail: 'No tiene permisos para realizar esta acción.',
      });
      this.displayDialog = false;
      return;
    }

    if (actualizarFechaPago && !this.fechaPago) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Por favor, seleccione una fecha de pago.',
      });
      return;
    }

    this.loading = true;
    
    if (actualizarFechaPago) {
      this.ejecutarRecalculoSegunTipoEmpresa();
    } else {
      this.validarLiquidacionActual();
    }
  }
  public ejecutarRecalculoSegunTipoEmpresa() {
    const tipoEmpresa = this.planilla?.tipo_empresa?.toUpperCase();
    
    if (tipoEmpresa === 'AP') {
      this.ejecutarRecalculoEmpresaPublica();
    } else {
      this.ejecutarRecalculoEmpresaPrivada();
    }
  }
  showDialog() {
    if (!this.esAdministrador) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin permisos',
        detail: 'Solo el administrador puede validar o actualizar liquidaciones.',
      });
      return;
    }

    // VALIDACIÓN: No permitir cambios en liquidaciones ya validadas
    if (this.liquidacionValidada) {
      this.messageService.add({
        severity: 'info',
        summary: 'Liquidación ya validada',
        detail: `Esta liquidación ya fue validada por ${this.validadoPor} y no puede modificarse.`,
      });
      return;
    }

    this.resetearVariablesModal();
    this.displayDialog = true;
    
    // Resetear valores
    this.fechaPago = null;
    this.cotizacionReal = null;
    this.showFechaPagoInput = false;
    this.showCotizacionRealInput = false;
    this.displayDialog = true;
  }
  cancelarSeleccionFecha() {
    this.fechaPago = null;
    this.showFechaPagoInput = false;
    this.nuevoMontoTGN = null;
    this.mostrarInputMontoTGN = false;
  }
  confirmarLiquidacionConNuevoMonto() {
    if (!this.fechaPago || !this.nuevoMontoTGN) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Faltan datos requeridos (fecha de pago y nuevo monto TGN).',
      });
      return;
    }

    this.loading = true;
    this.ejecutarRecalculo();
  }
  public resetearVariablesModal() {
    this.nuevoMontoTGN = null;
    this.mostrarInputMontoTGN = false;
    this.fechaPago = null;
    this.showFechaPagoInput = false;
  }
  recargarDatosSinRecalcular() {
    
    this.loading = true;
    this.errorMessage = undefined;
    this.messages = [{ 
      severity: 'info', 
      summary: 'Cargando', 
      detail: 'Obteniendo datos de liquidación...' 
    }];
    
    // Solo obtener liquidación existente sin recalcular
    this.planillasService.obtenerLiquidacion(this.idPlanilla).subscribe({
      next: (response: any) => {

        
        this.planilla = response;
        this.datosDesdeDB = true;
        
        // Verificar si es empresa pública con liquidación preliminar
        this.esEmpresaPublicaConLiquidacionPreliminar = 
          response.tipo_empresa === 'AP' && 
          this.datosDesdeDB && 
          response.observaciones?.includes('LIQUIDACIÓN PRELIMINAR');
        
        // Mensaje informativo según el estado
        if (this.esEmpresaPublicaConLiquidacionPreliminar && this.esAdministrador) {
          this.messages = [{ 
            severity: 'warn', 
            summary: 'Liquidación Preliminar - Empresa Pública', 
            detail: 'Esta liquidación fue calculada automáticamente. Actualice la fecha de pago cuando la empresa realice el pago.' 
          }];
        } else if (this.esEmpresaPublicaConLiquidacionPreliminar && !this.esAdministrador) {
          this.messages = [{ 
            severity: 'info', 
            summary: 'Liquidación Preliminar', 
            detail: 'Esta es una liquidación preliminar. El administrador actualizará la fecha cuando se realice el pago.' 
          }];
        } else if (this.datosDesdeDB) {
          this.messages = [{ 
            severity: 'success', 
            summary: 'Liquidación Cargada', 
            detail: `Datos de liquidación cargados correctamente. TGN: ${response.aporte_porcentaje}` 
          }];
        }
        
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Error al obtener la liquidación';
        this.messages = [{ 
          severity: 'error', 
          summary: 'Error', 
          detail: this.errorMessage 
        }];
        this.loading = false;
      }
    });
  }
  cancelarNuevoMonto() {
    this.nuevoMontoTGN = null;
    this.mostrarInputMontoTGN = false;
  }
  validarNuevoMonto() {
    if (!this.nuevoMontoTGN || this.nuevoMontoTGN <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Por favor, ingrese un monto TGN válido mayor a 0.',
      });
      return;
    }

    // Mostrar SweetAlert de confirmación
    Swal.fire({
      title: '¿Confirmar actualización?',
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <p><strong>Fecha de pago real:</strong> ${this.fechaPago?.toLocaleDateString('es-BO')}</p>
          <p><strong>Nuevo monto TGN:</strong> ${this.nuevoMontoTGN?.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</p>
          <p><strong>Monto TGN anterior (teórico):</strong> ${this.planilla?.aporte_porcentaje?.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</p>
        </div>
        <p style="color: #f39c12; font-weight: bold;">Esta acción calculará toda la liquidación con los nuevos valores.</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#dc3545',
      confirmButtonText: 'Sí, actualizar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      customClass: { container: 'swal2-container' },
      willOpen: () => {
        document.querySelector('.swal2-container')?.setAttribute('style', 'z-index: 9999 !important;');
      },
    }).then((result) => {
      if (result.isConfirmed) {
        // Ocultar el input del monto
        this.mostrarInputMontoTGN = false;
        
        // Continuar con el proceso de recálculo usando el nuevo monto
        this.confirmarLiquidacionConNuevoMonto();
      }
    });
  }
  /* =========================================================================== */
/* MÉTODOS ESPECÍFICOS POR TIPO DE EMPRESA                                    */
/* =========================================================================== */

// 🏢 EMPRESAS PRIVADAS: Ejecutar recálculo
public ejecutarRecalculoEmpresaPrivada() {
  
  this.messages = [{ 
    severity: 'info', 
    summary: 'Procesando', 
    detail: 'Recalculando liquidación de empresa privada...' 
  }];
  
  this.planillasService.recalcularLiquidacionPrivada(this.idPlanilla, this.fechaPago!).subscribe({
    next: (response: any) => {
      this.manejarRespuestaExitosa(response, 'Liquidación de empresa privada recalculada correctamente');
    },
    error: (error) => {
      this.manejarError(error);
    }
  });
}

// 🏛️ EMPRESAS PÚBLICAS: Ejecutar recálculo
public ejecutarRecalculoEmpresaPublica() {
  
  if (this.esEmpresaPublicaConLiquidacionPreliminar && this.nuevoMontoTGN) {
    // Actualizar con nuevo monto TGN real
    this.actualizarConNuevoTGN();
  } else {
    // Recalcular sin nuevo TGN
    this.recalcularSinNuevoTGN();
  }
}

// 🏛️ EMPRESAS PÚBLICAS: Actualizar con nuevo TGN
public actualizarConNuevoTGN() {
  
  this.messages = [{ 
    severity: 'info', 
    summary: 'Procesando', 
    detail: 'Actualizando fecha de pago real y nuevo monto TGN...' 
  }];
  
  this.planillasService.actualizarEmpresaPublicaConTGN(this.idPlanilla, this.fechaPago!, this.nuevoMontoTGN!).subscribe({
    next: (response: any) => {
      const mensaje = `Empresa pública actualizada: Nuevo TGN ${response.aporte_porcentaje}, Descuento 5%: ${response.descuento_min_salud}`;
      this.manejarRespuestaExitosa(response, mensaje);
    },
    error: (error) => {
      this.manejarError(error);
    }
  });
}

// 🏛️ EMPRESAS PÚBLICAS: Recalcular sin nuevo TGN
public recalcularSinNuevoTGN() {
  
  this.messages = [{ 
    severity: 'info', 
    summary: 'Procesando', 
    detail: 'Recalculando liquidación de empresa pública...' 
  }];
  
  this.planillasService.recalcularLiquidacionPublica(this.idPlanilla, this.fechaPago!).subscribe({
    next: (response: any) => {
      this.manejarRespuestaExitosa(response, 'Liquidación de empresa pública recalculada correctamente');
    },
    error: (error) => {
      this.manejarError(error);
    }
  });
}

// 📝 Validar liquidación actual (sin cambios)
public validarLiquidacionActual() {
  this.planillasService.validarLiquidacion(this.idPlanilla, {}).subscribe({
    next: (response: any) => {
      
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Liquidación validada correctamente.',
      });
      
      this.displayDialog = false;
      this.loading = false;
      this.recargarDatosSinRecalcular();
    },
    error: (error) => {
      this.manejarError(error);
    },
  });
}

/* =========================================================================== */
/* MÉTODOS AUXILIARES PARA MANEJO DE RESPUESTAS                              */
/* =========================================================================== */

// 📊 Mostrar mensajes según el contexto
public mostrarMensajesSegunContexto(response: any) {
  if (this.esEmpresaPublicaConLiquidacionPreliminar && this.esAdministrador) {
    this.messages = [{ 
      severity: 'warn', 
      summary: 'Liquidación Preliminar - Empresa Pública', 
      detail: 'Esta liquidación fue calculada automáticamente. Actualice la fecha de pago cuando la empresa realice el pago.' 
    }];
  } else if (this.esEmpresaPublicaConLiquidacionPreliminar && !this.esAdministrador) {
    this.messages = [{ 
      severity: 'info', 
      summary: 'Liquidación Preliminar', 
      detail: 'Esta es una liquidación preliminar. El administrador actualizará la fecha cuando se realice el pago.' 
    }];
  } else if (this.datosDesdeDB) {
    const fechaLiq = response.fecha_liquidacion ? new Date(response.fecha_liquidacion).toLocaleDateString() : '';
    this.messages = [{ 
      severity: 'success', 
      summary: 'Liquidación Cargada', 
      detail: `Liquidación calculada el ${fechaLiq}` 
    }];
  } else {
    this.messages = [{ 
      severity: 'success', 
      summary: 'Liquidación Calculada', 
      detail: 'Se calculó la liquidación exitosamente.' 
    }];
  }
}

// ✅ Manejar respuesta exitosa
public manejarRespuestaExitosa(response: any, mensajeBase: string) {
  
  this.planilla = response;
  this.datosDesdeDB = true;
  this.esEmpresaPublicaConLiquidacionPreliminar = false;
  
  // Mostrar SweetAlert de éxito y recargar solo los datos de liquidación
  Swal.fire({
    title: '¡Éxito!',
    text: mensajeBase,
    icon: 'success',
    timer: 2000,
    showConfirmButton: false,
    customClass: { container: 'swal2-container' },
    willOpen: () => {
      document.querySelector('.swal2-container')?.setAttribute('style', 'z-index: 9999 !important;');
    },
  }).then(() => {
    // Recargar solo los datos de liquidación sin refrescar la página
    this.loadAportes();
  });
  
  this.displayDialog = false;
  this.loading = false;
  this.resetearVariablesModal();
  
  console.log('✅ Proceso completado exitosamente - Recargando datos de liquidación');
}

// ❌ Manejar errores
public manejarError(error: any) {
  console.error('❌ Error en proceso:', error);
  this.loading = false;
  this.messageService.add({
    severity: 'error',
    summary: 'Error',
    detail: error.error?.message || 'Error al procesar la solicitud.',
  });
}

// ❌ Manejar errores de carga
public manejarErrorCarga(error: any) {
  this.errorMessage = error.error?.message || 'Error al obtener la liquidación';
  this.planilla = null;
  this.datosDesdeDB = false;
  this.esEmpresaPublicaConLiquidacionPreliminar = false;
  
  if (this.errorMessage && this.errorMessage.includes('no tiene fecha de pago')) {
    this.messages = [{ 
      severity: 'warn', 
      summary: 'Sin Fecha de Pago', 
      detail: 'Esta planilla no tiene fecha de pago asignada. No se puede calcular la liquidación.' 
    }];
  } else {
    this.messages = [{ 
      severity: 'error', 
      summary: 'Error', 
      detail: this.errorMessage 
    }];
  }
  
  this.loading = false;
}

// Método modificado para verificar si debe mostrar botón de validar o recalcular
public debeValidarLiquidacion(): boolean {
  // Verificar múltiples campos posibles para el estado de validación
  const estaValidada = this.planilla && (
    (this.planilla.valido_cotizacion && this.planilla.valido_cotizacion.trim() !== '') ||
    (this.planilla.validado_por && this.planilla.validado_por.trim() !== '') ||
    this.liquidacionValidada
  );
  
  
  return estaValidada;
}

// Nuevo método para abrir modal de validación
public abrirModalValidacion() {
  if (!this.esAdministrador) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Sin permisos',
      detail: 'Solo el administrador puede validar liquidaciones.',
    });
    return;
  }

  if (this.debeValidarLiquidacion()) {
    this.messageService.add({
      severity: 'info',
      summary: 'Liquidación ya validada',
      detail: `Esta liquidación ya fue validada por ${this.planilla.valido_cotizacion} y no puede validarse nuevamente.`,
    });
    return;
  }

  this.mostrarModalValidacion = true;
}

// Nuevo método para confirmar validación
public confirmarValidacionLiquidacion() {
  if (!this.nombreCompleto || this.nombreCompleto.trim() === '') {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo obtener el nombre del usuario.',
    });
    return;
  }

  this.loading = true;
  this.mostrarModalValidacion = false;

  this.planillasService.validarPlanilla(this.idPlanilla, this.nombreCompleto).subscribe({
    next: (response: any) => {
      console.log('✅ Respuesta de validarPlanilla:', response);
      
      // Actualizar inmediatamente el estado local de la planilla
      if (this.planilla) {
        this.planilla.valido_cotizacion = this.nombreCompleto;
        this.liquidacionValidada = true;
        this.validadoPor = this.nombreCompleto;
        
        // Si la respuesta incluye fecha_liquidacion, actualizarla también
        if (response.planilla && response.planilla.fecha_liquidacion) {
          this.planilla.fecha_liquidacion = response.planilla.fecha_liquidacion;
        }
        
        console.log('📝 Estado local actualizado:', {
          valido_cotizacion: this.planilla.valido_cotizacion,
          liquidacionValidada: this.liquidacionValidada,
          validadoPor: this.validadoPor
        });
      }
      
      this.loading = false;
      
      // Mostrar SweetAlert de confirmación
      Swal.fire({
        title: '¡Liquidación Validada!',
        html: `
          <div style="text-align: center; margin: 20px 0;">
            <i class="pi pi-check-circle" style="font-size: 3rem; color: #28a745; margin-bottom: 1rem;"></i>
            <p style="font-size: 1.1rem; margin: 1rem 0;">La liquidación ha sido validada exitosamente</p>
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <strong style="color: #495057;">Validado por:</strong><br>
              <span style="color: #28a745; font-weight: bold;">${this.nombreCompleto}</span>
            </div>
            <p style="color: #6c757d; font-size: 0.9rem; font-style: italic;">
              Esta validación es permanente e irreversible
            </p>
          </div>
        `,
        icon: 'success',
        confirmButtonColor: '#28a745',
        confirmButtonText: 'Entendido',
        allowOutsideClick: false,
        customClass: { 
          container: 'swal2-container',
          popup: 'swal2-popup-large'
        },
        willOpen: () => {
          document.querySelector('.swal2-container')?.setAttribute('style', 'z-index: 9999 !important;');
        },
      }).then(() => {
        // NO recargar datos inmediatamente - mantener estado local
        console.log('✨ Validación completada - Estado local mantenido');
        // Si necesitas actualizar algo más en la UI, hazlo aquí sin recargar todo
      });
    },
    error: (error) => {
      console.error('❌ Error al validar liquidación:', error);
      this.loading = false;
      
      // SweetAlert de error
      Swal.fire({
        title: 'Error al Validar',
        text: error.error?.message || 'Error al validar la liquidación.',
        icon: 'error',
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Cerrar',
        customClass: { container: 'swal2-container' },
        willOpen: () => {
          document.querySelector('.swal2-container')?.setAttribute('style', 'z-index: 9999 !important;');
        },
      });
    }
  });
}

// Método para cerrar modal de validación
public cerrarModalValidacion() {
  this.mostrarModalValidacion = false;
}

// Método modificado para obtener texto del botón
public obtenerTextoBoton() {
  if (this.debeValidarLiquidacion()) {
    return 'Liquidación Validada';
  }
  
  if (this.esEmpresaPublicaConLiquidacionPreliminar && this.esAdministrador) {
    return 'Actualizar Fecha de Pago';
  } else if (this.esEmpresaPublicaConLiquidacionPreliminar && !this.esAdministrador) {
    return 'Esperando Actualización del Administrador';
  } else if (this.datosDesdeDB) {
    return 'Validar Liquidación';
  } else {
    return 'Calcular Liquidación';
  }
}

// Método modificado para obtener ícono del botón
public obtenerIconoBoton() {
  if (this.debeValidarLiquidacion()) {
    return 'pi pi-check-circle';
  }
  
  if (this.esEmpresaPublicaConLiquidacionPreliminar && this.esAdministrador) {
    return 'pi pi-refresh';
  } else if (this.esEmpresaPublicaConLiquidacionPreliminar && !this.esAdministrador) {
    return 'pi pi-info-circle';
  } else if (this.datosDesdeDB) {
    return 'pi pi-shield';
  } else {
    return 'pi pi-plus';
  }
}

// Método modificado para obtener clase del botón
public obtenerClaseBoton() {
  if (this.debeValidarLiquidacion()) {
    return 'p-button-secondary';
  }
  
  if (this.esEmpresaPublicaConLiquidacionPreliminar && this.esAdministrador) {
    return 'p-button-warning';
  } else if (this.esEmpresaPublicaConLiquidacionPreliminar && !this.esAdministrador) {
    return 'p-button-secondary';
  } else if (this.datosDesdeDB) {
    return 'p-button-success';
  } else {
    return 'p-button-primary';
  }
}

// Método modificado para obtener si el botón está deshabilitado
public estaDeshabilitadoBoton(): boolean {
  return this.debeValidarLiquidacion() || 
         (this.esEmpresaPublicaConLiquidacionPreliminar && !this.esAdministrador);
}

// Método modificado para manejar el click del botón
public manejarClickBoton() {
  if (this.debeValidarLiquidacion()) {
    // No hacer nada si ya está validada
    return;
  }
  
  if (this.datosDesdeDB && !this.esEmpresaPublicaConLiquidacionPreliminar) {
    // Mostrar modal de validación en lugar de recalcular
    this.abrirModalValidacion();
  } else {
    // Comportamiento normal para otros casos
    this.showDialog();
  }
}

//-------------------------------

public ejecutarRecalculo() {
  console.log('🔄 Método legacy ejecutarRecalculo() llamado - redirigiendo a método específico');
  this.ejecutarRecalculoSegunTipoEmpresa();
}

// Método para obtener fecha de liquidación formateada
public obtenerFechaLiquidacion(): string {
  if (!this.planilla || !this.planilla.fecha_liquidacion) {
    return '';
  }
  
  const fecha = new Date(this.planilla.fecha_liquidacion);
  return fecha.toLocaleDateString('es-BO', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
}