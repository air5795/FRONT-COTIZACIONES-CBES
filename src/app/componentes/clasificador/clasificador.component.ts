import { Component } from '@angular/core';
import { ClasificadorService } from '../../servicios/clasificador/clasificador.service';
import { Mensaje } from '../../dominio/Mensaje';
import { Clasificador } from '../../dominio/Clasificador';
import { DetalleClasificador } from '../../dominio/DetalleClasificador';
import { DetalleClasificadorService } from '../../servicios/clasificador/detalle-clasificador.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { LocalService } from '../../servicios/local/local.service';
import { NotificacionService } from '../../servicios/mensaje/notificacion.service';
import {MessageService} from 'primeng/api';
import { Table } from 'primeng/table';
@Component({
  selector: 'app-clasificador',
  templateUrl: './clasificador.component.html',
  styleUrl: './clasificador.component.css',
  providers: [MessageService,NotificacionService]
})
export class ClasificadorComponent {
  columnas: any[] | undefined;
  listaClasificadores:any []| undefined;
  expandedRows = {};
  nuevoClasificadorDialog:boolean=false;
  confirmClasificadorDialogo:boolean=false;
  clasificadorForm!:FormGroup;
  editarForm:boolean=false;
  clasificador!:Clasificador;
  eliminarClasificadorDialogo:boolean=false;
  idClasificador:number | undefined;

  nuevoClasificadorDetalleDialog:boolean=false;
  clasificadorDetalleForm!:FormGroup;
  confirmDetalleClasificadorDialogo:boolean=false;
  editarFormDetalle:boolean=false;
  identificadorClasificador!:string;
  idDetalleClasificador!:number;
  eliminarDetalleClasificadorDialogo:boolean=false;
  detalleClasificador!:DetalleClasificador;
  constructor(private clasificadorService:ClasificadorService, private detalleClasificadorService:DetalleClasificadorService, private localService:LocalService,private notificacionService: NotificacionService){
  }
  ngOnInit() {
    this.cargarListaClasificadores();
    this.clasificadorForm = new FormGroup({
      identificadorClasificador: new FormControl('', [Validators.required, Validators.minLength(3)]),
      descripcionClasificador: new FormControl('', [Validators.required, Validators.minLength(3)]),
    });
    this.clasificadorDetalleForm = new FormGroup({
      identificadorClasificadorDetalle: new FormControl('', [Validators.required, Validators.minLength(3)]),
      nombreClasificadorDetalle: new FormControl('', [Validators.required, Validators.minLength(3)]),
      orden: new FormControl('', [Validators.required]),
      descripcionClasificadorDetalle: new FormControl('', [Validators.required, Validators.minLength(3)]),
    });
    this.columnas = [
      { field: 'identificadorClasificador', header: 'identificadorClasificador' },
      { field: 'descripcionClasificador', header: 'descripcionClasificador' },
      { field: 'fechaRegistro', header: 'fechaRegistro' },
  ];
  }
  cargarListaClasificadores(){
    this.clasificadorService.getClasificadores()
  .subscribe((respuesta: any) => {
    if(respuesta.status){
      this.listaClasificadores=respuesta.data;
      this.listaClasificadores?.forEach(c => {
        this.detalleClasificadorService.getDetallesClasificadores(c.identificadorClasificador)
        .subscribe((resp: any) => {
            c.detalles=resp.data;
        })
      })
    }
  });

  }
  guardarClasificador(){
    let c:Clasificador=this.clasificadorForm.value;
    c.usuarioRegistro=this.localService.getLocalStorage("usuario")!;
    c.usuarioModificacion=this.localService.getLocalStorage("usuario")!;
    this.clasificadorService.guardarClasificador(c)
  .subscribe((respuesta: any) => {
    if(respuesta.status){
    this.confirmClasificadorDialogo=false;
    this.clasificadorForm.reset();
    this.cargarListaClasificadores();
    this.notificacionService.mostrarMensaje("clasificador","success","Correcto",respuesta.message);
    }else{
      this.confirmClasificadorDialogo=false;
      this.clasificadorForm.reset();
      this.notificacionService.mostrarMensaje("clasificador","error","Error",respuesta.message);
    }
  })
  }
  actualizarClasificador(){
    console.log("llegooo");
    let c:Clasificador=this.clasificadorForm.value;
    c.usuarioModificacion=this.localService.getLocalStorage("usuario")!;
    this.clasificadorService.actualizarClasificador(this.idClasificador!,c)
  .subscribe((respuesta: any) => {
    if(respuesta.status){
      this.confirmClasificadorDialogo=false;
    this.clasificadorForm.reset();
    this.cargarListaClasificadores();

    }else{
      this.confirmClasificadorDialogo=false;
      this.clasificadorForm.reset();
      this.notificacionService.mostrarMensaje("clasificador","error","Error",respuesta.message);
    }
  })
  }
  eliminarClasificador(id:number){
    this.clasificadorService.eliminarClasificador(id).subscribe((respuesta:Mensaje) => {
      if(respuesta.status){
        this.cargarListaClasificadores();
        this.notificacionService.mostrarMensaje("clasificador","success","Correcto",respuesta.message);
      }
      else{
        this.notificacionService.mostrarMensaje("clasificador","error","Error",respuesta.message);
      }
    });
  }
  confirmarGuardado(){
    if(this.editarForm){
      this.actualizarClasificador();
      this.nuevoClasificadorDialog = false;
      this.editarForm=false;
    }else{
      this.guardarClasificador();
      this.nuevoClasificadorDialog = false;
    }
  }
  cerrarNuevoClasificador() {
    this.editarForm=false;
    this.clasificadorForm .reset();
    this.nuevoClasificadorDialog = false;
  }
  abrirNuevoClasificador() {
    this.nuevoClasificadorDialog = true;
  }
  mostrarDialogoConfirmarGuardar(){
    this.confirmClasificadorDialogo=true;
  }
  mostrarDialogoEliminar(s:Clasificador){
    this.clasificador=s;
    this.eliminarClasificadorDialogo=true;
  }
  confirmarEliminar(){
    this.eliminarClasificadorDialogo=false;
    this.eliminarClasificador(this.clasificador?.idClasificador!);
  }
  abrirEditarClasificador(c:Clasificador){
    this.idClasificador=c.idClasificador;
    this.clasificadorForm.controls['identificadorClasificador'].setValue(c.identificadorClasificador);
    this.clasificadorForm.controls['descripcionClasificador'].setValue(c.descripcionClasificador);
    this.nuevoClasificadorDialog = true;
    this.editarForm=true;
  }
  /*************************************************/
  abrirNuevoDetalleClasificador(ic:string) {
    this.nuevoClasificadorDetalleDialog = true;
    this.identificadorClasificador=ic;
  }
  abrirEditarDetalleClasificador(dc:DetalleClasificador){
    this.idDetalleClasificador=dc.idClasificadorDetalle;
    this.clasificadorDetalleForm.controls['identificadorClasificadorDetalle'].setValue(dc.identificadorClasificadorDetalle);
    this.clasificadorDetalleForm.controls['nombreClasificadorDetalle'].setValue(dc.nombreClasificadorDetalle);
    this.clasificadorDetalleForm.controls['orden'].setValue(dc.orden);
    this.clasificadorDetalleForm.controls['descripcionClasificadorDetalle'].setValue(dc.descripcionClasificadorDetalle);
    this.nuevoClasificadorDetalleDialog = true;
    this.editarFormDetalle=true;
  }
  cerrarNuevoDetalleClasificador() {
    this.editarFormDetalle=false;
    this.clasificadorDetalleForm.reset();
    this.nuevoClasificadorDetalleDialog = false;
  }
  mostrarDetalleDialogoConfirmarGuardar(){
    this.confirmDetalleClasificadorDialogo=true;
  }
  mostrarDetalleDialogoEliminar(dc:DetalleClasificador){
    this.detalleClasificador=dc;
    this.eliminarDetalleClasificadorDialogo=true;
  }
  confirmarDetalleEliminar(){
    this.eliminarDetalleClasificadorDialogo=false;
    let usuario=this.localService.getLocalStorage("usuario")!;
    this.eliminarDetalleClasificador(this.detalleClasificador?.idClasificadorDetalle,usuario);
  }
  guardarDetalleClasificador(){
    let dc:DetalleClasificador=this.clasificadorDetalleForm.value;
    dc.identificadorClasificador=this.identificadorClasificador;
    dc.usuarioRegistro=this.localService.getLocalStorage("usuario")!;
    dc.usuarioModificacion=this.localService.getLocalStorage("usuario")!;
    this.detalleClasificadorService.guardarDetalleClasificador(dc)
  .subscribe((respuesta: any) => {
    if(respuesta.status){
    this.confirmDetalleClasificadorDialogo=false;
    this.clasificadorDetalleForm.reset();
    this.identificadorClasificador='';
    this.cargarListaClasificadores();
    this.notificacionService.mostrarMensaje("clasificador","success","Correcto",respuesta.message);
    }else{
      this.notificacionService.mostrarMensaje("clasificador","error","Error",respuesta.message);
    }
  })
  }
  confirmarDetalleGuardado(){
    if(this.editarFormDetalle){
      this.actualizarDetalleClasificador();
      this.nuevoClasificadorDetalleDialog = false;
      this.editarFormDetalle=false;
    }else{
      this.guardarDetalleClasificador();
      this.nuevoClasificadorDetalleDialog = false;
    }
  }
  eliminarDetalleClasificador(id:number,usuario:string){
    this.detalleClasificadorService.eliminarDetalleClasificador(id,usuario).subscribe((respuesta:Mensaje) => {
      if(respuesta.status){
        this.cargarListaClasificadores();
        this.notificacionService.mostrarMensaje("clasificador","success","Correcto",respuesta.message);

      }
    });
  }
  actualizarDetalleClasificador(){
    let dc:DetalleClasificador=this.clasificadorDetalleForm.value;
    dc.usuarioModificacion=this.localService.getLocalStorage("usuario")!;
    console.log(dc);
    this.detalleClasificadorService.actualizarDetalleClasificador(this.idDetalleClasificador!,dc)
  .subscribe((respuesta: any) => {
    if(respuesta.status){
    this.confirmDetalleClasificadorDialogo=false;
    this.clasificadorDetalleForm.reset();
    this.cargarListaClasificadores();
    this.notificacionService.mostrarMensaje("clasificador","success","Correcto",respuesta.message);
    }else{
      this.notificacionService.mostrarMensaje("clasificador","error","Error",respuesta.message);
    }
  })
  }
  listaTablaClasificadores(table: Table, event: Event){
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');

}
}
