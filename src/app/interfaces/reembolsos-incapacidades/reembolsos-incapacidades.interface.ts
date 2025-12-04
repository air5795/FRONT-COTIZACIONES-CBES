// Interface para el DTO de creación de solicitud de reembolso
export interface CreateSolicitudesReembolsoDto {
  cod_patronal: string;
  mes: string;
  gestion: string;
  usuario_creacion?: string;
  nombre_creacion?: string;
}

// Interface para la entidad Solicitud de Reembolso
export interface SolicitudReembolso {
  id_solicitud_reembolso: number;
  cod_patronal: string;
  id_empresa: number;
  mes: string;
  gestion: string;
  tipo_empresa: string;
  estado: number;
  fecha_solicitud: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  fecha_presentacion?: string;
  nombre_usuario?: string;
  observaciones?: string;
  usuario_creacion: string;
  nombre_creacion: string;
  total_reembolso: number;
  total_trabajadores: number;
  empresa?: {
    id_empresa: number;
    emp_nom: string;

  };
}

// Interface para la respuesta de creación
export interface CrearSolicitudResponse {
  mensaje: string;
  id_solicitud: number;
}

// Interface para la respuesta paginada de solicitudes
export interface SolicitudesPaginadasResponse {
  mensaje: string;
  solicitudes: SolicitudReembolso[];
  total: number;
  pagina: number;
  limite: number;
}

// Interface para los parámetros de búsqueda
export interface ParametrosBusquedaSolicitudes {
  pagina?: number;
  limite?: number;
  busqueda?: string;
  mes?: string;
  anio?: string;
}


// ===== INTERFACES PARA BAJAS MÉDICAS =====

// Interface para una baja médica individual
export interface BajaMedica {
  ASE_MAT: string;
  ESP_NOM: string;
  MEDI_NOM: string;
  COMPROBANTE: number;
  DIAS_IMPEDIMENTO: number;
  DIA_DESDE: string;
  DIA_HASTA: string;
  FECHA_INCORPORACION: string;
  HORA_INCORPORACION: string;
  TIPO_BAJA: string;
  FECHA_REGISTRO: string;
  // Campos adicionales para riesgo profesional
  fecha_accidente?: string;
  fecha_vigencia?: string;
  lugar_accidente?: string;
}

// Interface para un grupo de bajas médicas continuas
export interface GrupoBajasMedicas {
  id: string; // ID único del grupo
  matricula: string;
  fecha_inicio: string; // Fecha de inicio del grupo (primera baja)
  fecha_fin: string; // Fecha de fin del grupo (última baja)
  dias_totales: number; // Total de días del grupo
  bajas: BajaMedica[]; // Array de bajas que conforman el grupo
  especialidades: string[]; // Lista de especialidades involucradas
  medicos: string[]; // Lista de médicos involucrados
  comprobantes: number[]; // Lista de comprobantes
  tipo_baja: string; // Tipo de baja predominante
}

export interface ResponseBajasMedicas {
  ok: boolean;
  bajasDB: BajaMedica[];
}

export interface DetalleReembolsoCalculado {
  nro?: number;
  ci: string;
  apellido_paterno: string;
  apellido_materno: string;
  nombres: string;
  matricula: string;
  tipo_incapacidad: string;
  fecha_inicio_baja: string;
  fecha_fin_baja: string;
  fecha_atencion?: string | null;
  hora_atencion?: string | null; // Formato HH:mm:ss
  fecha_emision_certificado?: string | null;
  fecha_sello_vigencia?: string | null;
  dias_incapacidad: number;
  dias_reembolso: number;
  salario: number;
  monto_dia: number;
  monto_subtotal?: number; // Subtotal antes de aplicar porcentaje (monto_dia × dias_mes_reembolso)
  porcentaje_reembolso: number;
  monto_reembolso: number;
  observaciones?: string;
  // Campos adicionales para mostrar
  especialidad?: string;
  medico?: string;
  comprobante?: number;
  fecha_incorporacion?: string;
  // Campos para el cálculo detallado (desde el backend)
  dias_totales_baja?: number; // Total de días de la baja completa
  correspondiente_al_mes?: {
    mes: string;
    gestion: string;
    dias_en_mes: number;
    fecha_inicio: string;
    fecha_fin: string;
  };
  // Campos que se guardan en la BD (mismos datos pero con nombres de columnas)
  dias_baja_total?: number;
  dias_mes_reembolso?: number;
  fecha_inicio_mes_reembolso?: string;
  fecha_fin_mes_reembolso?: string;
  // Información sobre ajuste de fechas para riesgo profesional
  ajuste_fechas?: {
    aplicado: boolean;
    fecha_original: string;
    fecha_ajustada: string;
    motivo: string | null;
  };
}

// ===== INTERFACES PARA DATOS DE ASEGURADO =====

// Interface para los datos del asegurado obtenidos del backend
export interface DatosAsegurado {
  AFI_NRO: number;
  CA_NRO: number;
  ASE_MAT_TIT: string;
  ASE_MAT: string;
  ASE_CI: string;
  ASE_CI_EXT: string;
  TIPO_DOCUMENTO: string;
  ASE_APAT: string;
  ASE_AMAT: string;
  ASE_NOM: string;
  ASE_FEC_NAC: string;
  ASE_EDAD: number;
  ASE_SEXO: string;
  ASE_TELF: string;
  EMP_NPATRONAL: string;
  EMP_NOM: string;
  ASE_TIPO: string;
  ASE_ESTADO: string;
  ASE_COND_EST: string;
  ASE_TIPO_ASEGURADO: string;
  PAR_COD: number;
  PAR_DESC: string | null;
}

// Interface para la respuesta de búsqueda de asegurado
export interface ResponseAsegurado {
  status: boolean;
  data: DatosAsegurado | DatosAsegurado[]; // Puede ser un objeto o un array
  message: string;
}