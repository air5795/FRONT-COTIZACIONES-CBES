// src/app/servicios/token/token.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  
  constructor() {}

  /**
   * Encripta un ID para uso en la URL (oculta el número real)
   * @param id ID a encriptar
   * @returns ID encriptado para usar en URL
   */
  encriptarId(id: number): string {
    // Convertir ID a string y agregar timestamp para ofuscación
    const timestamp = Date.now();
    const data = `${id}-${timestamp}`;
    
    // Codificar en Base64 y hacer URL-safe
    const encoded = btoa(data).replace(/[+/=]/g, (match) => {
      return { '+': '-', '/': '_', '=': '' }[match] || match;
    });
    
    return encoded;
  }

  /**
   * Desencripta un ID que fue encriptado con encriptarId()
   * @param encryptedId ID encriptado
   * @returns ID original o null si es inválido
   */
  desencriptarId(encryptedId: string): number | null {
    try {
      // Restaurar caracteres Base64 estándar
      const normalized = encryptedId.replace(/[-_]/g, (match) => {
        return { '-': '+', '_': '/' }[match] || match;
      });
      
      // Agregar padding si es necesario
      const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
      
      // Decodificar Base64
      const decoded = atob(padded);
      const [idStr] = decoded.split('-');
      
      const id = parseInt(idStr);
      return isNaN(id) ? null : id;
    } catch (error) {
      console.error('Error al desencriptar ID:', error);
      return null;
    }
  }

  /**
   * Verifica si un string parece ser un ID encriptado válido
   * @param value String a verificar
   * @returns true si parece un ID encriptado válido
   */
  esIdEncriptado(value: string): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }
    
    // Verificar que solo contenga caracteres válidos para Base64 URL-safe
    const base64UrlSafePattern = /^[A-Za-z0-9_-]+$/;
    if (!base64UrlSafePattern.test(value)) {
      return false;
    }
    
    // Intentar desencriptar para verificar validez
    const id = this.desencriptarId(value);
    return id !== null && id > 0;
  }

  /**
   * Genera un hash simple basado en datos de la planilla (alternativa)
   * @param planillaData Datos básicos de la planilla
   * @returns Hash único
   */
  generarHashPlanilla(planillaData: any): string {
    const dataString = JSON.stringify({
      id: planillaData.id_planilla_aportes,
      cod_patronal: planillaData.cod_patronal,
      mes: planillaData.mes,
      gestion: planillaData.gestion
    });
    
    // Hash simple usando el contenido
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Para debugging: muestra el ID real de un ID encriptado
   * @param encryptedId ID encriptado
   * @returns String informativo para debugging
   */
  debugId(encryptedId: string): string {
    const realId = this.desencriptarId(encryptedId);
    return `Encriptado: ${encryptedId} → Real: ${realId}`;
  }
}