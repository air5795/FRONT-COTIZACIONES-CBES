import { Component, OnInit } from '@angular/core';
import { AppMainComponent } from './app.main.component';
import { Router } from '@angular/router';
import { SessionService } from './servicios/auth/session.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-topbar',
  template: `
    <div class="topbar clearfix">
      <div class="logo">
        <a href="#">
          <img src="assets/layout/images/logo.png" alt="Logo">
        </a>
      </div>

      <a href="#">
        <img src="assets/layout/images/logo-text.png" class="app-name" alt="App Name"/>
      </a>

      <a id="topbar-menu-button" href="#" (click)="appMain.onTopbarMenuButtonClick($event)">
        <i class="pi pi-bars"></i>
      </a>

      <ul class="topbar-menu fadeInDown" [ngClass]="{'topbar-menu-visible': appMain.topbarMenuActive}">
        <li #profile class="profile-item" [ngClass]="{'active-topmenuitem': appMain.activeTopbarItem === profile}">
          <a class="p-2"
             style="background-color: #f3f3f3; padding: 4px !important; color: #14625b; margin: inherit; bottom: 1px; border-left: 8px solid #b0c9bb; border-bottom: 1px solid #b0c9bb;">
            <div class="profile-image pr-1" style="position: relative; display: inline-flex; align-items: center;">
              <div style="background-color: #009688; border-radius:7px">
                <app-notificaciones></app-notificaciones>
              </div>
              <img src="assets/layout/images/user.png" alt="User Image" style="margin-left: 20px; margin-right: 10px;">
            </div>

            <div *ngIf="persona; else noPersona" class="profile-info" style="margin-right: 10px; width: auto; min-width: 180px; text-align:left; overflow: hidden;" (click)="appMain.onTopbarItemClick($event, profile)">
              <span class="topbar-item-name profile-name" style="margin-left: 10px; display: block; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                <strong style="padding: 2px;">
                  {{persona.nombres}} {{persona.primerApellido}} {{persona.segundoApellido}}
                </strong>
              </span>

              <div *ngIf="persona.empresa || esAdminRole" style="width: 100%; overflow: hidden;">
                <hr style="margin: 3px;">
                <span class="topbar-item-name profile-role" [style.color]="getRoleColor()" style="width: 100%; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  <span style="font-size:11px; margin:8px;">
                    <span *ngIf="persona.empresa">{{persona.empresa.nombre}}</span>
                    <span *ngIf="!persona.empresa && esAdminRole">{{userRole}}</span>
                  </span>
                </span>
              </div>
            </div>
            <ng-template #noPersona>
              <span style="color: red;">Usuario no disponible</span>
            </ng-template>
          </a>

          <ul class="fadeInDown">
            <li role="menuitem">
              <a href="#" (click)="navegarAPerfil($event)">
                <i class="pi pi-user"></i>
                <span>Perfil</span>
              </a>
            </li>
            <li role="menuitem">
              <a (click)="cerrarSession()">
                <i class="pi pi-sign-out"></i>
                <span>Cerrar Sesión</span>
              </a>
            </li>
          </ul>
        </li>
      </ul>
    </div>
  `
})
export class AppTopbarComponent implements OnInit {
  persona: any;
  usuario: any;
  userRole: string = '';
  esAdminRole: boolean = false;

  private readonly adminRoles = [
    'ADMIN_COTIZACIONES_DESARROLLO',
    'ADMIN_COTIZACIONES',
    'ADMIN_TESORERIA_DESARROLLO',
    'ADMIN_TESORERIA'
  ];

  constructor(
    public appMain: AppMainComponent,
    private router: Router,
    private sessionService: SessionService
  ) {}

  ngOnInit() {
    this.sessionService.getSessionData().subscribe(data => {
      this.persona = data?.persona || null;
      this.usuario = data?.usuario || null;
      
      // Obtener el rol del usuario
      this.userRole = this.sessionService.getRolActual();
      
      // Verificar si el usuario tiene uno de los roles de administrador
      this.esAdminRole = this.adminRoles.includes(this.userRole);
    });
  }

  getRoleColor(): string {
    if (this.userRole === 'ADMIN_COTIZACIONES_DESARROLLO' || this.userRole === 'ADMIN_COTIZACIONES') {
      return '#8B0000'; // Rojo oscuro
    } else if (this.userRole === 'ADMIN_TESORERIA_DESARROLLO' || this.userRole === 'ADMIN_TESORERIA') {
      return '#B8860B'; // Amarillo oscuro (DarkGoldenrod)
    } else if (this.persona?.empresa) {
      return '#686868'; // Gris para empresas (color original)
    }
    return '#686868'; // Gris por defecto
  }

  cerrarSession() {
    this.sessionService.clearSession();
    /* window.location.href = environment.login; */
  }

  navegarAPerfil(event: Event) {
    event.preventDefault();
    this.router.navigate(['/cotizaciones/perfil-usuario']);
  }

}