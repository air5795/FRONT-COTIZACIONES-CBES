import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ReembolsosIncapacidadesService } from '../../../servicios/reembolsos-incapacidades/reembolsos-incapacidades.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-subir-archivo-denuncia',
  templateUrl: './subir-archivo-denuncia.component.html',
  styleUrls: ['./subir-archivo-denuncia.component.css']
})
export class SubirArchivoDenunciaComponent {
  @Input() idDetalle!: number;
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() archivoSubido = new EventEmitter<any>();

  archivoSeleccionado: File | null = null;
  previsualizacion: any = null;
  cargando: boolean = false;

  constructor(private reembolsosService: ReembolsosIncapacidadesService) {}

  onFileSelect(event: any) {
    const file = event.files[0];
    if (file) {
      this.archivoSeleccionado = file;
      this.generarPrevisualizacion(file);
    }
  }

  generarPrevisualizacion(file: File) {
    this.previsualizacion = {
      nombre: file.name,
      tamano: this.formatFileSize(file.size),
      tipo: file.type,
      extension: file.name.split('.').pop()?.toUpperCase() || '',
      url: null
    };

    // Generar URL para previsualización si es imagen
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previsualizacion.url = e.target?.result;
      };
      reader.readAsDataURL(file);
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  subirArchivo() {
    if (!this.archivoSeleccionado || !this.idDetalle) {
      Swal.fire({
        icon: 'warning',
        title: 'Advertencia',
        text: 'Debe seleccionar un archivo antes de continuar.'
      });
      return;
    }

    this.cargando = true;

    this.reembolsosService.subirArchivoDenuncia(this.idDetalle, this.archivoSeleccionado)
      .subscribe({
        next: (response) => {
          this.cargando = false;
          Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: 'Archivo subido correctamente'
          });
          this.archivoSubido.emit(response);
          this.cerrarModal();
        },
        error: (error) => {
          this.cargando = false;
          console.error('Error al subir archivo:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.error?.mensaje || 'Error al subir el archivo'
          });
        }
      });
  }

  cerrarModal() {
    this.visible = false;
    this.visibleChange.emit(false);
    this.archivoSeleccionado = null;
    this.previsualizacion = null;
  }

  onHide() {
    this.cerrarModal();
  }
}