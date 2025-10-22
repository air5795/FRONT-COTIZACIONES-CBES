import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from "@angular/common/http";
import { Usuario } from '../../dominio/Usuario';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor(private http: HttpClient) { }

  postLogin( usuario: Usuario ): Observable<any>{
    return this.http.post(environment.url_seguridad+"autorizacion/login",usuario);
  }

}
