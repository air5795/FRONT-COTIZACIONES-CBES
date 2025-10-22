import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanillasAportesDetalleAprobarComponent } from './planillas-aportes-detalle-aprobar.component';

describe('PlanillasAportesDetalleAprobarComponent', () => {
  let component: PlanillasAportesDetalleAprobarComponent;
  let fixture: ComponentFixture<PlanillasAportesDetalleAprobarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlanillasAportesDetalleAprobarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PlanillasAportesDetalleAprobarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
