// src/app/componentes/recursos/recursos.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MessageService, ConfirmationService } from 'primeng/api';
import { FileUpload } from 'primeng/fileupload';
import { RecursosService } from '../../servicios/recursos/recursos.service';
import { Recurso, CreateRecursoDto, FilterRecursoDto } from '../../interfaces/recursos.interface';
import { SessionService } from '../../servicios/auth/session.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-recursos',
  templateUrl: './recursos.component.html',
  styleUrls: ['./recursos.component.css']
})
export class RecursosComponent implements OnInit {
  @ViewChild('fileUpload') fileUpload!: FileUpload;

  // Datos principales
  recursos: Recurso[] = [];
  totalRecursos: number = 0;
  loading: boolean = false;
  
  // Filtros
  filtros: FilterRecursoDto = {
    page: 1,
    limit: 10,
    buscar: '',
    categoria: '',
    estado: 1 // Solo recursos activos por defecto
  };

  // Opciones para dropdowns
  categorias: any[] = [];
  estadosOptions = [
    { label: 'Activos', value: 1 },
    { label: 'Inactivos', value: 0 },
  ];

  // Modal de subir archivo
  mostrarModalSubir: boolean = false;
  nuevoRecurso: CreateRecursoDto = this.inicializarNuevoRecurso();
  archivoSeleccionado: File | null = null;
  subiendoArchivo: boolean = false;

  // Modal de vista libro
  mostrarVistaLibro: boolean = false;
  recursoActual: Recurso | null = null;
  urlVistaPrevia: SafeResourceUrl | null = null;

  tiposUsuario = [
    { label: 'Todos los usuarios', value: 'todos' },
    { label: 'Empresa Privada', value: 'empresa_privada' },
    { label: 'Empresa Pública', value: 'empresa_publica' },
    { label: 'Empresa Pasiva', value: 'empresa_pasiva' },
    { label: 'Admin. Cotizaciones', value: 'admin_cotizaciones' },
    { label: 'Admin. Tesorería', value: 'admin_tesoreria' },
    { label: 'Super Administrador', value: 'super_admin' }
  ];

  

  constructor(
    private recursosService: RecursosService,
    private messageService: MessageService,
    private sanitizer: DomSanitizer,
    private sessionService: SessionService
  ) {}

  ngOnInit(): void {
    
    this.cargarCategorias();
    this.cargarRecursos();
  }

  // Inicializar nuevo recurso
  inicializarNuevoRecurso(): CreateRecursoDto {
    return {
      titulo: '',
      descripcion: '',
      categoria: 'manual',
      esPublico: true,
      nombre_archivo: '',
      ruta_archivo: '',
      estado: 1,
      tipo_usuario: 'todos'
    };
  }

  // Getter para verificar si es administrador
  get esAdmin(): boolean {
    return this.sessionService.esAdministrador();
  }

  // Getter para obtener el tipo de usuario actual basado en el rol y empresa
  get tipoUsuarioActual(): string {
    const sessionData = this.sessionService.sessionDataSubject.value;
    
    if (!sessionData) return 'todos';
    
    const rol = sessionData?.rol?.rol || '';
    
    // Verificar si es administrador de cotizaciones
    if (rol === 'ADMIN_COTIZACIONES_DESARROLLO' || rol === 'ADMIN_COTIZACIONES') {
      return 'admin_cotizaciones';
    }
    
    // Verificar si es administrador de tesorería
    if (rol === 'ADMIN_TESORERIA_DESARROLLO' || rol === 'ADMIN_TESORERIA') {
      return 'admin_tesoreria';
    }
    
    // Verificar si es super administrador
    if (rol === 'SUPER_ADMIN') {
      return 'super_admin';
    }
    
    // Si es empresa, verificar el tipo
    if (this.sessionService.esEmpleador()) {
      const tipoEmpresa = this.sessionService.getTipoEmpresa();
      
      switch (tipoEmpresa) {
        case 'AP':
        case 'Pública':
          return 'empresa_publica';
        case 'AV':
        case 'Privada':
          return 'empresa_privada';
        case 'Pasiva':
          return 'empresa_pasiva';
        default:
          return 'todos';
      }
    }
    
    return 'todos';
  }

  // Método para verificar si el usuario puede ver un recurso específico
  puedeVerRecurso(recurso: Recurso): boolean {
    // Si es administrador, puede ver todos los recursos
    if (this.esAdmin) {
      return true;
    }
    
    // Si el recurso es público para todos
    if (recurso.tipo_usuario === 'todos') {
      return true;
    }
    
    // Verificar si coincide con el tipo de usuario actual
    const tipoActual = this.tipoUsuarioActual;
    return recurso.tipo_usuario === tipoActual;
  }

  // Cargar categorías disponibles
  cargarCategorias(): void {
    this.recursosService.getCategorias().subscribe({
      next: (categorias) => {
        this.categorias = categorias.map(cat => ({
          label: this.formatearCategoria(cat),
          value: cat
        }));
        
        // Agregar opciones adicionales
        if (!this.categorias.find(c => c.value === 'manual')) {
          this.categorias.unshift({ label: 'Manuales de Usuario', value: 'manual' });
        }
        if (!this.categorias.find(c => c.value === 'documento')) {
          this.categorias.push({ label: 'Documentos', value: 'documento' });
        }
        if (!this.categorias.find(c => c.value === 'plantilla')) {
          this.categorias.push({ label: 'Plantillas', value: 'plantilla' });
        }
        if (!this.categorias.find(c => c.value === 'imagen')) {
          this.categorias.push({ label: 'Imágenes', value: 'imagen' });
        }
        if (!this.categorias.find(c => c.value === 'video tutorial')) {
          this.categorias.push({ label: 'Videos Tutoriales', value: 'video tutorial' });
        }
        if (!this.categorias.find(c => c.value === 'general')) {
          this.categorias.push({ label: 'General', value: 'general' });
        }
      },
      error: (error) => {
        // Categorías por defecto
        this.categorias = [
          { label: 'Manuales de Usuario', value: 'manual' },
          { label: 'Documentos', value: 'documento' },
          { label: 'Plantillas', value: 'plantilla' },
          { label: 'Imágenes', value: 'imagen' },
          { label: 'Videos', value: 'video' },
          { label: 'General', value: 'general' }
        ];
      }
    });
  }

  // Cargar recursos con filtros
  cargarRecursos(event?: any): void {
    this.loading = true;

    if (event) {
      this.filtros.page = Math.floor(event.first / event.rows) + 1;
      this.filtros.limit = event.rows;
    }

    // Agregar filtro por tipo de usuario si no es admin
    if (!this.esAdmin) {
      this.filtros.tipo_usuario = this.tipoUsuarioActual;
    }

    const servicioMetodo = this.esAdmin ? 
      this.recursosService.findAll(this.filtros) : 
      this.recursosService.findByTipoUsuario(this.tipoUsuarioActual, this.filtros);

    servicioMetodo.subscribe({
      next: (response) => {
        // Filtrar recursos adicionales en el frontend si es necesario
        this.recursos = this.esAdmin ? 
          response.data : 
          response.data.filter(recurso => this.puedeVerRecurso(recurso));
        
        this.totalRecursos = response.total;
        this.loading = false;
      },
      error: (error) => {
       
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los recursos'
        });
        this.loading = false;
      }
    });
  }

  // Buscar recursos
  buscarRecursos(): void {
    this.filtros.page = 1;
    this.cargarRecursos();
  }

  // Limpiar filtros
  limpiarFiltros(): void {
    this.filtros = {
      page: 1,
      limit: 10,
      buscar: '',
      categoria: '',
      estado: 1
    };
    this.cargarRecursos();
  }

  // Seleccionar archivo
  onFileSelect(event: any): void {
    const files = event.files;
    if (files && files.length > 0) {
      this.archivoSeleccionado = files[0];
      this.nuevoRecurso.nombre_archivo = this.archivoSeleccionado!.name;
    }
  }

  // Subir archivo
  subirArchivo(): void {
    if (!this.nuevoRecurso.titulo.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'El título es requerido'
      });
      return;
    }

    // Si estamos editando y no hay archivo nuevo, solo actualizar datos
    if (this.recursoActual && !this.archivoSeleccionado) {
      this.actualizarRecurso();
      return;
    }

    // Si estamos creando y no hay archivo
    if (!this.recursoActual && !this.archivoSeleccionado) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Debe seleccionar un archivo'
      });
      return;
    }

    this.subiendoArchivo = true;

    const formData = new FormData();
    if (this.archivoSeleccionado) {
      formData.append('file', this.archivoSeleccionado);
    }
    formData.append('titulo', this.nuevoRecurso.titulo);
    formData.append('descripcion', this.nuevoRecurso.descripcion || '');
    formData.append('categoria', this.nuevoRecurso.categoria || 'general');
    formData.append('es_publico', this.nuevoRecurso.esPublico ? '1' : '0');
    formData.append('tipo_usuario', this.nuevoRecurso.tipo_usuario || 'todos');


    this.recursosService.uploadFile(formData).subscribe({
      next: (response) => {
        
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: this.recursoActual ? 'Recurso actualizado correctamente' : 'Recurso subido correctamente'
        });
        this.cerrarModalSubir();
        this.cargarRecursos();
      },
      error: (error) => {
  
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'Error al procesar el archivo'
        });
        this.subiendoArchivo = false;
      }
    });
  }

  // Actualizar recurso (solo metadatos)
  actualizarRecurso(): void {
    if (!this.recursoActual) return;

    this.subiendoArchivo = true;

    const updateDto = {
      titulo: this.nuevoRecurso.titulo,
      descripcion: this.nuevoRecurso.descripcion,
      categoria: this.nuevoRecurso.categoria,
      esPublico: this.nuevoRecurso.esPublico,
      tipo_usuario: this.nuevoRecurso.tipo_usuario
    };

    this.recursosService.update(this.recursoActual.id_recurso, updateDto).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Recurso actualizado correctamente'
        });
        this.cerrarModalSubir();
        this.cargarRecursos();
      },
      error: (error) => {
        
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el recurso'
        });
        this.subiendoArchivo = false;
      }
    });
  }

  // Cerrar modal de subir
  cerrarModalSubir(): void {
    this.mostrarModalSubir = false;
    this.nuevoRecurso = this.inicializarNuevoRecurso();
    this.archivoSeleccionado = null;
    this.subiendoArchivo = false;
    this.recursoActual = null; // Limpiar recurso en edición
    
    if (this.fileUpload) {
      this.fileUpload.clear();
    }
  }

  // Descargar recurso
  descargarRecurso(id: number): void {
    this.recursosService.downloadFile(id).subscribe({
      next: (response) => {
        // El navegador manejará automáticamente la descarga
        this.messageService.add({
          severity: 'success',
          summary: 'Descarga',
          detail: 'Archivo descargado correctamente'
        });
      },
      error: (error) => {
        
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo descargar el archivo'
        });
      }
    });
  }

  // Abrir vista de libro (PDFs)
  abrirVistaLibro(recurso: Recurso): void {
    this.recursoActual = recurso;
    this.mostrarVistaLibro = true;
    
    // Obtener URL pública del archivo
    this.recursosService.getFileUrl(recurso.id_recurso).subscribe({
      next: (response) => {
        this.procesarUrlVistaPrevia(response);
      },
      error: (error) => {
        console.error('Error al obtener URL del archivo:', error);
        this.mostrarErrorVistaPrevia('No se pudo cargar la vista previa');
      }
    });
  }

  // ✅ Método dedicado para procesar la URL de manera segura
  private procesarUrlVistaPrevia(response: any): void {
    // Resetear URL anterior
    this.urlVistaPrevia = null;
    
    // Validaciones exhaustivas
    if (!response) {
      this.mostrarErrorVistaPrevia('Respuesta vacía del servidor');
      return;
    }
    
    if (!response.url) {
      this.mostrarErrorVistaPrevia('URL no encontrada en la respuesta');
      return;
    }
    
    const url = response.url.toString().trim();
    
    if (!url) {
      this.mostrarErrorVistaPrevia('URL vacía');
      return;
    }
    
    try {
      // Validar formato de URL
      const urlObj = new URL(url);
      
      // Verificar protocolo seguro
      if (!['https:', 'http:'].includes(urlObj.protocol)) {
        throw new Error(`Protocolo no válido: ${urlObj.protocol}`);
      }
      
      // ✅ URL válida, sanitizar y asignar
      this.urlVistaPrevia = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      
    } catch (error) {
      console.error('Error al validar URL:', error, 'URL recibida:', url);
      this.mostrarErrorVistaPrevia('Formato de URL no válido');
    }
  }

  // ✅ Método auxiliar para manejar errores
  private mostrarErrorVistaPrevia(mensaje: string): void {
    this.urlVistaPrevia = null;
    this.messageService.add({
      severity: 'error',
      summary: 'Error de Vista Previa',
      detail: mensaje
    });
    // Mantener el modal abierto pero sin contenido
    // this.mostrarVistaLibro = false; // Comentar si quieres mantener el modal abierto
  }

  // Editar recurso (admin)
  editarRecurso(recurso: Recurso): void {
    // Implementar modal de edición
    this.nuevoRecurso = {
      titulo: recurso.titulo,
      descripcion: recurso.descripcion || '',
      categoria: recurso.categoria,
      esPublico: recurso.es_publico === 1,
      nombre_archivo: recurso.nombre_archivo,
      ruta_archivo: recurso.ruta_archivo,
      estado: recurso.estado,
      tipo_usuario: recurso.tipo_usuario || 'todos'
    };
    
    this.recursoActual = recurso;
    this.mostrarModalSubir = true;
    
    // Cambiar el título del modal
    setTimeout(() => {
      const modalHeader = document.querySelector('.p-dialog-header-title');
      if (modalHeader) {
        modalHeader.textContent = 'Editar Recurso';
      }
    }, 100);
  }

 // Confirmar eliminación
confirmarEliminar(recurso: Recurso): void {
  
  
  Swal.fire({
    title: '¿Eliminar recurso?',
    html: `¿Está seguro de eliminar <strong>PERMANENTEMENTE</strong> el recurso:<br><br><strong>"${recurso.titulo}"</strong><br><br>Esta acción no se puede deshacer.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
    focusCancel: true
  }).then((result) => {
    if (result.isConfirmed) {
      
      this.eliminarRecurso(recurso.id_recurso);
    } else {
      
    }
  });
}

// Eliminar recurso
eliminarRecurso(id: number): void {
  
  
  // Mostrar loading
  Swal.fire({
    title: 'Eliminando...',
    text: 'Por favor espere',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
  
  this.recursosService.delete(id).subscribe({
    next: (response) => {
      
      
      // Cerrar loading y mostrar éxito
      Swal.fire({
        title: '¡Eliminado!',
        text: 'El recurso ha sido eliminado permanentemente',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      
      this.cargarRecursos();
    },
    error: (error) => {
      
      
      // Cerrar loading y mostrar error
      Swal.fire({
        title: 'Error',
        text: error.error?.message || 'No se pudo eliminar el recurso',
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
    }
  });
}

  // Utilidades para iconos y estilos
  obtenerIconoArchivo(tipoMime: string): string {
    if (tipoMime?.includes('pdf')) return 'pi pi-file-pdf';
    if (tipoMime?.includes('word')) return 'pi pi-file-word';
    if (tipoMime?.includes('excel') || tipoMime?.includes('spreadsheet')) return 'pi pi-file-excel';
    if (tipoMime?.includes('powerpoint') || tipoMime?.includes('presentation')) return 'pi pi-file-powerpoint';
    if (tipoMime?.includes('image')) return 'pi pi-image';
    if (tipoMime?.includes('video')) return 'pi pi-video';
    if (tipoMime?.includes('zip')) return 'pi pi-folder';
    return 'pi pi-file';
  }

  obtenerColorArchivo(tipoMime: string): string {
    if (tipoMime?.includes('pdf')) return '#d32f2f';
    if (tipoMime?.includes('word')) return '#1976d2';
    if (tipoMime?.includes('excel') || tipoMime?.includes('spreadsheet')) return '#388e3c';
    if (tipoMime?.includes('powerpoint') || tipoMime?.includes('presentation')) return '#f57c00';
    if (tipoMime?.includes('image')) return '#7b1fa2';
    if (tipoMime?.includes('video')) return '#5d4037';
    return '#455a64';
  }

  obtenerEstiloCategoria(categoria: string): any {
    const estilos: any = {
      'manual': { 'background-color': '#e3f2fd', 'color': '#1976d2' },
      'documento': { 'background-color': '#f3e5f5', 'color': '#7b1fa2' },
      'plantilla': { 'background-color': '#e8f5e8', 'color': '#388e3c' },
      'imagen': { 'background-color': '#fff3e0', 'color': '#f57c00' },
      'video': { 'background-color': '#fce4ec', 'color': '#c2185b' },
      'general': { 'background-color': '#f5f5f5', 'color': '#616161' }
    };
    return estilos[categoria] || estilos['general'];
  }

  formatearCategoria(categoria: string): string {
    const nombres: any = {
      'manual': 'Manuales',
      'documento': 'Documentos',
      'plantilla': 'Plantillas',
      'imagen': 'Imágenes',
      'video': 'Videos',
      'general': 'General'
    };
    return nombres[categoria] || categoria.charAt(0).toUpperCase() + categoria.slice(1);
  }

  formatearTamano(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // Método para manejar cambios de página (compatible con el estilo de planillas-aportes-list)
  onPageChange(event: any): void {
    this.filtros.page = Math.floor(event.first / event.rows) + 1;
    this.filtros.limit = event.rows;
    this.cargarRecursos();
  }

  // Método para recargar datos
  recargar(): void {
    this.filtros = {
      page: 1,
      limit: 10,
      buscar: '',
      categoria: '',
      estado: 1
    };
    this.cargarRecursos();
  }

  // Método para buscar (compatible con el input de búsqueda del estilo planillas-aportes-list)
  buscar(value: string): void {
    this.filtros.buscar = value.trim();
    this.filtros.page = 1; // Resetear a la primera página
    this.cargarRecursos();
  }

  formatearTipoUsuario(tipo: string): string {
    const nombres: any = {
      'todos': 'Todos',
      'empresa_privada': 'Emp. Privada',
      'empresa_publica': 'Emp. Pública', 
      'empresa_pasiva': 'Emp. Pasiva',
      'admin_cotizaciones': 'Admin. Cotiz.',
      'admin_tesoreria': 'Admin. Tesor.',
      'super_admin': 'Super Admin'
    };
    return nombres[tipo] || tipo;
  }
  
  obtenerEstiloTipoUsuario(tipo: string): any {
    const estilos: any = {
      'todos': { 'background-color': '#e8f5e8', 'color': '#388e3c' },
      'empresa_privada': { 'background-color': '#e3f2fd', 'color': '#1976d2' },
      'empresa_publica': { 'background-color': '#f3e5f5', 'color': '#7b1fa2' },
      'empresa_pasiva': { 'background-color': '#fff3e0', 'color': '#f57c00' },
      'admin_cotizaciones': { 'background-color': '#ffebee', 'color': '#d32f2f' },
      'admin_tesoreria': { 'background-color': '#e0f2f1', 'color': '#00796b' },
      'super_admin': { 'background-color': '#f1f8e9', 'color': '#558b2f' }
    };
    return estilos[tipo] || estilos['todos'];
  }



}