// Define la interfaz para un empleado
export interface Empleado {
    idEmpleado: number;
    nombresYapellidos: string;
    ci: number;
    cargo: string;
    fechaIngreso: string;
    fechaRetiro: string;
    diasTrabajados: number;
    totalGanado: number;
    totalDescuento: number;
    fecha: string;
    matricula: string;
    observaciones: string;
  }
  
  // paginated-response.interface.ts
  export interface PaginatedResponse {
    data: Empleado[];
    count: string;
    page: number;
    pageSize: number;
  }
  
  // prueba
  export interface IEmpleado {
    idEmpleado?: number;
    aseNro: number;
    empNro: number;
    afiNro: number;
    caNro: number;
    aseCod: number;
    aseMatTit: string;
    aseMat: string;
    aseCiTit: string;
    tipoDocumentoTit: string;
    aseCi: number;
    aseCiCom?: string;
    aseCiext: string;
    tipoDocumento: string;
    aseApat: string;
    aseAmat: string;
    aseNom: string;
    aseLugNac: string;
    aseFecNac: Date;
    aseEdad: number;
    aseSexo: string;
    aseEcivil: string;
    aseCalle: string;
    aseNum: string;
    aseZona: string;
    aseLocalidad: string;
    aseTelf: string;
    aseProfesion: string;
    aseCargo: string;
    aseHaber: number;
    empNpatronal: string;
    empNom: string;
    aseFiniEmp: Date;
    aseLugar: string;
    aseFecAfi: Date;
    aseTipo: string;
    aseEstado: string;
    aseCondEst: string;
    aseTipoCod: number;
    aseTipoAsegurado: string;
    aseObs?: string;
    aseEstudio?: string;
    aseDocu?: string;
    parCod: number;
    parDesc: string;
    parOrden: number;
    validadoAfilaciones?: boolean;
    validadoSegip?: boolean;
    observaciones: string;
  }
  export interface IPaginatedResponseEmpleados {
    data: IEmpleado[];
    count: string;
    page: number;
    pageSize: number;
  }
  