import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LocalService } from '../../servicios/local/local.service';
import { Restriccion } from '../../dominio/Restriccion';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AutentificacionService } from '../../servicios/autentificacion/autentificacion.service';
import { Mensaje } from '../../dominio/Mensaje';
import { environment } from '../../../environments/environment';
import { Usuario } from '../../dominio/Usuario';
@Component({
  selector: 'app-autentificacion',
  templateUrl: './autentificacion.component.html',
  styleUrl: './autentificacion.component.css',
})
export class AutentificacionComponent {
  restricciones: Restriccion[] | undefined;
  selectedRestriccion: Restriccion | undefined;
  restriccionForm!: FormGroup;
  constructor(
    public router: Router,
    private localService: LocalService,
    private autentificacionService: AutentificacionService
  ) {
    this.restriccionForm = new FormGroup({
      selectedRestriccion: new FormControl('', Validators.required),
    });
  }
  ngOnInit() {
    this.restricciones = JSON.parse(
      this.localService.getLocalStorage('restriccion')!
    );
    console.log(this.restricciones);
  }

  ingresar() {
    let contexto: any = {
      sistema: environment.sistema,
      usuario: this.localService.getLocalStorage('usuario'),
      idUsuarioRestriccion:this.restriccionForm.value.selectedRestriccion,
    };
    this.autentificacionService
      .postContexto(contexto)
      .subscribe((respuesta: any) => {
        if (respuesta.status) {
          this.localService.setLocalStorageObjeto("recursos",respuesta.data.listaRecurso!);
          this.localService.setLocalStorageObjeto("persona",respuesta.data.usuario.persona!);
          this.localService.setLocalStorageObjeto("usuarioRestriccion",respuesta.data.usuarioRestriccion!);
          this.router.navigate(['cotizaciones']);
        }
      });

  }

  cancelarIngreso(){
    this.localService.deleteStorage();
    this.router.navigate(['']);
  }

}
