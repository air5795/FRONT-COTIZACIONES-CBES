export interface Perfil{
  idSistema: 0,
  idcNivelRestriccion: string,
  nombrePerfil: string,
  descripcionPerfil: string,
  fechaRegistro:Date,
  usuarioRegistro: string,
  ipRegistro?: string,
  bajaLogicaRegistro?: boolean,
  fechaModificacion?: Date,
  usuarioModificacion?: string,
  colIdRecurso?: string[]
}
