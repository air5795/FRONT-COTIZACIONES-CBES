import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UsuarioService } from '../../../servicios/usuario/usuario.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { PerfilService } from '../../../servicios/perfil/perfil.service';
import { SistemaService } from '../../../servicios/sistema/sistema.service';
import { ClasificadorService } from '../../../servicios/clasificador/clasificador.service';
import { MessageService } from 'primeng/api';
import { NotificacionService } from '../../../servicios/mensaje/notificacion.service';
import { Mensaje } from '../../../dominio/Mensaje';
import { Usuario } from '../../../dominio/Usuario';
@Component({
  selector: 'app-restriccion',
  templateUrl: './restriccion.component.html',
  styleUrl: './restriccion.component.css',
  providers: [MessageService,NotificacionService]
})
export class RestriccionComponent {
  usuario!:any;
  idPersona!:number;
  listaRestricciones!:any[];
  editarRestriccionDialogo:boolean=false;
  listaNiveles!:any[];
  listaDepartamento!:any[];
  listaSistemas!:any[];
  listaPerfiles!:any[];
  colIdPerfiles:any[]=[];
  sistemaSeleccionado:any;
  nivelForm!:FormGroup;
  perfilForm!:FormGroup;
  restriccion:any;
  idUsuarioRestriccion!:number;
  mostrarTabla:boolean=false;
  editarForm:boolean=false;
  guardarRestriccionDialogo:boolean=false;
  eliminarRestriccionDialogo:boolean=false;
  constructor(private route: ActivatedRoute, private usuarioService:UsuarioService, private perfilService:PerfilService,private sistemaService:SistemaService,private clasificadorService:ClasificadorService,private notificacionService:NotificacionService) {
    this.route.params.subscribe(params => {
      this.idPersona=params['id'];
    });
  }

  ngOnInit(){
      this.usuarioService.getUsuario(this.idPersona)
    .subscribe((respuesta: any) => {
      if (respuesta.status) {
        this.usuario=respuesta.data
        this.cargarListaRestricciones(this.usuario.usuario);
        this.listarSistemas();
        this.cargarListaNiveles();
      }
    });
    this.nivelForm = new FormGroup({
      idSistema: new FormControl('', [Validators.required]),
      idcNivel: new FormControl('', [Validators.required]),
      codDepartamento: new FormControl('', [Validators.required]),
    });
    this.perfilForm = new FormGroup({
      colIdPerfiles: new FormControl(),
    });

  }
  cargarListaRestricciones(u:string){
    this.usuarioService.getRestricciones(u)
    .subscribe((respuesta: any) => {
      console.log(respuesta.data);
      if(respuesta.status){
        this.listaRestricciones=respuesta.data;

      }
    });
  }
  cargarPerfiles(){
    if(this.sistemaSeleccionado){
    this.perfilService.getPerfiles(this.sistemaSeleccionado)
    .subscribe((respuesta: any) => {
      if(respuesta.status){
        console.log("perfiles",respuesta.data);
        this.listaPerfiles=respuesta.data;
        this.mostrarTabla=true;
      }
    });
  }else{
    this.mostrarTabla=false;
  }
}
listarSistemas(){
  this.sistemaService.getSistemas()
  .subscribe((respuesta: any) => {
    if (respuesta.status) {
      this.listaSistemas=respuesta.data
    }
  });
}
cargarListaNiveles(){
  this.clasificadorService.getNiveles()
  .subscribe((respuesta: any) => {
    if(respuesta.status){
      console.log(respuesta.data);
      this.listaNiveles=respuesta.data;
    }
  });
}
mostrarDialogoRestriccionGuardar(){
  this.guardarRestriccionDialogo=true;
}
  abrirNuevoRestriccion(){
    this.editarRestriccionDialogo=true;
  }
  mostrarDialogoEliminar(r:any){
    this.restriccion=r;
    console.log(this.restriccion);
    this.eliminarRestriccionDialogo=true;
  }
  confirmarEliminarRestriccion(){
    this.eliminarRestriccionDialogo=false;
    this.eliminarRestriccion(this.restriccion.idUsuarioRestriccion);
  }
  eliminarRestriccion(idRestriccion:number){
    this.usuarioService.eliminarRestricciones(idRestriccion).subscribe((respuesta:Mensaje) => {
      if(respuesta.status){
        this.cargarListaRestricciones(this.usuario.usuario);
        this.notificacionService.mostrarMensaje("restriccion","success","Correcto",respuesta.message);
      }
      else{
        this.notificacionService.mostrarMensaje("restriccion","error","Error",respuesta.message);
      }
    });
  }
  confirmarGuardadoRestriccion(){
    if(this.editarForm){
      this.editarForm=false;
      this.actualizarRestriccion();
    }else{
      this.guardarRestriccion();
    }

  }
  guardarRestriccion(){
    let restriccion={usuario:this.usuario.usuario, ...this.nivelForm.value, ...this.perfilForm.value }
    this.usuarioService.guardarRestricciones(restriccion)
    .subscribe((respuesta: any) => {
      if(respuesta.status){
        this.guardarRestriccionDialogo=false;
        this.editarRestriccionDialogo=false;
        this.perfilForm.reset();
        this.nivelForm.reset();
        this.cargarListaRestricciones(this.usuario.usuario);
      this.notificacionService.mostrarMensaje("restriccion","success","Correcto",respuesta.message);
      }else{
        this.guardarRestriccionDialogo=false;
        this.editarRestriccionDialogo=false;
        this.perfilForm.reset();
        this.nivelForm.reset();
        this.notificacionService.mostrarMensaje("restriccion","error","Error",respuesta.message);
      }
    })
  }
  actualizarRestriccion(){
    let restriccion={usuario:this.usuario.usuario, ...this.nivelForm.value, ...this.perfilForm.value }
    this.usuarioService.actualizarRestricciones(this.idUsuarioRestriccion,restriccion)
    .subscribe((respuesta: any) => {
      if(respuesta.status){
        this.guardarRestriccionDialogo=false;
        this.editarRestriccionDialogo=false;
        this.perfilForm.reset();
        this.nivelForm.reset();
        this.cargarListaRestricciones(this.usuario.usuario);
      this.notificacionService.mostrarMensaje("restriccion","success","Correcto",respuesta.message);
      }else{
        this.guardarRestriccionDialogo=false;
        this.editarRestriccionDialogo=false;
        this.perfilForm.reset();
        this.nivelForm.reset();
        this.notificacionService.mostrarMensaje("restriccion","error","Error",respuesta.message);
      }
    })
  }
  abrirEditarRestriccion(r:any){
    console.log(r);
    this.idUsuarioRestriccion=r.idUsuarioRestriccion;
    this.sistemaSeleccionado=r.idSistema;
    this.editarRestriccionDialogo=true;
    this.editarForm=true;
    this.colIdPerfiles=[];
    this.usuarioService.getPerfilesUsuario(this.sistemaSeleccionado,this.usuario.usuario)
    .subscribe((respuesta: any) => {
      this.listaPerfiles=respuesta.data;
      this.listaPerfiles.forEach(res=> {
        if(res.perfilAsignado==true){
          this.colIdPerfiles.push(res.idPerfil);
        }
     });
      this.nivelForm.controls['idSistema'].setValue(this.sistemaSeleccionado);
      this.nivelForm.controls['idcNivel'].setValue(r.idcNivel);
      this.nivelForm.controls['codDepartamento'].setValue(r.codDepartamento);
    });
  }
  cerrarNuevoUsuario(){
    this.editarRestriccionDialogo=false;
    this.sistemaSeleccionado=0;
    this.nivelForm.reset();
    this.perfilForm.reset();
  }
}
