import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolicitudReembolsoComponent } from './solicitud-reembolso.component';

describe('SolicitudReembolsoComponent', () => {
  let component: SolicitudReembolsoComponent;
  let fixture: ComponentFixture<SolicitudReembolsoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SolicitudReembolsoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SolicitudReembolsoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
