export interface PagoAporte {
  id: number; // ✅ AGREGAR: Nueva clave primaria
  id_planilla_aportes: number; // ✅ CAMBIAR: Ya no es clave primaria
  fecha_pago: Date;
  monto_pagado: number;
  monto_demasia: number;
  total_a_cancelar: number;
  metodo_pago?: string;
  comprobante_pago?: string;
  foto_comprobante?: string;
  estado: number;
  estado_envio: number;
  usuario_creacion: string;
  fecha_creacion: Date;
  usuario_modificacion?: string;
  fecha_modificacion?: Date;
  observaciones?: string;
    fecha_planilla: string;
}

