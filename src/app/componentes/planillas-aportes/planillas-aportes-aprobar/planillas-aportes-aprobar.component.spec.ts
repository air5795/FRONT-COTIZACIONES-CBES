import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanillasAportesAprobarComponent } from './planillas-aportes-aprobar.component';

describe('PlanillasAportesAprobarComponent', () => {
  let component: PlanillasAportesAprobarComponent;
  let fixture: ComponentFixture<PlanillasAportesAprobarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlanillasAportesAprobarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PlanillasAportesAprobarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
