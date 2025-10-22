import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistorialAportesComponent } from './historial-aportes.component';

describe('HistorialAportesComponent', () => {
  let component: HistorialAportesComponent;
  let fixture: ComponentFixture<HistorialAportesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HistorialAportesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HistorialAportesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
