import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanillasAportesComponent } from './planillas-aportes.component';

describe('PlanillasAportesComponent', () => {
  let component: PlanillasAportesComponent;
  let fixture: ComponentFixture<PlanillasAportesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlanillasAportesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PlanillasAportesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
