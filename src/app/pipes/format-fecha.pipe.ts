import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatFecha'
})
export class FormatFechaPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return value;

    const fecha = new Date(value);

    if (isNaN(fecha.getTime())) {
      return value; 
    }

    const dia = fecha.getUTCDate();
    const mes = fecha.toLocaleString('es', { month: 'short', timeZone: 'UTC' }); 
    const año = fecha.getUTCFullYear();
    const horas = fecha.getUTCHours(); 
    const minutos = fecha.getUTCMinutes().toString().padStart(2, '0'); 

    return `${dia} ${mes} ${año}, ${horas}:${minutos}`;
  }
}