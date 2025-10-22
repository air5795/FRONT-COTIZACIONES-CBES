import {Component, OnInit} from '@angular/core';
import {PrimeNGConfig} from 'primeng/api';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
})
export class AppComponent implements OnInit{

    layoutMode = 'static';

    darkMenu = false;

    inputStyle = 'outlined';

    ripple = true;

    compactMode = false;

    constructor(private primengConfig: PrimeNGConfig) {}

    ngOnInit() {
        this.primengConfig.ripple = true;
    }
}
