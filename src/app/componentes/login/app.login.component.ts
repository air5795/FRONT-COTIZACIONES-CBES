
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { LoginService } from '../../servicios/login/login.service';
import { Usuario } from '../../dominio/Usuario';
import { Mensaje } from '../../dominio/Mensaje';
import { environment } from '../../../environments/environment';
import { LocalService } from '../../servicios/local/local.service';

@Component({
  selector: 'app-login',
  templateUrl: './app.login.component.html',
})
export class AppLoginComponent {
  usuario!: FormGroup;
  constructor(public router: Router, private loginService:LoginService, private localService:LocalService){

  }
  ngOnInit() {
    this.usuario = new FormGroup({
      usuario: new FormControl('', [Validators.required, Validators.minLength(3)]),
      contrasenia: new FormControl('', Validators.required)
    });
  }
  verificarUsuario(){
  let usuario:Usuario=this.usuario.value;
  usuario.idSistema=environment.sistema;
  this.loginService.postLogin(usuario).subscribe((respuesta:any) => {
    console.log(respuesta);
    if(respuesta.status){
      this.localService.setLocalStorage("token",respuesta.data.token!);
      this.localService.setLocalStorage("usuario",usuario.usuario!);
      this.localService.setLocalStorageObjeto("restriccion",respuesta.data.restricciones)
      this.router.navigate(['autentificar']);
    }
  });
  }

}
