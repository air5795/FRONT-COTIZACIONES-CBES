import { Component } from '@angular/core';
import { NotificacionService } from '../../../servicios/mensaje/notificacion.service';
import { PlanillaAportesService } from '../../../servicios/planilla-aportes/planilla-aportes.service';
import { Table } from 'primeng/table';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { IPlanillaAportes, IPaginatedPlanillaAportes} from '../../../dominio/PlanillaAportes';
import { ITipoIncapacidad } from '../../../interfaces/tipo-incapacidad/tipo-incapacidad.interface';
import { LocalService } from '../../../servicios/local/local.service';
import { TipoIncapacidadService } from '../../../servicios/tipo-incapacidad/tipo-incapacidad.service';
import { MenuItem, MessageService, SelectItem } from 'primeng/api';
import { Mensaje } from '../../../dominio/Mensaje';
import { IconService } from '../../../servicios/iconservice';
import { formatearFecha, formatearFechaInversa, MESES, obtenerRangoDeAnios, obtenerMesActual, obtenerMesesCotizables } from '../../../helpers/mes.util';
import { UsuarioService } from '../../../servicios/usuario/usuario.service';
import { IEmpleado } from '../../../interfaces/empleados.interface';
import moment, { isDate } from 'moment';
import { FileUploadModule } from 'primeng/fileupload';

@Component({
  selector: 'app-planilla-aportes',
  templateUrl: './planilla-aportes.component.html',
  styleUrl: './planilla-aportes.component.css',
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
export class PlanillaAportesComponent {
  items: MenuItem[] | undefined;
  selectedFile: File | null = null; // Para almacenar el archivo seleccionado
  usuarioContexto: any;
  planillaAportes: IPlanillaAportes[] = [];
  listaTipoIncapacidad!: any[];
  listAllEmpleados: IEmpleado[] = [];
  carnetsFiltrados: IEmpleado[] = [];
  anios!: any[];
  meses = MESES;
  mesCotizable!: any[];
  mesActual = obtenerMesActual();
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
  mesCotizableSelect: any;
  gestionCotizableSelect: any;
  mesSelect: any;
  gestionSelect: any;
  nuevaPlanillaDialog: boolean = false;
  guardarIncapacidadDialog: boolean = false;
  planillaForm!: FormGroup;
  porcentajeIncapacidadLaboral: number = 0;
  columnas: any[] | undefined;
  bajaMedicaHora: string = moment().format('hh:mm');
  constructor(
    private localService: LocalService,
    private planillaService: PlanillaAportesService,
    private tipoIncapacidadService: TipoIncapacidadService,
    private usuarioService: UsuarioService,
    private notificacionService: NotificacionService,
  ) { }
  ngOnInit() {
    this.items = [
            {label: 'Editar', icon: 'pi pi-pencil', command: () => {
                this.update();
            }},
            {label: 'Eliminar', icon: 'pi pi-trash'},
            {label: 'Valida Afiliaciones', icon: 'pi pi-verified'}
        ];
    this.usuarioContexto = JSON.parse(this.localService.getLocalStorage("usuarioRestriccion")!);
    const anioActual = new Date().getFullYear();
    this.anios = obtenerRangoDeAnios(2023, anioActual);
    this.mesCotizable = obtenerMesesCotizables();
    
    this.mesCotizableSelect = this.mesActual - 1;
    this.gestionCotizableSelect = anioActual;
    this.gestionSelect = anioActual;
    this.mesSelect = this.mesActual;
    this.cargaPlanillaAportes();
    this.formularioPlanilla();
    this.setFechaInicio();
    this.setFechaFin();  
    this.columnas = [
      { field: 'idPlanilla', header: 'idPlanilla' },
      { field: 'aseCi', header: 'aseCi' },
      { field: 'aseMatTit', header: 'aseMatTit' },
      { field: 'aseNom', header: 'aseNom' },
      { field: 'aseApat', header: 'aseApat' },
      { field: 'aseAmat', header: 'aseAmat' },
      { field: 'estado', header: 'estado' },
      { field: 'observaciones', header: 'observaciones' },

    ];
  }
  update() {
    this.notificacionService.mostrarMensaje("planilla-aportes", "success", "Correcto", 'Actualizar');
}
  setFechaInicio() {
    const fechaActual = new Date();
    const anio = fechaActual.getFullYear();
    const mes = fechaActual.getMonth() + 1; // getMonth() devuelve un rango de 0-11
    const mesFormateado = mes < 10 ? `0${mes}` : mes; // Asegura el formato MM
    this.fechaInicio = `01/${mesFormateado}/${anio}`;
  }
  setFechaFin() {
    const fechaActual = new Date();
    const anio = fechaActual.getFullYear();
    const mes = fechaActual.getMonth() + 1; // getMonth() devuelve un rango de 0-11

    // Calcular el último día del mes
    const ultimoDia = new Date(anio, mes, 0).getDate();

    this.fechaFin = `${ultimoDia}/${mes < 10 ? `0${mes}` : mes}/${anio}`;
  }
  cargaPlanillaAportes() {
      this.planillaService.getPlanillaAportesList(
      this.usuarioContexto.numPatronalEmpresa!,
      this.mesSelect,
      this.gestionSelect,
      this.pagination,
      this.cantReg
    )
      .subscribe({
        next: (res: IPaginatedPlanillaAportes) => {
          this.planillaAportes = res.data;
          this.totalPlanillas = parseInt(res.count, 10);
        },
        error: (err) => {
          console.log(err);
        },
      });
  }
  buscarEmpleado(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }
  /**Metodo para migrar desde excel los datos de la planilla**/
  handleUpload() {
    if (this.selectedFile &&  this.usuarioContexto.numPatronalEmpresa) {
      this.planillaService
        .migrarPlanillaCotizacion(
          this.mesCotizableSelect,
          this.gestionCotizableSelect,
          this.usuarioContexto.numPatronalEmpresa,
          this.selectedFile)
          .subscribe((respuesta: any) => {
            if (respuesta.status) {
              this.nuevaPlanillaDialog = false;
              this.cargaPlanillaAportes();
              this.planillaForm.reset();
              this.notificacionService.mostrarMensaje("planilla-aportes", "success", "Correcto", respuesta.message);
            } else {
              this.nuevaPlanillaDialog = false;
              this.planillaForm.reset();
              this.notificacionService.mostrarMensaje("planilla-aportes", "error", "Error", respuesta.message);
            }
          });
    } else {
      this.notificacionService.mostrarMensaje("planilla-aportes", "error", "Error", 'Debe seleccionar un archivo');
    }
  }
  onUpload(event: any) {
    this.selectedFile = event.target.files[0];
  }
  /**Metodo para migrar desde excel los datos de la planilla**/
  validaAfiliacion() {
    console.log(this.usuarioContexto.numPatronalEmpresa);
    if (this.usuarioContexto.numPatronalEmpresa) {
      this.planillaService
        .validaAfiliacion(
          this.mesSelect,
          this.gestionSelect,
          this.usuarioContexto.numPatronalEmpresa)
          .subscribe((respuesta: any) => {
            if (respuesta.status) {
              this.nuevaPlanillaDialog = false;
              this.cargaPlanillaAportes();
              this.planillaForm.reset();
              this.notificacionService.mostrarMensaje("planilla-aportes", "success", "Correcto", respuesta.message);
            } else {
              this.nuevaPlanillaDialog = false;
              this.planillaForm.reset();
              this.notificacionService.mostrarMensaje("planilla-aportes", "error", "Error", respuesta.message);
            }
          });
    } else {
      this.notificacionService.mostrarMensaje("planilla-aportes", "error", "Error", 'No se cuenta con el numero de empleador');
    }
  }
  /*onSubmit() {
    console.log(this.planillaForm.value);
    // Aquí puedes manejar el envío del formulario
  }*/
  findAllTipoIncapacidad() {
    this.tipoIncapacidadService.findAllTipoIncapacidad()
      .subscribe((respuesta: any) => {
        if (respuesta.status) {
          this.listaTipoIncapacidad = respuesta.data;
        }
      });
  }
  listaAportesSelect() {
    this.cargaPlanillaAportes();
  }
  descargarPlanilla() {
    if (!this.usuarioContexto.numPatronalEmpresa) {
      console.error('empNpatronal es null');
      return; // Si empNpatronal es null, simplemente retornamos de la función
    }
    this.planillaService.descargarExcelCarbone(
      this.usuarioContexto.numPatronalEmpresa!,
      this.mesSelect,
      this.gestionSelect
      )
      .subscribe({
        next: (data) => {
          const blob = new Blob([data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'reporte.xlsx';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        },
        error: (error) => {
          console.error('Hubo un error al descargar el archivo', error);
          // Aquí también puedes mostrar algún mensaje al usuario, si lo deseas.
        },
      });
  }
  formularioPlanilla() {
    this.planillaForm = new FormGroup({
      mesCotizableSelect: new FormControl('', Validators.required),
      gestionCotizableSelect: new FormControl('', Validators.required),
      filePlanilla: new FormControl(''),
    });
  }
  abrirMigrarPlanilla() {
    this.nuevaPlanillaDialog = true;
    console.log(this.mesCotizable);
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
  mostrarDialogoIncapacidadGuardar() {
    this.guardarIncapacidadDialog = true;
  }
  cerrarRegistroIncapacidad() {
    this.nuevaPlanillaDialog = false;
    this.planillaForm.reset();
    /*this.planillaForm.patchValue({
      bajaMedicaHora: moment().format('kk:mm'),
  });*/
  }
  /*confirmarGuardadoEmpleado() {
    const fechaFormato = moment(this.empleadoForm.value.fechaCotizacionDel, 'DD/MM/YYYY').toDate();
    this.empleadoForm.patchValue({
      tipoIncapacidad: this.empleadoForm.value.identificadorIncapacidad,
      empNpatronal: this.usuarioContexto.numPatronalEmpresa,
      fechaCotizacionDel: fechaFormato,
    });
    let regIncapacidad = { ...this.empleadoForm.value }
    console.log(regIncapacidad);
    this.planillaService.guardarIncapacidad(regIncapacidad)
      .subscribe((respuesta: any) => {
        if (respuesta.status) {
          this.guardarIncapacidadDialog = false;
          this.nuevoEmpleadoDialog = false;
          this.cargaPlanillaAportes();
          this.empleadoForm.reset();
          this.notificacionService.mostrarMensaje("planilla-incapacidad", "success", "Correcto", respuesta.message);
        } else {
          this.guardarIncapacidadDialog = false;
          this.nuevoEmpleadoDialog = false;
          this.empleadoForm.reset();
          this.notificacionService.mostrarMensaje("planilla-incapacidad", "error", "Error", respuesta.message);
        }
      });
  }*/
}
