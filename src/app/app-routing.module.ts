import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { DashboardDemoComponent } from './componentes/inicio/dashboarddemo.component';
import { AppMainComponent } from './app.main.component';
import { AppErrorComponent } from './componentes/error/app.error.component';

import { AutentificacionComponent } from './componentes/autentificacion/autentificacion.component';
import { AppAccessdeniedComponent } from './componentes/denegado/app.accessdenied.component';
import { SistemaComponent } from './componentes/sistema/sistema.component';
import { ClasificadorComponent } from './componentes/clasificador/clasificador.component';
import { RecursoComponent } from './componentes/recurso/recurso.component';
import { UsuarioComponent } from './componentes/usuario/usuario.component';
import { PerfilComponent } from './componentes/perfil/perfil.component';
import { RestriccionComponent } from './componentes/usuario/restriccion/restriccion.component';
import { PlanillaIncapacidadComponent } from './componentes/empresa/planilla-incapacidad/planilla-incapacidad.component';
import { PlanillaAportesComponent } from './componentes/empresa/planilla-aportes/planilla-aportes.component';
import { PlanillaAportesAprobarComponent } from './componentes/empresa/planilla-aportes/planilla-aportes-aprobar.component';
import { DatosEmpresaComponent } from './componentes/datos-empresa/datos-empresa.component';
import { PlanillasAportesListComponent } from './componentes/planillas-aportes/planillas-aportes-list/planillas-aportes-list.component';
import { PlanillasAportesDetalleComponent } from './componentes/planillas-aportes/planillas-aportes-detalle/planillas-aportes-detalle.component';
import { PlanillasAportesAprobarComponent } from './componentes/planillas-aportes/planillas-aportes-aprobar/planillas-aportes-aprobar.component';
import { PlanillasAportesDetalleAprobarComponent } from './componentes/planillas-aportes/planillas-aportes-detalle-aprobar/planillas-aportes-detalle-aprobar.component';
import { HistorialAportesComponent } from './componentes/planillas-aportes/historial-aportes/historial-aportes.component';
import { PagosAportesAdminComponent } from './componentes/planillas-aportes/pagos-aportes-admin/pagos-aportes-admin.component';
import { HistorialNotificacionesComponent } from './componentes/notificaciones/historial-notificaciones/historial-notificaciones.component';
import { AuthGuard } from './guards/auth.guard';
import { PlanillaAccessGuard } from './guards/planilla-access.guard'; 
import { RoleGuard } from './guards/role.guard';
import { SolicitudReembolsoComponent } from './componentes/reembolsos-incapacidades/solicitud-reembolso/solicitud-reembolso.component';
import { EmpresasComponent } from './componentes/empresas/empresas.component';
import { PerfilUsuarioComponent } from './componentes/perfil-usuario/perfil-usuario.component';
import { DetallePlanillaReembolsoComponent } from './componentes/reembolsos-incapacidades/detalle-planilla-reembolso/detalle-planilla-reembolso.component';
import { HistorialReembolsosComponent } from './componentes/reembolsos-incapacidades/historial-reembolsos/historial-reembolsos.component';
import { DetallePlanillaReembolsoAdminComponent } from './componentes/reembolsos-incapacidades/detalle-planilla-reembolso-admin/detalle-planilla-reembolso-admin.component';
import { RecursosComponent } from './componentes/recursos/recursos.component';
import { LiquidacionesDevengadasComponent } from './componentes/liquidaciones-devengadas/liquidaciones-devengadas.component';
import { DetalleDevengadoComponent } from './componentes/liquidaciones-devengadas/detalle-devengado/detalle-devengado.component';

@NgModule({
    imports: [
        RouterModule.forRoot([
            {
                path: 'cotizaciones',
                component: AppMainComponent,
                canActivate: [AuthGuard],
                canActivateChild: [AuthGuard],
                children: [
                    { path: '', component: DatosEmpresaComponent },
                    // DATOS DE PERFIL DE EMPRESA ---------------------------------------------------------
                    { path: 'datos-empresa', component: DatosEmpresaComponent },
                    // NOTIFICACIONES ---------------------------------------------------------
                    { path: 'historial-notificaciones', component: HistorialNotificacionesComponent },
                    // EMPRESAS ---------------------------------------------------------
                    { path: 'empresas', component: EmpresasComponent },
                    // PERFIL DE USUARIO ---------------------------------------------------------
                    { path: 'perfil-usuario', component: PerfilUsuarioComponent },
                    // RECURSOS ---------------------------------------------------------
                    { path: 'descargas', component: RecursosComponent },
                    // PLANILLAS DE APORTES -------------------------------------------------------------
                    { path: 'planillas-aportes', component: PlanillasAportesListComponent },
                    { path: 'planillas-aportes/:id', component: PlanillasAportesDetalleComponent,canActivate: [PlanillaAccessGuard] ,},
                    { path: 'aprobar-planillas-aportes', component: PlanillasAportesAprobarComponent, canActivate: [RoleGuard], data: { roles: ['ADMIN_COTIZACIONES_DESARROLLO', 'ADMIN_COTIZACIONES'] } },
                    { path: 'aprobar-planillas-aportes/:id',component: PlanillasAportesDetalleAprobarComponent,canActivate: [PlanillaAccessGuard, RoleGuard], data: { roles: ['ADMIN_COTIZACIONES_DESARROLLO', 'ADMIN_COTIZACIONES'] } },
                    { path: 'historial-aportes', component: HistorialAportesComponent },
                    { path: 'pagos-aportes-admin', component: PagosAportesAdminComponent, canActivate: [RoleGuard], data: { roles: ['ADMIN_COTIZACIONES_DESARROLLO', 'ADMIN_COTIZACIONES'] } },
                    // LIQUIDACIONES DEVENGADAS -------------------------------------------------------------
                    { path: 'devengados', component: LiquidacionesDevengadasComponent },
                    { path: 'devengados/:id', component: DetalleDevengadoComponent },
                    // REEMBOLSOS DE INCAPACIDADES -------------------------------------------------------------
                    { path: 'planillas-incapacidades', component: SolicitudReembolsoComponent },
                    { path: 'planillas-incapacidades/detalle/:id', component: DetallePlanillaReembolsoComponent },
                            { path: 'historial-reembolsos', component: HistorialReembolsosComponent },
                            { path: 'historial-reembolsos/detalle/:id', component: DetallePlanillaReembolsoAdminComponent },
                    // OTROS -----------------------------------------------------------------------------
                    { path: 'sistemas', component: SistemaComponent, canActivate: [RoleGuard], data: { roles: ['ADMIN_COTIZACIONES_DESARROLLO', 'ADMIN_COTIZACIONES'] } },
                    { path: 'clasificadores', component: ClasificadorComponent, canActivate: [RoleGuard], data: { roles: ['ADMIN_COTIZACIONES_DESARROLLO', 'ADMIN_COTIZACIONES'] } },
                    { path: 'planillas-incapacidad', component: PlanillaIncapacidadComponent },
                    { path: 'planilla-aprobar', component: PlanillaAportesAprobarComponent, canActivate: [RoleGuard], data: { roles: ['ADMIN_COTIZACIONES_DESARROLLO', 'ADMIN_COTIZACIONES'] } },
                    { path: 'lista-personal', component: UsuarioComponent, canActivate: [RoleGuard], data: { roles: ['ADMIN_COTIZACIONES_DESARROLLO', 'ADMIN_COTIZACIONES'] } },
                    { path: 'perfiles', component: PerfilComponent, canActivate: [RoleGuard], data: { roles: ['ADMIN_COTIZACIONES_DESARROLLO', 'ADMIN_COTIZACIONES'] } },
                    { path: 'restriccionesUsuario/:id', component: RestriccionComponent, canActivate: [RoleGuard], data: { roles: ['ADMIN_COTIZACIONES_DESARROLLO', 'ADMIN_COTIZACIONES'] } }, 
                    
                    
                ]
            },
            { path: 'error', component: AppErrorComponent },
            { path: '', redirectTo: '/cotizaciones', pathMatch: 'full' },
            { path: 'autentificar', component: AutentificacionComponent },
            { path: 'denegado', component: AppAccessdeniedComponent },
            { path: '**', redirectTo: 'notfound' },
        ], { scrollPositionRestoration: 'enabled' })
    ],
    exports: [RouterModule]
})
export class AppRoutingModule {
}

