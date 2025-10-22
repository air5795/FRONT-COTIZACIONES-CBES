import { Injectable } from '@angular/core';
import {Message, MessageService} from 'primeng/api';
@Injectable({
  providedIn: 'root'
})
export class NotificacionService {

  constructor(private serviceMensaje: MessageService) {}

  mostrarMensaje(key:string,tipo:string,titulo:string,mensaje:string){
    this.serviceMensaje.add({ key: key, severity: tipo, summary: titulo, detail: mensaje });
    }
}
