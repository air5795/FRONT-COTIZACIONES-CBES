import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LocalService {
  constructor() {}
  setLocalStorage(key: string, token: string) {
    localStorage.setItem(key, token);
  }
  getLocalStorage(key: string): string | null {
    return localStorage.getItem(key);
  }
  setLocalStorageObjeto(key: string, restricciones: any) {
    localStorage.setItem(key, JSON.stringify(restricciones));
  }

  deleteStorage() {
    localStorage.removeItem('usuario');
    localStorage.removeItem('restriccion');
    localStorage.removeItem('recursos');
    localStorage.removeItem('token');
    localStorage.removeItem('persona');
    localStorage.removeItem('usuarioRestriccion');
    localStorage.clear();
  }

  deleteUserSpecificStorage() {
    // Elimina solo las claves que están relacionadas con la sesión de un usuario
    localStorage.removeItem('restriccion');
    localStorage.removeItem('recursos');
    localStorage.removeItem('persona');
    localStorage.removeItem('usuarioRestriccion');
    // Mantén el token u otras claves si es necesario
  }

  getJsonValue(key: string): any {
    const value = localStorage.getItem(key);
    try {
      return value ? JSON.parse(value) : null;
    } catch (e) {
      console.error(`Error parsing JSON for key "${key}":`, e);
      return null;
    }
  }
}