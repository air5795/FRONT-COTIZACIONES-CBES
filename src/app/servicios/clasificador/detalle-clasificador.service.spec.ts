import { TestBed } from '@angular/core/testing';

import { DetalleClasificadorService } from './detalle-clasificador.service';

describe('DetalleClasificadorService', () => {
  let service: DetalleClasificadorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DetalleClasificadorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
