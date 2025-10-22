import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanillasAdicionalesComponent } from './planillas-adicionales.component';

describe('PlanillasAdicionalesComponent', () => {
  let component: PlanillasAdicionalesComponent;
  let fixture: ComponentFixture<PlanillasAdicionalesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlanillasAdicionalesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PlanillasAdicionalesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
