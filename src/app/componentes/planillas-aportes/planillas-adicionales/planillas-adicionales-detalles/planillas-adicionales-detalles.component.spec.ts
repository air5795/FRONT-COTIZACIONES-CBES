import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanillasAdicionalesDetallesComponent } from './planillas-adicionales-detalles.component';

describe('PlanillasAdicionalesDetallesComponent', () => {
  let component: PlanillasAdicionalesDetallesComponent;
  let fixture: ComponentFixture<PlanillasAdicionalesDetallesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlanillasAdicionalesDetallesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PlanillasAdicionalesDetallesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
