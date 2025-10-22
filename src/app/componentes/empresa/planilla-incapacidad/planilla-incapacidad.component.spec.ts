import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanillaIncapacidadComponent } from './planilla-incapacidad.component';

describe('PlanillaIncapacidadComponent', () => {
  let component: PlanillaIncapacidadComponent;
  let fixture: ComponentFixture<PlanillaIncapacidadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlanillaIncapacidadComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PlanillaIncapacidadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
