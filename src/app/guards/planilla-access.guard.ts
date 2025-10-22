// src/app/guards/planilla-access.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SessionService } from '../servicios/auth/session.service';
import { PlanillasAportesService } from '../servicios/planillas-aportes/planillas-aportes.service';
import { TokenService } from '../servicios/token/token.service';

@Injectable({
  providedIn: 'root'
})
export class PlanillaAccessGuard implements CanActivate {

  constructor(
    private router: Router,
    private sessionService: SessionService,
    private planillasService: PlanillasAportesService,
    private tokenService: TokenService
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const planillaId = route.params['id'];
    
    // Si no hay ID, redirige al listado
    if (!planillaId) {
      // Redirección basada en el rol
      const destination = this.sessionService.esAdministrador()
        ? '/cotizaciones/aprobar-planillas-aportes'
        : '/cotizaciones/planillas-aportes';
      this.router.navigate([destination]);
      return of(false);
    }

    // Verificar si el usuario tiene acceso a esta planilla
    return this.verificarAccesoPlanilla(planillaId);
  }

private verificarAccesoPlanilla(planillaId: string): Observable<boolean> {

  
  // Verificar si es administrador (puede ver todas las planillas)
  if (this.sessionService.esAdministrador()) {
    return of(true);
  }

  // Verificar que sessionService tiene datos válidos
  const sessionData = this.sessionService.sessionDataSubject.value;
 

  if (!sessionData || !sessionData.persona) {
    
    // En lugar de denegar, permitir acceso y dejar que el componente maneje la carga
    return of(true);
  }

  // Desencriptar el ID
  const idReal = this.tokenService.desencriptarId(planillaId);

  
  if (!idReal) {
    // Si no se puede desencriptar, intentar como número directo (compatibilidad)
    const idNumerico = parseInt(planillaId);
    if (!isNaN(idNumerico) && idNumerico > 0) {
      
      return this.verificarPlanillaPorId(idNumerico);
    } else {
      
      // En lugar de redirigir inmediatamente, hacer una pausa
      setTimeout(() => {
        const destination = this.sessionService.esAdministrador()
          ? '/cotizaciones/aprobar-planillas-aportes'
          : '/cotizaciones/planillas-aportes';
        this.router.navigate([destination]);
      }, 100);
      return of(false);
    }
  }

  return this.verificarPlanillaPorId(idReal);
}

private verificarPlanillaPorId(planillaId: number): Observable<boolean> {
  
  
  // Verificar que sessionService tiene los datos necesarios
  const codigoPatronalUsuario = this.sessionService.getCodigoPatronal();
  
  
  if (!codigoPatronalUsuario) {
    
    // Permitir acceso temporalmente para evitar bloqueos durante el reload
    return of(true);
  }

  // Para usuarios no administradores, verificar si la planilla pertenece a su empresa
  return this.planillasService.getPlanillaId(planillaId).pipe(
    map((response: any) => {
      
      
      if (!response || !response.planilla) {
        
        setTimeout(() => {
          const destination = this.sessionService.esAdministrador()
            ? '/cotizaciones/aprobar-planillas-aportes'
            : '/cotizaciones/planillas-aportes';
          this.router.navigate([destination]);
        }, 100);
        return false;
      }

      const planilla = response.planilla;
      const codigoPatronalPlanilla = planilla.cod_patronal;


      // Verificar si la planilla pertenece a la empresa del usuario
      if (codigoPatronalUsuario !== codigoPatronalPlanilla) {
        
        setTimeout(() => {
          this.router.navigate(['/denegado']);
        }, 100);
        return false;
      }

      
      return true;
    }),
    catchError((error) => {

      
      // En lugar de redirigir inmediatamente, hacer una pausa
      setTimeout(() => {
        const destination = this.sessionService.esAdministrador()
          ? '/cotizaciones/aprobar-planillas-aportes'
          : '/cotizaciones/planillas-aportes';
        this.router.navigate([destination]);
      }, 100);
      return of(false);
    })
  );
}
}