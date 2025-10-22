import { Component, AfterViewInit, Renderer2, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { PrimeNGConfig } from 'primeng/api';
import { AppComponent } from './app.component';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService } from './servicios/auth/session.service';

@Component({
  selector: 'app-main',
  templateUrl: './app.main.component.html',
})
export class AppMainComponent implements AfterViewInit, OnDestroy {
  activeTabIndex: number | undefined;
  sidebarActive: boolean | undefined;
  topbarMenuActive: boolean | undefined;
  sidebarClick: boolean | undefined;
  topbarItemClick: boolean | undefined;
  activeTopbarItem: any;
  documentClickListener: any;
  configActive: boolean | undefined;
  configClick: boolean | undefined;
  sessionData: any = null;
  band: boolean = false;

  constructor(
    public renderer: Renderer2,
    public app: AppComponent,
    private primengConfig: PrimeNGConfig,
    private readonly sessionService: SessionService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.router.navigate([], {
      queryParams: {},
      replaceUrl: true,
    });

    this.sessionService.initSession().subscribe({
      next: (data) => {
        this.sessionData = data;

        if (data?.usuario && data?.rol && Object.keys(data.rol).length > 0) {
          
          this.band = true;
        } else {
          this.band = false;
          
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        
        this.band = false;
        this.router.navigate(['/login']);
        this.cdr.detectChanges();
      },
      complete: () => {
        
      },
    });

    this.sessionService.getSessionData().subscribe((data) => {
      
      this.sessionData = data;
      if (data?.usuario && data?.rol && Object.keys(data.rol).length > 0) {
        this.band = true;
      } else {
        this.band = false;
        this.router.navigate(['/login']);
      }
      this.cdr.detectChanges();
    });
  }

  ngAfterViewInit() {
    this.documentClickListener = this.renderer.listen(
      'body',
      'click',
      (event) => {
        if (!this.topbarItemClick) {
          this.activeTopbarItem = null;
          this.topbarMenuActive = false;
        }

        if (!this.sidebarClick && (this.overlay || !this.isDesktop())) {
          this.sidebarActive = false;
        }

        if (this.configActive && !this.configClick) {
          this.configActive = false;
        }

        this.configClick = false;
        this.topbarItemClick = false;
        this.sidebarClick = false;
      }
    );
  }

  onTabClick(event: Event, index: number) {
    if (this.activeTabIndex === index) {
      this.sidebarActive = !this.sidebarActive;
    } else {
      this.activeTabIndex = index;
      this.sidebarActive = true;
    }
    event.preventDefault();
  }

  closeSidebar(event: Event) {
    this.sidebarActive = false;
    event.preventDefault();
  }

  onSidebarClick($event: any) {
    this.sidebarClick = true;
  }

  onTopbarMenuButtonClick(event: any) {
    this.topbarItemClick = true;
    this.topbarMenuActive = !this.topbarMenuActive;
    event.preventDefault();
  }

  onTopbarItemClick(event: any, item: any) {
    this.topbarItemClick = true;
    if (this.activeTopbarItem === item) {
      this.activeTopbarItem = null;
    } else {
      this.activeTopbarItem = item;
    }
    event.preventDefault();
  }

  onTopbarSubItemClick(event: any) {
    event.preventDefault();
  }

  onConfigClick(event: any) {
    this.configClick = true;
  }

  onRippleChange(event: any) {
    this.app.ripple = event.checked;
    this.primengConfig = event.checked;
  }

  get overlay(): boolean {
    return this.app.layoutMode === 'overlay';
  }

  isDesktop() {
    return window.innerWidth > 1024;
  }

  ngOnDestroy() {
    if (this.documentClickListener) {
      this.documentClickListener();
    }
  }
}