import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AutentificacionService {
  constructor(private http: HttpClient) { }
  postContexto(contexto : any ): Observable<any>{
    return this.http.post(environment.url_seguridad+"aut-usuario/autorizacion/contexto",contexto);
  }
}
