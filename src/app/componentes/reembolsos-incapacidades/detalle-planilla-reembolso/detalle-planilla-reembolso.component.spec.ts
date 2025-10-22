import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetallePlanillaReembolsoComponent } from './detalle-planilla-reembolso.component';

describe('DetallePlanillaReembolsoComponent', () => {
  let component: DetallePlanillaReembolsoComponent;
  let fixture: ComponentFixture<DetallePlanillaReembolsoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DetallePlanillaReembolsoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DetallePlanillaReembolsoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
