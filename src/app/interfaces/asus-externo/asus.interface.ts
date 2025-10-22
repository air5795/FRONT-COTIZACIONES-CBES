export interface DatosPersona {
    NumeroDocumento: string;
    Complemento: string;
    Nombres: string;
    primerApellido: string;
    SegundoApellido: string;
    FechaNacimiento: Date;
  }
  
  export interface RespuestaBase {
    esValido: boolean;
    mensaje: string;
    tipoMensaje: string;
    codigoRespuesta: number;
    codigoUnico: string;
    descripcionRespuesta: string;
  }
  
  export interface RespuestaExitosa extends RespuestaBase {
    datosPersonaEnFormatoJson: DatosPersona;
    reporteCertificacion?: string; // Asumiendo que podría ser una cadena no nula en casos de éxito
  }
  
  export interface RespuestaError extends RespuestaBase {
    datosPersonaEnFormatoJson: null;
    reporteCertificacion: null;
  }
  
  export interface RespuestaCIDuplicado extends RespuestaBase {
    datosPersonaEnFormatoJson: null;
    reporteCertificacion: null;
  }
  