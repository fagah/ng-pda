import { AfterViewInit, Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { RxStompService } from '../services/rx-stomp.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RTCPeerConfiguration } from '../app.constants';
import { Subscription } from 'rxjs';
import { SharedModule } from '../shared/shared.module';
import { CommonModule } from '@angular/common';
import { WebRTCService } from '../services/web-rtc.service';

// export const ENV_RTCPeerConfiguration = RTCPeerConfiguration;

// const mediaConstraints = {
//   audio: true,
//   video: { width: 1280, height: 720 },
// };

// const offerOptions = {
//   offerToReceiveAudio: true,
//   offerToReceiveVideo: true,
// };

@Component({
  selector: 'app-passenger',
  standalone: true,
  imports: [SharedModule, CommonModule],
  templateUrl: './passenger.component.html',
  styleUrls: ['./passenger.component.scss'] // Fixed typo from styleUrl to styleUrls
})
export class PassengerComponent implements AfterViewInit, OnDestroy {
  
  @ViewChild('userLocalVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('peerReceivedVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  localStream: MediaStream | null = null;
  remoteStream: MediaStream | null = null;

  currentUser: any = JSON.parse(localStorage.getItem('currentUser') || '{}');
  localVideoActive = false;
  isCameraOn: boolean = true;
  isMicOn: boolean = true;
  isCalling: boolean = false;

  // protected webRTCService: WebRTCService = inject(WebRTCService);
  private messagesSubscription?: Subscription
  private localSubscription?: Subscription;
  private remoteSubscription?: Subscription;

  constructor(protected webRTCService: WebRTCService){
    this.webRTCService.getStompService().connect(this.currentUser);
    this.localSubscription = this.webRTCService.getLocalStream().subscribe((stream) => {
      this.localStream = stream;
      if (stream && this.localVideo.nativeElement) {
          this.localVideo.nativeElement.srcObject = stream;
      }else {
        console.warn('Local stream or local video element not available');
      }
    });

    // Subscribe to remote stream
    this.remoteSubscription = this.webRTCService.getRemoteStream().subscribe((stream) => {
      this.remoteStream = stream;
      if (stream && this.remoteVideo.nativeElement) {
          this.remoteVideo.nativeElement.srcObject = stream;
      }else {
        console.warn('Local stream or local video element not available');
      }
    });
  }

  ngAfterViewInit(): void {
    // Subscribe to local stream
    this.messagesSubscription = this.webRTCService.getStompService().messages$.subscribe((msg: any) => {
      switch (msg.type) {
        case 'answer':
          this.handleAnswer(msg);
          break;
        case 'candidate':
          console.info(`Passenger - ICE candidate received subscription:  ${JSON.stringify(msg.candidate)}`);
          this.webRTCService.handleICECandidate(msg.candidate);
          break;
        
        case 'call-rejected':
          alert(`Call was rejected by a passenger => ${JSON.stringify(msg.data)}`);
          this.hangUp();
          break;
        
        case 'hangup':
          alert(`Call was hung up by an agent`);
          this.hangUp();
        break;

        default:
          console.log(`Passenger => Unknown message type: ${msg.type}`);
      }
    });
  }

  async initiateCall(): Promise<void> {
    this.isCalling = true;
    await this.webRTCService.startCall(this.currentUser);
  }

  async hangUp(): Promise<void> {
    this.isCalling = false;
    this.webRTCService.endCall(this.currentUser.stationId);
  }

  handleICECandidate(candidate: any): void {
    console.info(`Passenger - ICE candidate received:  ${JSON.stringify(candidate)}`);
    this.webRTCService.handleICECandidate(candidate.candidate);
  }

  private async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    try {
      const remoteDescription = new RTCSessionDescription(answer); // The SDP answer received from the agent
      await this.webRTCService.getPeerConnection()!.setRemoteDescription(remoteDescription);
    } catch (error) {
      console.error("Failed to set remote description:", error);
    }
  }

  ngOnDestroy(): void {
    if (this.localSubscription) {
      this.localSubscription.unsubscribe();
    }
    if (this.remoteSubscription) {
      this.remoteSubscription.unsubscribe();
    }

    if (this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
    }
  }
  // ---------------------------------------------

  // private localStream?: MediaStream;
  // private peerConnection?: RTCPeerConnection;
  // private messagesSubscription?: Subscription;

  // constructor(
  //   private rxStompService: RxStompService,
  //   private modalService: NgbModal,
  // ) {
  //   this.initializeWebSocket();
  // }

  // ngAfterViewInit(): void {
  //   this.requestMediaDevices();
  //   this.startLocalVideo();
  // }

  // createPeerConnection(): void {
  //   this.peerConnection = new RTCPeerConnection({
  //     iceServers: [
  //       { urls: 'stun:stun.l.google.com:19302' } // STUN server configuration
  //     ],
  //   });

  //   this.peerConnection.onicecandidate = (event) => {
  //     if (event.candidate) {
  //       this.rxStompService.sendMessage(
  //         '/ice-candidate',
  //         JSON.stringify({
  //           type: 'ice-candidate',
  //           stationId: this.currentUser.stationId,
  //           data: event.candidate,
  //         }),
  //       );
  //     }
  //   };

  //   this.peerConnection.ontrack = (event) => {
  //     this.remoteVideo.nativeElement.srcObject = event.streams[0];
  //   };
  // }

  // initializeWebSocket(): void {
  //   this.rxStompService.connect(this.currentUser);
  //   this.messagesSubscription = this.rxStompService.messages$.subscribe((msg: any) => {
  //     switch (msg.type) {
  //       case 'offer':
  //         this.handleOffer(msg.data);
  //         break;
  //       case 'answer':
  //         alert('Answer received');
  //         this.handleAnswer(msg.data);
  //         break;
  //       case 'ice-candidate':
  //         this.handleICECandidate(msg.data);
  //         break;
  //       case 'call-rejected':
  //         console.log('Call was rejected by an agent.');
  //         break;
  //       default:
  //         console.log(`Unknown message type: ${msg.type}`);
  //     }
  //   });
  // }

  // async initiateCall(): Promise<void> {
  //   await this.requestMediaDevices(); // Ensure media devices are requested before creating a connection
  //   this.createPeerConnection();
  //   if (!this.localStream || !this.peerConnection) return;

  //   this.localStream.getTracks().forEach((track) => {
  //     this.peerConnection!.addTrack(track, this.localStream!);
  //   });

  //   try {
  //     const offer = await this.peerConnection.createOffer(offerOptions);
  //     await this.peerConnection.setLocalDescription(offer);
  //     this.rxStompService.sendMessage(
  //       '/passenger/offer',
  //       JSON.stringify({
  //         type: 'offer',
  //         stationId: this.currentUser.stationId,
  //         data: offer,
  //       }),
  //     );
  //   } catch (error) {
  //     console.error('Error creating offer:', error);
  //   }
  // }

  // async requestMediaDevices(): Promise<void> {
  //   try {
  //     this.localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
  //     this.localVideo.nativeElement.srcObject = this.localStream;
  //   } catch (error) {
  //     console.error('Error accessing media devices:', error);
  //   }
  // }

  // toggleCamera(): void {
  //   if (this.localStream) {
  //     this.isCameraOn = !this.isCameraOn;
  //     this.localStream.getVideoTracks().forEach(track => (track.enabled = this.isCameraOn));
  //   }
  // }

  // toggleMic(): void {
  //   if (this.localStream) {
  //     this.isMicOn = !this.isMicOn;
  //     this.localStream.getAudioTracks().forEach(track => (track.enabled = this.isMicOn));
  //   }
  // }

  // hangUp(): void {
  //   this.rxStompService.publish({ destination: '/topic/hangup', body: JSON.stringify({stationId: this.currentUser.stationId, type: 'hangup', data: '' }) });
  //   this.closeVideoCall();
  // }

  // startLocalVideo(): void {
  //   console.log('starting local stream');
  //   if(!this.localStream || !this.localVideo){
  //     alert('Local stream or video element not available');
  //     return;
  //   }
  //   this.localStream.getTracks().forEach(track => {
  //     track.enabled = true;
  //   });
  //   this.localVideo.nativeElement.srcObject = this.localStream;

  //   this.localVideoActive = true;
  // }

  // pauseLocalVideo(): void {
  //   console.log('pause local stream');
  //   this.localStream?.getTracks().forEach(track => {
  //     track.enabled = false;
  //   });
  //   if(this.localVideo){
  //     this.localVideo.nativeElement.srcObject = null;
  //   }

  //   this.localVideoActive = false;
  // }

  // private handleOffer(offer: RTCSessionDescriptionInit): void {
  //   if (!this.peerConnection) this.createPeerConnection();

  //   this.peerConnection?.setRemoteDescription(new RTCSessionDescription(offer))
  //     .then(() => {
  //       return this.peerConnection?.createAnswer();
  //     })
  //     .then((answer) => {
  //       return this.peerConnection?.setLocalDescription(answer);
  //     })
  //     .then(() => {
  //       this.rxStompService.sendMessage(
  //         '/agent/answer',
  //         JSON.stringify({
  //           type: 'answer',
  //           stationId: this.currentUser.stationId,
  //           data: this.peerConnection?.localDescription,
  //         }),
  //       );
  //     })
  //     .catch((error) => {
  //       console.error('Error handling offer:', error);
  //     });
  // }

  // private handleAnswer(answer: RTCSessionDescriptionInit): void {
  //   if (!this.peerConnection) {
  //     alert('Peer connection not created - cannot handle answer');
  //     return;
  //   }
  //   this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  // }

  // private handleICECandidate(candidate: RTCIceCandidateInit): void {
  //   this.peerConnection?.addIceCandidate(new RTCIceCandidate(candidate));
  // }

  // private closeVideoCall(): void {
  //   if (this.peerConnection) {
  //     this.peerConnection.getTransceivers().forEach(transceiver => transceiver.stop());
  //     this.peerConnection.close();
  //     this.peerConnection = undefined;
  //     this.isCalling = false;
  //     this.isMicOn = false;
  //     this.isCameraOn = false;
  //   }
  // }

  // ngOnDestroy(): void {
  //   if (this.messagesSubscription) {
  //     this.messagesSubscription.unsubscribe();
  //   }
  //   if (this.localStream) {
  //     this.localStream.getTracks().forEach(track => track.stop()); // Stop media tracks on component destroy
  //   }
  //   if (this.peerConnection) {
  //     this.peerConnection.close(); // Close the peer connection
  //   }
  // }
}
