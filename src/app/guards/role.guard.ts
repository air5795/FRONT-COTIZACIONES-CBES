import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, Router } from '@angular/router';
import { SessionService } from '../servicios/auth/session.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate, CanActivateChild {

  constructor(
    private readonly sessionService: SessionService,
    private readonly router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    // Validar sesión antes de revisar roles o permisos
    if (!this.sessionService.isAuthenticated()) {
      this.sessionService.clearSession();
      return false;
    }

    const roles = route.data?.['roles'] as string[] | undefined;
    const permisos = route.data?.['permisos'] as string[] | undefined;

    if (roles?.length) {
      const rolActual = this.sessionService.getRolActual();
      if (!roles.includes(rolActual)) {
        this.router.navigate(['/denegado']);
        return false;
      }
    }

    if (permisos?.length) {
      const tieneAlguno = permisos.some((permiso) => this.sessionService.tienePermiso(permiso));
      if (!tieneAlguno) {
        this.router.navigate(['/denegado']);
        return false;
      }
    }

    return true;
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot): boolean {
    return this.canActivate(childRoute);
  }
}

