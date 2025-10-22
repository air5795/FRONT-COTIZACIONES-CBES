import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from "@angular/common/http";
import { Observable } from 'rxjs';
import { DetalleClasificador } from '../../dominio/DetalleClasificador';
@Injectable({
  providedIn: 'root'
})
export class DetalleClasificadorService {

  constructor(private http: HttpClient) { }
  getDetallesClasificadores(identificadorClasificador:string): Observable<any>{
    return this.http.get(environment.url+"clasificador-detalle/"+identificadorClasificador);
  }
  guardarDetalleClasificador(dc:DetalleClasificador): Observable<any>{
    return this.http.post(environment.url+"clasificador-detalle/create-clasificador",dc);
  }
  eliminarDetalleClasificador(idClasificador:number,usuario:string): Observable<any>{
    return this.http.patch(environment.url+"clasificador-detalle/delete-logico/"+idClasificador+"/"+usuario,{});
  }
  actualizarDetalleClasificador(idDetalleClasificador:number,dc:DetalleClasificador): Observable<any>{
    return this.http.put(environment.url+"clasificador-detalle/"+idDetalleClasificador,dc);
  }

}
