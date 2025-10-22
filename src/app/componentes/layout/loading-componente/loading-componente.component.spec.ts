import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadingComponenteComponent } from './loading-componente.component';

describe('LoadingComponenteComponent', () => {
  let component: LoadingComponenteComponent;
  let fixture: ComponentFixture<LoadingComponenteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoadingComponenteComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LoadingComponenteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
