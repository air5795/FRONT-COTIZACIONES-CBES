import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagosAportesComponent } from './pagos-aportes.component';

describe('PagosAportesComponent', () => {
  let component: PagosAportesComponent;
  let fixture: ComponentFixture<PagosAportesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PagosAportesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PagosAportesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
