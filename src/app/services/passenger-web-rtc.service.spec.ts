import { TestBed } from '@angular/core/testing';

import { PassengerWebRtcService } from './passenger-web-rtc.service';

describe('PassengerWebRtcService', () => {
  let service: PassengerWebRtcService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PassengerWebRtcService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
