import { Recurso } from "./Recurso";
import { Token } from "./Token";

export interface Mensaje {
  status:boolean,
  message:string,
  data:Token,
}
