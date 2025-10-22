import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiquidacionesAportesComponent } from './liquidaciones-aportes.component';

describe('LiquidacionesAportesComponent', () => {
  let component: LiquidacionesAportesComponent;
  let fixture: ComponentFixture<LiquidacionesAportesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LiquidacionesAportesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LiquidacionesAportesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
