import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-accessdenied',
  templateUrl: './app.accessdenied.component.html',
  styleUrls: ['./app.accessdenied.component.scss']
})
export class AppAccessdeniedComponent {
  constructor(private router: Router) {}

  goHome() {
    this.router.navigate(['/']);
  }
}
