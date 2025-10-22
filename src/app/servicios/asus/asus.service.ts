
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import {
  RespuestaCIDuplicado,
  RespuestaError,
  RespuestaExitosa,
} from '../../interfaces/asus-externo/asus.interface';
import { environment } from '../../../environments/environment';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class AsusService {
  private readonly loginUrl = environment.loginUrlAsus;
  private readonly consultaUrl = environment.consultaUrlAsus;

  constructor(private http: HttpClient) {}

  private handleError(error: any) {
    // Manejo de errores
    return throwError(() => error);
  }

  private login(username: string, password: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http
      .post<any>(this.loginUrl, { username, password }, { headers })
      .pipe(catchError(this.handleError));
  }

  consultaDatosPersona(
    ci: string,
    fechaNacimiento: string
  ): Observable<RespuestaExitosa | RespuestaError | RespuestaCIDuplicado> {
    // Revisa si ya tienes un token y si no ha expirado
    const token = this.getTokenFromStorage(); // Suponiendo que tienes una función que recupera el token de algún lugar, como el localStorage
    if (token && !this.isTokenExpired(token)) {
      return this.makeConsultaDatosPersonaRequest(ci, fechaNacimiento, token);
    } else {
      // Si el token no existe o ha expirado, obtener uno nuevo
      return this.login(
        environment.userNameAsus,
        environment.passwordAsus
      ).pipe(
        switchMap((data) => {
          if (data.success) {
            const newToken = data.token;
            this.saveTokenToStorage(newToken); // Guarda el nuevo token donde corresponda
            return this.makeConsultaDatosPersonaRequest(
              ci,
              fechaNacimiento,
              newToken
            );
          } else {
            return throwError(() => new Error('Login fallido'));
          }
        }),
        catchError(this.handleError)
      );
    }
  }

  private makeConsultaDatosPersonaRequest(
    ci: string,
    fechaNacimiento: string,
    token: string
  ): Observable<RespuestaExitosa | RespuestaError | RespuestaCIDuplicado> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    return this.http
      .post<RespuestaExitosa | RespuestaError | RespuestaCIDuplicado>(
        this.consultaUrl,
        { ci, fechaNacimiento },
        { headers }
      )
      .pipe(catchError(this.handleError));
  }

  private getTokenFromStorage(): string | null {
    return localStorage.getItem('tokenAsus');
  }

  private saveTokenToStorage(token: string): void {
    localStorage.setItem('tokenAsus', token);
  }

  private removeTokenFromStorage(): void {
    localStorage.removeItem('tokenAsus');
  }

  private isTokenExpired(token: string): boolean {
    try {
      const decoded: any = jwtDecode(token);
      if (!decoded.exp) {
        return false;
      }

      const date = new Date(0);
      date.setUTCSeconds(decoded.exp);
      return date.valueOf() < new Date().valueOf();
    } catch (error) {
      // Si hay algún error al decodificar el token, asume que ha expirado
      return true;
    }
  }
}
