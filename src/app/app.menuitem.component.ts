import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: '[app-menuitem]',
  template: `
    <ng-container>
      <!-- Elemento con submenús o sin routerLink -->
      <a
        *ngIf="item.items?.length || !item.routerLink"
        href="javascript:void(0)"
        (click)="toggleSubmenu()"
        [ngClass]="{ 'active': isActive(), 'menu-item': true }"
      >
        <i [ngClass]="item.icon" class="layout-menuitem-icon"></i>
        <span>{{ item.label }}</span>
        <i *ngIf="item.items?.length" class="pi submenu-toggler" [ngClass]="item.expanded ? 'pi-angle-up' : 'pi-angle-down'"></i>
      </a>
      <!-- Elemento con routerLink y sin submenús -->
      <a
        *ngIf="item.routerLink && !item.items?.length"
        [routerLink]="item.routerLink"
        [ngClass]="{ 'active': isActive(), 'menu-item': true }"
      >
        <i [ngClass]="item.icon" class="layout-menuitem-icon"></i>
        <span>{{ item.label }}</span>
      </a>
      <!-- Submenús -->
      <ul *ngIf="item.items?.length && item.expanded" class="submenu">
        <li
          app-menuitem
          *ngFor="let child of item.items; let i = index"
          [item]="child"
          [index]="i"
        ></li>
      </ul>
    </ng-container>
  `,
  styles: [
    `
      .menu-item {
        display: flex;
        align-items: center;
        padding: 10px 15px;
        color: #333;
        text-decoration: none;
        border-radius: 4px;
        margin: 2px 0;
        transition: background-color 0.2s;
      }
      .menu-item:hover {
        background-color: #d5d5d5;
      }
      .active {
        background-color: #ededed;
        color: #0c8579 !important;
        font-weight: 500;
      }
      .layout-menuitem-icon {
        margin-right: 10px;
        color: inherit;
        order: -1; /* Asegura que el icono esté a la izquierda */
      }
      .submenu {
        list-style: none;
        padding: 0;
        margin: 0 0 0 20px;
      }
      .submenu-toggler {
        margin-left: auto; /* Coloca el icono de expansión a la derecha */
        color: inherit;
      }
    `
  ]
})
export class AppMenuitemComponent implements OnInit {
  @Input() item: any;
  @Input() index: number | undefined;
  @Input() root: boolean | undefined;

  constructor(private router: Router) {}

  ngOnInit() {
    if (this.item.items?.length) {
      this.item.expanded = this.isActive();
    }
  }

  isActive(): boolean {
    if (this.item.routerLink) {
      return this.router.isActive(this.item.routerLink, { paths: 'exact', queryParams: 'ignored', fragment: 'ignored', matrixParams: 'ignored' });
    }
    if (this.item.items?.length) {
      return this.item.items.some((child: any) => {
        return child.routerLink && this.router.isActive(child.routerLink, { paths: 'exact', queryParams: 'ignored', fragment: 'ignored', matrixParams: 'ignored' });
      });
    }
    return false;
  }

  toggleSubmenu() {
    if (this.item.items?.length) {
      this.item.expanded = !this.item.expanded;
    }
  }
}