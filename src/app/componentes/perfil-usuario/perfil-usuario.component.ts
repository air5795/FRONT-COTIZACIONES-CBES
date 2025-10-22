import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../servicios/auth/session.service';

@Component({
  selector: 'app-perfil-usuario',
  templateUrl: './perfil-usuario.component.html',
  styleUrl: './perfil-usuario.component.css'
})
export class PerfilUsuarioComponent implements OnInit {
  persona: any = null;
  usuario: any = null;
  rolActual: string = '';
  empresa: any = null;
  nombreCompleto: string = '';
  iniciales: string = '';
  fechaRegistro: string = '';
  ultimoAcceso: string = '';
  email: string = '';
  fechaImpresion: string = '';
  constructor(private sessionService: SessionService) {}

  ngOnInit() {
    this.cargarDatosUsuario();
  }

  private cargarDatosUsuario() {
    this.sessionService.getSessionData().subscribe(data => {

  
      if (data) {
        this.persona = data.persona || null;
        // AQUÍ ESTÁ EL CAMBIO: acceder directamente a data.usuario
        this.usuario = data.usuario || null;
        this.empresa = data.persona?.empresa || null;
        this.email = data.email || null;
  
        this.rolActual = this.sessionService.getRolActual();
        
        if (this.persona) {
          this.nombreCompleto = this.sessionService.getNombreCompleto();
          this.iniciales = this.generarIniciales();

          this.fechaRegistro = this.formatearFecha(new Date());
          this.ultimoAcceso = this.formatearFecha(new Date());
          this.fechaImpresion = this.formatearFecha(new Date());
        }
      }
    });
  }

  private generarIniciales(): string {
    if (!this.persona) {
      return '';
    }
    
    const nombres = this.persona.nombres || '';
    const primerApellido = this.persona.primerApellido || '';
    
    const inicialNombre = nombres.charAt(0).toUpperCase();
    const inicialApellido = primerApellido.charAt(0).toUpperCase();
    
    return inicialNombre + inicialApellido;
  }

  formatearFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getColorRol(): string {
    
    switch (this.rolActual) {
      case 'ADMIN_COTIZACIONES_DESARROLLO':
      case 'ADMIN_COTIZACIONES':
        return '#1a365d'; // Azul oscuro corporativo
      case 'ADMIN_TESORERIA_DESARROLLO':
      case 'ADMIN_TESORERIA':
        return '#2b6cb0'; // Azul medio
      default:
        return '#38a169'; // Verde corporativo
    }
  }

  getTipoUsuario(): string {
    
    if (this.rolActual.includes('ADMIN')) {
      return 'Administrador';
    } else if (this.rolActual.includes('EMPRESA')) {
      return 'Empresa';
    }
    return 'Usuario';
  }
}