import { Component } from '@angular/core';
import { SistemaService } from '../../servicios/sistema/sistema.service';
import { Sistema } from '../../dominio/Sistema';
import { Table } from 'primeng/table';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { LocalService } from '../../servicios/local/local.service';
import { Mensaje } from '../../dominio/Mensaje';
import { NotificacionService } from '../../servicios/mensaje/notificacion.service';
import {MessageService} from 'primeng/api';
@Component({
  selector: 'app-sistema',
  templateUrl: './sistema.component.html',
  styleUrl: './sistema.component.css',
  providers: [MessageService,NotificacionService]
})
export class SistemaComponent {
  sistema:Sistema | undefined;
  sistemas!:Sistema[];
  columnas: any[] | undefined;
  nuevoSistemaDialog:boolean=false;
  guardarSistemaDialogo:boolean=false;
  sistemaForm !: FormGroup;
  eliminarSistemaDialogo:boolean=false;
  editarForm:boolean=false;
  idSistema:number | undefined;
constructor(private sistemaService:SistemaService, private localService:LocalService,private notificacionService: NotificacionService){
  this.sistemaForm = new FormGroup({
    identificadorSistema: new FormControl('', [Validators.required, Validators.minLength(1)]),
    nombreSistema: new FormControl('', [Validators.required, Validators.minLength(3)]),
    descripcionSistema: new FormControl('', [Validators.required, Validators.minLength(3)]),
  });
}

ngOnInit() {
  this.cargarListaSistemas();
}

buscadorSistemas(table: Table, event: Event){
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');

}

cargarListaSistemas(){
  this.sistemaService.getSistemas()
  .subscribe((respuesta: any) => {
    if (respuesta.status) {
      this.sistemas=respuesta.data;
    }
  });
  this.columnas = [
    { field: 'identificadorSistema', header: 'identificadorSistema' },
];
}

abrirNuevoSistema() {
  this.nuevoSistemaDialog = true;
}
cerrarNuevoSistema() {
  this.editarForm=false;
  this.sistemaForm .reset();
  this.nuevoSistemaDialog = false;
}
abrirEditarSistema(s:Sistema) {
  this.idSistema=s.idSistema;
  this.sistemaForm.controls['identificadorSistema'].setValue(s.identificadorSistema);
  this.sistemaForm.controls['nombreSistema'].setValue(s.nombreSistema);
  this.sistemaForm.controls['descripcionSistema'].setValue(s.descripcionSistema);
  this.nuevoSistemaDialog = true;
  this.editarForm=true;
}
guardarSistema(){
  let s:Sistema=this.sistemaForm .value;
  s.fechaRegistro=new Date();
  s.fechaModificacion=new Date();
  s.usuarioRegistro=this.localService.getLocalStorage("usuario")!;
  s.usuarioModificacion=this.localService.getLocalStorage("usuario")!;
  s.bajaLogicaRegistro=false;
  this.sistemaService.guardarSistema(s).subscribe((respuesta:Mensaje) => {
    console.log(respuesta);
    if(respuesta.status){
      this.cargarListaSistemas();
      this.sistemaForm .reset();
      this.nuevoSistemaDialog = false;
      this.notificacionService.mostrarMensaje("sistema","success","Correcto",respuesta.message);
    }else{
      this.sistemaForm .reset();
      this.nuevoSistemaDialog = false;
      this.notificacionService.mostrarMensaje("sistema","error","Error",respuesta.message);
    }
  });

}
actualizarSistema(){
  let s:Sistema=this.sistemaForm .value;
  s.fechaModificacion=new Date();
  s.usuarioModificacion=this.localService.getLocalStorage("usuario")!;
  this.sistemaService.actualizarSistema(this.idSistema!,s).subscribe((respuesta:Mensaje) => {
    if(respuesta.status){
      this.cargarListaSistemas();
      this.sistemaForm .reset();
      this.nuevoSistemaDialog = false;
      this.notificacionService.mostrarMensaje("sistema","success","Correcto",respuesta.message);
    }else{
      this.nuevoSistemaDialog = false;
      this.notificacionService.mostrarMensaje("sistema","error","Error",respuesta.message);
    }
  });
}
eliminarSistema(id:number){
this.sistemaService.eliminarSistema(id).subscribe((respuesta:Mensaje) => {
  if(respuesta.status){
    this.cargarListaSistemas();
    this.notificacionService.mostrarMensaje("sistema","success","Correcto",respuesta.message);
  }
});
}
confirmarEliminar(){
  this.eliminarSistemaDialogo=false;
  this.eliminarSistema(this.sistema?.idSistema!);
}
mostrarDialogoEliminar(s:Sistema){
  this.sistema=s;
  this.eliminarSistemaDialogo=true;

}
confirmarGuardado(){
  this.guardarSistemaDialogo=false;
  if(this.editarForm){
    this.actualizarSistema();
    this.editarForm=false;
  }else{
    this.guardarSistema();
  }
}
mostrarDialogoGuardar(){
  this.guardarSistemaDialogo=true;
}
}


