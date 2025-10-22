// session.service.ts - Versión completa y funcional

import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { switchMap, catchError, tap, filter, shareReplay, take, finalize, timeout } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AccessLogService } from './access-log.service';

@Injectable({
  providedIn: 'root',
})
export class SessionService implements OnDestroy {
  readonly sessionDataSubject = new BehaviorSubject<any | null>(null);
  public sessionData$: Observable<any> = this.sessionDataSubject.asObservable().pipe(
    filter((data) => data !== null),
    shareReplay(1)
  );

  private destroy$ = new Subject<void>();
  private isInitialized = false;
  private refreshTokenTimer: any = null;
  private isRefreshing = false;
  private debugMode = true;

  constructor(
    private readonly http: HttpClient,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly accessLogService: AccessLogService
  ) {
    this.startRefreshTokenTimer();
  }

  ngOnDestroy(): void {
    
    this.destroy$.next();
    this.destroy$.complete();

    if (this.refreshTokenTimer) {
      clearInterval(this.refreshTokenTimer);
      this.refreshTokenTimer = null;
    }
  }

//Inicializa la sesión con debugging mejorado
  initSession(): Observable<any> {
    const currentData = this.sessionDataSubject.value;
    if (currentData?.usuario) {
      if (currentData?.token) {
        if (!this.isTokenExpiringSoon()) {
          return of(currentData);
        } else {
        }
      }
    }

    return this.route.queryParams.pipe(
      switchMap((params) => {
        const sessionIdFromParams = params['sessionId'];
        if (sessionIdFromParams) {
          this.saveSessionId(sessionIdFromParams);
          return this.fetchSessionData(sessionIdFromParams);
        }
        const sessionIdFromStorage = this.getSessionId();
        if (sessionIdFromStorage) {
          return this.fetchSessionData(sessionIdFromStorage);
        }
        this.redirectToLogin();
        return of(null);
      })
    );
  }

//Obtiene datos de sesión del servidor con mejor manejo de errores

  public fetchSessionData(sessionId: string): Observable<any> {
    return this.http.get(`${environment.urlMSAuth}?sessionId=${sessionId}`).pipe(
      tap((data: any) => {

        if (data && data.usuario) {
          const transformedData = this.transformSessionData(data);
          this.saveSessionData(transformedData, sessionId);
          this.sessionDataSubject.next(transformedData);
          this.isInitialized = true;

        } else {
          this.handleInvalidSession();
        }
      }),
      catchError((error) => {
        
        // Analizar el tipo de error
        if (error.status === 401) {
          // Limpiar sessionId inválido y redirigir
          this.clearInvalidSession();
        } else if (error.status === 404) {
          console.error('SessionService: Error 404 - Endpoint no encontrado');
        } else if (error.status === 0) {
          console.error('SessionService: Error de conectividad - Servidor no responde');
        } else {
          console.error('SessionService: Error desconocido:', error.status, error.message);
        }
        
        this.sessionDataSubject.next(null);
        return of(null);
      })
    );
  }

//Refresca el token de acceso
  refreshToken(): Observable<boolean> {

    if (this.isRefreshing) {
      return of(false);
    }

    this.isRefreshing = true;
    const currentSessionData = this.sessionDataSubject.value;

    if (!currentSessionData?.refreshToken) {
      this.isRefreshing = false;
      if (this.isTokenExpiringSoon()) {
        this.clearSession();
      }
      return of(false);
    }

    const refreshPayload = {
      refreshToken: currentSessionData.refreshToken
    };

    // Llamar al endpoint de refresh
    return this.http.post<{
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      tokenType: string;
    }>(`${environment.urlMSAuthRefreshToken}auth/refresh-token`, refreshPayload).pipe(
      take(1), // Solo tomar la primera respuesta
      timeout(15000), // 15 segundos de timeout
      tap(response => {
      }),
      switchMap(response => {

        if (response && response.accessToken) {
          // ✅ Actualizar tokens en memoria INMEDIATAMENTE
          const updatedSessionData = {
            ...currentSessionData,
            token: response.accessToken,
            refreshToken: response.refreshToken
          };
          this.sessionDataSubject.next(updatedSessionData);
          
          // ✅ También guardar en sessionStorage
          this.saveTokensToStorage(updatedSessionData);
          return of(true);
        } else {
          return of(false);
        }
      }),
      catchError(error => {
        
        // No hacer logout inmediato en todos los casos
        if (error.status === 401) {
          console.warn('SessionService: RefreshToken expirado o inválido - logout necesario');
          this.clearSession();
        } else if (error.status === 400) {
          console.warn('SessionService: Request de refresh mal formado');
        } else {
          console.warn('SessionService: Error temporal en refresh, reintentará más tarde');
        }
        
        return of(false);
      }),
      finalize(() => {
        this.isRefreshing = false;
      })
    );
  }

  /**
   * ✅ NUEVO: Guarda tokens en sessionStorage
   */
  private saveTokensToStorage(sessionData: any): void {
    try {
      const tokenData = {
        token: sessionData.token,
        refreshToken: sessionData.refreshToken,
        usuario: sessionData.usuario,
        timestamp: Date.now()
      };
      
      sessionStorage.setItem('tokenBackup', JSON.stringify(tokenData));
    } catch (error) {
    }
  }

  /**
   * ✅ NUEVO: Recupera tokens desde sessionStorage
   */
  private loadTokensFromStorage(): any {
    try {
      const stored = sessionStorage.getItem('tokenBackup');
      if (stored) {
        const data = JSON.parse(stored);
        return data;
      }
    } catch (error) {
    }
    return null;
  }

  /**
   * Crea o actualiza una sesión en el backend
   */
  private createSession(sessionData: any): Observable<any> {
    return this.http.post(`${environment.urlMSAuthRefreshToken}auth/create-session`, sessionData).pipe(
      timeout(10000), // Timeout de 10 segundos
      catchError((error) => {
        return of(null); // Devolver null en caso de error para no romper el flujo
      })
    );
  }

  /**
   * ✅ CORREGIDO: Verifica si el token está cerca de expirar
   */
  private isTokenExpiringSoon(): boolean {
    const sessionData = this.sessionDataSubject.value;
    
    if (!sessionData) {
      return false; // ← CAMBIO: No considerar expirado si no hay datos
    }
    
    if (!sessionData?.token) {
      return false; // ← CAMBIO: No considerar expirado si no hay token
    }

    try {
      const payload = JSON.parse(atob(sessionData.token.split('.')[1]));
      const exp = payload.exp * 1000;
      const now = Date.now();
      const timeUntilExpiry = exp - now;
      
      // ✅ Considerar próximo a expirar si quedan menos de 10 minutos
      const isSoon = timeUntilExpiry < 10 * 60 * 1000; // 10 minutos
      
      const minutesLeft = (timeUntilExpiry / 1000 / 60).toFixed(2);
      
      // ✅ Si ya expiró, manejar inmediatamente
      if (timeUntilExpiry <= 0) {
        this.handleExpiredToken();
        return false;
      }
      
      return isSoon;
    } catch (error) {
      return false; // ← CAMBIO: No considerar expirado en caso de error
    }
  }

//Maneja token expirado
  private handleExpiredToken(): void {
    const sessionData = this.sessionDataSubject.value;

    if (sessionData?.refreshToken) {
      this.refreshToken().subscribe(success => {
        if (!success) {
          this.clearSession();
        }
      });
    } else {
      this.clearSession();
    }
  }


//Auto-refresh con verificaciones mejoradas

  private autoRefreshToken(): void {
    const sessionData = this.sessionDataSubject.value;
    if (!sessionData) {
      return;
    }

    if (!this.hasValidSession()) {
      return;
    }
    if (!sessionData.refreshToken) {
      if (this.isTokenExpiringSoon()) {
      }
      return;
    }

    // ✅ Verificar si está próximo a expirar
    if (this.isTokenExpiringSoon()) {
      this.refreshToken().subscribe({
      });
    } else {
    }
  }

//Inicia el temporizador - Reducir frecuencia para tokens de 15 min
  private startRefreshTokenTimer(): void {
    if (this.refreshTokenTimer) {
      clearInterval(this.refreshTokenTimer);
    }

    // ✅ CAMBIO: Verificar cada 15 min 
    this.refreshTokenTimer = setInterval(() => {
      this.autoRefreshToken();
    }, 15 * 60 * 1000); // 15 minutos
    
  }

  /**
   * Maneja sesión inválida
   */
  private handleInvalidSession(): void {
    this.sessionDataSubject.next(null);
    this.clearSessionStorage();
    this.redirectToLogin();
  }

  /**
   * Limpia sesión inválida y redirige
   */
  private clearInvalidSession(): void {
    this.clearSessionStorage();
    this.sessionDataSubject.next(null);
    this.isInitialized = false;
    this.redirectToLogin();
  }

  /**
   * Redirige al login
   */
  private redirectToLogin(): void {
    // Dar un pequeño delay para que se complete el logging
    setTimeout(() => {
      window.location.href = environment.login;
    }, 100);
  }

  /**
   * Transforma los datos de sesión
   */
  public transformSessionData(data: any): any {

    const transformed = {
      usuario: data.usuario,
      rol: data.rol,
      persona: data.persona,
      system: data.system,
      menus: data.rol?.menus,
      
      // Asegurar que se guarden correctamente
      token: data.token || data.accessToken,
      refreshToken: data.refreshToken, // ← Debe existir según tus datos
      
      // Otros datos
      email: data.email || 'Correo no disponible',
      idSistema: data.idSistema || environment.sistema || 47,
      rutas: data.rutas || [],
      expiresAt: data.expiresAt
    };
    
    //tokens para verificar expiración
    if (transformed.token) {
      try {
        const payload = JSON.parse(atob(transformed.token.split('.')[1]));
        const exp = new Date(payload.exp * 1000);
        const now = new Date();
        const minutosRestantes = (exp.getTime() - now.getTime()) / 1000 / 60;

        if (minutosRestantes < 1) {
          
        }
      } catch (error) {
        
      }
    }
    
    if (transformed.refreshToken) {
      try {
        const payload = JSON.parse(atob(transformed.refreshToken.split('.')[1]));
        const exp = new Date(payload.exp * 1000);
        const now = new Date();
        const minutosRestantes = (exp.getTime() - now.getTime()) / 1000 / 60;
        
      } catch (error) {
        
      }
    }
    
    return transformed;
  }

  /**
   * Guarda datos de sesión
   */
  public saveSessionData(data: any, sessionId: string): void {
    if (data && data.usuario) {
      try {
        this.saveSessionId(sessionId);
        this.saveTokensToStorage(data); // ✅ También guardar tokens

      } catch (error) {

      }
    }
  }

  /**
   * Guarda sessionId en sessionStorage
   */
  private saveSessionId(sessionId: string): void {
    try {
      sessionStorage.setItem('sessionId', sessionId);
      
    } catch (error) {
      
    }
  }

  /**
   * Obtiene sessionId de sessionStorage
   */
  private getSessionId(): string | null {
    try {
      const sessionId = sessionStorage.getItem('sessionId');

      return sessionId;
    } catch (error) {

      return null;
    }
  }


//Limpia sessionStorage incluyendo tokens
  private clearSessionStorage(): void {
    try {
      const oldSessionId = sessionStorage.getItem('sessionId');
      sessionStorage.removeItem('sessionId');
      sessionStorage.removeItem('tokenBackup'); // ✅ También limpiar tokens
    } catch (error) {
    }
  }

  /**
   * Verifica si hay una sesión válida
   */
  hasValidSession(): boolean {
    const sessionData = this.sessionDataSubject.value;
    const hasSession = !!(sessionData?.token && sessionData?.usuario);
    return hasSession;
  }



  /**
   * Limpia la sesión y registra el logout
   */
  clearSession(): void {
    const currentSessionData = this.sessionDataSubject.value;
    if (this.accessLogService) {
      this.accessLogService.logAccessEvent('LOGOUT', currentSessionData, window.location.href).pipe(
        take(1),
        timeout(10000)
      ).subscribe({
        next: (result) => {
          
          this.performLogoutCleanup();
        },
        error: (error) => {
          
          this.performLogoutCleanup();
        }
      });
    } else {
      this.performLogoutCleanup();
    }
  }

  /**
   * Ejecuta la limpieza del logout
   */
  private performLogoutCleanup(): void {
    
    // Limpiar datos en memoria
    this.sessionDataSubject.next(null);
    
    // Limpiar sessionStorage
    this.clearSessionStorage();
    
    // Resetear flags
    this.isInitialized = false;
    this.isRefreshing = false;
    
    // Limpiar timer de refresh
    if (this.refreshTokenTimer) {
      clearInterval(this.refreshTokenTimer);
      this.refreshTokenTimer = null;
    }

    
    // Redirigir al login
    setTimeout(() => {
      window.location.href = environment.login;
    }, 100);
  }

  /**
   * ✅ NUEVO: Debug completo de tokens
   */
  public debugTokens(): void {
    
    const sessionData = this.sessionDataSubject.value;
    
    if (!sessionData) {
      return;
    }
    

    
    // Decodificar token principal
    if (sessionData.token) {
      try {
        const payload = JSON.parse(atob(sessionData.token.split('.')[1]));
        const exp = new Date(payload.exp * 1000);
        const now = new Date();
        const minutosRestantes = (exp.getTime() - now.getTime()) / 1000 / 60;
        
      } catch (error) {
        
      }
    }
    
    // Decodificar refreshToken
    if (sessionData.refreshToken) {
      try {
        const payload = JSON.parse(atob(sessionData.refreshToken.split('.')[1]));
        const exp = new Date(payload.exp * 1000);
        const now = new Date();
        const minutosRestantes = (exp.getTime() - now.getTime()) / 1000 / 60;
        
      } catch (error) {
        
      }
    }
    
  }


//Método para probar refresh manual

  public testRefreshToken(): Observable<boolean> {
    
    return this.refreshToken().pipe(
      tap(result => {
      })
    );
  }

  // ========== MÉTODOS HELPER PARA ROLES Y PERMISOS ==========

  public getSessionData(): Observable<any> { 
    return this.sessionData$; 
  }

  getCurrentSession(): any { 
    return this.sessionData$; 
  }
  
  esAdministrador(): boolean {
    const sessionData = this.sessionDataSubject.value;
    const rol = sessionData?.rol?.rol || '';
    return rol === 'ADMIN_COTIZACIONES_DESARROLLO' || rol === 'ADMIN_COTIZACIONES';
  }

  esEmpleador(): boolean {
    const sessionData = this.sessionDataSubject.value;
    const rol = sessionData?.rol?.rol || '';
    return rol === 'EMPRESA_COTIZACIONES_DESARROLLO' || rol === 'EMPRESA_COTIZACIONES';
  }

  esDesarrollo(): boolean {
    const sessionData = this.sessionDataSubject.value;
    const rol = sessionData?.rol?.rol || '';
    return rol.includes('_DESARROLLO');
  }

  esProduccion(): boolean {
    const sessionData = this.sessionDataSubject.value;
    const rol = sessionData?.rol?.rol || '';
    return !rol.includes('_DESARROLLO') && (rol.includes('ADMIN_') || rol.includes('EMPRESA_'));
  }

  getTipoEmpresa(): string {
    const sessionData = this.sessionDataSubject.value;
    return sessionData?.persona?.empresa?.tipo || '';
  }

  esEmpresaPublica(): boolean {
    return this.getTipoEmpresa() === 'AP' || this.getTipoEmpresa() === 'Pública';
  }

  esEmpresaPrivada(): boolean {
    const tipo = this.getTipoEmpresa();
    return tipo === 'AV' || tipo === 'Privada';
  }

  getEmpresaInfo(): any {
    const sessionData = this.sessionDataSubject.value;
    return sessionData?.persona?.empresa || null;
  }

  tienePermiso(permiso: string): boolean {
    const sessionData = this.sessionDataSubject.value;
    const permisos = sessionData?.rol?.permisos || [];
    return permisos.includes(permiso);
  }

  getRolActual(): string {
    const sessionData = this.sessionDataSubject.value;
    return sessionData?.rol?.rol || '';
  }

  getUsuarioInfo(): any {
    const sessionData = this.sessionDataSubject.value;
    return sessionData?.persona || null;
  }

  getNombreCompleto(): string {
    const persona = this.getUsuarioInfo();
    if (!persona) return '';
    
    const nombres = persona.nombres || '';
    const primerApellido = persona.primerApellido || '';
    const segundoApellido = persona.segundoApellido || '';
    
    return `${nombres} ${primerApellido} ${segundoApellido}`.trim();
  }

  getCodigoPatronal(): string {
    const empresa = this.getEmpresaInfo();
    return empresa?.codPatronal || '';
  }

  /**
   * Habilitar/deshabilitar modo debug
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }


//Método para obtener información del token sin decodificar

  getTokenInfo(): any {
    const sessionData = this.sessionDataSubject.value;
    if (!sessionData?.token) return null;

    try {
      const payload = JSON.parse(atob(sessionData.token.split('.')[1]));
      return {
        usuario: payload.username || payload.sub,
        expiracion: new Date(payload.exp * 1000),
        minutosRestantes: ((payload.exp * 1000) - Date.now()) / 1000 / 60,
        valido: (payload.exp * 1000) > Date.now()
      };
    } catch {
      return null;
    }
  }

  /**
   * ✅ NUEVO: Fuerza un refresh del token (para testing)
   */
  public forceRefreshToken(): Observable<boolean> {
    this.isRefreshing = false; // Reset flag por si estaba en progreso
    return this.refreshToken();
  }

  /**
   * ✅ NUEVO: Verifica si el usuario tiene una sesión activa válida
   */
  public isAuthenticated(): boolean {
    const sessionData = this.sessionDataSubject.value;
    
    if (!sessionData?.usuario || !sessionData?.token) {
      return false;
    }

    // Verificar que el token no haya expirado
    try {
      const payload = JSON.parse(atob(sessionData.token.split('.')[1]));
      const exp = payload.exp * 1000;
      const now = Date.now();
      
      return exp > now;
    } catch {
      return false;
    }
  }

  /**
   * ✅ NUEVO: Obtiene los menús del usuario actual
   */
  getMenus(): any[] {
    const sessionData = this.sessionDataSubject.value;
    return sessionData?.menus || [];
  }

  /**
   * ✅ NUEVO: Obtiene las rutas disponibles para el usuario
   */
  getRutas(): any[] {
    const sessionData = this.sessionDataSubject.value;
    return sessionData?.rutas || [];
  }
}