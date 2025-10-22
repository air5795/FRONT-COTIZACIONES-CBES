import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanillasAportesListComponent } from './planillas-aportes-list.component';

describe('PlanillasAportesListComponent', () => {
  let component: PlanillasAportesListComponent;
  let fixture: ComponentFixture<PlanillasAportesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlanillasAportesListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PlanillasAportesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
