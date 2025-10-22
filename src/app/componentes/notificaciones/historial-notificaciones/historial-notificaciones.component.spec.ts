import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistorialNotificacionesComponent } from './historial-notificaciones.component';

describe('HistorialNotificacionesComponent', () => {
  let component: HistorialNotificacionesComponent;
  let fixture: ComponentFixture<HistorialNotificacionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HistorialNotificacionesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HistorialNotificacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
