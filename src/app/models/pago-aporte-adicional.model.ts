export interface PagoAporteAdicional {
    id?: number; 
    id_planilla_adicional: number;
    fecha_pago: string;
    monto_pagado: number;
    metodo_pago: string;
    comprobante_pago: string;
    observaciones: string;
    foto_comprobante?: string;
  }