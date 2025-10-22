import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GoogleMapsLoaderService {
  private apiLoaded = false;
  private loadingPromise: Promise<void> | null = null;

  load(apiKey: string): Promise<void> {
    if (this.apiLoaded) return Promise.resolve();
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = new Promise((resolve, reject) => {
      if ((window as any).google?.maps) {
        this.apiLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      // ✅ Cargar con todas las librerías necesarias y v=weekly para la API más reciente
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async&libraries=marker,geometry&v=weekly&map_ids=DEMO_MAP_ID`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        this.apiLoaded = true;
        this.loadingPromise = null;
        
        // ✅ Suprimir warnings de deprecación globalmente
        this.suppressDeprecationWarnings();
        
        resolve();
      };
      
      script.onerror = (error) => {
        this.loadingPromise = null;
        reject(error);
      };
      
      document.head.appendChild(script);
    });

    return this.loadingPromise;
  }

  private suppressDeprecationWarnings(): void {
    // ✅ Interceptar y filtrar warnings específicos de Google Maps
    const originalWarn = console.warn;
    console.warn = (...args: any[]) => {
      const message = args.join(' ');
      
      // Filtrar warnings específicos de Google Maps
      if (
        message.includes('google.maps.Marker is deprecated') ||
        message.includes('AdvancedMarkerElement') ||
        message.includes('February 21st, 2024')
      ) {
        return; // No mostrar estos warnings
      }
      
      // Mostrar otros warnings normalmente
      originalWarn.apply(console, args);
    };
  }

  isLoaded(): boolean {
    return this.apiLoaded;
  }
}
