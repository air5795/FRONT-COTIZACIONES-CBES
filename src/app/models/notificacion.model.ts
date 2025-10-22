export interface Notificacion {
    id_notificacion: number;
    id_usuario_receptor: string;
    tipo_notificacion: string;
    mensaje: string;
    id_recurso: number;
    tipo_recurso: string;
    leido: boolean;
    fecha_creacion: string;
    usuario_creacion: string;
    nom_usuario?: string;
    empresa: string;
  }