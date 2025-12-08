import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { SessionService } from '../servicios/auth/session.service';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {

  constructor(private sessionService: SessionService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    // 1. Si ya hay sesión válida, refrescar si aplica y continuar
    if (this.sessionService.isAuthenticated()) {
      return this.sessionService.refreshTokenIfExpiring().pipe(
        map(() => true),
        catchError(() => {
          this.sessionService.clearSession();
          return of(false);
        })
      );
    }

    // 2. Intentar construir sesión desde query param o sessionStorage
    const sessionIdFromRoute = route.queryParamMap.get('sessionId');
    const sessionIdFromStorage = this.sessionService.getSessionId();
    const sessionId = sessionIdFromRoute || sessionIdFromStorage;

    if (sessionId) {
      return this.sessionService.fetchSessionData(sessionId).pipe(
        switchMap(() => {
          if (this.sessionService.isAuthenticated()) {
            return this.sessionService.refreshTokenIfExpiring().pipe(map(() => true));
          }
          this.sessionService.clearSession();
          return of(false);
        }),
        catchError(() => {
          this.sessionService.clearSession();
          return of(false);
        })
      );
    }

    // 3. No hay forma de autenticar
    this.sessionService.clearSession();
    return of(false);
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.canActivate(childRoute, state);
  }
}