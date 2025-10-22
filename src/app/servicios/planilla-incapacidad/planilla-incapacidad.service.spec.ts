import { TestBed } from '@angular/core/testing';

import { PlanillaIncapacidadService } from './planilla-incapacidad.service';

describe('PlanillaIncapacidadService', () => {
  let service: PlanillaIncapacidadService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlanillaIncapacidadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
