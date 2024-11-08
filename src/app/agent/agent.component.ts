import { AfterViewInit, Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { RxStompService } from '../services/rx-stomp.service';
import { SharedModule } from '../shared/shared.module';
import { WebRTCService } from '../services/web-rtc.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CallDialogComponent } from '../shared/call-dialog/call-dialog.component';

const mediaConstraints = {
  audio: true,
  video: { width: 1280, height: 720 },
};

@Component({
  selector: 'app-agent',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './agent.component.html',
  styleUrl: './agent.component.scss'
})
export class AgentComponent implements OnDestroy, AfterViewInit {

  @ViewChild('agentLocalVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('peerReceivedVideo') remoteVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('agentRingtoneAudio') ringtoneAudio!: ElementRef<HTMLAudioElement>;

  localStream: MediaStream | null = null;
  remoteStream: MediaStream | null = null;

  currentUser: any = JSON.parse(localStorage.getItem('currentUser') || '{}');
  // localStream?: MediaStream;
  // localVideoActive = false;
  // peerConnection?: RTCPeerConnection;
  // messagesSubscription?: Subscription;
  // agentMessageSubscription?: Subscription;
  isCalling: boolean = false;
  callOfferReceived: boolean = false;
  isCameraOn: boolean = true;
  isMicOn: boolean = true;

  protected webRTCService: WebRTCService = inject(WebRTCService);
  private modalService: NgbModal = inject(NgbModal);
  private messagesSubscription?: Subscription;
  private localSubscription?: Subscription;
  private remoteSubscription?: Subscription;

  constructor(){
    this.webRTCService.getStompService().connect(this.currentUser);
    // this.webRTCService.getStompService().watch(`/topic/${this.currentUser.stationGroup}/${this.currentUser.stationId}`)
    // .subscribe((message) => {
    //   const parsedMessage = JSON.parse(message.body);
    //   if (parsedMessage.type === 'candidate') {
    //     alert('AGENT@ Message received - ' + JSON.stringify(message));
    //     this.handleICECandidate(parsedMessage.candidate);
    //   }
    // });
  }

  ngAfterViewInit(): void {
    // Subscribe to local stream
    this.localSubscription = this.webRTCService.getLocalStream().subscribe((stream) => {

      this.localStream = stream;
      if (stream && this.localVideo.nativeElement) {
          this.localVideo.nativeElement.srcObject = stream;
      } else {
        console.warn('Local stream or local video element not available');
      }
    });

    // Subscribe to remote stream
    this.remoteSubscription = this.webRTCService.getRemoteStream().subscribe((stream) => {
      this.remoteStream = stream;
      if (stream && this.remoteVideo.nativeElement) {
          this.remoteVideo.nativeElement.srcObject = stream;
      }else {
        console.warn('remote stream or remote video element not available');
      }
    });

    this.messagesSubscription = this.webRTCService.getStompService().messages$.subscribe((msg: any) => {
      switch (msg.type) {
        case 'offer':
          this.handleOffer(msg);
          break;
        // case 'answer':
        //   console.info('Answer received - ', JSON.stringify(msg));
        //   this.webRTCService.handleAnswer(msg.data);
        //   break;
        case 'candidate':
          // alert('ICE candidate received');
          this.webRTCService.handleICECandidate(msg.candidate);
          break;
        
        case 'hangup':
          console.log('Call was rejected by a passenger.');
          this.hangUp();
          break;

        default:
          console.log(`Agent => Unknown message type: ${msg.type} from ${JSON.stringify(msg)} `);
      }
    });
  }

  // async initiateCall(): Promise<void> {
  //   this.isCalling = true;
  //   await this.webRTCService.startCall();
  // }

  async hangUp(): Promise<void> {
    this.isCalling = false;
    this.webRTCService.endCall(this.currentUser.stationId);
  }

  private handleOffer(offer: any): void {
    this.playRingtone();
    this.webRTCService.handleOffer(offer, this.currentUser);
    const modalRef = this.modalService.open(CallDialogComponent);
    modalRef.componentInstance.caller = offer.stationId;
    modalRef.result.then(async (result) => {
      if (result === 'accept') {
        this.sendAnswer();
      } else {
        this.sendRejection();
      }
    }, (reason) => {
      console.log('Call declined: ', reason);
      this.sendRejection();
    });

  }

  handleICECandidate(candidate: any): void {
    this.webRTCService.handleICECandidate(candidate.candidate);
  }

  async sendAnswer(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if( !stream || !this.webRTCService.getPeerConnection() ){
      alert('Failed to get local media');
      return;
    }
    this.webRTCService.setLocalStream(stream); // Publish the local stream
    // const answer = { type: 'answer', stationId: this.currentUser.stationId, data: this.webRTCService.getPeerConnection()!.localDescription };
    const answer = this.webRTCService.getPeerConnection()!.localDescription;
    const payload = { type: answer?.type, sdp: answer?.sdp, stationId: this.currentUser.stationId, data: answer };
    this.webRTCService.getStompService().sendMessage('/agent/answer', JSON.stringify(payload));
    this.stopRingtone();
  }

  // Send call rejection message
  sendRejection(): void {
    this.webRTCService.getStompService().sendMessage('/agent/rejected', JSON.stringify({ reason: 'Agent is busy!!!' }));
    this.stopRingtone();
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

  // -------------------------------------------------------------------------------------
  // constructor(private rxStompService: RxStompService) {
  //   this.initializeWebSocket();
  // }

  // ngOnInit(): void {
  //   // this.agentMessageSubscription = this.rxStompService.
  // }
  

  // ngAfterViewInit(): void {
  //   this.requestMediaDevices();
  //   // this.startLocalVideo();
  // }

  // acceptCall(): void {
  //   if (!this.callOfferReceived || !this.localStream || this.peerConnection) {
  //     alert(`call offered: ${this.callOfferReceived}, local stream: ${!this.localStream}, peer connection: ${!this.peerConnection}`);
  //     return;
  //   };
  //   this.isCalling = true;
  
  //   alert('Local stream and peer connection available');
  //   this.localStream.getTracks().forEach(track => {
  //     this.peerConnection!.getSenders().forEach(sender => {
  //       if (sender.track?.kind === track.kind) {
  //         sender.replaceTrack(track);
  //         alert('Track replaced');
  //       }
  //     });
  //   });
  // }

  // declineCall(): void {
  //   this.rxStompService.sendMessage(
  //     '/call/reject',
  //     JSON.stringify({
  //       stationId: this.currentUser.stationId,
  //       type: 'call-rejected',
  //       data: '',
  //     })
  //   );
  //   this.resetCallState();
  // }

  // initializeWebSocket(): void {
  //   this.rxStompService.connect(this.currentUser);
  //   this.messagesSubscription = this.rxStompService.messages$.subscribe((msg: any) => {
  //     switch (msg.type) {
  //       case 'offer':
  //         alert('Offer received');
  //         this.handleOffer(msg.data);
  //         // this.playRingtone();
  //         break;
  //       case 'answer':
  //         alert('Answer received');
  //         this.handleAnswer(msg.data);
  //         // this.stopRingtone();
  //         break;
  //       case 'ice-candidate':
  //         this.handleICECandidate(msg.data);
  //         break;
        
  //       case 'call-rejected':
  //         console.log('Call was rejected by a passenger.');
  //         this.resetCallState();
  //         break;

  //       default:
  //         console.log(`Unknown message type: ${msg.type}`);
  //     }
  //   });
  // }



  // async requestMediaDevices(): Promise<void> {
  //   try {
  //     this.localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
  //     this.localVideo.nativeElement.srcObject = this.localStream;
  //   } catch (error) {
  //     console.error('Error accessing media devices:', error);
  //   }
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

  // hangUp(): void {
  //   this.rxStompService.sendMessage('/topic/hangup', JSON.stringify({stationId: this.currentUser.stationId, type: 'hangup', data: '' }) );
  //   this.closeVideoCall();
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


  // startLocalVideo(): void {
  //   console.log('starting local stream');
  //   if(!this.localStream || !this.localVideo){
  //     alert('Local stream or video element not available');
  //     return;
  //   }
  //   this.localStream?.getTracks().forEach(track => {
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

  // private async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
  //   this.callOfferReceived = true;
  //   this.createPeerConnection();
  //   if(!this.peerConnection) {
  //     alert('Peer connection not created');
  //     return;
  //   }

  //   await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  //   const answer = await this.peerConnection.createAnswer();
  //   this.peerConnection.setLocalDescription(answer);
  //   this.rxStompService.sendMessage(
  //     '/agent/answer',
  //     JSON.stringify({
  //       type: 'answer',
  //       stationId: this.currentUser.stationId,
  //       data: this.peerConnection.localDescription,
  //     }),
  //   );
  //   this.startLocalVideo(); // TODO: if this is not called, the local video will not be displayed
  // }

  // private handleICECandidate(candidate: RTCIceCandidateInit): void {
  //   this.peerConnection?.addIceCandidate(new RTCIceCandidate(candidate));
  // }

  // private handleAnswer(answer: RTCSessionDescriptionInit): void {
  //   this.peerConnection?.setRemoteDescription(new RTCSessionDescription(answer));
  // }

  // private resetCallState(): void {
  //   this.callOfferReceived = false;
  //   this.isCalling = false;
  //   if (this.localStream) {
  //     this.localStream.getTracks().forEach(track => track.stop());
  //   }
  //   if (this.peerConnection) {
  //     this.peerConnection.close();
  //     this.peerConnection = undefined;
  //   }
  // }

  private playRingtone(): void {
    if (this.ringtoneAudio) {
      this.ringtoneAudio.nativeElement.play();
    }
  }

  private stopRingtone(): void {
    if (this.ringtoneAudio) {
      this.ringtoneAudio.nativeElement.pause();
    }
  }

  // ngOnDestroy(): void {
  //   if (this.messagesSubscription) {
  //     this.messagesSubscription.unsubscribe();
  //   }
  //   this.resetCallState();
  // }
}
