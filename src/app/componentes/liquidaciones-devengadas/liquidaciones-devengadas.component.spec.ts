import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiquidacionesDevengadasComponent } from './liquidaciones-devengadas.component';

describe('LiquidacionesDevengadasComponent', () => {
  let component: LiquidacionesDevengadasComponent;
  let fixture: ComponentFixture<LiquidacionesDevengadasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LiquidacionesDevengadasComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LiquidacionesDevengadasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
