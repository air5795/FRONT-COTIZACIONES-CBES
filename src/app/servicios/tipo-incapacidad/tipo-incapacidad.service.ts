import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from "@angular/common/http";
import { Observable, map } from 'rxjs';
import { ITipoIncapacidad } from '../../interfaces/tipo-incapacidad/tipo-incapacidad.interface';
import { IApiResponse } from '../../interfaces/respuesta.interface';

@Injectable({
  providedIn: 'root'
})
export class TipoIncapacidadService {

  constructor(private http: HttpClient) { }

  findAllTipoIncapacidad(): Observable<any> {
    const url = `${environment.url}tipo-incapacidad/listar`
    return this.http.get(url);
  }
}
