import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from "@angular/common/http";
import { Observable } from 'rxjs';
import { Clasificador } from '../../dominio/Clasificador';
@Injectable({
  providedIn: 'root'
})
export class ClasificadorService {

  constructor(private http: HttpClient) { }
  getClasificadores(): Observable<any>{
    return this.http.get(environment.url+"clasificador/listar");
  }
  guardarClasificador(c:Clasificador): Observable<any>{
    return this.http.post(environment.url+"clasificador",c);
  }
  eliminarClasificador(idClasificador:number): Observable<any>{
    return this.http.patch(environment.url+"clasificador/delete-logico/"+idClasificador,{});
  }
  actualizarClasificador(idClasificador:number,c:Clasificador): Observable<any>{
    console.log(idClasificador,c);
    return this.http.put(environment.url+"clasificador/"+idClasificador,c);
  }
  getNiveles(): Observable<any>{
    return this.http.get(environment.url+"clasificador-detalle/identificadorclasificador/NIVEL_RESTRICCION");
  }

}
