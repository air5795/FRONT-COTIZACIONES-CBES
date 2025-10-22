import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-componente',
  templateUrl: './loading-componente.component.html',
  styleUrl: './loading-componente.component.css'
})
export class LoadingComponenteComponent {
  @Input() progress: number = 0; 
  @Input() message: string = 'Cargando...'; 

  getStatusText(): string {
    if (this.progress === 100) {
      return 'Proceso completado';
    } else if (this.progress >= 80) {
      return 'Finalizando...';
    } else if (this.progress >= 50) {
      return 'Procesando datos...';
    } else if (this.progress >= 20) {
      return 'Analizando archivo...';
    } else {
      return 'Iniciando proceso...';
    }
  }
}