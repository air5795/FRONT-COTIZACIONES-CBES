import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { EmpresaService } from '../../servicios/empresa/empresa.service';
import { MessageService } from 'primeng/api';
import { LocalService } from '../../servicios/local/local.service';
import { SessionService } from '../../servicios/auth/session.service';

import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { GoogleMapsLoaderService } from '../../servicios/empresa/google-maps-loader.service';

@Component({
  selector: 'app-datos-empresa',
  templateUrl: './datos-empresa.component.html',
  styleUrls: ['./datos-empresa.component.css'],
  providers: [MessageService]
})
export class DatosEmpresaComponent implements OnInit {
  empresa: any = null;
  numPatronal: string | null = null;
  listaEmpresas: any[] = [];
  totalTrabajadores: number = 0;
  isAdmin: boolean = false;

  lat!: number;
  lng!: number;
  mapReady = false;
  mapError = false;


  constructor(
    private empresaService: EmpresaService,
    private localService: LocalService,
    private sessionService: SessionService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private http: HttpClient,
    private gmapsLoader: GoogleMapsLoaderService
  ) {}

  ngOnInit() {
    this.validarRolUsuario();
  
    if (!this.isAdmin) {
      // ✅ Cargar Google Maps con loading=async
      this.gmapsLoader.load('AIzaSyDC5fxZ3Qfi2cFfEADgiRM9xWRgvBlJMqY')
        .then(() => {
          this.mapReady = true;
  
          this.obtenerNumeroPatronal();
          if (this.numPatronal) {
            this.obtenerDatosEmpresa(this.numPatronal);
          } else {
            this.showError('No se encontró el número patronal');
          }
  
          this.obtenerTodasLasEmpresas();
          setTimeout(() => {
            this.mostrarAlerta();
          }, 500);
        })
        .catch((error) => {
          this.showError('No se pudo cargar el mapa de Google. Verifique su conexión.');
          this.mapError = true;
        });
    }
  }
  

  validarRolUsuario() {
    try {
      const sessionData = this.sessionService.sessionDataSubject.value;
      this.isAdmin = sessionData?.rol.rol === 'ADMIN_COTIZACIONES_DESARROLLO' || sessionData?.rol.rol === 'ADMIN_COTIZACIONES';
    } catch (error) {
      this.isAdmin = false; 
    }
  }

  obtenerNumeroPatronal() {
    try {
      const npatronal = this.sessionService.sessionDataSubject.value;
      this.numPatronal = npatronal?.persona.empresa.codPatronal || null;
    } catch (error) {
    }
  }

  obtenerDatosEmpresa(numPatronal: string) {
    this.empresaService.empresasNroPatronal(numPatronal).subscribe(
      (response) => {
        
        if (response) {
          this.empresa = response;
          this.cdr.detectChanges();
          this.calcularTotalTrabajadores();

          // 🔁 NUEVO: Obtener la dirección completa usando el ID
          this.empresaService.getDireccionCompleta(this.empresa.id_empresa).subscribe(
            (direccionResponse) => {
              const direccionCompleta = direccionResponse.direccion;
              this.obtenerCoordenadasDesdeDireccion(direccionCompleta);
            },
            (error) => {
            }
          );
        } else {
          this.showError('No se encontró la empresa');
        }
      },
      (error) => {
        this.showError('Error al cargar los datos de la empresa');
      }
    );
  }

  obtenerTodasLasEmpresas() {
    this.empresaService.getAllEmpresas().subscribe(
      (response) => {
        this.listaEmpresas = response || [];
        if (this.empresa) {
          this.calcularTotalTrabajadores();
        }
      },
      (error) => {
      }
    );
  }

  calcularTotalTrabajadores() {
    if (!this.empresa || !this.listaEmpresas.length) {
      return;
    }

    const codigoBase = this.empresa.cod_patronal.slice(3);
    const regionales = this.listaEmpresas.filter(emp => emp.cod_patronal.endsWith(codigoBase));
    this.totalTrabajadores = regionales.reduce((total, emp) => total + (emp.emp_ntrab || 0), 0);
    this.cdr.detectChanges();
  }

  mostrarAlerta() {
    this.messageService.add({
      severity: 'warn',
      summary: 'Aviso Importante',
      detail:
        'Señor empleador, no olvide mantener actualizados sus datos para evitar multas. En caso de no tener actualizados sus datos, favor regularizar en la Unidad de Seguros de la Caja Bancaria Estatal de Salud.',
      life: 10000
    });
  }

  showError(message: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      life: 5000
    });
  }

  obtenerCoordenadasDesdeDireccion(direccion: string) {
    if (!(window as any).google || !(window as any).google.maps) {
      this.mapError = true;
      return;
    }

    const apiKey = 'AIzaSyA_kuyLgukBmvAyF86YQC4Sx84JjizT9vc';
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(direccion)}&key=${apiKey}`;

    this.http.get<any>(url).subscribe(
      response => {
        if (response.status === 'OK' && response.results.length > 0) {
          const location = response.results[0].geometry.location;
          this.lat = location.lat;
          this.lng = location.lng;
          this.mapError = false;
          this.cdr.detectChanges();
          
          // ✅ Esperar un poco para que el DOM se actualice
          setTimeout(() => {
            this.initializeNativeMap();
          }, 100);
        } else {
          this.mapError = true;
        }
      },
      error => {
        this.mapError = true;
      }
    );
  }

  // ✅ Método completamente nuevo usando AdvancedMarkerElement
  private initializeNativeMap(): void {
    if (!this.lat || !this.lng || !(window as any).google?.maps) {
      this.mapError = true;
      return;
    }

    const mapElement = document.getElementById('native-map');
    if (!mapElement) {
      this.mapError = true;
      return;
    }

    try {
      // ✅ Crear mapa con mapId requerido para AdvancedMarkerElement
      const map = new (window as any).google.maps.Map(mapElement, {
        center: { lat: this.lat, lng: this.lng },
        zoom: 16,
        mapId: 'DEMO_MAP_ID', // Requerido para AdvancedMarkerElement
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true
      });

      // ✅ Usar AdvancedMarkerElement (nueva API)
      if ((window as any).google.maps.marker?.AdvancedMarkerElement) {
        new (window as any).google.maps.marker.AdvancedMarkerElement({
          map: map,
          position: { lat: this.lat, lng: this.lng },
          title: this.empresa?.emp_nom || 'Ubicación de la empresa',
          gmpDraggable: false
        });
      } else {
        // ✅ Fallback silencioso sin warnings
        
        // Suprimir temporalmente el warning
        const originalWarn = console.warn;
        console.warn = () => {};
        
        new (window as any).google.maps.Marker({
          position: { lat: this.lat, lng: this.lng },
          map: map,
          title: this.empresa?.emp_nom || 'Ubicación de la empresa'
        });
        
        // Restaurar console.warn después de 100ms
        setTimeout(() => {
          console.warn = originalWarn;
        }, 100);
      }

      this.mapError = false;
    } catch (error) {
      this.mapError = true;
    }
  }
  
  
  

  get mostrarMapa(): boolean {
    return this.mapReady && this.lat !== undefined && this.lng !== undefined && !this.mapError;
  }
  


}