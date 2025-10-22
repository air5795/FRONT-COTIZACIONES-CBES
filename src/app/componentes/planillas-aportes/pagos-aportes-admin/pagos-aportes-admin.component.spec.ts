import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagosAportesAdminComponent } from './pagos-aportes-admin.component';

describe('PagosAportesAdminComponent', () => {
  let component: PagosAportesAdminComponent;
  let fixture: ComponentFixture<PagosAportesAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PagosAportesAdminComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PagosAportesAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
