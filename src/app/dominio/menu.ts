export interface Menu {
    idMenu: number;
    nombre: string;
    icono?: string;
    ruta?: string; // Antes era "path"
    idMenuPadre?: number;
    categoria?: string;
    orden: number;
    subMenus?: Menu[]; // Para almacenar los submenús
  }