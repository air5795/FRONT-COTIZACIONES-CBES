import { ClasificadorService } from './../../servicios/clasificador/clasificador.service';
import { Component } from '@angular/core';
import { SistemaService } from '../../servicios/sistema/sistema.service';
import { PerfilService } from '../../servicios/perfil/perfil.service';
import { Perfil } from '../../dominio/perfil';
import { Table } from 'primeng/table';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { LocalService } from '../../servicios/local/local.service';
import { NotificacionService } from '../../servicios/mensaje/notificacion.service';
import { MessageService } from 'primeng/api';
import { Mensaje } from '../../dominio/Mensaje';
@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css',
  providers: [MessageService,NotificacionService]
})
export class PerfilComponent {
  listaSistemas!:any[];
  perfiles!:Perfil[];
  columnas: any[] | undefined;
  sistemaSeleccionado:any;
  mostrarTabla:boolean=false;
  nuevoPerfilDialog:boolean=false;
  nivelesPerfil!:any[];
  niveles!:any[];
  perfilForm!:FormGroup;
  guardarPerfilDialogo:boolean=false;
  eliminarPerfilDialogo:boolean=false;
  colIdRecurso:any[]=[];
  editarForm:boolean=false;
  perfil:any;
  idPerfil!:number;
  constructor(private sistemaService:SistemaService,private perfilService:PerfilService,private clasificadorService:ClasificadorService,private localService:LocalService, private notificacionService:NotificacionService){
  }
  ngOnInit() {
    this.perfilForm = new FormGroup({
      nombrePerfil: new FormControl('', [Validators.required, Validators.minLength(1)]),
      descripcionPerfil: new FormControl('', [Validators.required, Validators.minLength(3)]),
      idcNivelRestriccion: new FormControl('', [Validators.required]),
      colIdRecurso: new FormControl(),
    });
    this.cargarListaSistemas();
    this.columnas = [
      { field: 'nombrePerfil', header: 'nombrePerfil' },
      { field: 'descripcionPerfil', header: 'descripcionPerfil' },
      { field: 'idcNivelRestriccion', header: 'idcNivelRestriccion' },
  ];
  }
  cargarListaSistemas(){
    this.sistemaService.getSistemas()
    .subscribe((respuesta: any) => {
      if(respuesta.status){
        this.listaSistemas=respuesta.data;
      }
    });
  }
  cargarListaNivelesPerfil(){
    this.perfilService.getPerfilesNiveles(0,this.sistemaSeleccionado)
    .subscribe((respuesta: any) => {
      if(respuesta){
        if(respuesta.status){
          this.nivelesPerfil=respuesta.data;
        }

      }else{
        this.nivelesPerfil=[];
      }
    });
  }
  cargarListaPerfilRecurso(idPerfil:number): any[]{
    let r:any=[];
    r=this.perfilService.getPerfilesNiveles(idPerfil,this.sistemaSeleccionado)
    .subscribe((respuesta: any) => {
      if(respuesta.status){
        r=respuesta.data;
        return r;
      }
    });
    return r;
  }
  cargarListaNiveles(){
    this.clasificadorService.getNiveles()
    .subscribe((respuesta: any) => {
      if(respuesta.status){
        console.log(respuesta.data);
        this.niveles=respuesta.data;
      }
    });
  }

  mostrarPerfiles(){
    if(this.sistemaSeleccionado){
    this.perfilService.getPerfiles(this.sistemaSeleccionado)
    .subscribe((respuesta: any) => {
      console.log(respuesta);
      if(respuesta.status && respuesta.data.length>0){
        this.perfiles=respuesta.data;
        this.mostrarTabla=true;
        this.cargarListaNivelesPerfil();
        this.cargarListaNiveles();
      }else{
        this.perfiles=[];
        this.mostrarTabla=true;
        this.cargarListaNivelesPerfil();
        this.cargarListaNiveles();
      }
    });
  }else{
    this.mostrarTabla=false;
  }
}
confirmarGuardadoPerfil(){
  if(this.editarForm){
    this.actualizarPerfil();
    this.guardarPerfilDialogo=false;
    this.editarForm=false;
  }else{
    this.guardarPerfil();
    this.guardarPerfilDialogo=false;
  }
}
guardarPerfil(){
  let p:any=this.perfilForm.value;
  p.idSistema=this.sistemaSeleccionado;
  p.usuarioRegistro=this.localService.getLocalStorage("usuario")!;
  p.usuarioModificacion=this.localService.getLocalStorage("usuario")!;
  this.perfilService.guardarPerfilRecurso(0,p).subscribe((respuesta: any) =>{
    if(respuesta.status){
      this.nuevoPerfilDialog=false;
      this.perfilForm.reset();
      this.mostrarPerfiles();
      this.notificacionService.mostrarMensaje("perfil","success","Correcto",respuesta.message);
    }else{
      this.nuevoPerfilDialog=false;
      this.perfilForm.reset();
      this.notificacionService.mostrarMensaje("perfil","error","Error",respuesta.message);
    }
  })

}
actualizarPerfil(){
  let p:any=this.perfilForm.value;
  p.idSistema=this.sistemaSeleccionado;
  p.usuarioModificacion=this.localService.getLocalStorage("usuario")!;
  this.perfilService.guardarPerfilRecurso(this.idPerfil,p).subscribe((respuesta: any) =>{
    console.log(respuesta);
    if(respuesta.status){
      this.nuevoPerfilDialog=false;
      this.perfilForm.reset();
      this.mostrarPerfiles();
      this.notificacionService.mostrarMensaje("perfil","success","Correcto",respuesta.message);
    }else{
      this.nuevoPerfilDialog=false;
      this.perfilForm.reset();
      this.notificacionService.mostrarMensaje("perfil","error","Error",respuesta.message);
    }
  })
}
eliminarPerfil(id:number){
  this.perfilService.eliminarPerfil(id).subscribe((respuesta:Mensaje) => {
    if(respuesta.status){
      this.mostrarPerfiles();
      this.notificacionService.mostrarMensaje("perfil","success","Correcto",respuesta.message);
    }
    else{
      this.notificacionService.mostrarMensaje("perfil","error","Error",respuesta.message);
    }
  });
}
abrirEditarPerfil(p:any){
  this.idPerfil=p.idPerfil;
  this.perfilForm.controls['nombrePerfil'].setValue(p.nombrePerfil);
  this.perfilForm.controls['descripcionPerfil'].setValue(p.descripcionPerfil);
  this.perfilForm.controls['idcNivelRestriccion'].setValue(p.idcNivelRestriccion);
  this.perfilService.getPerfilesNiveles(p.idPerfil,this.sistemaSeleccionado)
    .subscribe((respuesta: any) => {
      if(respuesta.status){
        this.colIdRecurso=this.obtenerIds(respuesta.data);
        console.log("recursos",this.colIdRecurso);
      }
    });
  this.nuevoPerfilDialog = true;
  this.editarForm=true;
}
obtenerIds(recursos:any[]):any[]{
  return recursos.map((recurso) => recurso.recursoAsignado==true?recurso.idRecurso:null);
}
confirmarEliminarPerfil(){
  this.eliminarPerfilDialogo=false;
  this.eliminarPerfil(this.perfil.idPerfil);
}
mostrarDialogoEliminarPerfil(p:any){
  this.perfil=p;
  this.eliminarPerfilDialogo=true;
}
listaTablaClasificadores(table: Table, event: Event){
  table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
}
abrirNuevoPerfil() {
  this.nuevoPerfilDialog = true;
}
cerrarNuevoPerfil(){
  this.nuevoPerfilDialog = false;
  this.editarForm=false;
  this.colIdRecurso=[];
  this.perfilForm .reset();
}
mostrarDialogoPerfilGuardar(){
  this.guardarPerfilDialogo=true;
}
}
