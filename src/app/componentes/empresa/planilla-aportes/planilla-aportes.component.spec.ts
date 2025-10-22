import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanillaAportesComponent } from './planilla-aportes.component';

describe('PlanillaAportesComponent', () => {
  let component: PlanillaAportesComponent;
  let fixture: ComponentFixture<PlanillaAportesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlanillaAportesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PlanillaAportesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
