import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { PassengerWebRtcService } from '../services/passenger-web-rtc.service';
import { SharedModule } from '../shared/shared.module';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-passenger-screen',
  standalone: true,
  imports: [SharedModule, CommonModule],
  templateUrl: './passenger-screen.component.html',
  styleUrl: './passenger-screen.component.scss'
})
export class PassengerScreenComponent implements OnInit {

  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  incomingCall: boolean = false;
  isInCall: boolean = false;
  isCallRejected: boolean = false;

  user: any = { stationId: '1', stationGroup: 'passenger' };

  constructor(private webRTCService: PassengerWebRtcService) {}

  ngOnInit(): void {

    this.webRTCService.setupWebSocketListeners(this.user);
    this.setupWebRTCListeners(this.user);
    this.webRTCService.stompService.connect(this.user);

    this.webRTCService.getLocalStream().subscribe(stream => {
      if (this.localVideo && stream) {
        this.localVideo.nativeElement.srcObject = stream;
      }
    });

    this.webRTCService.getRemoteStream().subscribe(stream => {
      if (this.remoteVideo && stream) {
        this.remoteVideo.nativeElement.srcObject = stream;
      }
    });
  }

  startCall() {
    this.webRTCService.initiateCall(this.user);
    this.isInCall = true;
    this.incomingCall = false;
  }

  endCall(stationId: string) {
    this.webRTCService.endCall(stationId);
    this.isInCall = false;
  }

  rejectCall() {
    this.webRTCService.endCall(this.user.stationId);
    this.isCallRejected = true;
    this.incomingCall = false;
  }

  private setupWebRTCListeners(user: any) {
    this.webRTCService.stompService.connect(this.user);
    // Listen for incoming calls
    this.webRTCService.stompService.watch('/topic/passenger/incoming-call').subscribe(() => {
      if (!this.isInCall) {
        this.incomingCall = true;
      }
    });

    // Listen for call rejection
    this.webRTCService.stompService.watch('/topic/passenger/call-rejected').subscribe(() => {
      this.isCallRejected = true;
      this.incomingCall = false;
    });
  }
}
