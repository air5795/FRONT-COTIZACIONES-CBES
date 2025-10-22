import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

// ✅ Suprimir mensajes de React DevTools en proyectos Angular
if (typeof window !== 'undefined') {
  (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = { 
    isDisabled: true,
    supportsFiber: true,
    inject: () => {},
    onCommitFiberRoot: () => {},
    onCommitFiberUnmount: () => {}
  };

  // ✅ Suprimir errores de jQuery externos
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    
    // Filtrar errores específicos que no son de nuestro código
    if (
      message.includes('jquery-3.4.1.min.js') ||
      message.includes('translateContent.js') ||
      message.includes('Expected number') ||
      message.includes('React DevTools') ||
      message.includes('attribute d:')
    ) {
      return; // No mostrar estos errores
    }
    
    // Mostrar otros errores normalmente
    originalConsoleError.apply(console, args);
  };

  // ✅ Prevenir carga de scripts jQuery externos
  const originalCreateElement = document.createElement;
  document.createElement = function(tagName: string, options?: any) {
    const element = originalCreateElement.call(this, tagName, options);
    
    if (tagName.toLowerCase() === 'script') {
      const script = element as HTMLScriptElement;
      const originalSetAttribute = script.setAttribute;
      
      script.setAttribute = function(name: string, value: string) {
        if (name === 'src' && (
          value.includes('jquery') || 
          value.includes('translateContent')
        )) {
          console.warn('Blocked external script:', value);
          return;
        }
        originalSetAttribute.call(this, name, value);
      };
    }
    
    return element;
  };
}

if (environment.production) {
    enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
    .catch(err => console.error(err));
