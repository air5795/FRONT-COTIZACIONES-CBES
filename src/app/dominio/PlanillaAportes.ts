export interface IPlanillaAportes {
    activo: boolean;
    idEmpleado?: number; // opcional porque es NULL en la tabla
    aseCi: string;
    idPlanillaIncapacidad: number;
    aseMatTit: string;
    aseApat: string;
    aseAmat: string;
    aseNom: string;
    cargo: string;
    bajaMedicaIni: Date;
    bajaMedicaFin: Date;
    diasIncapacidadInicial: number;
    dia: number;
    totalGanadoMensual: number;
    totalDia?: number; // opcional porque es NULL en la tabla
    total: number;
    observaciones?: string; // opcional porque es NULL en la tabla
    idTipoIncapacidad?: number; // opcional porque es NULL en la tabla
    fechaCotizacionDel: Date;
    fechaCotizacionAl: Date;
    diaCbes: number;
    totalPorcentajeCubrir: number;
    fechaGeneracion: Date;
    estado: string;
  }
  
  export interface IPaginatedPlanillaAportes {
    data: IPlanillaAportes[];
    count: string;
    page: number;
    pageSize: number;
  }
  