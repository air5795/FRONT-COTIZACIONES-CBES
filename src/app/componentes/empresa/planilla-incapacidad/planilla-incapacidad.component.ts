import { Component } from '@angular/core';
import { NotificacionService } from '../../../servicios/mensaje/notificacion.service';
import { PlanillaIncapacidadService } from '../../../servicios/planilla-incapacidad/planilla-incapacidad.service';
import { Table } from 'primeng/table';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { IPlanillaIncapacidad, IPaginatedPlanillaIncapacidad } from '../../../dominio/PlanillaIncapacidad';
import { ITipoIncapacidad } from '../../../interfaces/tipo-incapacidad/tipo-incapacidad.interface';
import { LocalService } from '../../../servicios/local/local.service';
import { TipoIncapacidadService } from '../../../servicios/tipo-incapacidad/tipo-incapacidad.service';
import { MessageService, SelectItem } from 'primeng/api';
import { Mensaje } from '../../../dominio/Mensaje';
import { IconService } from '../../../servicios/iconservice';
import { formatearFecha, formatearFechaInversa } from '../../../helpers/mes.util';
import { UsuarioService } from '../../../servicios/usuario/usuario.service';
import { IEmpleado } from '../../../interfaces/empleados.interface';
import moment, { isDate } from 'moment';

@Component({
  selector: 'app-planilla-incapacidad',
  templateUrl: './planilla-incapacidad.component.html',
  styleUrl: './planilla-incapacidad.component.css',
  styles: [`
  :host ::ng-deep  .p-frozen-column {
      font-weight: bold;
  }

  :host ::ng-deep .p-datatable-frozen-tbody {
      font-weight: bold;
  }

  :host ::ng-deep .p-progressbar {
      height:.5rem;
  }
`],
  providers: [MessageService, NotificacionService]
})
export class PlanillaIncapacidadComponent {
  // Propiedades exclusivas para el diálogo de reporte
dialogoReporteVisible: boolean = false;
fechaInicioReporte: string = new Date().toISOString().split('T')[0]; // Fecha inicial por defecto
fechaFinReporte: string = new Date().toISOString().split('T')[0]; // Fecha final por defecto

  totalGeneral: number = 0;
  usuarioContexto: any;
  listTipoIncapacidades: ITipoIncapacidad[] = [];
  planillaIncapacidad: IPlanillaIncapacidad[] = [];
  listaTipoIncapacidad!: any[];
  listAllEmpleados: IEmpleado[] = [];
  carnetsFiltrados: IEmpleado[] = [];
  selectedTipoIncapacidades: number | null = null;
  selectedIdTipoDiscapacidad: number | null = null;
  idEmpleadoSelect: number | null = null;
  nombreIncapacidad: string | null = null;
  idIncapacidad: number = 0;
  //Fecha
  fechaInicio: string = new Date().toISOString().split('T')[0];
  fechaFin: string = new Date().toISOString().split('T')[0];
  totalPlanillas: number = 0;
  pagination: number = 1;
  cantReg: number = 10;
  tipoIncapacidadSelect: any;
  incapacidadSelect: any;
  nuevoEmpleadoDialog: boolean = false;
  guardarIncapacidadDialog: boolean = false;
  empleadoForm!: FormGroup;
  porcentajeIncapacidadLaboral: number = 0;
  columnas: any[] | undefined;
  bajaMedicaHora: string = moment().format('hh:mm');
  constructor(
    private localService: LocalService,
    private planillaService: PlanillaIncapacidadService,
    private tipoIncapacidadService: TipoIncapacidadService,
    private usuarioService: UsuarioService,
    private notificacionService: NotificacionService,
  ) { }
  ngOnInit() {
    this.usuarioContexto = JSON.parse(this.localService.getLocalStorage("usuarioRestriccion")!);
    this.cargaPlanillaIncapacidad();
    this.formularioPlanilla();
    this.findAllTipoIncapacidad();
    this.setFechaInicio();
    this.setFechaFin();
    this.getFindAllEmpleados();
    this.empleadoForm.patchValue({
        bajaMedicaHora: moment().format('kk:mm'),
    });
    this.columnas = [
      { field: 'idPlanillaIncapacidad', header: 'idPlanillaIncapacidad' },
      { field: 'aseCi', header: 'aseCi' },
      { field: 'matricula', header: 'matricula' },
      { field: 'nombreCompleto', header: 'nombreCompleto' },
      { field: 'bajaMedicaIni', header: 'bajaMedicaIni' },
      { field: 'bajaMedicaFin', header: 'bajaMedicaFin' },
      { field: 'diasIncapacidadInicial', header: 'diasIncapacidadInicial' },
      { field: 'fechaCotizacionDel', header: 'fechaCotizacionDel' },
      { field: 'fechaCotizacionAl', header: 'fechaCotizacionAl' },
      { field: 'dia', header: 'dia' },
      { field: 'diaCbes', header: 'diaCbes' },
      { field: 'totalGanadoMensual', header: 'totalGanadoMensual' },
      { field: 'totalDia', header: 'totalDia' },
      { field: 'total', header: 'total' },
      { field: 'totalPorcentajeCubrir', header: 'totalPorcentajeCubrir' },
      { field: 'estado', header: 'estado' },
      { field: 'observaciones', header: 'observaciones' },

    ];
  }

  calcularTotalGeneral() {
    this.totalGeneral = this.planillaIncapacidad.reduce(
      (sum, item) => sum + (item.totalPorcentajeCubrir || 0),
      0
    );
  }
  
  setFechaInicio() {
    const fechaActual = new Date();
    const año = fechaActual.getFullYear();
    const mes = fechaActual.getMonth() + 1; // getMonth() devuelve un rango de 0-11
    const mesFormateado = mes < 10 ? `0${mes}` : mes; // Asegura el formato MM
    this.fechaInicio = `01/${mesFormateado}/${año}`;
  }
  setFechaFin() {
    const fechaActual = new Date();
    const año = fechaActual.getFullYear();
    const mes = fechaActual.getMonth() + 1; // getMonth() devuelve un rango de 0-11

    // Calcular el último día del mes
    const ultimoDia = new Date(año, mes, 0).getDate();

    this.fechaFin = `${ultimoDia}/${mes < 10 ? `0${mes}` : mes}/${año}`;
  }
  cargaPlanillaIncapacidad() {
    
    this.planillaService
      .getPlanillaIncapacidadesList(
        this.usuarioContexto.numPatronalEmpresa!,
        this.idIncapacidad,
        this.fechaInicio,
        this.fechaFin,
        this.pagination,
        this.cantReg
      )
      .subscribe({
        next: (res: IPaginatedPlanillaIncapacidad) => {
          this.planillaIncapacidad = res.data.map(item => ({
            ...item,
            totalPorcentajeCubrir: isNaN(Number(item.totalPorcentajeCubrir)) ? 0 : Number(item.totalPorcentajeCubrir)
          }));
          this.totalPlanillas = parseInt(res.count, 10);
          this.calcularTotalGeneral();
          console.log('Planilla de Incapacidad',this.planillaIncapacidad);
        },
        error: (err) => {
          console.log(err);
        },
      });
  }
  

  findAllTipoIncapacidad() {
    this.tipoIncapacidadService.findAllTipoIncapacidad()
      .subscribe((respuesta: any) => {
        if (respuesta.status) {
          this.listaTipoIncapacidad = respuesta.data;
        }
      });
  }
  listaIncapacidadSelect() {
    if (this.tipoIncapacidadSelect) {
      if (isDate(this.fechaInicio)) {
        this.fechaInicio = moment(this.fechaInicio).format('DD/MM/YYYY');
      }
      if (isDate(this.fechaFin)) {
        this.fechaFin = moment(this.fechaFin).format('DD/MM/YYYY');
      }
      this.idIncapacidad = this.tipoIncapacidadSelect;
      this.fechaInicio = formatearFecha(this.fechaInicio);
      this.fechaFin = formatearFecha(this.fechaFin);
      this.cargaPlanillaIncapacidad();
      
      this.fechaInicio = formatearFechaInversa(this.fechaInicio);
      this.fechaFin = formatearFechaInversa(this.fechaFin);
    }
  }
  formularioPlanilla() {
    this.empleadoForm = new FormGroup({
      identificadorIncapacidad: new FormControl(''),
      tipoIncapacidad: new FormControl(''),
      aseCi: new FormControl('', Validators.required),
      matricula: new FormControl('', Validators.required),
      nombreCompleto: new FormControl('', Validators.required),
      bajaMedicaIni: new FormControl('', Validators.required),
      bajaMedicaHora: new FormControl('', Validators.required),
      bajaMedicaFin: new FormControl('', Validators.required),
      diasIncapacidadInicial: new FormControl(null, Validators.required),
      dia: new FormControl(null, Validators.required),
      totalGanadoMensual: new FormControl(null, Validators.required),
      totalDia: new FormControl(null, Validators.required),
      total: new FormControl(null, Validators.required),
      empleado: new FormControl(),
      fechaCotizacionDel: new FormControl(null, Validators.required),
      fechaCotizacionAl: new FormControl(null, Validators.required),
      diaCbes: new FormControl(null, Validators.required),
      totalPorcentajeCubrir: new FormControl(null, Validators.required),
      fechaGeneracion: new FormControl(null, Validators.required),
      observaciones: new FormControl(''),
      empNpatronal: new FormControl(''),
    });
  }
  abrirNuevoEmpleado() {
    this.nuevoEmpleadoDialog = true;
  }
  getFindAllEmpleados() {
    if (this.usuarioContexto.numPatronalEmpresa) {
      this.usuarioService.getFindAllEmpleados(this.usuarioContexto.numPatronalEmpresa).subscribe({
        next: (res: IEmpleado[]) => {
          this.listAllEmpleados = res;
        },
        error: (err) => {
          console.log(err);
        },
      });
    } else {
      // Handle the null case, maybe set an error message or do nothing
    }
  }
  /***
   * Busca Autocompleta para el número de documento del afiliado
   * ***/
  filterCountry(event: any) {
    const filtered: any[] = [];
    const query = event.query;
    var matriculaBuscar = '';
    for (let i = 0; i < this.listAllEmpleados.length; i++) {
      const carnetsEmpleados = this.listAllEmpleados[i];
      matriculaBuscar = carnetsEmpleados.aseMatTit?carnetsEmpleados.aseMatTit.toString():'';
      if (matriculaBuscar.includes(query)) {
        filtered.push(carnetsEmpleados);
      }
    }
    this.carnetsFiltrados = filtered;
  }
  /***
 * Busca al empledado seleccionado y envia sus datos al formulario
 * ***/
  onEmpleadoSelected(event: any) {
    const selectedId = event.value ? event.value : event;
    if (selectedId.idEmpleado) {
      // Actualiza el formulario aquí
      this.empleadoForm.patchValue({
        aseCi: selectedId.aseCi,
        matricula: selectedId.aseMatTit,
        nombreCompleto:
          selectedId.aseNom +
          ' ' +
          selectedId.aseApat +
          ' ' +
          selectedId.aseAmat, // Ajusta según tu modelo
        empleado: selectedId.idEmpleado,
        totalGanadoMensual: selectedId.aseHaber,
        totalDia: (selectedId.aseHaber / 30).toFixed(2),
        fechaGeneracion: new Date(),
      });
    }
  }
  /***
* Hace el calculo de los dias de baja, dependiendo el tipo de baja seleccionado
* ***/
  calculaDiasBaja() {
    if (this.empleadoForm.value.identificadorIncapacidad) {
      const fechaIniBaja = this.empleadoForm.value.bajaMedicaIni;
      if (fechaIniBaja) {
        const fechaInicioBaja = moment(fechaIniBaja);
        if (fechaInicioBaja) {
          if(this.empleadoForm.value.aseCi > 0){
            const fechaFinalizacionBaja = this.empleadoForm.value.bajaMedicaFin;
          if (fechaFinalizacionBaja < fechaInicioBaja) {
            this.notificacionService.mostrarMensaje("planilla-incapacidad", "error", "Error", 'Fecha de Alta no puede ser menor a la Fecha de Inicio de Baja');
            this.empleadoForm.patchValue({
              bajaMedicaFin: '',
              diasIncapacidadInicial: 0,
              fechaCotizacionDel: '',
              fechaCotizacionAl: '',
              dia: 0,
              diaCbes: 0,
              total: 0,
              totalPorcentajeCubrir: 0,
            });
          } else {
            const fechaFinBaja = moment(fechaFinalizacionBaja);
            let dias = fechaFinBaja.diff(fechaInicioBaja, 'days');
            const mesActualIni = moment(fechaIniBaja).month() + 1;
            const mesActualFin = moment(fechaFinBaja).month() + 1;
            let porcentajeDecimal = '';
            let numPorcentaje = 0;
            let diasDiferencia = 0;
            let diasCbes = 0;
            let horaBaja = moment (this.empleadoForm.value.bajaMedicaHora, 'HH:mm');
            let horaLimite = moment ('19:30', 'HH:mm');
            /***Buscamos el valor de porcentaje del tipo de incapacidad**/
            for (let i = 0; i < this.listaTipoIncapacidad.length; i++) {
              const dataIncapacidades = this.listaTipoIncapacidad[i];
              if (this.empleadoForm.value.identificadorIncapacidad == dataIncapacidades.idTipoIncapacidad) {
                porcentajeDecimal = dataIncapacidades.porcentajeDecimal;
                numPorcentaje = dataIncapacidades.porcentaje;
                diasDiferencia = dataIncapacidades.diasDiferencia;
                diasCbes = dataIncapacidades.diasCbes;
              }
            }
            /***Validamos el mes si no es el actual se procede a calcular en base al mes inicial**/
            if (mesActualIni != mesActualFin) {
              /**Obtenemos el último dia del mes anterior**/
              const endOfMonth = moment(fechaInicioBaja, 'YYYY-MM-DD').endOf('month').format('YYYY-MM-DD');
              const fechaFinMesAnterior = moment(endOfMonth);
              let daysBackMont = (fechaFinMesAnterior.diff(fechaInicioBaja, 'days')) + 1;
              if(daysBackMont <= diasCbes){
                diasCbes = diasCbes - daysBackMont;
              }else{
                diasCbes = 0;
              }
              const año = this.empleadoForm.value.bajaMedicaFin.getFullYear();
              const mes = this.empleadoForm.value.bajaMedicaFin.getMonth() + 1; // getMonth() devuelve un rango de 0-11
              const mesFormateado = mes < 10 ? `0${mes}` : mes; // Asegura el formato MM
              const fechaInicioMes = `${año}-${mesFormateado}-01`;
              const fechaInicioCalculo = moment(fechaInicioMes);
              /**Realizamos el calculo en base a la nueva fecha de inicio***/
              /*****Calculamos las fechas de cotizaciones y los valores calculados */
              const dateStart = fechaInicioCalculo;
              let dayStart = fechaFinBaja.diff(dateStart, 'days');
              let dayCbes = (dayStart + 1) - diasCbes;
              
              let totalCobertura = (parseFloat(this.empleadoForm.value.totalDia) * dayCbes).toFixed(2);
              let totalAsus = (parseFloat(totalCobertura) * parseFloat(porcentajeDecimal)).toFixed(2);
              this.porcentajeIncapacidadLaboral = numPorcentaje;
              /********/
              this.empleadoForm.patchValue({
                diasIncapacidadInicial: dias + 1,
                dia: dayStart + 1,
                fechaCotizacionDel: moment(dateStart).format('DD/MM/YYYY'),
                fechaCotizacionAl: this.empleadoForm.value.bajaMedicaFin,
                diaCbes: dayCbes,
                total: totalCobertura,
                totalPorcentajeCubrir: totalAsus,
              });
            } else {
              /*****Calculamos las fechas de cotizaciones y los valores calculados */
              /***Control de la hora de la presentación de la baja***/
              let diaPosterior = 0;
              if (horaBaja.isAfter(horaLimite)) {
                diaPosterior = diasDiferencia;              
              }
              const dateStart = fechaInicioBaja.add(diaPosterior, 'days');
              let dayStart = fechaFinBaja.diff(dateStart, 'days');
              let dayCbes = (dayStart + 1) - diasCbes;
              let totalCobertura = (parseFloat(this.empleadoForm.value.totalDia) * dayCbes).toFixed(2);
              let totalAsus = (parseFloat(totalCobertura) * parseFloat(porcentajeDecimal)).toFixed(2);
              this.porcentajeIncapacidadLaboral = numPorcentaje;
              /********/
              this.empleadoForm.patchValue({
                diasIncapacidadInicial: dias + 1,
                dia: dayStart + 1,
                fechaCotizacionDel: moment(dateStart).format('DD/MM/YYYY'),
                fechaCotizacionAl: this.empleadoForm.value.bajaMedicaFin,
                diaCbes: dayCbes,
                total: totalCobertura,
                totalPorcentajeCubrir: totalAsus,
              });
            }

          }
          }else{
            this.notificacionService.mostrarMensaje("planilla-incapacidad", "error", "Error", 'Debe seleccionar la matrícula del asegurado' + this.empleadoForm.value.bajaMedicaHora);
            this.empleadoForm.patchValue({
            bajaMedicaFin: '',
        });
          }
        }
      }
      else {
        this.notificacionService.mostrarMensaje("planilla-incapacidad", "error", "Error", 'Debe seleccionar la fecha de inicio de baja médica');
        this.empleadoForm.patchValue({
          bajaMedicaFin: '',
        });
      }

    } else {
      this.notificacionService.mostrarMensaje("planilla-incapacidad", "error", "Error", 'Debe seleccionar el tipo de baja médica');
      this.empleadoForm.patchValue({
        bajaMedicaFin: '',
      });
    }
  }
  mostrarDialogoIncapacidadGuardar() {
    this.guardarIncapacidadDialog = true;
  }
  cerrarRegistroIncapacidad() {
    this.nuevoEmpleadoDialog = false;
    this.empleadoForm.reset();
    this.empleadoForm.patchValue({
      bajaMedicaHora: moment().format('kk:mm'),
  });
  }
  confirmarGuardadoEmpleado() {
    const fechaFormato = moment(this.empleadoForm.value.fechaCotizacionDel, 'DD/MM/YYYY').toDate();
    this.empleadoForm.patchValue({
      tipoIncapacidad: this.empleadoForm.value.identificadorIncapacidad,
      empNpatronal: this.usuarioContexto.numPatronalEmpresa,
      fechaCotizacionDel: fechaFormato,
    });
    let regIncapacidad = { ...this.empleadoForm.value }
    
    this.planillaService.guardarIncapacidad(regIncapacidad)
      .subscribe((respuesta: any) => {
        if (respuesta.status) {
          this.guardarIncapacidadDialog = false;
          this.nuevoEmpleadoDialog = false;
          this.cargaPlanillaIncapacidad();
          this.empleadoForm.reset();
          this.notificacionService.mostrarMensaje("planilla-incapacidad", "success", "Correcto", respuesta.message);
        } else {
          this.guardarIncapacidadDialog = false;
          this.nuevoEmpleadoDialog = false;
          this.empleadoForm.reset();
          this.notificacionService.mostrarMensaje("planilla-incapacidad", "error", "Error", respuesta.message);
        }
      });
  }



  // Abrir el diálogo para la generación del reporte
abrirDialogoReporte() {
  this.dialogoReporteVisible = true;
}

// Generar el reporte
generarReporte() {
  if (!this.fechaInicioReporte || !this.fechaFinReporte || !this.usuarioContexto.numPatronalEmpresa) {
    this.notificacionService.mostrarMensaje(
      "planilla-incapacidad",
      "error",
      "Error",
      "Por favor seleccione un rango de fechas válido y asegúrese de que el número patronal esté configurado."
    );
    return;
  }

  const empNpatronal = this.usuarioContexto.numPatronalEmpresa;
  const idIncapacidad = this.idIncapacidad || 0;

    // Convertir fechas al formato ISO
    const fechaInicioISO = new Date(this.fechaInicioReporte).toISOString();
    const fechaFinISO = new Date(this.fechaFinReporte).toISOString();

  this.planillaService
    .generarReporte(empNpatronal, idIncapacidad, fechaInicioISO, fechaFinISO)
    .subscribe({
      next: (res: Blob) => {
        // Crear un enlace para descargar el archivo
        const url = window.URL.createObjectURL(res);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_planilla_incapacidad_${empNpatronal}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        this.notificacionService.mostrarMensaje(
          "planilla-incapacidad",
          "success",
          "Éxito",
          "Reporte generado correctamente."
        );
        this.dialogoReporteVisible = false; // Cierra el diálogo al terminar
      },
      error: (err) => {
        console.error(err);
        this.notificacionService.mostrarMensaje(
          "planilla-incapacidad",
          "error",
          "Error",
          "Ocurrió un error al generar el reporte. Intente nuevamente."
        );
      },
    });
}

  
}
