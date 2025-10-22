// loading.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SessionService } from '../../servicios/auth/session.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-loading',
  template: `<p>Inicializando sesión...</p>`,
})
export class LoadingComponent implements OnInit {
  constructor(
    private sessionService: SessionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.sessionService.initSession().subscribe({
      next: (data) => {
        if (data?.usuario && data?.rol) {
          this.router.navigate(['/cotizaciones']);
        } else {
          window.location.href = environment.login;
        }
      },
      error: () => {
        window.location.href = environment.login;
      }
    });
  }
}