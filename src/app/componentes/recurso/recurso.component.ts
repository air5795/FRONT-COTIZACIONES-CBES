import { NotificacionService } from './../../servicios/mensaje/notificacion.service';
import { Component } from '@angular/core';
import { RecursoService } from '../../servicios/recurso/recurso.service';
import { Table } from 'primeng/table';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Recurso } from '../../dominio/Recurso';
import { LocalService } from '../../servicios/local/local.service';
import { SistemaService } from '../../servicios/sistema/sistema.service';
import { MessageService } from 'primeng/api';
import { Mensaje } from '../../dominio/Mensaje';
import { IconService } from '../../servicios/iconservice';
@Component({
  selector: 'app-recurso',
  templateUrl: './recurso.component.html',
  styleUrl: './recurso.component.css',
  providers: [MessageService, NotificacionService]
})
export class RecursoComponent {
  recursosSistemas!: any[];
  listaSistemas!: any[];
  nuevoRecursoDialog: boolean = false;
  columnas: any[] | undefined;
  recursoForm!: FormGroup;
  tiposRecursos!: any[];
  eliminarRecursoDialogo: boolean = false;
  guardarRecursoDialogo: boolean = false;
  editarForm: boolean = false;
  esVisible: boolean = false;
  recurso: any;
  idRecurso!: number;
  listaIconos!: any[];
  iconos!: any[];
  constructor(
    private recursoService: RecursoService,
    private sistemaService: SistemaService,
    private localService: LocalService,
    private notificacionService: NotificacionService,
    private iconService: IconService) {
  }
  ngOnInit() {
    this.cargarListaRecursos();
    this.cargarListaRecursosPorSistema();
    this.cargarListaSistemas();
    this.cargarIconos();
    this.recursoForm = new FormGroup({
      idTipoRecurso: new FormControl('', [Validators.required]),
      nombreRecurso: new FormControl('', [Validators.required, Validators.minLength(3)]),
      descripcionRecurso: new FormControl('', [Validators.required, Validators.minLength(3)]),
      idRecursoSuperior: new FormControl(),
      idSistema: new FormControl('', [Validators.required]),
      uri: new FormControl('', [Validators.required, Validators.minLength(3)]),
      orden: new FormControl('', [Validators.required]),
      icono: new FormControl('', [Validators.required, Validators.minLength(3)]),
      esVisible: new FormControl('',),
    });
    this.columnas = [
      { field: 'idRecurso', header: 'idRecurso' },
      { field: 'nombreRecurso', header: 'nombreRecurso' },
      { field: 'nombreRecursoPadre', header: 'nombreRecursoPadre' },
      { field: 'descripcionRecurso', header: 'descripcionRecurso' },
      { field: 'nombreTipoRecurso', header: 'nombreTipoRecurso' },
    ];

  }
  cargarIconos() {
    this.iconService.getIcons()
      .subscribe((respuesta: any) => {
        this.iconos = respuesta.icons;
      });

  }
  cargarListaSistemas() {
    this.sistemaService.getSistemas()
      .subscribe((respuesta: any) => {
        if (respuesta.status) {
          this.listaSistemas = respuesta.data;
        }
      });
  }
  cargarListaRecursos() {
    this.recursoService.getRecursos()
      .subscribe((respuesta: any) => {
        if (respuesta.status) {
          this.tiposRecursos = respuesta.data;
        }

      });
  }
  cargarListaRecursosPorSistema() {
    this.recursoService.getRecursosPorSistema()
      .subscribe((respuesta: any) => {
        if (respuesta.status) {
          this.recursosSistemas = respuesta.data;
        }
      });
  }
  abrirNuevoRecurso() {
    this.nuevoRecursoDialog = true;
  }
  buscadorRecursos(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');

  }
  mostrarDialogoEliminar(r: any) {
    this.recurso = r;
    this.eliminarRecursoDialogo = true;

  }
  mostrarDialogoRecursoGuardar() {
    this.guardarRecursoDialogo = true;
  }
  cerrarNuevoRecurso() {
    this.nuevoRecursoDialog = false;
    this.esVisible = false;
    this.recursoForm.reset();
  }
  confirmarGuardadoRecurso() {
    console.log(this.recursoForm.value);
    if (this.editarForm) {
      this.guardarRecursoDialogo = false;
      this.editarForm = false;
      this.actualizarRecurso();
    } else {
      this.guardarRecurso();
      this.guardarRecursoDialogo = false;
    }

  }
  confirmarEliminarRecurso() {
    this.eliminarRecursoDialogo = false;
    this.eliminarRecurso(this.recurso.idRecurso!);
  }
  actualizarRecurso() {
    console.log(this.recursoForm.value);
    let r: any = this.recursoForm.value;
    r.usuarioModificacion = this.localService.getLocalStorage("usuario")!;
    this.recursoService.actualizarRecurso(r, this.idRecurso).subscribe((respuesta: any) => {
      if (respuesta.status) {
        this.nuevoRecursoDialog = false;
        this.editarForm = false;
        this.recursoForm.reset();
        this.cargarListaRecursosPorSistema();
        this.notificacionService.mostrarMensaje("recurso", "success", "Correcto", respuesta.message);

      } else {
        this.nuevoRecursoDialog = false;
        this.recursoForm.reset();
        this.notificacionService.mostrarMensaje("recurso", "error", "Error", respuesta.message);
      }
    })
  }
  guardarRecurso() {
    let r: any = this.recursoForm.value;
    r.icono = r.icono.name;
    r.usuarioRegistro = this.localService.getLocalStorage("usuario")!;
    r.usuarioModificacion = this.localService.getLocalStorage("usuario")!;
    this.recursoService.guardarRecurso(r).subscribe((respuesta: any) => {
      if (respuesta.status) {
        this.nuevoRecursoDialog = false;
        this.recursoForm.reset();
        this.cargarListaRecursosPorSistema();
        this.notificacionService.mostrarMensaje("recurso", "success", "Correcto", respuesta.message);
      } else {
        this.nuevoRecursoDialog = false;
        this.recursoForm.reset();
        this.notificacionService.mostrarMensaje("recurso", "error", "Error", respuesta.message);
      }
    })
  }
  abrirEditarRecurso(r: any) {
    console.log(r.esVisible);
    this.idRecurso = r.idRecurso;
    this.recursoForm.controls['idTipoRecurso'].setValue(r.idTipoRecurso);
    this.recursoForm.controls['nombreRecurso'].setValue(r.nombreRecurso);
    this.recursoForm.controls['descripcionRecurso'].setValue(r.descripcionRecurso);
    this.recursoForm.controls['idRecursoSuperior'].setValue(r.idRecursoSuperior);
    this.recursoForm.controls['idSistema'].setValue(r.idSistema);
    this.recursoForm.controls['uri'].setValue(r.uri);
    this.recursoForm.controls['orden'].setValue(r.orden);
    this.recursoForm.controls['icono'].setValue(r.icono);
    this.esVisible = r.esVisible;
    this.nuevoRecursoDialog = true;
    this.editarForm = true;
  }
  eliminarRecurso(id: number) {
    this.recursoService.eliminarRecurso(id).subscribe((respuesta: Mensaje) => {
      if (respuesta.status) {
        this.cargarListaRecursosPorSistema();
        this.notificacionService.mostrarMensaje("recurso", "success", "Correcto", respuesta.message);
      }
      else {
        this.notificacionService.mostrarMensaje("recurso", "error", "Error", respuesta.message);
      }
    });
  }
  filtrarIconos(event: any) {
    const filtrado: any[] = [];
    const query = event.query;
    for (let i = 0; i < this.iconos.length; i++) {
      const icono = this.iconos[i];
      if (icono.properties.name.toLowerCase().indexOf(query.toLowerCase()) == 0) {
        filtrado.push(icono.properties);
      }
    }

    this.listaIconos = filtrado;
  }
}
