import { TestBed } from '@angular/core/testing';

import { TipoIncapacidadService } from './tipo-incapacidad.service';

describe('TipoIncapacidadService', () => {
  let service: TipoIncapacidadService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TipoIncapacidadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
