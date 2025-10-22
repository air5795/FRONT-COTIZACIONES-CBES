import { Component } from '@angular/core';
import { PlanillasAportesService } from '../../../servicios/planillas-aportes/planillas-aportes.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LocalService } from '../../../servicios/local/local.service';
import * as XLSX from 'xlsx';


@Component({
  selector: 'app-planillas-aportes-aprobar',
  templateUrl: './planillas-aportes-aprobar.component.html',
  styleUrl: './planillas-aportes-aprobar.component.css'
})
export class PlanillasAportesAprobarComponent {

  
  planillas: any[] = [];
  loading = true;
  empresa: any = null;
  mostrarModal = false;
  activeIndex: number = 0;  // Paso actual en el Stepper
  archivoSeleccionado: File | null = null;
  mesSeleccionado: string = '';
  gestiones: { label: string; value: number }[] = []; // Gestiones disponibles para seleccionar en modal stepper
  gestionSeleccionada: number | null = null;
  planillaDatos: any[] = [];  // Datos extraídos de la planilla Excel para el modal steper
  
  
  meses = [
    { label: 'ENERO', value: 'ENERO' },
    { label: 'FEBRERO', value: 'FEBRERO' },
    { label: 'MARZO', value: 'MARZO' },
    { label: 'ABRIL', value: 'ABRIL' },
    { label: 'MAYO', value: 'MAYO' },
    { label: 'JUNIO', value: 'JUNIO' },
    { label: 'JULIO', value: 'JULIO' },
    { label: 'AGOSTO', value: 'AGOSTO' },
    { label: 'SEPTIEMBRE', value: 'SEPTIEMBRE' },
    { label: 'OCTUBRE', value: 'OCTUBRE' },
    { label: 'NOVIEMBRE', value: 'NOVIEMBRE' },
    { label: 'DICIEMBRE', value: 'DICIEMBRE' }
  ];
  
  steps = [
    { label: 'Elegir Mes y Gestión' },
    { label: 'Importar Planilla' },
    { label: 'Verificar Datos' }
  ];
  
  
    constructor(
      private planillasService: PlanillasAportesService,
      private router: Router,
      private http: HttpClient
    ) {}
  
    ngOnInit(): void {
       this.obtenerPlanillasTodo();
    }
  
    
  
      obtenerPlanillasTodo() {

        this.planillasService.getPlanillasTodo().subscribe({
          next: (data) => {
            this.planillas = data.planillas;
            console.log('Planillas de Aportes:', this.planillas);
            this.loading = false;
          },
          error: (err) => {
            console.error('Error al obtener planillas:', err);
            this.loading = false;
          }
        });
      }
  
    verPlanilla(id_planilla: number) {
      this.router.navigate(['/cotizaciones/aprobar-planillas-aportes', id_planilla]);
    }

 
  
  
  
    
    
  

  
  
  

}
