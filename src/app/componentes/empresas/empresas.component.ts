import { Component, OnInit } from '@angular/core';
import { EmpresaService } from '../../servicios/empresa/empresa.service';
import { LazyLoadEvent } from 'primeng/api';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-empresas',
  templateUrl: './empresas.component.html',
  styleUrl: './empresas.component.css'
})
export class EmpresasComponent implements OnInit {
  empresas: any[] = [];
  loading = true;
  totalRegistros: number = 0;
  pagina: number = 0;
  limite: number = 10;
  busqueda: string = '';
  sincronizando: boolean = false; 

  constructor(private empresaService: EmpresaService) {}

  ngOnInit() {
    this.obtenerEmpresas();
  }

  obtenerEmpresas() {
    if (this.pagina >= 0 && this.limite > 0) {
      this.loading = true;
      this.empresaService
        .getEmpresasPaginadas(
          this.pagina + 1,
          this.limite,
          this.busqueda
        )
        .subscribe(
          (response) => {
            this.empresas = response.data;
            this.totalRegistros = response.total;
            this.loading = false;
            console.log('📡 Empresas:', this.empresas);
          },
          (error) => {
            console.error('❌ Error al cargar las empresas:', error);
            this.loading = false;
          }
        );
    }
  }

  onLazyLoad(event: LazyLoadEvent) {
    const first = event.first ?? 0;
    const rows = event.rows ?? this.limite;

    this.pagina = Math.floor(first / rows);
    this.limite = rows;

    this.obtenerEmpresas();
  }

  onPageChange(event: any) {
    this.pagina = Math.floor(event.first / event.rows);
    this.limite = event.rows;
    this.obtenerEmpresas();
  }

  buscar(value: string): void {
    this.busqueda = value.trim();
    this.pagina = 0; 
    this.obtenerEmpresas();
  }

  sincronizarEmpresas() {
    Swal.fire({
      title: '¿Sincronizar empresas?',
      text: 'Se actualizarán todas las empresas con los datos más recientes del sistema externo.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, sincronizar',
      cancelButtonText: 'Cancelar',
      showLoaderOnConfirm: true,
      preConfirm: () => {
        this.sincronizando = true;
        return this.empresaService.sincronizarEmpresas().toPromise()
          .then((response) => {
            return response;
          })
          .catch((error) => {
            Swal.showValidationMessage(`Error: ${error.error?.message || error.message}`);
          });
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      this.sincronizando = false;
      
      if (result.isConfirmed) {
        Swal.fire({
          title: '¡Sincronización exitosa!',
          text: 'Las empresas han sido sincronizadas correctamente con los datos más recientes.',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        }).then(() => {
          // Recargar la tabla después de la sincronización exitosa
          this.recargar();
        });
      }
    });
  }

  recargar() {
    this.busqueda = '';
    this.pagina = 0;
    this.obtenerEmpresas();
  }
}
