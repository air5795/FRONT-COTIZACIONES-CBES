import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from "@angular/common/http";
import { Observable } from 'rxjs';
import { Sistema } from '../../dominio/Sistema';
@Injectable({
  providedIn: 'root'
})
export class SistemaService {

  constructor(private http: HttpClient) { }

  getSistemas(): Observable<any>{
    return this.http.get(environment.url+"par-sistema/listar-par-sistema");
  }
  guardarSistema(sistema:Sistema): Observable<any>{
    return this.http.post(environment.url+"par-sistema/add-par-sistema",sistema);
  }
  actualizarSistema(idSistema:number,sistema:Sistema): Observable<any>{
    return this.http.put(environment.url+"par-sistema/"+idSistema,sistema);
  }
  eliminarSistema(idSistema:number): Observable<any>{
    return this.http.patch(environment.url+"par-sistema/delete-logico/"+idSistema,{});
  }
}
