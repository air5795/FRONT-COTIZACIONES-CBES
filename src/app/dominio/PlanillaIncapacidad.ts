export interface IPlanillaIncapacidad {
  activo: boolean;
  aseCi: string;
  idPlanillaIncapacidad: number;
  matricula: string;
  nombreCompleto: string;
  bajaMedicaIni: Date;
  bajaMedicaFin: Date;
  diasIncapacidadInicial: number;
  dia: number;
  totalGanadoMensual: number;
  totalDia?: number; // opcional porque es NULL en la tabla
  total: number;
  observaciones?: string; // opcional porque es NULL en la tabla
  idTipoIncapacidad?: number; // opcional porque es NULL en la tabla
  idEmpleado?: number; // opcional porque es NULL en la tabla
  fechaCotizacionDel: Date;
  fechaCotizacionAl: Date;
  diaCbes: number;
  totalPorcentajeCubrir: number;
  fechaGeneracion: Date;
  estado: string;
}

export interface IPaginatedPlanillaIncapacidad {
  data: IPlanillaIncapacidad[];
  count: string;
  page: number;
  pageSize: number;
}
