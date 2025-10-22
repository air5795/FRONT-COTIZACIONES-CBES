import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ReembolsosIncapacidadesService } from '../../../servicios/reembolsos-incapacidades/reembolsos-incapacidades.service';
import { 
  BajaMedica, 
  GrupoBajasMedicas,
  DetalleReembolsoCalculado,
  ResponseAsegurado,
  DatosAsegurado
} from '../../../interfaces/reembolsos-incapacidades/reembolsos-incapacidades.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-buscar-trabajador',
  templateUrl: './buscar-trabajador.component.html',
  styleUrls: ['./buscar-trabajador.component.css'],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class BuscarTrabajadorComponent {
  @Output() detalleSeleccionado = new EventEmitter<DetalleReembolsoCalculado>();
  @Input() codPatronal: string = '';  
  @Input() mes: string = '';          
  @Input() gestion: string = '';
  @Input() modoIngreso: 'automatico' | 'manual' = 'automatico';

  buscarForm: FormGroup;
  formularioManual: FormGroup;
  bajasEncontradas: BajaMedica[] = [];
  gruposBajasEncontradas: GrupoBajasMedicas[] = [];
  bajaSeleccionada: BajaMedica | null = null;
  grupoSeleccionado: GrupoBajasMedicas | null = null;
  detalleCalculado: DetalleReembolsoCalculado | null = null;
  
  cargandoBusqueda = false;
  mostrarDialogBajas = false;
  mostrarDialogCalculo = false;
  
  // Control para datos adicionales de riesgo profesional
  mostrarDatosAdicionales = false;
  formularioDatosAdicionales: FormGroup;

  // Datos del trabajador (estos podrían venir de otro servicio)
  datosWorker: {
    ci: string;
    apellido_paterno: string;
    apellido_materno: string;
    nombres: string;
    salario: number;
    dias_pagados?: number; // Opcional: se obtiene de la planilla o usa 30 por defecto
  } = {
    ci: '',
    apellido_paterno: '',
    apellido_materno: '',
    nombres: '',
    salario: 0,
    dias_pagados: undefined // No inicializar con 30, se asignará desde la planilla
  };

  // Propiedades para el buscador de asegurados
  buscadorAsegurado: FormGroup;
  cargandoBusquedaAsegurado = false;
  tipoBusqueda: 'ci' | 'matricula' = 'ci';
  
  // Control de modo de ingreso de datos del trabajador
  modoIngresoTrabajador: 'buscar' | 'manual' = 'buscar';
  aseguradoEncontrado: DatosAsegurado | null = null;
  salarioTrabajador: any = null;
  cargandoSalario = false;

  // Control del stepper
  pasoActual: number = 1;

  constructor(
    private fb: FormBuilder,
    private reembolsosService: ReembolsosIncapacidadesService
  ) {
    this.buscarForm = this.fb.group({
      matricula: ['', [Validators.required, Validators.pattern(/^\d{2}-\d{4}\s[A-Z]{3}$/)]]
    });

    // Formulario para ingreso manual (simplificado para pruebas)
    this.formularioManual = this.fb.group({
      // Datos del trabajador
      ci: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellido_paterno: ['', [Validators.required, Validators.minLength(2)]],
      apellido_materno: ['', [Validators.required, Validators.minLength(2)]],
      matricula: ['', [Validators.required, Validators.pattern(/^\d{2}-\d{4}\s[A-Z]{3}$/)]],
      // Datos de la incapacidad
      tipo_baja: ['', Validators.required],
      fecha_inicio: ['', Validators.required],
      fecha_fin: ['', Validators.required],
      salario: [0, [Validators.required, Validators.min(0)]],
      // Campos adicionales para riesgo profesional
      fecha_accidente: [''],
      fecha_vigencia: [''],
      lugar_accidente: ['']
    });

    // Formulario para datos adicionales de riesgo profesional (modo automático)
    this.formularioDatosAdicionales = this.fb.group({
      fecha_accidente: ['', Validators.required],
      fecha_vigencia: ['', Validators.required],
      lugar_accidente: ['', Validators.required]
    });

    // Formulario para el buscador de asegurados
    this.buscadorAsegurado = this.fb.group({
      tipo_busqueda: ['ci', Validators.required],
      valor_busqueda: ['', Validators.required]
    });
  }

  // Getter para verificar si el tipo de incapacidad es PROFESIONAL
  get esRiesgoProfesional(): boolean {
    return this.formularioManual.get('tipo_baja')?.value === 'PROFESIONAL';
  }

  // Getter para verificar si el grupo seleccionado es de riesgo profesional
  get esGrupoRiesgoProfesional(): boolean {
    return this.grupoSeleccionado?.tipo_baja === 'PROFESIONAL';
  }

  buscarBajasMedicas() {
    if (this.buscarForm.invalid) {
      Swal.fire({
        title: 'Atención',
        text: 'Por favor ingrese una matrícula válida (formato: XX-XXXX XXX)',
        customClass: {
          popup: 'swal-high-zindex'
        },
        didOpen: () => {
          // Aplicar z-index alto para que aparezca por encima del p-dialog
          const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
          if (swalContainer) {
            swalContainer.style.zIndex = '10000';
          }
        }
      });
      return;
    }

    const matricula = this.buscarForm.get('matricula')?.value;
    this.cargandoBusqueda = true;

    this.reembolsosService.buscarBajasMedicasPorMatricula(matricula).subscribe({
      next: (response) => {
        this.cargandoBusqueda = false;
        
        if (response.ok && response.bajasDB && response.bajasDB.length > 0) {
          this.bajasEncontradas = response.bajasDB;
          
          // Agrupar las bajas por continuidad
          this.gruposBajasEncontradas = this.agruparBajasPorContinuidad(response.bajasDB);
          
          this.mostrarDialogBajas = true;
          
          Swal.fire({
            title: 'Éxito',
            html: `
              <div style="text-align: center;">
                <small>Las bajas continuas han sido agrupadas automáticamente</small>
              </div>
            `,
            timer: 3000,
            customClass: {
              popup: 'swal-high-zindex'
            },
            didOpen: () => {
              // Aplicar z-index alto para que aparezca por encima del p-dialog
              const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
              if (swalContainer) {
                swalContainer.style.zIndex = '10000';
              }
            }
          });
        } else {
          Swal.fire({
            title: 'Sin resultados',
            text: 'No se encontraron bajas médicas para esta matrícula',
            customClass: {
              popup: 'swal-high-zindex'
            },
            didOpen: () => {
              // Aplicar z-index alto para que aparezca por encima del p-dialog
              const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
              if (swalContainer) {
                swalContainer.style.zIndex = '10000';
              }
            }
          });
        }
      },
      error: (error) => {
        this.cargandoBusqueda = false;
        console.error('Error al buscar bajas médicas:', error);
        Swal.fire({
          title: 'Error',
          text: 'Error al consultar el servicio de bajas médicas',
          customClass: {
            popup: 'swal-high-zindex'
          },
          didOpen: () => {
            // Aplicar z-index alto para que aparezca por encima del p-dialog
            const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
            if (swalContainer) {
              swalContainer.style.zIndex = '10000';
            }
          }
        });
      }
    });
  }

  /**
   * Agrupa las bajas médicas por continuidad de fechas
   * Dos bajas son continuas si:
   * 1. Son consecutivas (fecha_fin + 1 día = fecha_inicio de la siguiente)
   * 2. Se superponen (hay días en común)
   */
  private agruparBajasPorContinuidad(bajas: BajaMedica[]): GrupoBajasMedicas[] {
    if (!bajas || bajas.length === 0) return [];

    // 1. Ordenar bajas por fecha de inicio
    const bajasOrdenadas = [...bajas].sort((a, b) => {
      const fechaA = new Date(a.DIA_DESDE);
      const fechaB = new Date(b.DIA_DESDE);
      return fechaA.getTime() - fechaB.getTime();
    });

    const grupos: GrupoBajasMedicas[] = [];
    let grupoActual: BajaMedica[] = [bajasOrdenadas[0]];

    for (let i = 1; i < bajasOrdenadas.length; i++) {
      const bajaAnterior = grupoActual[grupoActual.length - 1];
      const bajaActual = bajasOrdenadas[i];

      if (this.sonBajasContinuas(bajaAnterior, bajaActual)) {
        // Son continuas, agregar al grupo actual
        grupoActual.push(bajaActual);
      } else {
        // No son continuas, crear nuevo grupo
        grupos.push(this.crearGrupoBajas(grupoActual));
        grupoActual = [bajaActual];
      }
    }

    // Agregar el último grupo
    grupos.push(this.crearGrupoBajas(grupoActual));

    return grupos;
  }

  /**
   * Determina si dos bajas son continuas
   */
  private sonBajasContinuas(baja1: BajaMedica, baja2: BajaMedica): boolean {
    const fechaFin1 = new Date(baja1.DIA_HASTA);
    const fechaInicio2 = new Date(baja2.DIA_DESDE);
    
    // Calcular la diferencia en días
    const diferenciaDias = Math.floor((fechaInicio2.getTime() - fechaFin1.getTime()) / (1000 * 60 * 60 * 24));
    
    // Son continuas si:
    // - Se superponen (diferencia <= 0)
    // - Son consecutivas (diferencia = 1)
    return diferenciaDias <= 1;
  }

  /**
   * Crea un objeto GrupoBajasMedicas a partir de un array de bajas
   */
  private crearGrupoBajas(bajas: BajaMedica[]): GrupoBajasMedicas {
    if (bajas.length === 0) {
      throw new Error('No se puede crear un grupo vacío');
    }

    // Ordenar por fecha para obtener inicio y fin correctos
    const bajasOrdenadas = [...bajas].sort((a, b) => {
      const fechaA = new Date(a.DIA_DESDE);
      const fechaB = new Date(b.DIA_DESDE);
      return fechaA.getTime() - fechaB.getTime();
    });

    const fechaInicio = bajasOrdenadas[0].DIA_DESDE;
    const fechaFin = bajasOrdenadas[bajasOrdenadas.length - 1].DIA_HASTA;
    
    // Calcular días totales del grupo
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diasTotales = Math.floor((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Extraer información única
    const especialidades = [...new Set(bajas.map(b => b.ESP_NOM).filter(e => e))];
    const medicos = [...new Set(bajas.map(b => b.MEDI_NOM).filter(m => m))];
    const comprobantes = [...new Set(bajas.map(b => b.COMPROBANTE))];
    
    // Determinar tipo de baja predominante
    const tiposBaja = bajas.map(b => b.TIPO_BAJA?.trim()).filter(t => t);
    const tipoPredominante = this.obtenerTipoPredominante(tiposBaja);

    return {
      id: `grupo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      matricula: bajas[0].ASE_MAT,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      dias_totales: diasTotales,
      bajas: bajasOrdenadas,
      especialidades,
      medicos,
      comprobantes,
      tipo_baja: tipoPredominante
    };
  }

  /**
   * Obtiene el tipo de baja más frecuente
   */
  private obtenerTipoPredominante(tipos: string[]): string {
    if (tipos.length === 0) return 'ENFERMEDAD';
    
    const conteo: { [key: string]: number } = {};
    tipos.forEach(tipo => {
      conteo[tipo] = (conteo[tipo] || 0) + 1;
    });
    
    return Object.keys(conteo).reduce((a, b) => conteo[a] > conteo[b] ? a : b);
  }

  /**
   * Selecciona un grupo de bajas médicas para calcular el reembolso
   */
  seleccionarGrupo(grupo: GrupoBajasMedicas) {
    this.grupoSeleccionado = grupo;
    
    // Extraer CI de la matrícula (formato: XX-XXXX XXX)
    const ci = grupo.matricula.split(' ')[0].replace('-', '');
    
    // Configurar datos del trabajador con información del grupo
     this.datosWorker = {
       ci: ci,
       apellido_paterno: 'APELLIDO_PATERNO',
       apellido_materno: 'APELLIDO_MATERNO',
       nombres: 'TRABAJADOR',
       salario: 2500
     };

    // Crear una baja consolidada usando las fechas del grupo
    this.bajaSeleccionada = {
      ...grupo.bajas[0], // Usar la primera baja como base
      DIA_DESDE: grupo.fecha_inicio, // Usar fecha de inicio consolidada
      DIA_HASTA: grupo.fecha_fin,    // Usar fecha de fin consolidada
      DIAS_IMPEDIMENTO: grupo.dias_totales // Usar días totales consolidados
    };
    
    // Verificar si es riesgo profesional para mostrar datos adicionales
    if (grupo.tipo_baja === 'PROFESIONAL') {
      this.mostrarDatosAdicionales = true;
      this.formularioDatosAdicionales.reset();
    } else {
      // Para otros tipos, proceder directamente con el cálculo
      this.mostrarDialogCalculo = true;
      this.calcularYMostrarReembolso();
    }
  }

  /**
   * Procesa los datos adicionales para riesgo profesional
   */
  procesarDatosAdicionales() {
    if (this.formularioDatosAdicionales.invalid) {
      Swal.fire({
        title: 'Atención',
        text: 'Por favor complete todos los campos requeridos para Riesgo Profesional',
        customClass: {
          popup: 'swal-high-zindex'
        },
        didOpen: () => {
          const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
          if (swalContainer) {
            swalContainer.style.zIndex = '10000';
          }
        }
      });
      return;
    }

    const datos = this.formularioDatosAdicionales.value;
    
    // Agregar los datos adicionales a la baja seleccionada
    if (this.bajaSeleccionada) {
      this.bajaSeleccionada.fecha_accidente = datos.fecha_accidente;
      this.bajaSeleccionada.fecha_vigencia = datos.fecha_vigencia;
      this.bajaSeleccionada.lugar_accidente = datos.lugar_accidente;
    }

    // Cerrar el formulario de datos adicionales
    this.mostrarDatosAdicionales = false;
    
    // Proceder con el cálculo
    this.mostrarDialogCalculo = true;
    this.calcularYMostrarReembolso();
  }

  /**
   * Cancela la captura de datos adicionales
   */
  cancelarDatosAdicionales() {
    this.mostrarDatosAdicionales = false;
    this.grupoSeleccionado = null;
    this.bajaSeleccionada = null;
  }

  /**
   * Verifica si se aplicó un ajuste de fechas
   */
  esAjusteFechasAplicado(): boolean {
    if (this.detalleCalculado) {
      const esProfesional = this.detalleCalculado.tipo_incapacidad === 'PROFESIONAL';
      return esProfesional;
    }
    return false;
  }

  /**
   * Formatea una fecha sin problemas de zona horaria
   */
  formatearFechaSinZonaHoraria(fechaString: string): string {
    // Extraer solo la parte de fecha (YYYY-MM-DD) sin la hora
    const fechaParte = fechaString.split('T')[0];
    const [año, mes, dia] = fechaParte.split('-');
    
    // Crear fecha local sin zona horaria
    const fecha = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia));
    return fecha.toLocaleDateString('es-BO');
  }

  /**
   * Muestra el motivo del ajuste de fechas
   */
  mostrarMotivoAjuste() {
    
    const ajuste = (this.detalleCalculado as any)?.ajuste_fechas;
    
    if (ajuste) {

      
      // Corregir problema de zona horaria - usar solo la parte de fecha
      const fechaOriginal = this.formatearFechaSinZonaHoraria(ajuste.fecha_original);
      const fechaAjustada = this.formatearFechaSinZonaHoraria(ajuste.fecha_ajustada);
      
      
      Swal.fire({
        title: ajuste.aplicado ? 'Ajuste de Fechas - Riesgo Profesional' : 'Información - Riesgo Profesional',
        customClass: {
          popup: 'swal-high-zindex'
        },
        didOpen: () => {
          const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
          if (swalContainer) {
            swalContainer.style.zIndex = '20000';
          }
        },
        html: `
          <div style="text-align: left;">
            <p><strong>Estado del ajuste:</strong></p>
            <p>${ajuste.aplicado ? 'Ajuste aplicado' : 'Sin ajuste necesario'}</p>
            <br>
            <p><strong>Motivo:</strong></p>
            <p>${ajuste.motivo}</p>
            <br>
            <p><strong>Detalles:</strong></p>
            <ul>
              <li><strong>Fecha original:</strong> ${fechaOriginal}</li>
              <li><strong>Fecha ajustada:</strong> ${fechaAjustada}</li>
              <li><strong>Tipo:</strong> ${this.detalleCalculado?.tipo_incapacidad}</li>
            </ul>
            <br>
            <p style="color: #856404; font-size: 0.9rem;">
              <i class="pi pi-info-circle"></i>
              ${ajuste.aplicado 
                ? 'El reembolso se calcula desde la fecha de vigencia debido a que se excedió el plazo permitido para la presentación del derecho de vigencia.'
                : 'No se excedió el plazo permitido, por lo que no se aplicó ningún ajuste de fechas.'
              }
            </p>
          </div>
        `,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#ff9800',
        width: '500px'
      });
    } else {
      Swal.fire({
        title: 'Información - Riesgo Profesional',
        text: 'Este es un cálculo de riesgo profesional. No se encontraron datos de ajuste de fechas.',
        confirmButtonText: 'Entendido',
        customClass: {
          popup: 'swal-high-zindex'
        },
        didOpen: () => {
          const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
          if (swalContainer) {
            swalContainer.style.zIndex = '10000';
          }
        }
      });
    }
  }

  /**
   * Muestra los detalles de las bajas agrupadas
   */
  mostrarDetallesGrupo(grupo: GrupoBajasMedicas) {
    const detallesHtml = grupo.bajas.map((baja, index) => `
      <div style="border: 1px solid #e0e0e0; padding: 10px; margin: 5px 0; border-radius: 4px;">
        <strong>Baja ${index + 1}:</strong><br>
        <small><strong>Período:</strong> ${this.formatDate(baja.DIA_DESDE)} → ${this.formatDate(baja.DIA_HASTA)}</small><br>
        <small><strong>Días:</strong> ${baja.DIAS_IMPEDIMENTO}</small><br>
        <small><strong>Médico:</strong> ${baja.MEDI_NOM}</small><br>
        <small><strong>Especialidad:</strong> ${baja.ESP_NOM}</small><br>
        <small><strong>Comprobante:</strong> ${baja.COMPROBANTE}</small>
      </div>
    `).join('');

    Swal.fire({
      title: `Detalles del Grupo - ${grupo.matricula}`,
      html: `
        <div style="text-align: left; max-height: 400px; overflow-y: auto;">
          <div style="background: #f8f9fa; padding: 10px; border-radius: 4px; margin-bottom: 15px;">
            <strong>Resumen del Grupo:</strong><br>
            <small><strong>Período Consolidado:</strong> ${this.formatDate(grupo.fecha_inicio)} → ${this.formatDate(grupo.fecha_fin)}</small><br>
            <small><strong>Días Totales:</strong> ${grupo.dias_totales}</small><br>
            <small><strong>Tipo de Baja:</strong> ${grupo.tipo_baja}</small><br>
            <small><strong>Especialidades:</strong> ${grupo.especialidades.join(', ')}</small>
          </div>
          <strong>Bajas Individuales (${grupo.bajas.length}):</strong>
          ${detallesHtml}
        </div>
      `,
      width: '600px',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#3085d6',
      customClass: {
        container: 'swal-high-zindex'
      }
    });
  }

  seleccionarBaja(baja: BajaMedica) {
    this.bajaSeleccionada = baja;
    // Ya no cerramos un diálogo de bajas, el usuario puede querer ver la lista.
    // this.mostrarDialogBajas = false; 
    
    // Extraer CI de la matrícula (formato: XX-XXXX XXX)
    const ci = baja.ASE_MAT.split(' ')[0];
    
    // Preparar datos básicos del trabajador
    this.datosWorker = {
      ci: ci,
      apellido_paterno: 'APELLIDO_PATERNO', // Obtener del servicio de trabajadores
      apellido_materno: 'APELLIDO_MATERNO', // Obtener del servicio de trabajadores
      nombres: 'NOMBRES_COMPLETOS', // Obtener del servicio de trabajadores
      salario: 5000 // Obtener del servicio de trabajadores o permitir editar
    };
    
    // Llamar automáticamente al cálculo después de seleccionar la baja
    this.calcularYMostrarReembolso();
  }

calcularYMostrarReembolso() {
  if (!this.bajaSeleccionada) return;
  
  const bajaSeleccionada = this.bajaSeleccionada;
  
  // Preparar datos de la baja médica con campos adicionales para riesgo profesional
  const bajaMedicaCompleta = {
    ...bajaSeleccionada,
    // Incluir campos adicionales para riesgo profesional si están disponibles
    fecha_accidente: (bajaSeleccionada as any).fecha_accidente || null,
    fecha_vigencia: (bajaSeleccionada as any).fecha_vigencia || null,
    lugar_accidente: (bajaSeleccionada as any).lugar_accidente || null
  };

  // Primero intentar con datos reales de la planilla
  this.reembolsosService.calcularReembolso(
    bajaMedicaCompleta,
    this.datosWorker,
    this.codPatronal,
    this.mes,
    this.gestion
  ).subscribe({
    next: (response) => {
      console.log('Cálculo exitoso con datos reales:', response);
      
      // ✅ CRÍTICO: Actualizar datosWorker con los datos reales del backend ANTES de procesar
      this.datosWorker = {
        ci: response.datos_trabajador.ci,
        apellido_paterno: response.datos_trabajador.apellido_paterno,
        apellido_materno: response.datos_trabajador.apellido_materno,
        nombres: response.datos_trabajador.nombres,
        salario: response.datos_trabajador.salario_total
      };
      
      // Ahora procesar la respuesta con los datos actualizados
      this.procesarRespuestaCalculo(response, bajaSeleccionada, 'DATOS REALES DE PLANILLA');
    },
    error: (error) => {
      console.warn('No se encontró en planilla, intentando con modo de prueba:', error.message);
      
      // Si falla, usar el modo de prueba como fallback
      this.calcularConModoPrueba(bajaSeleccionada);
    }
  });
}

  private calcularConModoPrueba(bajaSeleccionada: BajaMedica) {
    
    // Preparar datos para el modo de prueba
    const bajaMedicaPrueba = {
      tipo_baja: this.determinarTipoBaja(bajaSeleccionada),
      fecha_inicio: bajaSeleccionada.DIA_DESDE,
      fecha_fin: bajaSeleccionada.DIA_HASTA,
      dias_impedimento: bajaSeleccionada.DIAS_IMPEDIMENTO,
      especialidad: bajaSeleccionada.ESP_NOM,
      medico: bajaSeleccionada.MEDI_NOM,
      comprobante: bajaSeleccionada.COMPROBANTE,
      // Campos adicionales para riesgo profesional
      fecha_accidente: (bajaSeleccionada as any).fecha_accidente || null,
      fecha_vigencia: (bajaSeleccionada as any).fecha_vigencia || null,
      lugar_accidente: (bajaSeleccionada as any).lugar_accidente || null
    };

    // Usar datos básicos del trabajador (extraídos de la matrícula)
    const ci = bajaSeleccionada.ASE_MAT.split(' ')[0];
    const datosWorkerPrueba = {
      ci: ci,
      apellido_paterno: 'APELLIDO_PATERNO',
      apellido_materno: 'APELLIDO_MATERNO', 
      nombres: 'NOMBRES_TRABAJADOR',
      matricula: bajaSeleccionada.ASE_MAT,
      salario: 5000 // Salario por defecto
    };

    this.reembolsosService.calcularReembolsoPrueba(datosWorkerPrueba, bajaMedicaPrueba, this.mes, this.gestion).subscribe({
      next: (response) => {
        console.log('Cálculo exitoso con modo de prueba:', response);
        this.procesarRespuestaCalculo(response, bajaSeleccionada, 'MODO PRUEBA (No encontrado en planilla)');
      },
      error: (error) => {
        Swal.fire({
          title: 'Error en el Cálculo',
          html: `
            <div style="text-align: left;">
              <p><strong>No se pudo calcular el reembolso:</strong></p>
              <ul>
                <li>❌ No se encontró en la planilla del período</li>
                <li>❌ Falló el cálculo de prueba</li>
              </ul>
              <hr>
              <small>Verifique los datos y vuelva a intentar</small>
            </div>
          `,
          customClass: {
            popup: 'swal-high-zindex'
          },
          didOpen: () => {
            // Aplicar z-index alto para que aparezca por encima del p-dialog
            const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
            if (swalContainer) {
              swalContainer.style.zIndex = '10000';
            }
          }
        });
      }
    });
  }

  private procesarRespuestaCalculo(response: any, bajaSeleccionada: BajaMedica, origen: string) {

    
    // Usar los datos del backend
    this.detalleCalculado = {
      ci: response.datos_trabajador.ci,
      apellido_paterno: response.datos_trabajador.apellido_paterno,
      apellido_materno: response.datos_trabajador.apellido_materno,
      nombres: response.datos_trabajador.nombres,
      matricula: response.datos_trabajador.matricula,
      tipo_incapacidad: response.calculo.tipo_incapacidad,
      fecha_inicio_baja: response.calculo.fecha_inicio_baja,
      fecha_fin_baja: response.calculo.fecha_fin_baja,
      dias_incapacidad: response.calculo.dias_incapacidad,
      dias_reembolso: response.calculo.dias_reembolso,
      salario: response.calculo.salario,
      monto_dia: response.calculo.monto_dia,
      monto_subtotal: response.calculo.monto_subtotal,
      porcentaje_reembolso: response.calculo.porcentaje_reembolso,
      monto_reembolso: response.calculo.monto_reembolso,
      especialidad: bajaSeleccionada.ESP_NOM, 
      medico: bajaSeleccionada.MEDI_NOM,     
      comprobante: bajaSeleccionada.COMPROBANTE, 
      fecha_incorporacion: this.formatDate(bajaSeleccionada.FECHA_INCORPORACION),
      // Campos del cálculo detallado (para guardar en BD)
      dias_totales_baja: response.calculo.dias_totales_baja,
      correspondiente_al_mes: response.calculo.correspondiente_al_mes,
      dias_baja_total: response.calculo.dias_totales_baja,
      dias_mes_reembolso: response.calculo.correspondiente_al_mes?.dias_en_mes,
      fecha_inicio_mes_reembolso: response.calculo.correspondiente_al_mes?.fecha_inicio,
      fecha_fin_mes_reembolso: response.calculo.correspondiente_al_mes?.fecha_fin,
      // Información sobre ajuste de fechas
      ajuste_fechas: response.calculo.ajuste_fechas
    };

    // Actualizar los datos del trabajador con la información del backend
    this.datosWorker = {
      ci: response.datos_trabajador.ci,
      apellido_paterno: response.datos_trabajador.apellido_paterno,
      apellido_materno: response.datos_trabajador.apellido_materno,
      nombres: response.datos_trabajador.nombres,
      salario: response.datos_trabajador.salario_total,
      dias_pagados: response.datos_trabajador.dias_pagados || 30
    };

    this.mostrarDialogCalculo = true;

    // Mostrar mensaje de éxito con información del origen
    Swal.fire({
      title: 'Cálculo Completado',
      timer: 3000,
      customClass: {
        popup: 'swal-high-zindex'
      },
      didOpen: () => {
        // Aplicar z-index alto para que aparezca por encima del p-dialog
        const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
        if (swalContainer) {
          swalContainer.style.zIndex = '10000';
        }
      }
    });
  }

  private determinarTipoBaja(baja: BajaMedica): string {
    // Lógica para determinar el tipo de baja basado en los datos disponibles
    // Puedes ajustar esta lógica según tus necesidades
    if (baja.ESP_NOM?.toLowerCase().includes('ginecolog') || 
        baja.ESP_NOM?.toLowerCase().includes('obstetr')) {
      return 'MATERNIDAD';
    }
    
    if (baja.ESP_NOM?.toLowerCase().includes('traumatolog') ||
        baja.ESP_NOM?.toLowerCase().includes('laboral')) {
      return 'PROFESIONAL';
    }
    
    return 'ENFERMEDAD'; // Por defecto
  }

  confirmarYAgregar() {
    if (this.detalleCalculado) {
      // Actualizar con los datos editados
      this.detalleCalculado.apellido_paterno = this.datosWorker.apellido_paterno;
      this.detalleCalculado.apellido_materno = this.datosWorker.apellido_materno;
      this.detalleCalculado.nombres = this.datosWorker.nombres;
      this.detalleCalculado.salario = this.datosWorker.salario;
      
      // Recalcular con el nuevo salario usando días pagados REALES de la planilla
      const diasPagados = this.datosWorker.dias_pagados || this.salarioTrabajador?.dias_pagados || 30;
      
      // Validar que se obtuvieron los días pagados reales
      // NOTA: 30 es un valor válido para días pagados, no es un valor por defecto
      if (!diasPagados || diasPagados <= 0 || diasPagados > 31) {

        throw new Error('Días pagados inválidos en la planilla');
      }
      

      const montoDia = this.datosWorker.salario / diasPagados;
      
      const montoReembolso = (montoDia * this.detalleCalculado.dias_reembolso * this.detalleCalculado.porcentaje_reembolso) / 100;
      
      this.detalleCalculado.monto_dia = parseFloat(montoDia.toFixed(6));
      this.detalleCalculado.monto_reembolso = parseFloat(montoReembolso.toFixed(6));
      
      // Emitir el detalle calculado al componente padre
      this.detalleSeleccionado.emit(this.detalleCalculado);
      
      // Limpiar y cerrar
      this.limpiarFormulario();
      this.mostrarDialogCalculo = false;
      
      Swal.fire({
        title: 'Éxito',
        text: 'Trabajador agregado a la planilla de reembolsos',
        timer: 2000,
        customClass: {
          popup: 'swal-high-zindex'
        },
        didOpen: () => {
          // Aplicar z-index alto para que aparezca por encima del p-dialog
          const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
          if (swalContainer) {
            swalContainer.style.zIndex = '10000';
          }
        }
      });
    }
  }

  // ========== MÉTODOS PARA MODO MANUAL ==========
  
  cambiarModo(modo: 'automatico' | 'manual') {

    
    this.modoIngreso = modo;
    this.limpiarFormulario();

  }

  procesarIngresoManual() {
    // Validar campos básicos
    if (this.formularioManual.invalid) {
      Swal.fire({
        title: 'Atención',
        text: 'Por favor complete todos los campos requeridos',
        customClass: {
          popup: 'swal-high-zindex'
        },
        didOpen: () => {
          const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
          if (swalContainer) {
            swalContainer.style.zIndex = '10000';
          }
        }
      });
      return;
    }

    const datos = this.formularioManual.value;
    
    // Validar campos adicionales para riesgo profesional
    if (datos.tipo_baja === 'PROFESIONAL') {
      if (!datos.fecha_accidente || !datos.fecha_vigencia || !datos.lugar_accidente) {
        Swal.fire({
          title: 'Atención',
          text: 'Para Riesgo Profesional debe completar: Fecha de Accidente, Fecha de Vigencia y Lugar de Accidente',
          customClass: {
            popup: 'swal-high-zindex'
          },
          didOpen: () => {
            const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
            if (swalContainer) {
              swalContainer.style.zIndex = '10000';
            }
          }
        });
        return;
      }
    }
    
    // Calcular días de impedimento entre las dos fechas
    const fechaInicio = new Date(datos.fecha_inicio);
    const fechaFin = new Date(datos.fecha_fin);
    const diasImpedimento = Math.ceil((fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Usar los datos ingresados por el usuario
    const datosTrabajador = {
      ci: datos.ci,
      matricula: datos.matricula,
      nombres: datos.nombres,
      apellido_paterno: datos.apellido_paterno,
      apellido_materno: datos.apellido_materno,
      especialidad: 'MEDICINA GENERAL',
      medico: 'DR. MANUAL',
      comprobante: Math.floor(Math.random() * 900000) + 100000 // Generar número aleatorio
    };
    
    // Crear una baja médica manual con datos ingresados
    this.bajaSeleccionada = {
      ASE_MAT: datosTrabajador.matricula,
      TIPO_BAJA: datos.tipo_baja,
      DIA_DESDE: datos.fecha_inicio,
      DIA_HASTA: datos.fecha_fin,
      DIAS_IMPEDIMENTO: diasImpedimento,
      ESP_NOM: datosTrabajador.especialidad,
      MEDI_NOM: datosTrabajador.medico,
      COMPROBANTE: datosTrabajador.comprobante,
      FECHA_INCORPORACION: datos.fecha_fin,
      HORA_INCORPORACION: '00:00:00',
      FECHA_REGISTRO: new Date().toISOString(),
      // Campos adicionales para riesgo profesional
      fecha_accidente: datos.fecha_accidente || null,
      fecha_vigencia: datos.fecha_vigencia || null,
      lugar_accidente: datos.lugar_accidente || null
    };

    // Establecer los datos del trabajador con datos ingresados
    // Si hay datos de planilla disponibles, usarlos; si no, usar 30 por defecto
    const diasPagadosReales = this.salarioTrabajador?.dias_pagados;
    
    // Validar que se obtuvieron los días pagados reales
    if (!diasPagadosReales) {
      throw new Error('No se obtuvieron los días pagados de la planilla en modo manual');
    }
    
    this.datosWorker = {
      ci: datosTrabajador.ci,
      apellido_paterno: datosTrabajador.apellido_paterno,
      apellido_materno: datosTrabajador.apellido_materno,
      nombres: datosTrabajador.nombres,
      salario: Number(datos.salario), // Asegurar que sea número
      dias_pagados: diasPagadosReales // Usar días reales de la planilla
    };
    

    // Calcular manualmente el reembolso
    this.calcularReembolsoManual();
  }

  calcularReembolsoManual() {
    if (!this.bajaSeleccionada) return;
  
    const bajaSeleccionada = this.bajaSeleccionada;
    const datos = this.formularioManual.value;

    
    // 🔥 CRÍTICO: Verificar días pagados ANTES de enviar
    const diasPagadosReales = this.salarioTrabajador?.dias_pagados;
    
    
    if (!diasPagadosReales) {
      
      
      Swal.fire({
        title: 'Error',
        text: 'No se encontraron los días pagados de la planilla. Por favor, busque nuevamente al trabajador.',
        customClass: {
          popup: 'swal-high-zindex'
        },
        didOpen: () => {
          const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
          if (swalContainer) {
            swalContainer.style.zIndex = '10000';
          }
        }
      });
      return;
    }
    
    
    
    const bajaMedicaPrueba = {
      tipo_baja: datos.tipo_baja,
      fecha_inicio: datos.fecha_inicio,
      fecha_fin: datos.fecha_fin,
      dias_impedimento: bajaSeleccionada.DIAS_IMPEDIMENTO,
      especialidad: bajaSeleccionada.ESP_NOM,
      medico: bajaSeleccionada.MEDI_NOM,
      comprobante: bajaSeleccionada.COMPROBANTE,
      fecha_accidente: datos.fecha_accidente || null,
      fecha_vigencia: datos.fecha_vigencia || null,
      lugar_accidente: datos.lugar_accidente || null
    };
  
    // 🔥 SOLUCIÓN: Enviar explícitamente dias_pagados al backend
    const datosWorkerPrueba = {
      ci: this.datosWorker.ci,
      apellido_paterno: this.datosWorker.apellido_paterno,
      apellido_materno: this.datosWorker.apellido_materno,
      nombres: this.datosWorker.nombres,
      matricula: bajaSeleccionada.ASE_MAT,
      salario: this.datosWorker.salario,
      dias_pagados: diasPagadosReales // ✅ Enviar días reales de la planilla
    };
    

  
    this.reembolsosService.calcularReembolsoPrueba(datosWorkerPrueba, bajaMedicaPrueba, this.mes, this.gestion).subscribe({
      next: (response) => {

        
        // Actualizar datosWorker con respuesta del backend
        this.datosWorker = {
          ci: response.datos_trabajador.ci,
          apellido_paterno: response.datos_trabajador.apellido_paterno,
          apellido_materno: response.datos_trabajador.apellido_materno,
          nombres: response.datos_trabajador.nombres,
          salario: response.datos_trabajador.salario_total,
          dias_pagados: diasPagadosReales // ✅ Mantener días reales
        };
        
        this.detalleCalculado = {
          ci: response.datos_trabajador.ci,
          apellido_paterno: response.datos_trabajador.apellido_paterno,
          apellido_materno: response.datos_trabajador.apellido_materno,
          nombres: response.datos_trabajador.nombres,
          matricula: response.datos_trabajador.matricula,
          tipo_incapacidad: response.calculo.tipo_incapacidad,
          fecha_inicio_baja: response.calculo.fecha_inicio_baja,
          fecha_fin_baja: response.calculo.fecha_fin_baja,
          dias_incapacidad: response.calculo.dias_incapacidad,
          dias_reembolso: response.calculo.dias_reembolso,
          salario: response.calculo.salario,
          monto_dia: response.calculo.monto_dia,
          monto_subtotal: response.calculo.monto_subtotal,
          porcentaje_reembolso: response.calculo.porcentaje_reembolso,
          monto_reembolso: response.calculo.monto_reembolso,
          especialidad: response.baja_medica.ESP_NOM,
          medico: response.baja_medica.MEDI_NOM,
          comprobante: response.baja_medica.COMPROBANTE,
          fecha_incorporacion: this.formatDate(bajaSeleccionada.FECHA_INCORPORACION),
          dias_totales_baja: response.calculo.dias_totales_baja,
          correspondiente_al_mes: response.calculo.correspondiente_al_mes,
          dias_baja_total: response.calculo.dias_totales_baja,
          dias_mes_reembolso: response.calculo.correspondiente_al_mes?.dias_en_mes,
          fecha_inicio_mes_reembolso: response.calculo.correspondiente_al_mes?.fecha_inicio,
          fecha_fin_mes_reembolso: response.calculo.correspondiente_al_mes?.fecha_fin
        };
  
        Swal.fire({
          title: 'Cálculo de Prueba Completado',
          html: `
            <div style="text-align: left;">
              <p><strong>Salario:</strong> Bs ${response.calculo.salario.toFixed(2)}</p>
              <p><strong>Días pagados:</strong> ${diasPagadosReales} días</p>
              <p><strong>Monto día:</strong> Bs ${response.calculo.monto_dia.toFixed(2)}</p>
              <p><strong>Días de reembolso:</strong> ${response.calculo.dias_reembolso}</p>
              <p><strong>Porcentaje:</strong> ${response.calculo.porcentaje_reembolso}%</p>
              <p><strong>Monto reembolso:</strong> Bs ${response.calculo.monto_reembolso.toFixed(2)}</p>
            </div>
            <hr>
            <small>Calculado con días pagados reales de planilla</small>
          `,
          timer: 4000,
          customClass: {
            popup: 'swal-high-zindex'
          },
          didOpen: () => {
            const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
            if (swalContainer) {
              swalContainer.style.zIndex = '10000';
            }
          }
        });
  
        this.mostrarDialogCalculo = true;
      },
      error: (error) => {
        console.error('❌ Error al calcular reembolso:', error);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo calcular el reembolso',
          customClass: {
            popup: 'swal-high-zindex'
          },
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

  limpiarFormulario() {
    
    // Resetear todos los formularios
    this.buscarForm.reset();
    this.formularioManual.reset();
    this.formularioDatosAdicionales.reset();
    this.buscadorAsegurado.reset();
    
    // Limpiar arrays y objetos
    this.bajasEncontradas = [];
    this.gruposBajasEncontradas = [];
    this.bajaSeleccionada = null;
    this.grupoSeleccionado = null;
    this.detalleCalculado = null;
    this.aseguradoEncontrado = null;
    this.salarioTrabajador = null;
    
    // Resetear estados de UI
    this.mostrarDialogBajas = false;
    this.mostrarDialogCalculo = false;
    this.mostrarDatosAdicionales = false;
    this.cargandoBusqueda = false;
    this.cargandoSalario = false;
    this.cargandoBusquedaAsegurado = false;
    
    // Resetear stepper al paso 1
    this.pasoActual = 1;
    
    // Resetear modo de ingreso de trabajador
    this.modoIngresoTrabajador = 'buscar';
    
    // Limpiar datos del trabajador
    this.datosWorker = {
      ci: '',
      apellido_paterno: '',
      apellido_materno: '',
      nombres: '',
      salario: 0,
      dias_pagados: undefined
    };

  }

  /**
   * Limpia los resultados de búsqueda
   */
  limpiarResultados() {
    this.bajasEncontradas = [];
    this.gruposBajasEncontradas = [];
    this.grupoSeleccionado = null;
    this.bajaSeleccionada = null;
    this.detalleCalculado = null;
    this.mostrarDialogBajas = false;
    this.mostrarDialogCalculo = false;
    this.mostrarDatosAdicionales = false;
    this.buscarForm.reset();
    
    // Limpiar datos del trabajador
    this.datosWorker = {
      ci: '',
      apellido_paterno: '',
      apellido_materno: '',
      nombres: '',
      salario: 0
    };
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatDateShort(dateString: string): string {
    if (!dateString) return '';
    // Usar UTC para evitar problemas de zona horaria
    const date = new Date(dateString);
    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = date.getUTCFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  }

  // Obtener días totales de la baja (columna "día" después de BAJA MÉDICA)
  getDiasTotalesBaja(detalle: any): number {
    // Si viene del backend, usar dias_totales_baja
    if (detalle.dias_totales_baja) {
      return detalle.dias_totales_baja;
    }
    
    // Si no, calcular manualmente
    const fechaInicio = new Date(detalle.fecha_inicio_baja);
    const fechaFin = new Date(detalle.fecha_fin_baja);
    const diffTime = Math.abs(fechaFin.getTime() - fechaInicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // +1 para incluir ambos días
  }

  // Obtener días que caen en el mes (columna "DIA" después de CORRESPONDIENTE AL MES)
  getDiasEnMes(detalle: any): number {
    if (detalle.correspondiente_al_mes?.dias_en_mes) {
      return detalle.correspondiente_al_mes.dias_en_mes;
    }
    return detalle.dias_incapacidad;
  }

  // Obtener valor informativo de días menos 3 (columna "día -3")
  getDiasMenos3(detalle: any): number {
    const diasEnMes = this.getDiasEnMes(detalle);
    
    // Solo restar 3 si es ENFERMEDAD
    if (detalle.tipo_incapacidad === 'ENFERMEDAD') {
      return Math.max(0, diasEnMes - 3);
    }
    
    // Para otros tipos, mostrar los días del mes
    return diasEnMes;
  }

  getTipoIncapacidadClass(tipo: string): string {
    switch (tipo?.trim().toUpperCase()) {
      case 'ENFERMEDAD': return 'enfermedad';
      case 'MATERNIDAD': return 'maternidad';
      case 'ACCIDENTE DE TRABAJO':
      case 'ENFERMEDAD PROFESIONAL':
        return 'profesional';
      default: return 'default';
    }
  }

  cerrarDialogCalculo() {
    this.mostrarDialogCalculo = false;
    this.bajaSeleccionada = null;
    this.detalleCalculado = null;
  }

  // ========== MÉTODOS PARA BUSCADOR DE ASEGURADOS ==========

  /**
   * Cambia el tipo de búsqueda (CI o Matrícula)
   */
  cambiarTipoBusqueda(tipo: 'ci' | 'matricula') {
    this.tipoBusqueda = tipo;
    this.buscadorAsegurado.patchValue({
      tipo_busqueda: tipo,
      valor_busqueda: ''
    });
  }

  /**
   * Busca un asegurado por CI o matrícula
   */
  buscarAsegurado() {
    if (this.buscadorAsegurado.invalid) {
      Swal.fire({
        title: 'Atención',
        text: 'Por favor ingrese un valor válido para la búsqueda',
        customClass: {
          popup: 'swal-high-zindex'
        },
        didOpen: () => {
          const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
          if (swalContainer) {
            swalContainer.style.zIndex = '10000';
          }
        }
      });
      return;
    }

    const valorBusqueda = this.buscadorAsegurado.get('valor_busqueda')?.value;
    this.cargandoBusquedaAsegurado = true;

    const busquedaObservable = this.tipoBusqueda === 'ci' 
      ? this.reembolsosService.buscarAseguradoPorCi(valorBusqueda)
      : this.reembolsosService.buscarAseguradoPorMatricula(valorBusqueda);

    busquedaObservable.subscribe({
      next: (response) => {
        this.cargandoBusquedaAsegurado = false;
        
        // Manejar la estructura real de respuesta del backend
        if (response.status && response.data) {
          // El backend puede devolver un array (búsqueda por matrícula) o un objeto directo (búsqueda por CI)
          const datosAsegurado = Array.isArray(response.data) ? response.data[0] : response.data;
          
          if (datosAsegurado) {
            this.aseguradoEncontrado = datosAsegurado;
            
            // Consultar salario desde planillas
            this.consultarSalarioTrabajador(datosAsegurado.ASE_MAT);
            
            Swal.fire({
              title: 'Asegurado encontrado',
              text: 'Se encontraron los datos del trabajador. Consultando salario desde planillas...',
              timer: 3000,
              customClass: {
                popup: 'swal-high-zindex'
              },
              didOpen: () => {
                const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
                if (swalContainer) {
                  swalContainer.style.zIndex = '10000';
                }
              }
            });
          } else {
            Swal.fire({
              title: 'Sin resultados',
              text: 'No se encontró un asegurado con los datos proporcionados',
              customClass: {
                popup: 'swal-high-zindex'
              },
              didOpen: () => {
                const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
                if (swalContainer) {
                  swalContainer.style.zIndex = '10000';
                }
              }
            });
          }
        } else {
          Swal.fire({
            title: 'Sin resultados',
            text: 'No se encontró un asegurado con los datos proporcionados',
            customClass: {
              popup: 'swal-high-zindex'
            },
            didOpen: () => {
              const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
              if (swalContainer) {
                swalContainer.style.zIndex = '10000';
              }
            }
          });
        }
      },
      error: (error) => {
        this.cargandoBusquedaAsegurado = false;
        console.error('Error al buscar asegurado:', error);
        Swal.fire({
          title: 'Error',
          text: 'Error al consultar los datos del asegurado',
          customClass: {
            popup: 'swal-high-zindex'
          },
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

  /**
   * Llena el formulario manual con los datos del asegurado encontrado
   */
  private llenarFormularioConDatosAsegurado(datosAsegurado: DatosAsegurado) {
    this.formularioManual.patchValue({
      ci: datosAsegurado.ASE_CI,
      nombres: datosAsegurado.ASE_NOM,
      apellido_paterno: datosAsegurado.ASE_APAT,
      apellido_materno: datosAsegurado.ASE_AMAT,
      matricula: datosAsegurado.ASE_MAT
    });

    // Actualizar también los datos del trabajador
    this.datosWorker = {
      ci: datosAsegurado.ASE_CI,
      apellido_paterno: datosAsegurado.ASE_APAT,
      apellido_materno: datosAsegurado.ASE_AMAT,
      nombres: datosAsegurado.ASE_NOM,
      salario: this.datosWorker.salario // Mantener el salario si ya estaba ingresado
    };
  }

  /**
   * Llena el formulario manual con datos del asegurado y salario
   */
  private llenarFormularioConDatosCompletos(datosAsegurado: DatosAsegurado, salario?: number) {

    
    const salarioNumerico = Number(salario) || 0;
    
    // 🔥 CRÍTICO: Obtener días pagados ANTES de llenar el formulario
    const diasPagadosReales = this.salarioTrabajador?.dias_pagados;
    
    if (!diasPagadosReales) {
      
      Swal.fire({
        title: 'Error',
        text: 'No se encontró información de días pagados en la planilla',
        customClass: {
          popup: 'swal-high-zindex'
        },
        didOpen: () => {
          const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
          if (swalContainer) {
            swalContainer.style.zIndex = '10000';
          }
        }
      });
      return;
    }
    
    
    
    const datosParaLlenar = {
      ci: datosAsegurado.ASE_CI,
      nombres: datosAsegurado.ASE_NOM,
      apellido_paterno: datosAsegurado.ASE_APAT,
      apellido_materno: datosAsegurado.ASE_AMAT,
      matricula: datosAsegurado.ASE_MAT,
      salario: salarioNumerico
    };
    
    this.formularioManual.patchValue(datosParaLlenar);
  
    // 🔥 ACTUALIZAR datosWorker CON DÍAS PAGADOS REALES
    this.datosWorker = {
      ci: datosAsegurado.ASE_CI,
      apellido_paterno: datosAsegurado.ASE_APAT,
      apellido_materno: datosAsegurado.ASE_AMAT,
      nombres: datosAsegurado.ASE_NOM,
      salario: salarioNumerico,
      dias_pagados: diasPagadosReales // ✅ Asignar aquí
    };
    

  }

  /**
   * Limpia el buscador de asegurados
   */
  limpiarBuscadorAsegurado() {
    this.buscadorAsegurado.reset();
    this.buscadorAsegurado.patchValue({
      tipo_busqueda: 'ci'
    });
  }

  /**
   * Cambia el modo de ingreso de datos del trabajador
   */
  cambiarModoIngresoTrabajador(modo: 'buscar' | 'manual') {
    this.modoIngresoTrabajador = modo;
    
    if (modo === 'buscar') {
      // Limpiar datos del trabajador cuando se cambia a búsqueda
      this.aseguradoEncontrado = null;
      this.limpiarBuscadorAsegurado();
    } else {
      // Limpiar datos encontrados cuando se cambia a manual
      this.aseguradoEncontrado = null;
      this.limpiarBuscadorAsegurado();
    }
  }

  /**
   * Usa automáticamente los datos del asegurado encontrado
   */
  private usarDatosAseguradoAutomatico() {

    
    if (this.aseguradoEncontrado && this.salarioTrabajador) {
      const salario = this.salarioTrabajador.salario_total;

      
      this.llenarFormularioConDatosCompletos(this.aseguradoEncontrado, salario);
      
      // Avanzar automáticamente al paso 3 (Resumen y Cálculo)
      this.pasoActual = 3;
      

    }
  }

  /**
   * Limpia los datos del asegurado encontrado
   */
  limpiarDatosAsegurado() {
    this.aseguradoEncontrado = null;
    this.salarioTrabajador = null;
    this.limpiarBuscadorAsegurado();
  }

  /**
   * Verifica si las fechas de inicio y fin están completas
   */
  fechasCompletas(): boolean {
    const fechaInicio = this.formularioManual.get('fecha_inicio')?.value;
    const fechaFin = this.formularioManual.get('fecha_fin')?.value;
    return !!(fechaInicio && fechaFin);
  }

  /**
   * Verifica si todos los datos están completos para proceder con el cálculo
   */
  datosCompletosParaCalcular(): boolean {
    // Verificar datos básicos de incapacidad
    const tipoBaja = this.formularioManual.get('tipo_baja')?.value;
    const fechaInicio = this.formularioManual.get('fecha_inicio')?.value;
    const fechaFin = this.formularioManual.get('fecha_fin')?.value;
    
    if (!tipoBaja || !fechaInicio || !fechaFin) {
      return false;
    }
    
    // Verificar datos del trabajador
    if (this.modoIngresoTrabajador === 'buscar') {
      // Si está en modo búsqueda, debe haber encontrado un trabajador con salario
      return !!(this.aseguradoEncontrado && this.salarioTrabajador);
    } else {
      // Si está en modo manual, verificar que todos los campos estén llenos
      const ci = this.formularioManual.get('ci')?.value;
      const nombres = this.formularioManual.get('nombres')?.value;
      const apellidoPaterno = this.formularioManual.get('apellido_paterno')?.value;
      const apellidoMaterno = this.formularioManual.get('apellido_materno')?.value;
      const matricula = this.formularioManual.get('matricula')?.value;
      const salario = this.formularioManual.get('salario')?.value;
      
      return !!(ci && nombres && apellidoPaterno && apellidoMaterno && matricula && salario);
    }
  }

  // ========== MÉTODOS PARA STEPPER ==========

  /**
   * Verifica si los datos de incapacidad están completos
   */
  datosIncapacidadCompletos(): boolean {
    const tipoBaja = this.formularioManual.get('tipo_baja')?.value;
    const fechaInicio = this.formularioManual.get('fecha_inicio')?.value;
    const fechaFin = this.formularioManual.get('fecha_fin')?.value;
    
    if (!tipoBaja || !fechaInicio || !fechaFin) {
      return false;
    }
    
    // Si es riesgo profesional, verificar campos adicionales
    if (tipoBaja === 'PROFESIONAL') {
      const fechaAccidente = this.formularioManual.get('fecha_accidente')?.value;
      const fechaVigencia = this.formularioManual.get('fecha_vigencia')?.value;
      const lugarAccidente = this.formularioManual.get('lugar_accidente')?.value;
      
      return !!(fechaAccidente && fechaVigencia && lugarAccidente);
    }
    
    return true;
  }

  /**
   * Verifica si los datos del trabajador están completos
   */
  datosTrabajadorCompletos(): boolean {
    if (this.modoIngresoTrabajador === 'buscar') {
      // Si está en modo búsqueda, debe haber encontrado un trabajador con salario
      return !!(this.aseguradoEncontrado && this.salarioTrabajador);
    } else {
      // Si está en modo manual, verificar que todos los campos estén llenos
      const ci = this.formularioManual.get('ci')?.value;
      const nombres = this.formularioManual.get('nombres')?.value;
      const apellidoPaterno = this.formularioManual.get('apellido_paterno')?.value;
      const apellidoMaterno = this.formularioManual.get('apellido_materno')?.value;
      const matricula = this.formularioManual.get('matricula')?.value;
      const salario = this.formularioManual.get('salario')?.value;
      
      return !!(ci && nombres && apellidoPaterno && apellidoMaterno && matricula && salario);
    }
  }

  /**
   * Avanza al siguiente paso del stepper
   */
  siguientePaso() {
    if (this.pasoActual < 3) {
      this.pasoActual++;
      
      // Si avanza al paso 2 y está en modo búsqueda, buscar automáticamente
      if (this.pasoActual === 2 && this.modoIngresoTrabajador === 'buscar' && this.aseguradoEncontrado) {
        // Los datos ya están disponibles, no hacer nada
      }
    }
  }

  /**
   * Retrocede al paso anterior del stepper
   */
  anteriorPaso() {
    if (this.pasoActual > 1) {
      this.pasoActual--;
    }
  }

  /**
   * Consulta el salario del trabajador desde las planillas
   * Usa la fecha de inicio de baja para determinar el mes de la planilla
   */
  private consultarSalarioTrabajador(matricula: string) {
    this.cargandoSalario = true;
    
    // Obtener la fecha de inicio de baja del formulario
    const fechaInicioBaja = this.formularioManual.get('fecha_inicio')?.value;
    
    if (!fechaInicioBaja) {
      
      this.cargandoSalario = false;
      this.salarioTrabajador = null;
      return;
    }
    
    // Extraer mes y año de la fecha de inicio de baja
    const fecha = new Date(fechaInicioBaja);
    const mesInicioBaja = String(fecha.getMonth() + 1).padStart(2, '0'); // +1 porque getMonth() es 0-based
    const gestionInicioBaja = String(fecha.getFullYear());
    
    
    this.reembolsosService.obtenerSalarioTrabajador(
      this.codPatronal,
      mesInicioBaja,
      gestionInicioBaja,
      matricula
    ).subscribe({
      next: (response) => {
        this.cargandoSalario = false;
        
        if (response.status && response.data) {
          this.salarioTrabajador = response.data;
          
          
          // Usar automáticamente los datos del trabajador
          this.usarDatosAseguradoAutomatico();
        } else {
          this.salarioTrabajador = null;
        }
      },
      error: (error) => {
        this.cargandoSalario = false;
        this.salarioTrabajador = null;
      }
    });
  }
}