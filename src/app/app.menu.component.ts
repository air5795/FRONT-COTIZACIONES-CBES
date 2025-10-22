import { Component, OnInit } from '@angular/core';
import { SessionService } from './servicios/auth/session.service';
import { Menu } from './dominio/menu';

@Component({
  selector: 'app-menu',
  template: `
    <div class="menu-scroll-content" style="padding: 10px;">
      <ul class="navigation-menu">
        <li
          app-menuitem
          *ngFor="let item of model; let i = index"
          [item]="item"
          [index]="i"
          [root]="true"
          style="background-color: #ededed; color: white; border-bottom: 2px solid #ffffff; border-radius: 8px; padding: 5px;"
        ></li>
      </ul>
    </div>
  `,
  styles: [
    `
      .navigation-menu {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      ::ng-deep .layout-wrapper .layout-sidebar .layout-tabmenu .layout-tabmenu-contents .layout-tabmenu-content .layout-submenu-content .navigation-menu li ul li a {
        padding: 15px !important;
      }
    `
  ]
})
export class AppMenuComponent implements OnInit {
  public model: any[] = [];

  constructor(private readonly sessionService: SessionService) {}

  ngOnInit() {
    this.sessionService.getSessionData().subscribe((data) => {
      const menus = data?.rol?.menus || [];
      this.model = this.getMenusWithSubMenus(menus);
    });
  }

  getMenusWithSubMenus(menus: Menu[]): any[] {
    const map = new Map<number, Menu>();
    const roots: Menu[] = [];

    menus.forEach((menu) => {
      menu.subMenus = [];
      map.set(menu.idMenu, menu);
    });

    menus.forEach((menu) => {
      if (menu.idMenuPadre === null) {
        roots.push(menu);
      } else {
        const parent = map.get(menu.idMenuPadre ?? 0);
        if (parent) {
          parent.subMenus!.push(menu);
        }
      }
    });

    const sortByOrder = (a: Menu, b: Menu) => a.orden - b.orden;

    const sortMenus = (menus: Menu[]) => {
      menus.sort(sortByOrder);
      menus.forEach((menu) => {
        sortMenus(menu.subMenus!);
      });
    };

    sortMenus(roots);

    return this.mapear(roots);
  }

  mapear(recurso: Menu[]): any[] {
    return recurso.map((r: Menu) => ({
      label: r.nombre,
      icon: r.icono,
      routerLink: r.ruta === 'null' ? null : r.ruta,
      items: this.mapear(r.subMenus || []),
      expanded: false
    }));
  }
}