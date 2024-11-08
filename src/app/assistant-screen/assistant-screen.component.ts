import { Component } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { AssistantWebRtcService } from '../services/assistant-web-rtc.service';

@Component({
  selector: 'app-assistant-screen',
  standalone: true,
  imports: [SharedModule, CommonModule],
  templateUrl: './assistant-screen.component.html',
  styleUrl: './assistant-screen.component.scss'
})
export class AssistantScreenComponent {

  localStream$: Observable<MediaStream | null>;
  remoteStream$: Observable<MediaStream | null>;
  isCallActive = false;

  user: any = { stationId: '2', stationGroup: 'agent' };

  constructor(private webRTCService: AssistantWebRtcService) {
    this.localStream$ = this.webRTCService.getLocalStream();
    this.remoteStream$ = this.webRTCService.getRemoteStream();
  }

  ngOnInit(): void {
    // Optionally, you could initialize any additional logic here
    this.setupWebSocketListeners(this.user);
    this.webRTCService.stompService.connect(this.user);
  }

  ngOnDestroy(): void {
    this.endCall();
  }

  // Handles answering an incoming call
  handleAnswer(): void {
    // Logic to answer the call, probably triggered by user action
    // this.assistantWebRtcService.handleOffer();
    this.isCallActive = true;
  }

  // Ends the call
  endCall(): void {
    this.webRTCService.endCall(this.user.stationId);
    this.isCallActive = false;
  }

  /** Listens to WebSocket messages from the passenger */
  private setupWebSocketListeners(user: any): void {
    // Listens for incoming offers from passengers
    // /topic/agent/offer
    this.webRTCService.stompService.watch('/topic/agent/offer').subscribe((message) => {
      const parsedMessage = JSON.parse(message.body);
      if (parsedMessage.type === 'offer') {
        this.webRTCService.handleOffer(parsedMessage, user.stationId);
      } else if (parsedMessage.type === 'call-rejected') {
        alert('Call was rejected by the passenger.');
      }
    });

    // ICE candidate exchange with passenger
    this.webRTCService.stompService.watch('/topic/passenger/ice-candidate').subscribe((message) => {
      const parsedMessage = JSON.parse(message.body);
      if (parsedMessage.type === 'candidate') {
        this.webRTCService.handleICECandidate(parsedMessage.candidate);
      }
    });

    // Listen for hangup messages to end the call
    this.webRTCService.stompService.watch('/topic/passenger/hangup').subscribe(() => {
      this.webRTCService.endCall(user.stationId);
      alert('The passenger has ended the call.');
    });
  }
}
