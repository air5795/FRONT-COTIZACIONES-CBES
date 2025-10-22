// src/app/componentes/planillas-aportes/verificacion-afiliaciones/verificacion-afiliaciones.component.ts
import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { PlanillasAportesService } from '../../../servicios/planillas-aportes/planillas-aportes.service';
import { MessageService } from 'primeng/api';
import Swal from 'sweetalert2';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-verificacion-afiliaciones',
  templateUrl: './verificacion-afiliaciones.component.html',
  styleUrls: ['./verificacion-afiliaciones.component.css'],
  providers: [MessageService]
})
export class VerificacionAfiliacionesComponent implements OnInit, OnChanges, OnDestroy {
  @Input() idPlanilla!: number;

  // Estados del componente
  loading = false;
  verificacionCompleta = false;
  descargandoReporte = false;
  
  // Control de progreso REAL basado en datos de la planilla
  progresoVerificacion = 0;
  mensajeProgreso = 'Preparando verificación...';
  progresoDescarga = 0;
  mensajeDescarga = 'Preparando descarga...';
  
  // Datos de la verificación
  resumenVerificacion: any = null;
  resultadosNoEncontrados: any[] = [];
  
  // Información de la planilla
  infoPlanilla: any = null;
  
  // Subscripción para el progreso inteligente
  private progressSubscription?: Subscription;

  constructor(
    private planillasAportesService: PlanillasAportesService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    if (this.idPlanilla) {
      this.cargarInfoPlanilla();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['idPlanilla'] && changes['idPlanilla'].currentValue) {
      this.resetearEstado();
      this.cargarInfoPlanilla();
    }
  }

  private resetearEstado(): void {
    this.verificacionCompleta = false;
    this.resumenVerificacion = null;
    this.resultadosNoEncontrados = [];
    this.progresoVerificacion = 0;
    this.mensajeProgreso = 'Preparando verificación...';
    if (this.progressSubscription) {
      this.progressSubscription.unsubscribe();
    }
  }

  private cargarInfoPlanilla(): void {
    if (!this.idPlanilla) return;

    this.planillasAportesService.getPlanillaId(this.idPlanilla).subscribe({
      next: (response) => {
        this.infoPlanilla = response.planilla;
        console.log('📋 Información de planilla cargada:', this.infoPlanilla);
      },
      error: (error) => {
        console.error('❌ Error al cargar información de planilla:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la información de la planilla'
        });
      }
    });
  }

  iniciarVerificacion(): void {
    if (!this.idPlanilla) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No se ha seleccionado una planilla válida'
      });
      return;
    }

    Swal.fire({
      title: '¿Iniciar verificación de afiliaciones?',
      text: `Se verificarán ${this.infoPlanilla?.total_trabaj || 'todos los'} trabajadores de la planilla`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, verificar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.ejecutarVerificacion();
      }
    });
  }

  private ejecutarVerificacion(): void {
    this.loading = true;
    this.verificacionCompleta = false;
    this.progresoVerificacion = 0;
    this.mensajeProgreso = 'Iniciando verificación...';
    
    console.log(' Iniciando verificación de afiliaciones para planilla:', this.idPlanilla);

    // ✅ INICIAR PROGRESO INMEDIATAMENTE
    this.simularProgresoInteligenteVerificacion();

    // ✅ EJECUTAR SERVICIO EN PARALELO (sin esperar al progreso)
    this.planillasAportesService.verificarCiEnAfiliaciones(this.idPlanilla).subscribe({
      next: (response) => {
        console.log('✅ Verificación completada:', response);
        
        // ✅ FORZAR PROGRESO A 100% cuando termine la respuesta
        if (this.progressSubscription) {
          this.progressSubscription.unsubscribe();
        }
        
        // Completar progreso gradualmente
        let progresoFinal = this.progresoVerificacion;
        const completarProgreso = setInterval(() => {
          progresoFinal += 5;
          this.progresoVerificacion = Math.min(progresoFinal, 100);
          
          if (progresoFinal >= 100) {
            clearInterval(completarProgreso);
            this.progresoVerificacion = 100;
            this.mensajeProgreso = '✅ Verificación completada';
            
            setTimeout(() => {
              this.resumenVerificacion = response.resumen;
              this.resultadosNoEncontrados = response.resultados || [];
              this.verificacionCompleta = true;
              this.loading = false;

              // Mostrar mensaje de éxito
              this.messageService.add({
                severity: 'success',
                summary: 'Verificación Completada',
                detail: response.mensaje
              });

              // Mostrar resumen en SweetAlert
              Swal.fire({
                title: 'Verificación Completada',
                html: `
                  <div class="verification-summary">
                    <p><strong>Total consultados:</strong> ${response.resumen.total_consultados}</p>
                    <p><strong>Encontrados:</strong> ${response.resumen.encontrados_en_afiliaciones} (${response.resumen.porcentaje_encontrados})</p>
                    <p><strong>No encontrados:</strong> ${response.resumen.no_encontrados_en_afiliaciones}</p>
                    <p><strong>Errores:</strong> ${response.resumen.consultas_con_error}</p>
                  </div>
                `,
                icon: 'info',
                confirmButtonText: 'Entendido'
              });
            }, 1000);
          }
        }, 100);
      },
      error: (error) => {
        console.error('❌ Error en verificación:', error);
        this.loading = false;
        this.verificacionCompleta = false;
        if (this.progressSubscription) {
          this.progressSubscription.unsubscribe();
        }

        Swal.fire({
          title: 'Error en Verificación',
          text: error.error?.message || 'Ocurrió un error durante la verificación',
          icon: 'error',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  private simularProgresoInteligenteVerificacion(): void {
    const totalTrabajadores = this.infoPlanilla?.total_trabaj || 1000;
    const totalLotes = Math.ceil(totalTrabajadores / 50); // Lotes de 50 como en el backend
    
    // ✅ CÁLCULO INTELIGENTE: 100ms por registro + pausa entre lotes
    const tiempoPorRegistro = 10; // ms
    const pausaEntreLotes = 100; // ms como en el backend
    const tiempoEstimadoMs = (totalTrabajadores * tiempoPorRegistro) + (totalLotes * pausaEntreLotes);
    
    const intervalMs = 300; // Actualizar cada 300ms
    const incrementoPorIntervalo = (100 / (tiempoEstimadoMs / intervalMs));
    
    let progresoActual = 0;
    let tiempoTranscurrido = 0;

    console.log(`Tiempo estimado: ${Math.round(tiempoEstimadoMs/1000)}s para ${totalTrabajadores} trabajadores en ${totalLotes} lotes`);

    this.progressSubscription = interval(intervalMs).subscribe(() => {
      tiempoTranscurrido += intervalMs;
      progresoActual += incrementoPorIntervalo;
      
      if (progresoActual >= 99) {
        progresoActual = 99; // No llegar a 100 hasta que termine realmente
      }
      
      this.progresoVerificacion = Math.floor(progresoActual);
      
      // ✅ MENSAJES INTELIGENTES basados en el progreso real
      const loteActual = Math.min(Math.floor((progresoActual / 100) * totalLotes) + 1, totalLotes);
      const registrosProcesados = Math.floor((progresoActual / 100) * totalTrabajadores);
      
      if (progresoActual < 2) {
        this.mensajeProgreso = 'Conectando con Afiliaciones ' + totalTrabajadores + ' trabajadores...';
      } else if (progresoActual < 25) {
        this.mensajeProgreso = 'Generando Informacion (espere)...';
      } else if (progresoActual < 50) {
        this.mensajeProgreso = 'Agrupando Informacion (espere)...';
      } else {
        // ✅ SIMULAR MENSAJES EXACTOS del backend
        const registrosEnLoteActual = this.calcularRegistrosEnLote(loteActual, totalLotes, totalTrabajadores);
        
        if (Math.floor(progresoActual) % 20 === 0 || progresoActual > 95) {
          // Mostrar progreso general como en el backend
          this.mensajeProgreso = ` Progreso: ${registrosProcesados}/${totalTrabajadores} (${Math.floor(progresoActual)}%) - Procesando...`;
        } else {
          // Mostrar lote actual como en el backend
          this.mensajeProgreso = ` Procesando lote ${loteActual}/${totalLotes} (${registrosEnLoteActual} registros)`;
        }
      }
    });
  }

  private calcularRegistrosEnLote(loteActual: number, totalLotes: number, totalTrabajadores: number): number {
    // ✅ LÓGICA EXACTA del backend: lotes de 50, excepto el último
    if (loteActual === totalLotes) {
      const registrosUltimoLote = totalTrabajadores % 50;
      return registrosUltimoLote === 0 ? 50 : registrosUltimoLote;
    }
    return 50;
  }

  descargarReporte(): void {
    if (!this.idPlanilla) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No se ha seleccionado una planilla válida'
      });
      return;
    }

    this.descargandoReporte = true;
    this.progresoDescarga = 0;
    this.mensajeDescarga = 'Preparando reporte...';

    console.log('📄 Descargando reporte de verificación para planilla:', this.idPlanilla);

    // ✅ INICIAR PROGRESO INMEDIATAMENTE
    this.simularProgresoInteligenteDescarga();

    // ✅ EJECUTAR DESCARGA EN PARALELO
    this.planillasAportesService.descargarReporteVerificacionAfiliaciones(this.idPlanilla).subscribe({
      next: (blob) => {
        console.log('✅ Reporte descargado');
        
        // ✅ FORZAR PROGRESO A 100% cuando termine la descarga
        this.progresoDescarga = 100;
        this.mensajeDescarga = '✅ Reporte generado correctamente';
        
        setTimeout(() => {
          // Crear URL para el blob
          const url = window.URL.createObjectURL(blob);
          
          // Crear elemento de descarga
          const link = document.createElement('a');
          link.href = url;
          link.download = `verificacion_afiliaciones_planilla_${this.idPlanilla}_${new Date().toISOString().split('T')[0]}.pdf`;
          
          // Ejecutar descarga
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Limpiar URL
          window.URL.revokeObjectURL(url);

          this.messageService.add({
            severity: 'success',
            summary: 'Descarga Exitosa',
            detail: 'El reporte se ha descargado correctamente'
          });

          this.descargandoReporte = false;
        }, 1000);
      },
      error: (error) => {
        console.error('❌ Error al descargar reporte:', error);
        this.descargandoReporte = false;
        
        Swal.fire({
          title: 'Error en Descarga',
          text: error.error?.message || 'No se pudo descargar el reporte',
          icon: 'error',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  private simularProgresoInteligenteDescarga(): void {
    // ✅ FASES REALES de generación de reporte (basado en el backend)
    const fases = [
      { mensaje: ' Validando parámetros...', duracion: 300, progreso: 5 },
      { mensaje: ' Obteniendo información de la planilla...', duracion: 500, progreso: 15 },
      { mensaje: ' Ejecutando verificación de afiliaciones...', duracion: 800, progreso: 60 },
      { mensaje: ' Generando estadísticas...', duracion: 400, progreso: 75 },
      { mensaje: ' Creando documento PDF...', duracion: 500, progreso: 90 },
      { mensaje: ' Aplicando formato final...', duracion: 300, progreso: 95 }
    ];

    let faseActual = 0;
    let tiempoEnFase = 0;

    const interval = setInterval(() => {
      // ✅ Si ya terminó la descarga real, parar la simulación
      if (this.progresoDescarga >= 100 || !this.descargandoReporte) {
        clearInterval(interval);
        return;
      }

      if (faseActual >= fases.length) {
        // Mantener en 95% hasta que termine la descarga real
        this.progresoDescarga = 95;
        this.mensajeDescarga = 'Finalizando reporte (espere)...';
        return;
      }

      const fase = fases[faseActual];
      tiempoEnFase += 150; // Reducido para que sea más rápido

      // Actualizar mensaje y progreso de la fase actual
      this.mensajeDescarga = fase.mensaje;
      
      // Progreso suave dentro de la fase
      const progresoAnterior = faseActual > 0 ? fases[faseActual - 1].progreso : 0;
      const progresoFase = progresoAnterior + ((fase.progreso - progresoAnterior) * (tiempoEnFase / fase.duracion));
      this.progresoDescarga = Math.min(Math.floor(progresoFase), fase.progreso);

      // Pasar a la siguiente fase
      if (tiempoEnFase >= fase.duracion) {
        this.progresoDescarga = fase.progreso;
        faseActual++;
        tiempoEnFase = 0;
      }
    }, 150); // Intervalo más rápido
  }

  getTipoProblemaColor(tipoProblema: string): string {
    switch (tipoProblema) {
      case 'ERROR DE CONSULTA':
        return '#ff6b6b';
      case 'NO EXISTE EN SISTEMA':
        return '#ffa726';
      default:
        return '#666';
    }
  }

  getTipoProblemaIcon(tipoProblema: string): string {
    switch (tipoProblema) {
      case 'ERROR DE CONSULTA':
        return 'pi pi-exclamation-triangle';
      case 'NO EXISTE EN SISTEMA':
        return 'pi pi-user-minus';
      default:
        return 'pi pi-info-circle';
    }
  }

  calcularTiempoEstimado(): string {
    const totalTrabajadores = this.infoPlanilla?.total_trabaj || 0;
    
    // ✅ CÁLCULO REAL basado en el rendimiento del backend
    const segundosEstimados = Math.ceil((totalTrabajadores * 100 + Math.ceil(totalTrabajadores/50) * 100) / 1000);
    
    if (segundosEstimados < 60) {
      return `~${segundosEstimados} segundos`;
    } else if (segundosEstimados < 300) {
      return `~${Math.ceil(segundosEstimados/60)} minutos`;
    } else {
      return `~${Math.ceil(segundosEstimados/60)} minutos`;
    }
  }

  ngOnDestroy(): void {
    if (this.progressSubscription) {
      this.progressSubscription.unsubscribe();
    }
  }
}