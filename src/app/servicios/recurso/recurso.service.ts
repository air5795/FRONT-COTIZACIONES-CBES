import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from "@angular/common/http";
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class RecursoService {

  constructor(private http: HttpClient) { }
  getRecursos(): Observable<any>{
    return this.http.get(environment.url+"par-tipo-recurso/listar-par-tipo-recurso");
  }
  getRecursosPorSistema(): Observable<any>{
    return this.http.get(environment.url+"aut-recurso/listaRecursosBySistema/0");
  }
  guardarRecurso(r:any): Observable<any>{
    return this.http.post(environment.url+"aut-recurso/createautrecurso",r);
  }
  eliminarRecurso(idRecurso:number): Observable<any>{
    return this.http.patch(environment.url+"aut-recurso/delete-logico/"+idRecurso,{});
  }
  actualizarRecurso(r:any,idRecurso:number): Observable<any>{
    return this.http.put(environment.url+"aut-recurso/"+idRecurso,r);
  }
}
