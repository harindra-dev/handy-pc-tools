import { TestBed } from '@angular/core/testing';

import { AppUtils } from './app-utils';

describe('AppUtils', () => {
  let service: AppUtils;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppUtils);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
