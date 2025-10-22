import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SessionService } from '../servicios/auth/session.service';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private sessionService: SessionService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.sessionService.getSessionData().pipe(
      take(1),
      map((session) => {
        const tieneUsuario = !!session?.usuario;
        const tieneRol = !!session?.rol && Object.keys(session.rol).length > 0;

        if (tieneUsuario && tieneRol) {
          return true;
        } else {
          
          return false;
        }
      })
    );
  }
}