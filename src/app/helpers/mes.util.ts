export const MESES = [
  { value: 1, name: 'Enero' },
  { value: 2, name: 'Febrero' },
  { value: 3, name: 'Marzo' },
  { value: 4, name: 'Abril' },
  { value: 5, name: 'Mayo' },
  { value: 6, name: 'Junio' },
  { value: 7, name: 'Julio' },
  { value: 8, name: 'Agosto' },
  { value: 9, name: 'Septiembe' },
  { value: 10, name: 'Octubre' },
  { value: 11, name: 'Noviembre' },
  { value: 12, name: 'Diciembre' },
];

export const obtenerMesActual = (): number => {
  return new Date().getMonth() + 1; // +1 porque getMonth() devuelve valores de 0 a 11
};
export const obtenerRangoDeAnios = (inicio: number, fin: number): any => {
  const anios = [];
  for (let i = inicio; i <= fin; i++) {
    anios.push({ gestion:i, value:i});
  }
  return anios;
};

export const obtenerMesesCotizables = (): any => {
  const fechaActual = new Date();
  const mes = fechaActual.getMonth(); // getMonth() devuelve un rango de 0-11
  const mesesCotizable = [];
  const MESES = [
    { value: 1, name: 'Enero' },
    { value: 2, name: 'Febrero' },
    { value: 3, name: 'Marzo' },
    { value: 4, name: 'Abril' },
    { value: 5, name: 'Mayo' },
    { value: 6, name: 'Junio' },
    { value: 7, name: 'Julio' },
    { value: 8, name: 'Agosto' },
    { value: 9, name: 'Septiembre' },
    { value: 10, name: 'Octubre' },
    { value: 11, name: 'Noviembre' },
    { value: 12, name: 'Diciembre' },
  ];
  // for (let i = 0; i <= mes; i++) {
  //   mesesCotizable.push({ value: MESES[i].value, name: MESES[i].name });
  // }

  // Ahora vamos a agregar todos los meses sin ninguna condición de fecha
  for (let i = 0; i < MESES.length; i++) {
    mesesCotizable.push({ value: MESES[i].value, name: MESES[i].name });
  }
  return mesesCotizable;
};


export const formatearFecha = (fecha: string): string => {
  if (!fecha) return '';

  // Separa la cadena de fecha en componentes
  const partes = fecha.split('/');
  const dia = partes[0];
  const mes = partes[1];
  const anio = partes[2];

  // Crea la fecha en la zona horaria local
  const fechaObj = new Date(parseInt(anio), parseInt(mes) - 1, parseInt(dia));

  // Formatea la fecha como dd/mm/yyyy
  const diaFormateado = ('0' + fechaObj.getDate()).slice(-2);
  const mesFormateado = ('0' + (fechaObj.getMonth() + 1)).slice(-2);
  const anioFormateado = fechaObj.getFullYear().toString();

  return `${anioFormateado}-${mesFormateado}-${diaFormateado}`;
};

export const formatearFechaInversa = (fecha: string): string => {
  if (!fecha) return '';

  // Separa la cadena de fecha en componentes
  const partes = fecha.split('-');
  const anio = partes[0];
  const mes = partes[1];
  const dia = partes[2];

  // Crea la fecha en la zona horaria local
  const fechaObj = new Date(parseInt(anio), parseInt(mes) - 1, parseInt(dia));

  // Formatea la fecha como dd/mm/yyyy
  const diaFormateado = ('0' + fechaObj.getDate()).slice(-2);
  const mesFormateado = ('0' + (fechaObj.getMonth() + 1)).slice(-2);
  const anioFormateado = fechaObj.getFullYear().toString();

  return `${diaFormateado}/${mesFormateado}/${anioFormateado}`;
};
