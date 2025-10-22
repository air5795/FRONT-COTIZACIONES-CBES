import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanillasAportesDetalleComponent } from './planillas-aportes-detalle.component';

describe('PlanillasAportesDetalleComponent', () => {
  let component: PlanillasAportesDetalleComponent;
  let fixture: ComponentFixture<PlanillasAportesDetalleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlanillasAportesDetalleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PlanillasAportesDetalleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
