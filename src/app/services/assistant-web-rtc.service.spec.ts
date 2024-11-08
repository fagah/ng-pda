import { TestBed } from '@angular/core/testing';

import { AssistantWebRtcService } from './assistant-web-rtc.service';

describe('AssistantWebRtcService', () => {
  let service: AssistantWebRtcService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AssistantWebRtcService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
