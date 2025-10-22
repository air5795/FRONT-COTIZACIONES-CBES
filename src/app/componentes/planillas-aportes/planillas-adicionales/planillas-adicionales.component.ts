import { Component, Input, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LocalService } from '../../../servicios/local/local.service';
import { EmpresaService } from '../../../servicios/empresa/empresa.service';
import * as XLSX from 'xlsx';
import { LazyLoadEvent } from 'primeng/api';

import { MessageService } from 'primeng/api';
import { PlanillasAdicionalesService } from '../../../servicios/planillas-aportes/planillas-adicionales.service';
import { PlanillasAportesService } from '../../../servicios/planillas-aportes/planillas-aportes.service';

@Component({
  selector: 'app-planillas-adicionales',
  templateUrl: './planillas-adicionales.component.html',
  styleUrl: './planillas-adicionales.component.css',
  providers: [MessageService]
})
export class PlanillasAdicionalesComponent {
  @Input() idPlanilla: number | null = null;

  planillas: any[] = [];
  loading = true;
  empresa: any = null;
  activeIndex: number = 0; 
  archivoSeleccionado: File | null = null;
  mesSeleccionado: string = '';
  gestiones: { label: string; value: number }[] = []; 
  gestionSeleccionada: number | null = null;
  planillaDatos: any[] = []; 
  numPatronal: string | null = null;
  nomEmpresa: string | null = null;
  tipoEmpresa: string | null = null;

  totalRegistros: number = 0;
  pagina: number = 0;
  limite: number = 15;
  busqueda: string = '';

  mesFiltro: string | undefined = undefined;
  anioFiltro: string | undefined = undefined;

  

  meses = [
    { label: 'ENERO', value: '1' },
    { label: 'FEBRERO', value: '2' },
    { label: 'MARZO', value: '3' },
    { label: 'ABRIL', value: '4' },
    { label: 'MAYO', value: '5' },
    { label: 'JUNIO', value: '6' },
    { label: 'JULIO', value: '7' },
    { label: 'AGOSTO', value: '8' },
    { label: 'SEPTIEMBRE', value: '9' },
    { label: 'OCTUBRE', value: '10' },
    { label: 'NOVIEMBRE', value: '11' },
    { label: 'DICIEMBRE', value: '12' },
  ];

  mostrarModal: boolean = false;
  steps: any[] = [
    { label: 'Cargar Archivo' },
    { label: 'Verificar y Guardar' }
  ];

  motivoAdicional: string = '';

  anioSeleccionado: string | undefined = undefined;

  anios: any[] = Array.from({ length: 10 }, (_, i) => ({
    label: (2025 - i).toString(),
    value: (2025 - i).toString()
  })); 

  mostrarModalDetalles: boolean = false;
  idPlanillaAdicionalSeleccionada: number | null = null; 



  constructor(
    private planillasService: PlanillasAportesService,
    private planillasAdicionalesService: PlanillasAdicionalesService,
    private localService: LocalService,
    private empresaService: EmpresaService,
    private router: Router,
    private http: HttpClient,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.obtenerNumeroPatronal();
    if (this.numPatronal) {
      this.obtenerDatosEmpresa(this.numPatronal);
    } else {
      console.warn('Número patronal no encontrado en localStorage.');
    }
    this.loading = true;
    if (this.idPlanilla) {
      this.cargarHistorial();
    } else {
      this.loading = false; 
    }
  }

  obtenerNumeroPatronal() {
    try {
      const usuarioRestriccion = JSON.parse(
        this.localService.getLocalStorage('usuarioRestriccion') || '{}'
      );
      this.numPatronal = usuarioRestriccion?.numPatronalEmpresa || null;
      this.nomEmpresa = usuarioRestriccion?.empresa || null;
      this.tipoEmpresa = usuarioRestriccion?.tipo || null;
      if (this.numPatronal) {
        console.log('COD patronal:', this.numPatronal.slice(3));
        console.log('Nombre empresa:', this.nomEmpresa);
        console.log('Tipo empresa:', this.tipoEmpresa);
      }

      if (!this.numPatronal) {
        console.error('⚠️ No se encontró el número patronal en localStorage.');
      } else {
        console.log(`✅ Número patronal obtenido: ${this.numPatronal}`);
      }
    } catch (error) {
      console.error('❌ Error al obtener número patronal:', error);
    }
  }


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['idPlanilla'] && changes['idPlanilla'].currentValue !== changes['idPlanilla'].previousValue) {
      this.loading = true;
      this.pagina = 1;
      this.cargarHistorial();
    }
  }

  cargarHistorial() {
    if (!this.idPlanilla) return;
    this.planillasAdicionalesService
      .obtenerHistorialAdicional(this.idPlanilla, this.pagina, this.limite, this.busqueda, this.mesFiltro, this.anioFiltro)
      .subscribe({
        next: (response) => {
          this.planillas = response.planillas;
          this.totalRegistros = response.total;
        },
        error: (error) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error.message || 'Error al cargar historial' });
        }
      });
  }

  onPageChange(event: any) {
    this.pagina = event.page + 1;
    this.limite = event.rows;
    this.cargarHistorial();
  }

  aplicarFiltros() {
    this.pagina = 1;
    this.cargarHistorial();
  }

  buscar(valor: string) {
    this.busqueda = valor;
    this.pagina = 1;
    this.cargarHistorial();
  }

  recargar() {
    this.busqueda = '';
    this.mesFiltro = undefined;
    this.anioFiltro = undefined;
    this.pagina = 1;
    this.cargarHistorial();
  }

  verDetalle(id: number) {
    this.idPlanillaAdicionalSeleccionada = id;
    this.mostrarModalDetalles = true;
  }

  // --------------------------------------------------------------------------------------------------------

  abrirModal() {
    if (!this.idPlanilla) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'El ID de la planilla es requerido' });
      return;
    }
    this.mostrarModal = true;
    this.activeIndex = 0;
    this.resetForm();
  }

  resetForm() {
    this.motivoAdicional = '';
    this.archivoSeleccionado = null;
    this.planillaDatos = [];
  }

  seleccionarArchivo(event: any) {
    const file = event.target.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      this.archivoSeleccionado = file;
    } else {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Solo se permiten archivos .xlsx o .xls' });
    }
  }

  nextStep() {
    if (this.activeIndex === 0 && (!this.archivoSeleccionado || !this.motivoAdicional )) {
      this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'Suba un archivo y especifique un motivo adicional' });
      return;
    }
    this.activeIndex++;
  }

  prevStep() {
    this.activeIndex--;
  }

  guardarPlanilla() {
    if (!this.idPlanilla || !this.archivoSeleccionado || !this.motivoAdicional || !this.tipoEmpresa) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Faltan datos requeridos' });
      console.error('Faltan datos requeridos', this.idPlanilla, this.archivoSeleccionado, this.motivoAdicional, this.tipoEmpresa);
      return;
    }

    this.planillasAdicionalesService
      .subirPlanillaAdicional(this.idPlanilla, this.archivoSeleccionado, this.motivoAdicional , this.tipoEmpresa)
      .subscribe({
        next: (response) => {
          this.planillaDatos = response.data || []; // Ajusta según la estructura de la respuesta
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Planilla adicional guardada' });
          this.mostrarModal = false;
        },
        error: (error) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error.message || 'Error al guardar la planilla' });
        }
      });
  }

  obtenerDatosEmpresa(numPatronal: string) {
    console.log(`🔍 Buscando empresa con número patronal: ${numPatronal}`);

    this.empresaService.getEmpresaByNroPatronal(numPatronal).subscribe(
      (response) => {
        console.log('📡 Respuesta de la API:', response);

        if (response && response.length > 0) {
          this.empresa = response[0];
          console.log('🏢 Empresa asignada:', this.empresa);
        } else {
          console.warn(
            '⚠️ No se encontró información para este número patronal.'
          );
        }
      },
      (error) => {
        console.error('❌ Error al obtener datos de la empresa:', error);
      }
    );
  }



}
