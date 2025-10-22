import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { SessionService } from './servicios/auth/session.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SessionResolver implements Resolve<any> {
  constructor(private sessionService: SessionService) {}

  resolve(): Observable<any> {
    return this.sessionService.initSession();
  }
}