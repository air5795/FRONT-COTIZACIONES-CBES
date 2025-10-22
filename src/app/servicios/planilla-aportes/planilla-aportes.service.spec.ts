import { TestBed } from '@angular/core/testing';

import { PlanillaAportesService } from './planilla-aportes.service';

describe('PlanillaAportesService', () => {
  let service: PlanillaAportesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlanillaAportesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
