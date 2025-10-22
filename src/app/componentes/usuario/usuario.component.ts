import { Component, Output, enableProdMode } from '@angular/core';
import { Router } from '@angular/router';
import { UsuarioService } from '../../servicios/usuario/usuario.service';
import { Table } from 'primeng/table';
import { SistemaService } from '../../servicios/sistema/sistema.service';
import { ClasificadorService } from '../../servicios/clasificador/clasificador.service';
import { PerfilService } from '../../servicios/perfil/perfil.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NotificacionService } from '../../servicios/mensaje/notificacion.service';
import { MenuItem, MessageService } from 'primeng/api';
import { Mensaje } from '../../dominio/Mensaje';
import { LocalService } from '../../servicios/local/local.service';
import { formatearFecha } from '../../helpers/mes.util';
import {
  IEmpleado,
  IPaginatedResponseEmpleados,
} from '../../interfaces/empleados.interface';
import { DatosPersona } from '../../interfaces/asus-externo/asus.interface';
import { AsusService } from '../../servicios/asus/asus.service';
import { DatePipe } from '@angular/common';
import moment from 'moment';
import { InputSwitchModule } from 'primeng/inputswitch';
import { DetalleClasificadorService } from '../../servicios/clasificador/detalle-clasificador.service';
@Component({
  selector: 'app-usuario',
  templateUrl: './usuario.component.html',
  styleUrl: './usuario.component.css',
  providers: [MessageService, NotificacionService]
})
export class UsuarioComponent {
  items: MenuItem[] | undefined;
  //Switch para la habiltacion de campos en caso de que no exista los datos del SEGIP
  //Paginador
  empleados: IEmpleado[] = [];
  totalEmpleados: number = 0;
  pagination: number = 1;
  cantReg: number = 10;
  //Fin de paginador
  datosPersona!: DatosPersona;
  listaUsuarios!: any[];
  columnas: any[] | undefined;
  nuevoEmpleadoDialog: boolean = false;
  listaExpedicion!: any[];
  listaGenero!: any[];
  sistemaSeleccionado: any;
  guardarEmpleadoDialogo: boolean = false;
  mostrarTabla: boolean = false;
  segipForm!: FormGroup;
  personaForm!: FormGroup;
  usuario: any;
  editarUsuarioDialogo: boolean = false;
  eliminarUsuarioDialogo: boolean = false;
  guardarEditarUsuarioDialogo: boolean = false;
  idPersona!: number;
  // valSwitch: boolean = false;
  verificadoSegip: boolean = false;
  esVisible: boolean = false;
  usuarioContexto: any;
  constructor(
    private usuarioService: UsuarioService,
    private detalleClasificadorService: DetalleClasificadorService,
    private notificacionService: NotificacionService,
    private route: Router,
    private asusService: AsusService,
    private localService: LocalService) { }
  ngOnInit() {
    this.items = [
      {label: 'Editar', icon: 'pi pi-pencil',
        
      },
      {label: 'Eliminar', icon: 'pi pi-trash'},
      {label: 'Valida Afiliaciones', icon: 'pi pi-verified'}
  ];
    this.usuarioContexto = JSON.parse(this.localService.getLocalStorage("usuarioRestriccion")!);
    this.cargarListaUsuarios();
    this.listarExpedicion();
    this.listarGenero();
    this.segipForm = new FormGroup({
      documentoSegip: new FormControl('', [Validators.required, Validators.minLength(5)]),
      fechaNacSegip: new FormControl('', [Validators.required]),
      complementoSegip: new FormControl(),
    });
    this.personaForm = new FormGroup({
      aseNom: new FormControl('', [Validators.required, Validators.minLength(3)]),
      aseApat: new FormControl('', [Validators.required, Validators.minLength(3)]),
      aseAmat: new FormControl(''),
      aseFecNac: new FormControl('', [Validators.required]),
      aseCi: new FormControl('', [Validators.required, Validators.minLength(5)]),
      aseCiCom: new FormControl(''),
      aseCiext: new FormControl(''),
      aseFiniEmp: new FormControl('', [Validators.required]),
      aseCargo: new FormControl('', [Validators.required, Validators.minLength(3)]),
      aseHaber: new FormControl('', [Validators.required, Validators.minLength(4)]),
      aseSexo: new FormControl('', [Validators.required]),
      validacionSegip: new FormControl(''),
      empNpatronal: new FormControl(''),
      
    });
    this.columnas = [
      { field: 'aseMatTit', header: 'Matricula' },
      { field: 'aseNom', header: 'Nombre' },
      { field: 'aseApat', header: 'Apellidos' },
      { field: 'aseAmat', header: 'Apellidos' },
      { field: 'aseCi', header: 'CI' },
      { field: 'aseCargo', header: 'Cargo' },
      { field: 'aseHaber', header: 'Salario' },
      { field: 'idcNivel', header: 'idcNivel' },

    ];
  }
  cargarListaUsuarios() {
    this.usuarioService.getUsuarios(this.usuarioContexto.numPatronalEmpresa!, this.pagination, this.cantReg)
      .subscribe({
        next: (res: IPaginatedResponseEmpleados) => {
          this.empleados = res.data;
          this.totalEmpleados = parseInt(res.count, 10);
        },
        error: (err) => {
          console.log(err);
        },
      });
  }
  buscadorPerfil(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }
  abrirNuevoEmpleado() {
    this.nuevoEmpleadoDialog = true;
  }
  listarExpedicion() {
    this.usuarioService.listarExpedicion()
      .subscribe((respuesta: any) => {
        if (respuesta.status) {
          this.listaExpedicion = respuesta.data;
        } else {
          console.log('Error sin datos');
        }
      });
  }

  listarGenero() {
    this.usuarioService.listarGenero()
      .subscribe((respuesta: any) => {
        if (respuesta.status) {
          this.listaGenero = respuesta.data;
        }
      });
  }

  consultarDatosPersona(ci: string, fechaNacimiento: string): Promise<any> {
    //const ci = '5818263'; // Estos datos probablemente vengan de algún formulario o estado de sesión
    //const fechaNacimiento = '04/06/1987'; // Asegúrate de formatear la fecha como se espera
    return new Promise((resolve, reject) => {
      this.asusService.consultaDatosPersona(ci, fechaNacimiento).subscribe({
        next: (respuesta) => {
          // Manejar la respuesta exitosa
          if (
            'datosPersonaEnFormatoJson' in respuesta &&
            respuesta.datosPersonaEnFormatoJson
          ) {
            this.verificadoSegip = true;
            this.notificacionService.mostrarMensaje("usuario", "success", "Consulta Segip", respuesta.descripcionRespuesta);
            resolve(respuesta.datosPersonaEnFormatoJson);
            // Puedes hacer más lógica aquí si es necesario
          } else {
            // Manejar la respuesta cuando no hay datos de persona (RespuestaError o RespuestaCIDuplicado)
            this.notificacionService.mostrarMensaje("usuario", "error", "Consulta Segip", respuesta.descripcionRespuesta);
            this.personaForm.reset();
            this.verificadoSegip = false;
            reject(respuesta.descripcionRespuesta);
          }
        },
        error: (error) => {
          // Manejar el error
          reject(error);
          console.log(error);
        },
      });
    });
  }

  async busquedaSegipAsus() {
    const ci = this.segipForm.get('documentoSegip')?.value;
    const fechaNacimiento = this.segipForm.get('fechaNacSegip')?.value;
    const fechaString = moment(fechaNacimiento).format('DD/MM/YYYY');
    if (ci && fechaString) {
      this.datosPersona = await this.consultarDatosPersona(ci, fechaString);
      if (this.datosPersona && Object.keys(this.datosPersona).length > 0) {
        this.personaForm.patchValue({
          aseNom: this.datosPersona.Nombres,
          aseApat: this.datosPersona.primerApellido,
          aseAmat: this.datosPersona.SegundoApellido,
          aseCiCom: this.datosPersona.Complemento,
          aseCi: this.datosPersona.NumeroDocumento,
          aseFecNac: this.datosPersona.FechaNacimiento,
          //empNpatronal: this.empPatronal,
        });
      }
    } else {
      this.notificacionService.mostrarMensaje("usuario", "error", "Error", 'Debe Completar el Carnet de Identidad y Fecha Nacimiento');
      console.log(
        'Debe Completar el Carnet de Identidad y Fecha Nacimiento'
      );
    }
  }
  /*Enviamos los datos para la busqueda en el SEGIP*/
  manejarClick() {
    this.busquedaSegipAsus();
  }
  /*Enviamos los datos para la busqueda en el SEGIP*/
  resetForm() {
    this.segipForm.reset();
    this.personaForm.reset();
  }
  mostrarDialogoUsuarioGuardar() {
    this.guardarEmpleadoDialogo = true;
  }

  confirmarGuardadoEmpleado() {

    if (this.verificadoSegip === true) {
      console.log('ingreso por validacion SEGIP');
      const fechaNacFormato = moment(this.personaForm.value.aseFecNac, 'DD/MM/YYYY').toDate();
      this.personaForm.patchValue({
        aseFecNac: fechaNacFormato,
        validacionSegip: this.verificadoSegip,
        empNpatronal: this.usuarioContexto.numPatronalEmpresa,
      });
    } else {
      this.personaForm.patchValue({
        validacionSegip: this.verificadoSegip,
        empNpatronal: this.usuarioContexto.numPatronalEmpresa,
      });
    }

    let usuario = { ...this.personaForm.value }
   this.usuarioService.guardarUsuario(usuario)
    .subscribe((respuesta: any) => {
      if(respuesta.status){
        this.guardarEmpleadoDialogo=false;
        this.nuevoEmpleadoDialog=false;
        this.cargarListaUsuarios();
        this.personaForm.reset();
        this.segipForm.reset();
      this.notificacionService.mostrarMensaje("usuario","success","Correcto",respuesta.message);
      }else{
        this.guardarEmpleadoDialogo=false;
        this.nuevoEmpleadoDialog=false;
        this.personaForm.reset();
        this.segipForm.reset();
        this.notificacionService.mostrarMensaje("usuario","error","Error",respuesta.message);
      }
    });
  }
  editarUsuario() {

  }
  confirmarEliminarUsuario() {
    this.eliminarUsuarioDialogo = false;
    this.eliminarUsuario(this.usuario.idPersona, this.usuario.usuario);
  }
  mostrarDialogoEliminar(a: any) {
    this.usuario = a;
    this.eliminarUsuarioDialogo = true;
  }
  eliminarUsuario(idPersona: number, idUsuario: string) {
    this.usuarioService.eliminarUsuario(idPersona, idUsuario).subscribe((respuesta: Mensaje) => {
      if (respuesta.status) {
        this.cargarListaUsuarios();
        this.notificacionService.mostrarMensaje("usuario", "success", "Correcto", respuesta.message);
      }
      else {
        this.notificacionService.mostrarMensaje("usuario", "error", "Error", respuesta.message);
      }
    });
  }
  abrirEditarUsuario(u: any) {
    this.idPersona = u.idPersona;
    this.editarUsuarioDialogo = true;
    this.personaForm.controls['aseNom'].setValue(u.aseNom);
    this.personaForm.controls['aseApat'].setValue(u.aseApat);
    this.personaForm.controls['aseAmat'].setValue(u.aseAmat);
    this.personaForm.controls['aseFecNac'].setValue(new Date(u.aseFecNac));
    this.personaForm.controls['aseCi'].setValue(u.aseCi);
    this.personaForm.controls['aseCargo'].setValue(u.aseCargo);
    this.personaForm.controls['aseHaber'].setValue(u.aseHaber);
    this.personaForm.controls['complemento'].setValue(u.complemento);
    this.personaForm.controls['aseCiext'].setValue(u.aseCiext);
    this.personaForm.controls['aseSexo'].setValue(u.aseSexo);
    this.personaForm.controls['idcEstado'].setValue(u.idcEstado);
    
  }

  confirmarEditarUsuario() {
    this.guardarEditarUsuarioDialogo = true;
  }

  guardarEditarUsuario() {
    console.log(this.personaForm.value);
    this.usuarioService.actualizarUsuario(this.personaForm.value, this.idPersona)
      .subscribe((respuesta: any) => {
        if (respuesta.status) {
          this.cargarListaUsuarios();
          this.guardarEditarUsuarioDialogo = false;
          this.editarUsuarioDialogo = false;
          this.personaForm.reset();
          this.notificacionService.mostrarMensaje("usuario", "success", "Correcto", respuesta.message);
        } else {
          this.personaForm.reset();
          this.notificacionService.mostrarMensaje("usuario", "error", "Error", respuesta.message);
        }
      });
  }

  cerrarEditarUsuario() {
    this.personaForm.reset();
    this.editarUsuarioDialogo = false;
  }
  abrirRestriccionesUsuario(u: any) {
    this.route.navigate(['inicio/restriccionesUsuario/' + u.idPersona]);

  }
  cerrarNuevoEmpleado() {
    this.nuevoEmpleadoDialog = false;
    this.personaForm.reset();
    this.segipForm.reset();
  }

}
