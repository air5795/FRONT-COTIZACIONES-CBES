import { Restriccion } from "./Restriccion";

export interface Token {
  usuario?: string;
  token?: string;
  contraseniaReset?: boolean;
  restricciones?: Restriccion[];
}
