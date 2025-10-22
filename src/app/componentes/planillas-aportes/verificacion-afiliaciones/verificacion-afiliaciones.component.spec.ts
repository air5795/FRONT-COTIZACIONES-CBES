import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerificacionAfiliacionesComponent } from './verificacion-afiliaciones.component';

describe('VerificacionAfiliacionesComponent', () => {
  let component: VerificacionAfiliacionesComponent;
  let fixture: ComponentFixture<VerificacionAfiliacionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VerificacionAfiliacionesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VerificacionAfiliacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
