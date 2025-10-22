import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Usuario } from '../../dominio/Usuario';
import { IPaginatedResponseEmpleados, IEmpleado } from '../../interfaces/empleados.interface';
import { IApiResponse } from '../../interfaces/respuesta.interface';
@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  constructor(private http: HttpClient) { }
  getUsuarios(numPatronal: string,
    page: number,
    cantidad: number): Observable<IPaginatedResponseEmpleados> {
    const url = `${environment.url}empleado/lista-empleados/${numPatronal}?limit=${cantidad}&offset=${page}`;
    return this.http.get<IApiResponse<IPaginatedResponseEmpleados>>(url).pipe(
      map((response) => {
        // Comprueba si la respuesta es válida
        if (response.status && response.data) {
          return response.data;
        }
        // Lanza un error si la respuesta no es válida
        console.log(response.message);
        throw new Error('No se pudo obtener los empleados');
      })
    ); // Aquí se cambió any a PaginatedResponse
  }

  getFindAllEmpleados(empNpatronal: string): Observable<IEmpleado[]> {
    const url = `${environment.url}empleado/find-all-empleados/${empNpatronal}`;
    return this.http.get<IApiResponse<IEmpleado[]>>(url).pipe(
      map((response) => {
        if (response.status && response.data) {
          return response.data;
        }
        throw new Error('No se pudo obtener los empleados');
      })
    );
  }

  getUsuario(idPersona: number): Observable<any> {
    return this.http.get(environment.url + "aut-persona/aut-pers-usuario/" + idPersona);
  }
  getEmpleado(carnet: number): Observable<any> {
    return this.http.get(environment.url + "empleado/busca-empleado/" + carnet);
  }
  guardarSistema(usuario: Usuario): Observable<any> {
    return this.http.post(environment.url + "aut-usuario/adicionar", usuario);
  }
  listarExpedicion(): Observable<any> {
    return this.http.get(environment.url + "par-clasificador-detalle/EXPEDICION");
  }
  listarGenero(): Observable<any> {
    return this.http.get(environment.url + "par-clasificador-detalle/GENERO");
  }
  listarEstadoUsuario(): Observable<any> {
    return this.http.get(environment.url + "clasificador-detalle/identificadorclasificador/ESTADO_USUARIO");
  }
  guardarUsuario(usuario: any): Observable<any> {
    return this.http.post(environment.url + "empleado/crear-empleado-no-afiliado", usuario);
  }
  eliminarUsuario(idPersona: number, idUsuario: string): Observable<any> {
    return this.http.patch(environment.url + "aut-usuario/delete-logico/" + idPersona + "/" + idUsuario, {});
  }
  actualizarUsuario(usuario: any, idpersona: number): Observable<any> {
    return this.http.put(environment.url + "aut-persona/" + idpersona, usuario);
  }
  getRestricciones(usuario: string): Observable<any> {
    return this.http.get(environment.url + "aut-usuario-restriccion/" + usuario);
  }
  guardarRestricciones(perfiles: any): Observable<any> {
    return this.http.post(environment.url + "aut-usuario-restriccion/adicionar-perfiles", perfiles);
  }
  eliminarRestricciones(idRestriccion: any): Observable<any> {
    return this.http.delete(environment.url + "aut-usuario-restriccion/" + idRestriccion);
  }
  getPerfilesUsuario(idSistema: number, usuario: string): Observable<any> {
    return this.http.get(environment.url + "aut-perfil/aut-usuario-perfil/" + idSistema + "/" + usuario);
  }
  actualizarRestricciones(idUsuarioRestriccion: number, perfiles: any): Observable<any> {
    return this.http.put(environment.url + "aut-usuario-restriccion/update-usurestperfil/" + idUsuarioRestriccion, perfiles);

  }
}
