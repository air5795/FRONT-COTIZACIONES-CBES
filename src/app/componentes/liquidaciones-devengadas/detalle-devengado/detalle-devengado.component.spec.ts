import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalleDevengadoComponent } from './detalle-devengado.component';

describe('DetalleDevengadoComponent', () => {
  let component: DetalleDevengadoComponent;
  let fixture: ComponentFixture<DetalleDevengadoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DetalleDevengadoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DetalleDevengadoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
