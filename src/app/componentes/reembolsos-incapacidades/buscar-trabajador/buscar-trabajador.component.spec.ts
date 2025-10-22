import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuscarTrabajadorComponent } from './buscar-trabajador.component';

describe('BuscarTrabajadorComponent', () => {
  let component: BuscarTrabajadorComponent;
  let fixture: ComponentFixture<BuscarTrabajadorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BuscarTrabajadorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BuscarTrabajadorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
