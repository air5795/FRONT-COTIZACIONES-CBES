import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagosAportesAdicionalesComponent } from './pagos-aportes-adicionales.component';

describe('PagosAportesAdicionalesComponent', () => {
  let component: PagosAportesAdicionalesComponent;
  let fixture: ComponentFixture<PagosAportesAdicionalesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PagosAportesAdicionalesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PagosAportesAdicionalesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
