import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from "@angular/common/http";
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PerfilService {

  constructor(private http: HttpClient) { }
  getPerfiles(idSistema:number): Observable<any>{
    return this.http.get(environment.url+"aut-perfil/sistema/"+idSistema);
  }
  getPerfilesNiveles(idPerfil:number,idSistema:number): Observable<any>{
    return this.http.get(environment.url+"aut-perfil/aut-perfil-recurso/"+idPerfil+"/"+idSistema);
  }
  guardarPerfilRecurso(idPerfil:number,perfil:any): Observable<any>{
    return this.http.post(environment.url+"aut-perfil/aut-perfil-recurso/"+idPerfil,perfil);
  }
  eliminarPerfil(idPerfil:number): Observable<any>{
    return this.http.patch(environment.url+"aut-perfil/delete-logico/"+idPerfil,{});
  }
}
