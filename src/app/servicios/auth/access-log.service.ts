import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of, tap, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AccessLog, AccessStatus, AccessType } from '../../models/access-log.model';

export interface AccessLogFilters {
  userId?: string;
  username?: string;
  systemName?: string;
  action?: string;
  accessResult?: string;
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
  page?: number;
  limit?: number;
}

export interface AccessLogResponse {
  data: AccessLog[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({
  providedIn: 'root'
})
export class AccessLogService {

  constructor(
    private readonly http: HttpClient
  ) {
  }

  /**
   * Registra un evento de acceso (LOGIN/LOGOUT)
   * @param eventType Tipo de evento ('LOGIN' | 'LOGOUT')
   * @param sessionData Datos de la sesión
   * @param resource URL del recurso (opcional)
   * @returns Observable con el resultado del registro
   */
  logAccessEvent(eventType: string, sessionData: any, resource?: string): Observable<AccessLog | null> {
    console.log(`AccessLogService: Registrando evento ${eventType}`, {
      eventType,
      hasSessionData: !!sessionData,
      sessionData: sessionData,
      resource
    });

    // ✅ CORREGIDO: Registrar el evento independientemente de si hay sessionData
    return this.createAccessLogEntry(eventType, sessionData, resource);
  }

  /**
   * Crea la entrada del log de acceso
   */
 private createAccessLogEntry(eventType: string, sessionData: any, resource?: string): Observable<AccessLog | null> {
    if (!sessionData) {
      //console.log('AccessLogService: No hay datos de sesión');
      return of(null);
    }
    /* console.log('AccessLogService: Datos de sesión:', sessionData);
    console.log('AccessLogService: Registrando acceso:', eventType, resource); */

    const accessLog: Partial<AccessLog> = {
      idUsuario: sessionData?.persona?.idUsuario,
      username: sessionData?.usuario,
      email: sessionData?.email || 'Correo no disponible',
      idSistema: sessionData?.idSistema || 2,
      nombreSistema: sessionData?.system,
      rol: sessionData?.rol?.rol,
      requestMethod: this.getCurrentRequestMethod(),
      requestUrl: resource,
      accessType: AccessType[eventType as keyof typeof AccessType] || AccessType.LOGIN,
      accessStatus: AccessStatus.SUCCESS,
      deviceType: this.getDeviceType(),
      browser: this.getBrowser(),
      os: this.getOS(),
    };
    //console.log('AccessLogService: Creando acceso:', accessLog);
    return this.http.post<AccessLog>(`${environment.urlMSAuthRefreshToken}access-logs/createAccessLog`, accessLog).pipe(
      timeout(30000),
      tap(() => console.log('AccessLogService: Solicitud enviada con éxito')),
      catchError(error => {
        console.error('AccessLogService: Error al crear acceso:', error);
        return of(null);
      })
    );
  }
  /**
   * ✅ NUEVO: Mapea el tipo de evento al enum AccessType
   */
  private getAccessType(eventType: string): AccessType {
    const typeMap: { [key: string]: AccessType } = {
      'LOGIN': AccessType.LOGIN,
      'LOGOUT': AccessType.LOGOUT,
      'ACCESS': AccessType.ACCESS || AccessType.LOGIN, // Fallback
      'VIEW': AccessType.VIEW || AccessType.LOGIN // Fallback
    };

    const accessType = typeMap[eventType.toUpperCase()];
    
    if (!accessType) {
      console.warn(`AccessLogService: Tipo de evento desconocido: ${eventType}, usando LOGIN como fallback`);
      return AccessType.LOGIN;
    }

    return accessType;
  }

  /**
   * ✅ NUEVO: Obtiene la IP del cliente (limitado en browser)
   */
  private getClientIP(): string {
    // En un navegador, no podemos obtener la IP real del cliente
    // El servidor debe capturar esto del header X-Forwarded-For o similar
    return 'CLIENT_IP_FROM_BROWSER';
  }

  /**
   * Obtiene el tipo de dispositivo
   */
  private getDeviceType(): string {
    const ua = navigator.userAgent;
    if (/mobile/i.test(ua)) return 'Mobile';
    if (/tablet/i.test(ua)) return 'Tablet';
    return 'Desktop';
  }

  /**
   * Obtiene el navegador
   */
  private getBrowser(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Opera')) return 'Opera';
    return 'Unknown';
  }

  /**
   * Obtiene el método HTTP actual (aproximado)
   */
  private getCurrentRequestMethod(): string {
    // Para logout, típicamente es POST o DELETE
    // Como estamos en el browser, asumimos POST para operaciones de logout
    return 'POST';
  }

  /**
   * Obtiene el sistema operativo
   */
  private getOS(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Win')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (/iPad|iPhone|iPod/.test(ua)) return 'iOS';
    return 'Unknown';
  }

  /**
   * ✅ NUEVO: Método de debugging para verificar configuración
   */
  public debugAccessLog(): void {
    console.log('=== ACCESS LOG SERVICE DEBUG ===');
    console.log('Environment URL:', `${environment.urlMSAuthRefreshToken}access-logs/createAccessLog`);
    console.log('Sistema ID:', environment.sistema);
    console.log('Device Info:', {
      deviceType: this.getDeviceType(),
      browser: this.getBrowser(),
      os: this.getOS()
    });
    console.log('=== END DEBUG ===');
  }
}