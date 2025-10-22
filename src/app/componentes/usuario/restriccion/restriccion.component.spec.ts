import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RestriccionComponent } from './restriccion.component';

describe('RestriccionComponent', () => {
  let component: RestriccionComponent;
  let fixture: ComponentFixture<RestriccionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RestriccionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RestriccionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
