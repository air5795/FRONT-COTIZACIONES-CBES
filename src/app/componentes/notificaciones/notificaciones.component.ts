import { Component, OnInit, OnDestroy } from '@angular/core';
import { NotificacionesService } from '../../servicios/notificaciones/notificaciones.service';
import { Notificacion } from '../../models/notificacion.model';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { SessionService } from '../../servicios/auth/session.service';
import { TokenService } from '../../servicios/token/token.service';

@Component({
  selector: 'app-notificaciones',
  templateUrl: './notificaciones.component.html',
  styleUrls: ['./notificaciones.component.css'],
})
export class NotificacionesComponent implements OnInit, OnDestroy {
  notificaciones: Notificacion[] = [];
  notificacionesNoLeidas: number = 0;
  private subscription!: Subscription;
  usuarioRestriccion: any;
  idcNivel: any;
  empresaUsuario: string | null = null;
  isDropdownVisible: boolean = false;

  constructor(
    private notificacionesService: NotificacionesService,
    private router: Router,
    private sessionService: SessionService,
    private tokenService: TokenService
  ) {}

  async ngOnInit(): Promise<void> {
    const sessionData = this.sessionService.sessionDataSubject.value;
    
    if (sessionData?.rol?.rol) {
      const rolCompleto = sessionData.rol.rol;
      
      if (rolCompleto.includes('ADMIN_COTIZACIONES')) {
        this.idcNivel = 'ADMINISTRADOR_COTIZACIONES';
      } else if (rolCompleto.includes('EMPRESA_COTIZACIONES')) {
        this.idcNivel = 'COTIZACIONES_EMPRESA';
      } else {
        this.idcNivel = rolCompleto;
      }
    } else {
      return;
    }

    this.empresaUsuario = sessionData?.persona?.empresa?.nombre || null;

    // Cargar notificaciones inicialmente
    await this.cargarNotificaciones();

    // Configurar el intervalo de actualización cada 2 min 
    this.subscription = interval(10000).subscribe(() => {
      this.cargarNotificaciones();
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  async cargarNotificaciones(): Promise<void> {
    try {
      const responseNoLeidas = await this.notificacionesService
        .getNotificaciones(this.idcNivel, false)
        .toPromise();

      // Filtramos las notificaciones según la empresa si el usuario es COTIZACIONES_EMPRESA
      let notificacionesFiltradas = responseNoLeidas?.notificaciones || [];
      
      if (this.idcNivel === 'COTIZACIONES_EMPRESA' && this.empresaUsuario) {
        notificacionesFiltradas = notificacionesFiltradas.filter(
          (notificacion: Notificacion) => notificacion.empresa === this.empresaUsuario
        );
      }

      this.notificaciones = notificacionesFiltradas;
      this.notificacionesNoLeidas = notificacionesFiltradas.length;
    } catch (error) {
    }
  }

  onNotificacionClick(notificacion: Notificacion): void {
    if (!notificacion.leido) {
      this.notificacionesService.marcarNotificacionComoLeida(notificacion.id_notificacion).subscribe({
        next: () => {
          notificacion.leido = true;
          this.cargarNotificaciones();
          this.isDropdownVisible = false;
        },
        error: (error) => {
          // Manejo de errores vacío
        },
      });
    } else {
      this.isDropdownVisible = false;
    }
  
    // Lógica de navegación corregida
    const idEncriptado = this.tokenService.encriptarId(notificacion.id_recurso);
    let rutaDestino: string;
  
    if (this.idcNivel === 'ADMINISTRADOR_COTIZACIONES') {
      // ✅ CORRECCIÓN: Usar la ruta de detalle para administradores
      rutaDestino = `/cotizaciones/aprobar-planillas-aportes/${idEncriptado}`;
    } else if (this.idcNivel === 'COTIZACIONES_EMPRESA') {
      // Ruta para empleadores (esta ya estaba bien)
      rutaDestino = `/cotizaciones/planillas-aportes/${idEncriptado}`;
    } else {
      // Ruta por defecto si el rol no coincide
      rutaDestino = `/cotizaciones/planillas-aportes`;
    }
  
    if (rutaDestino) {
      this.router.navigate([rutaDestino]);
    }
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isDropdownVisible = !this.isDropdownVisible;
  }

  closeDropdown(): void {
    this.isDropdownVisible = false;
  }

  get badgeText(): string {
  if (this.notificacionesNoLeidas > 999) return '999+';
  if (this.notificacionesNoLeidas > 99) return '99+';
  return String(this.notificacionesNoLeidas);
}

}